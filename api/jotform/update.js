// /api/jotform/update.js - Vercel serverless function
// Actualiza el campo "Estado de aprobación" en una submission de Jotform
// Requiere variables de entorno (en Vercel > Settings > Env Vars):
//  - JOTFORM_API_KEY  (obligatoria)
//  - PROXY_SECRET     (opcional: si la pones, debes enviar X-Auth-Token desde el front)

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Auth-Token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { submissionId, formId, value } = req.body || {};
    const apiKey = process.env.JOTFORM_API_KEY;
    const expectedToken = process.env.PROXY_SECRET || null;
    const providedToken = req.headers["x-auth-token"] || null;

    // Seguridad simple opcional
    if (expectedToken && providedToken !== expectedToken) {
      return res.status(401).json({ error: "No autorizado (X-Auth-Token inválido)" });
    }

    if (!apiKey) return res.status(500).json({ error: "Falta JOTFORM_API_KEY en el servidor" });
    if (!submissionId || !formId || typeof value === "undefined") {
      return res.status(400).json({ error: "Faltan parámetros: submissionId, formId, value" });
    }

    // 1) Resolver QID del campo "Estado de aprobación" por etiqueta
    const qid = await resolveEstadoAprobacionQID(formId, apiKey);
    if (!qid) {
      return res.status(404).json({ error: 'No se encontró el campo "Estado de aprobación" en el formulario' });
    }

    // 2) Actualizar la submission (POST /submission/{id})
    const url = `https://api.jotform.com/submission/${encodeURIComponent(submissionId)}?apiKey=${encodeURIComponent(apiKey)}`;
    const body = new URLSearchParams();
    body.append(`submission[${qid}]`, value ?? "");

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const text = await r.text(); // devolvemos el cuerpo “tal cual” para depurar
    if (!r.ok) {
      return res.status(r.status).send(text);
    }

    // 3) (Opcional) verificar leyendo la submission recién actualizada
    const verif = await fetch(`https://api.jotform.com/submission/${encodeURIComponent(submissionId)}?apiKey=${encodeURIComponent(apiKey)}`);
    const verifJson = await verif.json();
    const real = verifJson?.content?.answers?.[qid]?.answer ?? null;

    return res.status(200).json({
      ok: true,
      qid,
      written: value,
      verified: real
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Error interno en proxy", details: String(err) });
  }
}

// ----- helpers -----
function normalize(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function resolveEstadoAprobacionQID(formId, apiKey) {
  const url = `https://api.jotform.com/form/${encodeURIComponent(formId)}/questions?apiKey=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const data = await r.json();
  const content = data?.content || {};
  const target = normalize("Estado de aprobación");

  // match exacto por etiqueta
  for (const qid in content) {
    const label = normalize(content[qid]?.text || "");
    if (label === target) return qid;
  }
  // match parcial como fallback
  for (const qid in content) {
    const label = normalize(content[qid]?.text || "");
    if (label.includes(target)) return qid;
  }
  return null;
}

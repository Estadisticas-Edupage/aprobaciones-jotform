// /api/jotform/update.js - Vercel serverless function
// Actualiza el campo "Estado de aprobación" en una submission de Jotform
// ENV requeridas en Vercel:
//  - JOTFORM_API_KEY   (obligatoria)
//  - JOTFORM_FORM_ID   (recomendada, así no expones el formId)
//  - PROXY_SECRET      (opcional; si existe, debes enviar X-Auth-Token desde el front)

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Auth-Token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { submissionId, formId: formIdFromBody, value } = req.body || {};
    const apiKey = process.env.JOTFORM_API_KEY;
    const formIdEnv = process.env.JOTFORM_FORM_ID;
    const expectedToken = process.env.PROXY_SECRET || null;
    const providedToken = req.headers["x-auth-token"] || null;

    if (expectedToken && providedToken !== expectedToken) {
      return res.status(401).json({ error: "No autorizado (X-Auth-Token inválido)" });
    }
    if (!apiKey) return res.status(500).json({ error: "Falta JOTFORM_API_KEY en el servidor" });

    // Soportar formId tomado desde el servidor
    const formId = (!formIdFromBody || formIdFromBody === "env") ? formIdEnv : formIdFromBody;
    if (!submissionId || !formId || typeof value === "undefined") {
      return res.status(400).json({ error: "Faltan parámetros: submissionId y/o formId y/o value" });
    }

    // 1) Resolver QID del campo "Estado de aprobación"
    const qid = await resolveEstadoAprobacionQID(formId, apiKey);
    if (!qid) {
      return res.status(404).json({
        error: 'No se encontró el campo "Estado de aprobación" en el formulario',
        hint: "Revisa la etiqueta exacta en Jotform o que JOTFORM_FORM_ID apunte al formulario correcto."
      });
    }

    // 2) Enviar el valor EXACTO que está configurado en el dropdown del form
    // (si tus opciones ya son: Pendiente, Aprobar, Rechazar, Solicitar Documentos, Bloqueado, no hay mapeo extra)
    const url = `https://api.jotform.com/submission/${encodeURIComponent(submissionId)}?apiKey=${encodeURIComponent(apiKey)}`;
    const body = new URLSearchParams();
    body.append(`submission[${qid}]`, value ?? "");

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const text = await r.text();
    if (!r.ok) {
      // Propaga el error de Jotform para que lo veas en consola
      return res.status(r.status).send(text);
    }

    // 3) Verificar leyendo la submission
    const verif = await fetch(`https://api.jotform.com/submission/${encodeURIComponent(submissionId)}?apiKey=${encodeURIComponent(apiKey)}`);
    const verifJson = await verif.json();
    const real = verifJson?.content?.answers?.[qid]?.answer ?? null;

    return res.status(200).json({
      ok: true,
      formIdUsed: formId,
      qid,
      written: value,
      verified: real
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Error interno en proxy", details: String(err) });
  }
}

// ---------- helpers ----------
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

  // Soporta "Estado de aprobación" y "Estado de Aprobación" (con/sin tilde y mayúsculas)
  const targets = [
    normalize("Estado de aprobación"),
    normalize("Estado de Aprobación"),
    normalize("Estado de aprobacion"),
    normalize("Estado de Aprobacion")
  ];

  // match exacto
  for (const qid in content) {
    const label = normalize(content[qid]?.text || "");
    if (targets.includes(label)) return qid;
  }
  // match parcial
  for (const qid in content) {
    const label = normalize(content[qid]?.text || "");
    if (label.includes(normalize("Estado de aprobación")) || label.includes(normalize("Estado de Aprobación"))) {
      return qid;
    }
  }
  return null;
}

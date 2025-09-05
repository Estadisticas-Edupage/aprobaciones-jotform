// /api/jotform/update.js (Vercel)
// Proxy anti-CORS para actualizar un campo normal en una submission de Jotform

export default async function handler(req, res) {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { submissionId, qid, value, apiKey: apiKeyFromBody } = req.body || {};
    const apiKey = process.env.JOTFORM_API_KEY || apiKeyFromBody;
    const expected = process.env.PROXY_SECRET; // opcional
    const provided = req.headers['x-auth-token'];

    if (expected && provided !== expected) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    if (!apiKey || !submissionId || !qid) {
      return res.status(400).json({ error: 'Faltan apiKey/submissionId/qid' });
    }

    const url = `https://api.jotform.com/submission/${encodeURIComponent(submissionId)}?apiKey=${encodeURIComponent(apiKey)}`;
    const body = new URLSearchParams();
    body.append(`submission[${qid}]`, value ?? '');

    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno en proxy', details: String(e) });
  }
}

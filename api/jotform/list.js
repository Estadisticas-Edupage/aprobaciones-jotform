// /api/jotform/list.js
// Devuelve las submissions desde Jotform sin exponer API Key ni Form ID al navegador.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const apiKey = process.env.JOTFORM_API_KEY;
  const formId = process.env.JOTFORM_FORM_ID; // <-- nuevo

  if (!apiKey || !formId) {
    return res.status(500).json({ error: 'Falta JOTFORM_API_KEY o JOTFORM_FORM_ID en variables de entorno' });
  }

  try {
    const url = `https://api.jotform.com/form/${encodeURIComponent(formId)}/submissions?apiKey=${encodeURIComponent(apiKey)}&limit=200&addWorkflowStatus=1`;
    const r = await fetch(url);
    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'No se pudo leer Jotform', details: String(e) });
  }
}

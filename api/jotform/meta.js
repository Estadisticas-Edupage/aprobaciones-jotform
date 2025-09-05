export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const formId = process.env.JOTFORM_FORM_ID || null;
  if (!formId) return res.status(500).json({ error: 'Falta JOTFORM_FORM_ID' });
  res.status(200).json({ formId });
}

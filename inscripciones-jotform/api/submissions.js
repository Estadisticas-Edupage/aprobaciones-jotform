export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verificar token
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  // API Key de JotForm (usar variable de entorno en producción)
  const apiKey = process.env.JOTFORM_API_KEY || 'f460668edce79e7c0008cf37ac1d6fdb';
  const formId = '252455052823050';
  
  try {
    // Llamar a JotForm API
    const response = await fetch(
      `https://api.jotform.com/form/${formId}/submissions?apiKey=${apiKey}&limit=100`
    );
    
    const data = await response.json();
    
    if (data.responseCode === 200) {
      return res.status(200).json({
        submissions: data.content || []
      });
    }
    
    return res.status(500).json({ error: 'Error al obtener datos' });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Error de servidor',
      details: error.message 
    });
  }
}
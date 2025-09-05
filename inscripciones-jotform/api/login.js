// Función serverless para manejar login
export default function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { colegio, password, year } = req.body;
  
  // Credenciales de demo (en producción usar base de datos)
  const colegios = {
    'demo': { password: 'demo2025', nombre: 'Colegio Demo', formId: '252455052823050' },
    'vicente_azuero': { password: 'VAZ2025', nombre: 'Colegio Vicente Azuero', formId: '252455052823050' },
    'san_jose': { password: 'SJ2025', nombre: 'Colegio San José', formId: '252455052823051' }
  };
  
  if (colegios[colegio] && colegios[colegio].password === password) {
    // Generar token simple
    const token = Buffer.from(`${colegio}:${Date.now()}`).toString('base64');
    
    return res.status(200).json({
      success: true,
      token: token,
      user: {
        colegio: colegio,
        nombre: colegios[colegio].nombre,
        formId: colegios[colegio].formId
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Credenciales incorrectas'
  });
}
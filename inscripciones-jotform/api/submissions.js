export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const apiKey = process.env.JOTFORM_API_KEY || 'f460668edce79e7c0008cf37ac1d6fdb';
  const formId = '252455052823050';
  
  try {
    const response = await fetch(
      `https://api.jotform.com/form/${formId}/submissions?apiKey=${apiKey}&limit=100`
    );
    
    const data = await response.json();
    
    if (data.responseCode === 200) {
      // Mapear los campos correctamente según tu estructura
      const submissions = (data.content || []).map(sub => {
        const answers = sub.answers || {};
        
        return {
          id: sub.id,
          created_at: sub.created_at,
          status: sub.status,
          answers: {
            '2': answers['2'],    // estado
            '3': answers['3'],    // jornada
            '4': answers['4'],    // nombre
            '5': answers['5'],    // apellido
            '6': answers['6'],    // genero
            '7': answers['7'],    // sede
            '8': answers['8'],    // grado
            '10': answers['10'],  // rh
            '11': answers['11'],  // edad
            '12': answers['12'],  // direccion
            '13': answers['13'],  // barrio
            '14': answers['14'],  // estrato
            '15': answers['15'],  // ciudad
            '16': answers['16'],  // celular
            '17': answers['17'],  // email
            '19': answers['19'],  // madre nombre
            '20': answers['20'],  // madre documento
            '21': answers['21'],  // madre telefono
            '22': answers['22'],  // madre email
            '27': answers['27'],  // padre nombre
            '28': answers['28'],  // padre documento
            '29': answers['29'],  // padre celular
            '37': answers['37'],  // acudiente nombre
            '38': answers['38'],  // acudiente documento
            '39': answers['39'],  // acudiente tel (era 9, debe ser 39)
            '40': answers['40'],  // acudiente email
            '43': answers['43'],  // parentesco
            '60': answers['60']   // observacion
          }
        };
      });
      
      return res.status(200).json({
        submissions: submissions
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

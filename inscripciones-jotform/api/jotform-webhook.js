export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const submission = req.body;
    
    // Procesar la submission de JotForm
    const submissionId = submission.submissionID;
    const formId = submission.formID;
    const answers = submission.rawRequest || {};
    
    // Extraer información usando el mapeo de campos
    const studentData = {
      submissionId,
      formId,
      fecha: new Date().toISOString(),
      // Campos del estudiante
      nombres: answers.q4_nombre || '',
      apellidos: answers.q5_apellido || '',
      documento: answers.q38_acudiente_documento || '',
      grado: answers.q8_grado || '',
      sede: answers.q7_sede || '',
      jornada: answers.q3_jornada || '',
      
      // Archivos adjuntos (si los hay)
      archivos: []
    };
    
    // Buscar campos de archivo
    Object.keys(answers).forEach(key => {
      if (key.includes('upload') && answers[key]) {
        studentData.archivos.push({
          campo: key,
          url: answers[key],
          tipo: detectarTipoDocumento(key)
        });
      }
    });
    
    // Guardar en base de datos o procesar según necesites
    console.log('Nueva inscripción recibida:', studentData);
    
    // Si hay archivos, procesarlos
    if (studentData.archivos.length > 0) {
      await procesarArchivos(studentData);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Submission procesada',
      submissionId 
    });
    
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return res.status(500).json({ 
      error: 'Error procesando submission',
      details: error.message 
    });
  }
}

function detectarTipoDocumento(fieldName) {
  if (fieldName.includes('registro') || fieldName.includes('civil')) return 'registro_civil';
  if (fieldName.includes('boletin') || fieldName.includes('notas')) return 'boletin';
  if (fieldName.includes('foto') || fieldName.includes('photo')) return 'foto';
  if (fieldName.includes('medico')) return 'certificado_medico';
  return 'otro';
}

async function procesarArchivos(studentData) {
  // Aquí procesarías los archivos
  // Por ejemplo, descargarlos de JotForm y guardarlos en tu servidor
  
  for (const archivo of studentData.archivos) {
    try {
      // Registrar el archivo en el sistema
      const response = await fetch(`${process.env.VERCEL_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: new Date().getFullYear().toString(),
          inscripcionId: studentData.submissionId,
          docType: archivo.tipo,
          fileUrl: archivo.url,
          fileName: `${archivo.tipo}_${Date.now()}.pdf`
        })
      });
      
      console.log('Archivo procesado:', await response.json());
    } catch (error) {
      console.error('Error procesando archivo:', error);
    }
  }
}
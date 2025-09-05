export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  switch (method) {
    case 'POST':
      // Para Vercel, usamos una solución diferente sin sistema de archivos
      // Los archivos se guardarían en un servicio externo como Cloudinary o S3
      
      try {
        const { year, inscripcionId, docType, fileUrl, fileName } = req.body;
        
        // En producción, aquí guardarías la referencia en una base de datos
        // Por ahora, simulamos el guardado
        
        return res.status(200).json({ 
          success: true,
          message: 'Documento registrado correctamente',
          document: {
            id: Date.now().toString(),
            year,
            inscripcionId,
            type: docType,
            fileName,
            fileUrl,
            uploadDate: new Date().toISOString()
          }
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }

    case 'GET':
      const { year, inscripcionId } = req.query;
      
      // En producción, esto vendría de una base de datos
      // Por ahora, devolvemos datos de ejemplo
      const documents = [
        {
          id: '1',
          name: 'registro_civil_1234.pdf',
          type: 'registro_civil',
          size: 245632,
          date: '2025-09-04',
          status: 'verified',
          url: '#'
        },
        {
          id: '2',
          name: 'boletin_notas.pdf',
          type: 'boletin',
          size: 189456,
          date: '2025-09-04',
          status: 'verified',
          url: '#'
        },
        {
          id: '3',
          name: 'foto_estudiante.jpg',
          type: 'foto',
          size: 98234,
          date: '2025-09-04',
          status: 'pending',
          url: '#'
        }
      ];
      
      return res.status(200).json({ 
        success: true,
        documents,
        inscripcionId,
        year
      });

    case 'DELETE':
      const { documentId } = req.query;
      
      // En producción, eliminarías de la base de datos
      return res.status(200).json({ 
        success: true,
        message: 'Documento eliminado',
        documentId
      });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
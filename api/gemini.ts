import { GoogleGenAI } from "@google/genai";

// Esta función se ejecuta en el servidor de Vercel (Backend)
// No expone la API Key al navegador del cliente.
export default async function handler(request, response) {
  // Configuración de CORS para permitir peticiones desde tu propio frontend
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar preflight request para CORS
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Solo permitir método POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = request.body;

    if (!process.env.API_KEY) {
      throw new Error('La variable de entorno API_KEY no está configurada en Vercel.');
    }

    // Inicializar Gemini SDK
    // NOTA: Asegúrate de instalar la dependencia en tu package.json: npm install @google/genai
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Configuración del modelo (usamos el modelo estándar definido en las guías)
    const model = 'gemini-2.5-flash';

    const result = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    // Devolver la respuesta al frontend
    return response.status(200).json({ text: result.text });

  } catch (error) {
    console.error('Error en la API de Gemini:', error);
    return response.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
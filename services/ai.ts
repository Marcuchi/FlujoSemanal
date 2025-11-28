/**
 * Servicio para comunicarse con la API de Gemini a través de las Vercel Functions.
 * 
 * Uso:
 * import { askGemini } from './services/ai';
 * 
 * const respuesta = await askGemini("Analiza mis gastos de esta semana...");
 */

export const askGemini = async (prompt: string): Promise<string> => {
  try {
    // Llamada al endpoint local (que Vercel redirige a la Serverless Function)
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error al consultar el servicio de IA:", error);
    throw error;
  }
};
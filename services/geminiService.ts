
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to retry calls with exponential backoff
 */
async function generateWithRetry(
  model: string, 
  contents: any, 
  retries = 3,
  systemInstruction?: string
): Promise<GenerateContentResponse> {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined
      });
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.status || error?.code || error?.response?.status;
      const isTransient = errorCode === 429 || errorCode === 503;
      
      if (isTransient && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 1000 + (Math.random() * 500);
        console.warn(`Gemini API ${model} hit error ${errorCode}. Retrying in ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      if (!isTransient) {
        throw error;
      }
    }
  }
  throw lastError;
}

/**
 * Analyzes a specific video frame using Gemini 3 Pro (Preview) with fallback to Flash.
 */
export const analyzeFrame = async (
  base64Image: string,
  promptText: string,
  chatHistory: string[] = [] 
): Promise<string> => {
  const systemContext = `
    You are an elite sports biomechanics and technique coach. 
    The user is showing you a specific frame from a slow-motion video analysis.
    Analyze the body position, angles, and technique visible in this image.
    Be concise, encouraging, and technical but easy to understand.
    Answer the user's specific question about this moment in the movement.
    Respond in Spanish.
  `;

  const fullPrompt = `Previous Context: ${chatHistory.slice(-2).join('\n')}\n\nUser Question: ${promptText}`;
  
  const contents = {
    parts: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      {
        text: fullPrompt,
      },
    ],
  };

  try {
    const response = await generateWithRetry('gemini-3-pro-preview', contents, 2, systemContext);
    return response.text || "No pude analizar el frame.";
  } catch (error: any) {
    console.warn("Gemini 3 Pro failed, attempting fallback to Gemini 2.5 Flash:", error);
    try {
      const response = await generateWithRetry('gemini-2.5-flash', contents, 3, systemContext);
      return response.text || "No pude analizar el frame.";
    } catch (fallbackError) {
      console.error("All Gemini models failed:", fallbackError);
      const errCode = (fallbackError as any)?.status || (fallbackError as any)?.code;
      if (errCode === 429) {
        return "⚠️ El sistema está experimentando mucho tráfico (Error 429). Por favor espera unos segundos e intenta de nuevo.";
      }
      return "Lo siento, hubo un error conectando con el entrenador AI. Verifica tu conexión o intenta más tarde.";
    }
  }
};

/**
 * General Sports Coach Chatbot
 */
export const chatWithCoach = async (
  message: string,
  history: {role: string, text: string}[]
): Promise<string> => {
  const systemInstruction = `
    Eres un entrenador deportivo de alto rendimiento experto en atletismo, fuerza, nutrición, recuperación y prevención de lesiones.
    Tu objetivo es ayudar al atleta a mejorar, escuchar sus sensaciones y dar consejos basados en ciencia.
    Sé empático, motivador y profesional.
    Si preguntan sobre lesiones, da consejos generales pero siempre recomienda ver a un médico si hay dolor agudo.
  `;

  const formattedHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  // Add current message
  formattedHistory.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    // Using Flash for fast conversational response
    const response = await generateWithRetry('gemini-2.5-flash', formattedHistory, 3, systemInstruction);
    return response.text || "No tengo una respuesta en este momento.";
  } catch (error) {
    console.error("Coach chat error", error);
    return "Lo siento, estoy teniendo problemas para procesar tu consulta deportiva en este momento.";
  }
};

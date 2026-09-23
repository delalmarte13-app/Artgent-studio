import { ArtFormData, ReversePromptResult } from "../types";

export const getStoredGroqKey = (): string => {
  try {
    return localStorage.getItem('artgen_groq_key') || '';
  } catch {
    return '';
  }
};

export const setStoredGroqKey = (key: string): void => {
  try {
    if (key.trim()) {
      localStorage.setItem('artgen_groq_key', key.trim());
    } else {
      localStorage.removeItem('artgen_groq_key');
    }
  } catch (e) {
    console.warn('Error saving Groq key in localStorage:', e);
  }
};

const getCommonHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const groqKey = getStoredGroqKey();
  if (groqKey) {
    headers['x-groq-key'] = groqKey;
  }
  return headers;
};

export const checkGroqStatus = async (): Promise<{ configured: boolean; model: string; source: string }> => {
  try {
    const response = await fetch('/api/groq-status', {
      headers: getCommonHeaders()
    });
    return await response.json();
  } catch {
    return { configured: false, model: 'llama-3.3-70b-versatile', source: 'none' };
  }
};

export const validateGroqKey = async (key: string): Promise<{ valid: boolean; message: string; model?: string }> => {
  const response = await fetch('/api/validate-groq-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  return await response.json();
};

export const generateArtImage = async (formData: ArtFormData): Promise<string> => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 429 || data.error === 'QUOTA_EXCEEDED_429') {
      throw new Error("LÍMITE_DE_CUOTA_429: Has alcanzado el límite de cuota gratuito de Google para imágenes rasterizadas. Cambia al 'Modo Vectorial (SVG)' para seguir creando arte ilimitado con Gemini.");
    }
    throw new Error(data.message || "Error al generar la imagen con IA.");
  }

  if (data.imageUrl) {
    return data.imageUrl;
  }

  throw new Error("No se devolvió ninguna imagen en la respuesta.");
};

export const generateVectorSvg = async (formData: ArtFormData): Promise<string> => {
  const response = await fetch('/api/generate-svg', {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al generar el trazado vectorial SVG con IA.");
  }

  if (data.svg) {
    return data.svg;
  }

  throw new Error("No se devolvió un código SVG válido.");
};

export const getTermDefinition = async (term: string, category: string): Promise<string> => {
  try {
    const response = await fetch('/api/term-definition', {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify({ term, category })
    });

    const data = await response.json();
    if (data.definition) {
      return data.definition;
    }
    return `Término técnico de referencia en ${category}.`;
  } catch (err) {
    console.warn("Term definition error:", err);
    return `Término técnico de referencia en ${category}.`;
  }
};

export const reverseEngineerImageToPrompt = async (
  imageBase64: string
): Promise<ReversePromptResult> => {
  const response = await fetch('/api/reverse-prompt', {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify({ imageBase64 })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al analizar la imagen con IA.");
  }

  return data as ReversePromptResult;
};

export const createEnhancedPrompt = async (
  baseConcept: string,
  modeId: string,
  selectedAttributes?: Record<string, string[]>
): Promise<string> => {
  const response = await fetch('/api/enhance-prompt', {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify({ baseConcept, modeId, selectedAttributes })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al generar el prompt con IA.");
  }

  return data.enhancedPrompt || baseConcept;
};

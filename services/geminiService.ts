import { ArtFormData, ReversePromptResult } from "../types";

export const generateArtImage = async (formData: ArtFormData): Promise<string> => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseConcept, modeId, selectedAttributes })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al generar el prompt con IA.");
  }

  return data.enhancedPrompt || baseConcept;
};

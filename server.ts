import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { CREATIVE_MODES, MOODS, PALETTES } from './types.ts';
import type { ArtFormData, ReversePromptResult } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Listen on process.env.PORT in production (Cloud Run) or command line --port in development (3000)
const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 && process.argv[portArgIndex + 1] 
  ? Number(process.argv[portArgIndex + 1]) 
  : (process.env.PORT ? Number(process.env.PORT) : 3000);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.API_KEY || '';

const getAiClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

// Retry helper for handling temporary 503 spikes, timeouts and model fallbacks
async function executeWithModelFallback<T>(
  models: string[],
  operation: (model: string, ai: GoogleGenAI) => Promise<T>,
  taskName = 'Operación Gemini',
  timeoutMs = 45000
): Promise<T> {
  const ai = getAiClient();
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout de ${timeoutMs}ms excedido para ${model}`)), timeoutMs)
      );
      return await Promise.race([operation(model, ai), timeoutPromise]);
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.code;
      const errMsg = err?.message || String(err);
      console.warn(`[${taskName}] Fallo con modelo ${model} (Status ${statusCode}): ${errMsg.slice(0, 160)}`);

      // If it's a 503 UNAVAILABLE (high demand spike), wait briefly before falling back
      if (statusCode === 503 || errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError || new Error(`No fue posible completar ${taskName} tras intentar los modelos disponibles.`);
}

const getAspectRatio = (w: string, h: string): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
  const numW = parseInt(w, 10);
  const numH = parseInt(h, 10);
  if (!numW || !numH) return '1:1';
  const ratio = numW / numH;
  if (ratio >= 1.6) return '16:9';
  if (ratio >= 1.2) return '4:3';
  if (ratio <= 0.6) return '9:16';
  if (ratio <= 0.8) return '3:4';
  return '1:1';
};

const buildPromptText = (formData: ArtFormData): string => {
  const { 
    description, mode, mood, palette, width, height,
    selectedAttributes = {}, imageUsageMode, referenceImage
  } = formData;

  const selectedMode = CREATIVE_MODES.find(m => m.id === mode) || CREATIVE_MODES[0];
  const moodObj = MOODS.find(m => m.id === mood) || MOODS[0];
  const paletteObj = PALETTES.find(p => p.id === palette) || PALETTES[0];

  let promptText = `DEPARTAMENTO: ${selectedMode.label.toUpperCase()} (${selectedMode.shortLabel}).\n`;
  promptText += `DIRECTRIZ DE DISEÑO: ${selectedMode.promptPrefix}\n\n`;

  if (referenceImage && imageUsageMode === 'overlay') {
    promptText += `MODO DE EDICIÓN Y TRANSFORMACIÓN:\n`;
    promptText += `- Transforma e integra la imagen de referencia aportada.\n`;
    promptText += `- Conserva la estructura y silueta base, pero reelabora texturas, iluminación y estilo artístico según los parámetros siguientes.\n\n`;
  } else if (referenceImage) {
    promptText += `MODO INSPIRACIÓN:\n`;
    promptText += `- Usa la composición cromática, atmósfera y volúmenes de la imagen de referencia como inspiración para una nueva creación original.\n\n`;
  }

  promptText += `CONCEPTO Y DESCRIPCIÓN PRINCIPAL:\n${description || "Diseño conceptual exclusivo de alta gama."}\n\n`;

  promptText += `ESPECIFICACIONES DEL DEPARTAMENTO:\n`;
  selectedMode.attributeGroups.forEach(group => {
    const selectedVals = selectedAttributes[group.id] || [];
    if (selectedVals.length > 0) {
      promptText += `- ${group.label.toUpperCase()}: ${selectedVals.join(", ")}\n`;
    }
  });

  promptText += `\nATMÓSFERA Y LUZ: ${moodObj.label} - ${moodObj.value}\n`;
  promptText += `PALETA CROMÁTICA: ${paletteObj.label} - ${paletteObj.value}\n`;
  promptText += `DIMENSIONES / PROPORCIÓN: Aspect ratio ${getAspectRatio(width, height)}.\n`;
  promptText += `CALIDAD: Obra maestra profesional con acabados nítidos, texturas de material auténticas y composición visual equilibrada.`;

  return promptText;
};

// --- API ENDPOINTS ---

// 1. GENERATE VECTOR SVG
app.post('/api/generate-svg', async (req, res) => {
  try {
    const formData = req.body as ArtFormData;
    const basePrompt = buildPromptText(formData);

    const svgPrompt = `Genera un código XML <svg> completo, profesional y visualmente impactante.
El diseño debe representar fielmente las siguientes especificaciones creativas:
${basePrompt}

REGLAS ESTRICTAS DE SALIDA:
- Devuelve EXCLUSIVAMENTE código XML SVG bien formado.
- Debe comenzar exactamente con la etiqueta <svg y terminar con </svg>.
- NO incluyas formato Markdown (sin \`\`\`xml o \`\`\`), ni introducciones, ni comentarios antes o después.
- Añade viewBox="0 0 ${formData.width || '1024'} ${formData.height || '1024'}" y xmlns="http://www.w3.org/2000/svg".
- Utiliza gradientes (<linearGradient>, <radialGradient>), sombras (<filter>), capas, máscaras y trazados (<path>) complejos para lograr volumen, texturas y luces espectaculares.`;

    const textModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    const svgCode = await executeWithModelFallback(
      textModels,
      async (model, ai) => {
        const response = await ai.models.generateContent({
          model,
          contents: svgPrompt
        });
        const raw = response.text || '';
        let cleaned = raw.replace(/```xml/gi, '').replace(/```svg/gi, '').replace(/```/g, '').trim();
        const start = cleaned.indexOf('<svg');
        const end = cleaned.lastIndexOf('</svg>');
        if (start !== -1 && end !== -1 && end > start) {
          return cleaned.substring(start, end + 6);
        }
        if (cleaned.startsWith('<svg')) {
          return cleaned;
        }
        throw new Error('La respuesta generada no contiene un SVG válido.');
      },
      'Generación SVG'
    );

    res.json({ svg: svgCode });
  } catch (error: any) {
    console.error('Error in /api/generate-svg:', error);
    res.status(500).json({ 
      error: 'SVG_GENERATION_FAILED', 
      message: error?.message || 'Error al generar el trazado vectorial SVG con IA.' 
    });
  }
});

// 2. GENERATE RASTER IMAGE
app.post('/api/generate-image', async (req, res) => {
  try {
    const formData = req.body as ArtFormData;
    const promptText = buildPromptText(formData);
    const { referenceImage, width, height } = formData;

    const inlineDataPart = referenceImage ? {
      inlineData: {
        mimeType: referenceImage.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
        data: referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage
      }
    } : null;

    const contentsPayload = inlineDataPart 
      ? [{ text: promptText }, inlineDataPart] 
      : [{ text: promptText }];

    const imageAspect = getAspectRatio(width, height);
    const imageModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'];

    let lastError: any = null;
    const ai = getAiClient();

    for (const model of imageModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: contentsPayload,
          config: { 
            imageConfig: { aspectRatio: imageAspect } 
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              return res.json({ imageUrl: `data:${mime};base64,${part.inlineData.data}` });
            }
          }
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        console.warn(`Image generation model ${model} failed:`, msg.slice(0, 140));
        if (err?.status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          return res.status(429).json({
            error: 'QUOTA_EXCEEDED_429',
            message: 'Has alcanzado el límite de cuota gratuito de Google para imágenes rasterizadas. Puedes activar el "Modo Vectorial (SVG)" para continuar creando obras en alta definición con Gemini sin restricciones de cuota.'
          });
        }
      }
    }

    res.status(500).json({
      error: 'IMAGE_GENERATION_FAILED',
      message: lastError?.message || 'Error al generar la imagen con el servicio de IA.'
    });
  } catch (error: any) {
    console.error('Error in /api/generate-image:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: error?.message || 'Error interno del servidor' });
  }
});

// 3. REVERSE ENGINEER IMAGE TO PROMPT
app.post('/api/reverse-prompt', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'MISSING_IMAGE', message: 'Se requiere una imagen para analizar.' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.*)$/s);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `Actúa como el director técnico y curador maestro de arte y diseño de ArtGen Studio.
Analiza meticulosamente esta imagen para realizar una INGENIERÍA INVERSA DE PROMPT (Prompt Reverse Engineering) completa.

Debes determinar:
1. Departamento creativo más idóneo: estrictamente uno entre: "architecture", "graffiti", "photo", "fashion", "interior", "general".
2. Nombre legible del departamento: "Arquitectura", "Graffiti & Street Art", "Fotografía de Estudio", "Diseño de Moda", "Interiorismo & Espacios", o "Bellas Artes & Pintura".
3. Master Prompt en español: Texto descriptivo de nivel profesional (50 a 90 palabras), detallando sujeto principal, ángulo de cámara/perspectiva, texturas superficiales, atmósfera luminosa, estilo artístico y acabados para reproducir la imagen fielmente.
4. English Master Prompt: El prompt equivalente optimizado en inglés de alta calidad.
5. Estilo artístico o arquitectónico detectado.
6. Iluminación y atmósfera detectada (tipo de luz, sombras, hora o set).
7. Materiales y texturas superficiales clave identificadas (array de 2 a 4 strings).
8. Paleta de colores dominante: exactamente 5 códigos hexadecimales representativos (ej: ["#1e293b", "#3b82f6", ...]).
9. Nombre evocador para la paleta cromática.
10. Notas técnicas de composición.
11. Consejo técnico para recrear o mejorar la toma.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con este esquema exacto:
{
  "department": "architecture" | "graffiti" | "photo" | "fashion" | "interior" | "general",
  "departmentName": "Nombre Legible",
  "masterPrompt": "Prompt descriptivo detallado en español...",
  "englishPrompt": "Exhaustive high-fidelity prompt in English...",
  "detectedStyle": "Estilo identificado",
  "detectedLighting": "Iluminación detectada",
  "detectedMaterials": ["Material 1", "Material 2"],
  "paletteColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "paletteName": "Nombre de la paleta",
  "compositionNotes": "Composición y encuadre",
  "technicalTips": "Consejo técnico para la recreación"
}`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };
    const textPart = {
      text: prompt,
    };

    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    const result = await executeWithModelFallback(
      modelsToTry,
      async (model, ai) => {
        const response = await ai.models.generateContent({
          model,
          contents: [imagePart, textPart],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        let parsed: any = {};
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        } else {
          parsed = JSON.parse(cleaned);
        }

        const validDepartments = ['architecture', 'graffiti', 'photo', 'fashion', 'interior', 'general'];
        const dept = validDepartments.includes(parsed.department) ? parsed.department : 'general';
        const deptLabels: Record<string, string> = {
          architecture: 'Arquitectura',
          graffiti: 'Graffiti & Street Art',
          photo: 'Fotografía de Estudio',
          fashion: 'Diseño de Moda',
          interior: 'Interiorismo & Espacios',
          general: 'Bellas Artes & Pintura'
        };

        const finalResult: ReversePromptResult = {
          department: dept,
          departmentName: parsed.departmentName || deptLabels[dept] || 'Bellas Artes & Pintura',
          masterPrompt: parsed.masterPrompt || 'Composición artística y estética de alta resolución.',
          englishPrompt: parsed.englishPrompt || 'High aesthetic artistic composition in fine detail.',
          detectedStyle: parsed.detectedStyle || 'Estilo visual contemporáneo',
          detectedLighting: parsed.detectedLighting || 'Iluminación equilibrada y envolvente',
          detectedMaterials: Array.isArray(parsed.detectedMaterials) && parsed.detectedMaterials.length > 0 
            ? parsed.detectedMaterials 
            : ['Textura natural', 'Acabado mate', 'Pigmentos finos'],
          paletteColors: Array.isArray(parsed.paletteColors) && parsed.paletteColors.length >= 3 
            ? parsed.paletteColors.slice(0, 5) 
            : ['#1c1917', '#78716c', '#d6d3d1', '#f59e0b', '#fdfbf7'],
          paletteName: parsed.paletteName || 'Paleta Cromática Detectada',
          compositionNotes: parsed.compositionNotes || 'Composición armónica central con balance de elementos.',
          technicalTips: parsed.technicalTips || 'Ajusta los materiales y la iluminación en el panel de parámetros para matizar el resultado.',
        };
        return finalResult;
      },
      'Ingeniería Inversa de Prompt'
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/reverse-prompt:', error);
    res.status(500).json({ error: 'REVERSE_PROMPT_FAILED', message: error?.message || 'Error al analizar la imagen.' });
  }
});

// 4. ENHANCE PROMPT
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { baseConcept = '', modeId = 'general', selectedAttributes = {} } = req.body;
    const selectedMode = CREATIVE_MODES.find(m => m.id === modeId) || CREATIVE_MODES[0];

    let attrsDesc = '';
    selectedMode.attributeGroups.forEach(g => {
      const vals = selectedAttributes[g.id] || [];
      if (vals.length > 0) attrsDesc += `${g.label}: ${vals.join(', ')}. `;
    });

    const prompt = `Actúa como el curador y director técnico de arte y diseño de ArtGen Studio.
El usuario desea formular un Master Prompt profesional para el departamento de "${selectedMode.label}" (${selectedMode.shortLabel}).
Concepto inicial o idea del usuario: "${baseConcept.trim() || 'Creación innovadora y vanguardista para ' + selectedMode.label}".
${attrsDesc ? `Parámetros técnicos elegidos: ${attrsDesc}` : ''}

Tu tarea:
Escribe un Master Prompt profesional en español (entre 50 y 90 palabras) listo para generar una obra de arte deslumbrante.
Detalla:
- Sujeto focal y composición precisa
- Materiales, texturas auténticas y acabados
- Iluminación ambiental y sombras
- Estilo estético o escuela afín

Responde ÚNICAMENTE con el texto del prompt listo para usar, sin introducciones, sin prefijos ("Prompt:"), sin comillas, sin explicaciones ni saludos.`;

    const textModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    const enhanced = await executeWithModelFallback(
      textModels,
      async (model, ai) => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        const text = response.text?.trim().replace(/^["']|["']$/g, '');
        if (text) return text;
        throw new Error('Respuesta vacía del modelo.');
      },
      'Mejora de Prompt'
    );

    res.json({ enhancedPrompt: enhanced });
  } catch (error: any) {
    console.error('Error in /api/enhance-prompt:', error);
    res.status(500).json({ error: 'ENHANCE_PROMPT_FAILED', message: error?.message || 'Error al enriquecer el prompt.' });
  }
});

// 5. TERM DEFINITION
app.post('/api/term-definition', async (req, res) => {
  try {
    const { term, category } = req.body;
    const prompt = `Actúa como un profesor y maestro especialista en diseño y arte. Explica el concepto técnico "${term}" dentro de la categoría "${category}".
Proporciona una definición concisa, clara y académica de 2 a 3 frases en español.
Enfócate en cómo influye visualmente y cómo se aplica en un proyecto real.
Responde directamente sin saludos ni introducciones.`;

    const textModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    const definition = await executeWithModelFallback(
      textModels,
      async (model, ai) => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        return response.text?.trim() || `Término técnico de referencia en ${category}.`;
      },
      'Definición de Término'
    );

    res.json({ definition });
  } catch (error: any) {
    console.error('Error in /api/term-definition:', error);
    res.status(500).json({ error: 'TERM_DEF_FAILED', message: error?.message || 'Error al obtener definición.' });
  }
});

// --- CLIENT / STATIC SERVING ---
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ArtGen Studio server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});

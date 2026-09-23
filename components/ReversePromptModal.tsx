import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Upload, X, Copy, Check, ArrowRight, Palette, Layers, 
  Sun, Compass, Cpu, RefreshCw, Image as ImageIcon, Eye, AlertCircle
} from 'lucide-react';
import { ReversePromptResult } from '../types';
import { reverseEngineerImageToPrompt } from '../services/geminiService';

interface ReversePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToStudio?: (result: ReversePromptResult, imageBase64: string) => void;
  onApplyPrompt?: (result: ReversePromptResult, imageBase64: string) => void;
  initialImage?: string | null;
}

export const ReversePromptModal: React.FC<ReversePromptModalProps> = ({
  isOpen,
  onClose,
  onApplyToStudio,
  onApplyPrompt,
  initialImage = null,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReversePromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImage && isOpen) {
      setSelectedImage(initialImage);
      setResult(null);
      setError(null);
    }
  }, [initialImage, isOpen]);

  if (!isOpen) return null;

  const handleApplyToStudioAction = () => {
    if (!selectedImage || !result) return;
    if (onApplyToStudio) {
      onApplyToStudio(result, selectedImage);
    } else if (onApplyPrompt) {
      onApplyPrompt(result, selectedImage);
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await reverseEngineerImageToPrompt(selectedImage);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ocurrió un error al analizar la imagen con IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-stone-950 rounded-2xl shadow-sm">
              <Sparkles size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Visión IA Multimodal</span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                Ingeniería Inversa de Prompt
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top upload bar if no image or to change image */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Image Preview / Drop Zone */}
            <div className="md:col-span-5 flex flex-col gap-3">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                1. Imagen Fuente de Referencia
              </span>

              {selectedImage ? (
                <div className="relative group rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-inner aspect-square flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Referencia para análisis"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-stone-900 rounded-xl text-xs font-bold shadow-md hover:bg-stone-100"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedImage(null); setResult(null); }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50/60 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-square group"
                >
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-stone-400 group-hover:text-amber-500 group-hover:scale-110 transition-all mb-3">
                    <Upload size={28} />
                  </div>
                  <p className="text-xs font-bold text-stone-800">
                    Sube cualquier foto, diseño o pintura
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
                    Arrastra aquí o haz clic para explorar tus archivos (PNG, JPG, WebP)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedImage && !result && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Deconstruyendo imagen con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Desglosar y Generar Prompt</span>
                    </>
                  )}
                </button>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Results or Explanation Zone */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                2. Desglose Técnico & Prompt Resultante
              </span>

              {result ? (
                <div className="space-y-4 animate-in fade-in">
                  {/* Department & Style Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Departamento:</span>
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs">
                        {result.departmentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Estilo:</span>
                      <span className="px-2.5 py-1 bg-stone-200 text-stone-800 font-medium rounded-lg text-xs">
                        {result.detectedStyle}
                      </span>
                    </div>
                  </div>

                  {/* Master Prompt Spanish */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500" />
                        Prompt Maestro de Replicación (Español)
                      </span>
                      <button
                        onClick={() => handleCopy(result.masterPrompt, 'es')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                      >
                        {copiedKey === 'es' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        <span>{copiedKey === 'es' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-stone-800 leading-relaxed font-mono bg-stone-50/70 p-3 rounded-xl border border-stone-100 select-all">
                      {result.masterPrompt}
                    </p>
                  </div>

                  {/* Master Prompt English */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-stone-400" />
                        Prompt Técnico en Inglés (High Fidelity)
                      </span>
                      <button
                        onClick={() => handleCopy(result.englishPrompt, 'en')}
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                      >
                        {copiedKey === 'en' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        <span>{copiedKey === 'en' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-mono bg-stone-50/70 p-3 rounded-xl border border-stone-100 select-all">
                      {result.englishPrompt}
                    </p>
                  </div>

                  {/* Extracted Palette */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <Palette size={13} className="text-amber-500" />
                        Paleta de Color Extraída ({result.paletteName})
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {result.paletteColors.map((color, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCopy(color, `color-${idx}`)}
                          className="flex flex-col items-center gap-1 p-1.5 bg-white rounded-xl border border-stone-200 hover:scale-105 transition-all text-center"
                          title="Clic para copiar código HEX"
                        >
                          <span
                            className="w-full h-7 rounded-lg shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[10px] font-mono text-stone-600">
                            {copiedKey === `color-${idx}` ? '¡OK!' : color}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attributes breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-2xl border border-stone-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                        Iluminación & Atmósfera
                      </span>
                      <p className="text-stone-800 text-[11px]">{result.detectedLighting}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-stone-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                        Materiales Clave
                      </span>
                      <p className="text-stone-800 text-[11px]">{result.detectedMaterials.join(', ')}</p>
                    </div>
                  </div>

                  {/* Action Button: Load into Studio */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleApplyToStudioAction}
                      className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <ArrowRight size={16} className="text-amber-400" />
                      <span>Cargar Prompt y Parámetros en el Estudio</span>
                    </button>
                  </div>
                </div>
              ) : isAnalyzing ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-stone-50 rounded-2xl border border-stone-200/80 text-center animate-pulse">
                  <RefreshCw size={36} className="text-amber-500 animate-spin mb-4" />
                  <h3 className="font-serif text-stone-800 font-bold text-sm">
                    Analizando volumetría, luces y estilo...
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 max-w-xs">
                    Gemini Vision está formulando el prompt maestro y extrayendo la composición cromática exacta.
                  </p>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 text-center">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-stone-300 mb-3">
                    <ImageIcon size={32} />
                  </div>
                  <h3 className="font-serif text-stone-700 font-bold text-sm">
                    Carga una imagen para comenzar
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 max-w-xs">
                    La IA examinará texturas, iluminación, autores afines y generará las directrices exactas para replicar la obra o reinterpretada con tu toque.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

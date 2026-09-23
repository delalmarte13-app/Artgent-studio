import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, Loader2, ExternalLink, X, Cpu, Sparkles, Trash2 } from 'lucide-react';
import { getStoredGroqKey, setStoredGroqKey, validateGroqKey, checkGroqStatus } from '../services/geminiService';

interface GroqConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const GroqConfigModal: React.FC<GroqConfigModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [serverGroqConfigured, setServerGroqConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGroqKey();
      setApiKey(stored);
      setStatus(stored ? 'success' : 'idle');
      setStatusMessage(stored ? 'Clave de Groq guardada en este navegador.' : '');
      checkGroqStatus().then(res => {
        setServerGroqConfigured(res.configured);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    if (!apiKey.trim()) {
      setStatus('error');
      setStatusMessage('Por favor ingresa una clave de Groq válida.');
      return;
    }

    setStatus('testing');
    setStatusMessage('Validando clave con Groq Cloud (Llama 3.3)...');

    try {
      const result = await validateGroqKey(apiKey.trim());
      if (result.valid) {
        setStoredGroqKey(apiKey.trim());
        setStatus('success');
        setStatusMessage(result.message || '¡Clave validada y guardada correctamente!');
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setStatus('error');
        setStatusMessage(result.message || 'La clave proporcionada no es válida.');
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err?.message || 'Error de conexión con Groq.');
    }
  };

  const handleRemove = () => {
    setStoredGroqKey('');
    setApiKey('');
    setStatus('idle');
    setStatusMessage('Clave eliminada. Se utilizará Gemini como motor principal.');
    if (onKeyUpdated) onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                Motor de IA & Clave Groq
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                  Opcional
                </span>
              </h3>
              <p className="text-xs text-stone-400">Aceleración por hardware ultra-rápido Llama 3.3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors p-2 rounded-lg hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-800/60 border border-stone-700/50 rounded-xl">
              <div className="flex items-center gap-2 text-stone-300 font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Google Gemini
              </div>
              <p className="text-stone-400 text-[11px]">Motor principal del servidor activo (3.6 Flash & Imagen 3).</p>
            </div>

            <div className="p-3 bg-stone-800/60 border border-stone-700/50 rounded-xl">
              <div className="flex items-center gap-2 text-stone-300 font-semibold mb-1">
                <span className={`w-2 h-2 rounded-full ${apiKey || serverGroqConfigured ? 'bg-amber-400 animate-pulse' : 'bg-stone-500'}`}></span>
                Groq Llama 3.3
              </div>
              <p className="text-stone-400 text-[11px]">
                {apiKey || serverGroqConfigured ? 'Conectado para inferencia ultra-rápida.' : 'Opcional para aceleración extrema.'}
              </p>
            </div>
          </div>

          {/* Key Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center justify-between">
              <span>API Key de Groq (gsk_...)</span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 normal-case font-normal text-xs"
              >
                Obtener clave gratis <ExternalLink className="w-3 h-3" />
              </a>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-10 pr-20 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-400 hover:text-stone-200"
              >
                {showKey ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              La clave se almacena localmente en tu navegador y se transfiere de forma segura al proxy del servidor.
            </p>
          </div>

          {/* Status notification */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
              status === 'success' 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                : status === 'error'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-stone-800/80 border-stone-700 text-stone-300'
            }`}>
              {status === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0 mt-0.5" />}
              {status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {status === 'idle' && <Sparkles className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* What does Groq do */}
          <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800/80 space-y-2 text-xs text-stone-400">
            <h4 className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ¿Por qué añadir Groq?
            </h4>
            <ul className="list-disc list-inside space-y-1 text-stone-400 text-[11px]">
              <li><strong className="text-stone-300">Enriquecimiento instantáneo de prompts:</strong> respuestas en menos de 400ms.</li>
              <li><strong className="text-stone-300">Generación de arte vectorial (SVG):</strong> respaldo y aceleración con Llama 3.3 70B.</li>
              <li><strong className="text-stone-300">Diccionario artístico técnico:</strong> explicaciones de términos en tiempo real.</li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-stone-800 bg-stone-900/80 flex items-center justify-between">
          <div>
            {apiKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar clave
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={status === 'testing' || !apiKey.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 flex items-center gap-2 transition-all shadow-md shadow-amber-950/30 font-medium"
            >
              {status === 'testing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Validando...
                </>
              ) : (
                'Guardar y Validar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

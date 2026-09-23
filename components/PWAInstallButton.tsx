import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-button"
        type="button"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-3.5 py-1.5 text-xs shadow-sm transition-all active:scale-95"
      >
        <Smartphone size={14} className="stroke-[2.5]" />
        <span>Descargar en Teléfono</span>
      </button>
    );
  }

  // iOS Safari flow or generic mobile prompt
  return (
    <>
      <button
        id="pwa-install-button"
        type="button"
        onClick={() => setShowIOSGuide(true)}
        className="flex items-center gap-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold px-3.5 py-1.5 text-xs shadow-sm transition-all active:scale-95"
      >
        <Smartphone size={14} className="text-amber-400 stroke-[2.5]" />
        <span className="hidden sm:inline">Instalar en Teléfono</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-stone-900 text-amber-400 rounded-2xl shadow-md">
                <Smartphone size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Acceso Móvil</span>
                <h3 className="text-base font-serif font-bold text-stone-900">Instalar ArtGen en tu Teléfono</h3>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200/60 mb-5">
                <p className="font-semibold text-stone-900">En tu iPhone o iPad (Safari):</p>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-stone-700 shadow-sm shrink-0">
                    <Share2 size={16} />
                  </div>
                  <span>1. Pulsa el botón <strong>Compartir</strong> (icono con la flecha hacia arriba) en la barra inferior de Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg text-stone-700 shadow-sm shrink-0">
                    <PlusSquare size={16} />
                  </div>
                  <span>2. Desplázate hacia abajo y selecciona <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.</span>
                </div>
                <p className="text-[11px] text-stone-400 pt-1 border-t border-stone-200/60">
                  ¡Listo! La aplicación funcionará a pantalla completa como una app nativa en tu teléfono.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200/60 mb-5">
                <p className="font-semibold text-stone-900">En tu teléfono Android / Chrome:</p>
                <p>1. Pulsa en el menú de tres puntos de tu navegador (arriba a la derecha).</p>
                <p>2. Selecciona <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.</p>
                <p className="text-[11px] text-stone-400 pt-1 border-t border-stone-200/60">
                  Se descargará el acceso directo con icono oficial para entrar sin barras de navegación.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

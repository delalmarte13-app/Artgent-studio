import React, { useRef } from 'react';
import { Printer, Download, X, FileText, Check, Palette, Sparkles, Building2, ShieldCheck } from 'lucide-react';
import { GalleryItem, CREATIVE_MODES, MOODS, PALETTES } from '../types';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GalleryItem | null;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  const modeObj = CREATIVE_MODES.find(m => m.id === item.formData.mode) || CREATIVE_MODES[0];
  const moodObj = MOODS.find(m => m.id === item.formData.mood) || MOODS[0];
  const paletteObj = PALETTES.find(p => p.id === item.formData.palette) || PALETTES[0];
  const formattedDate = new Date(item.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
      {/* Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-900 text-amber-400 rounded-2xl shadow-sm">
              <FileText size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Documentación Técnica</span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                Ficha & Dossier de Proyecto
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition active:scale-95"
            >
              <Printer size={15} />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Dossier Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-stone-900 bg-white print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Dossier Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b-2 border-stone-900 pb-5 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                    ARTGEN STUDIO • ATELIER DIGITAL
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                    Ref: #{item.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                  {item.title}
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  Departamento: <span className="font-semibold text-stone-800">{modeObj.label}</span> | Fecha de Emisión: <span className="font-semibold text-stone-800">{formattedDate}</span>
                </p>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="inline-block px-3 py-1 bg-stone-100 border border-stone-200 text-stone-700 text-xs font-mono font-bold rounded-lg">
                  {item.formData.isVector ? 'VECTOR SVG' : 'RENDER RASTER IA'}
                </span>
              </div>
            </div>

            {/* Visual Artwork Centerpiece */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-6 flex items-center justify-center shadow-inner overflow-hidden">
              {item.formData.isVector && item.svgContent ? (
                <div 
                  className="w-full max-h-[380px] flex items-center justify-center svg-container"
                  dangerouslySetInnerHTML={{ __html: item.svgContent }} 
                />
              ) : item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-h-[380px] w-auto object-contain rounded-xl shadow-md border border-stone-200"
                />
              ) : null}
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Dimensiones / Proporción
                </span>
                <p className="text-sm font-semibold text-stone-900">
                  {item.formData.width} × {item.formData.height} px
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Formato calibrado de visualización
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Atmósfera & Luz
                </span>
                <p className="text-sm font-semibold text-stone-900">
                  {moodObj.label}
                </p>
                <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                  {moodObj.value}
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Paleta Cromática
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-4 h-4 rounded-full border border-stone-300 shrink-0"
                    style={{ backgroundColor: paletteObj.color }}
                  />
                  <span className="text-sm font-semibold text-stone-900">{paletteObj.label}</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                  {paletteObj.value}
                </p>
              </div>
            </div>

            {/* Detailed Parameters / Attributes */}
            {item.formData.selectedAttributes && Object.keys(item.formData.selectedAttributes).length > 0 && (
              <div className="p-5 bg-stone-50/70 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                  Especificaciones Técnicas Seleccionadas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(item.formData.selectedAttributes).map(([groupId, vals]) => {
                    if (!vals || vals.length === 0) return null;
                    const group = modeObj.attributeGroups.find(g => g.id === groupId);
                    const label = group ? group.label : groupId;
                    return (
                      <div key={groupId} className="p-2.5 bg-white rounded-xl border border-stone-200/80">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          {label}
                        </span>
                        <span className="text-xs font-medium text-stone-800">
                          {vals.join(', ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Concept & Master Prompt */}
            <div className="p-5 bg-stone-900 text-stone-100 rounded-2xl shadow-sm space-y-2">
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase block">
                Memoria Conceptual & Prompt Maestro
              </span>
              <p className="text-xs font-mono leading-relaxed text-stone-200">
                {item.formData.description || "Diseño conceptual exclusivo de alta gama."}
              </p>
            </div>

            {/* Footer / Certification */}
            <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-stone-600" />
                <span>Documento oficial generado por ArtGen Studio Atelier</span>
              </div>
              <div className="signature text-xl text-stone-700">
                ArtGen Studio
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

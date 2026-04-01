"use client";

import React from 'react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ isOpen, onClose, imageUrl, title = "Visualización de Imagen" }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-500"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full flex flex-col items-center animate-in zoom-in slide-in-from-bottom-12 duration-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior */}
        <div className="w-full flex items-center justify-between mb-6 px-4">
            <div className="flex flex-col">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.4em] drop-shadow-md">Registro Visual</h3>
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">{title}</p>
            </div>
            <button 
                onClick={onClose}
                className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all active:scale-90 border border-white/10 group shadow-2xl"
            >
                <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Contenedor de Imagen */}
        <div className="relative group w-full flex justify-center">
            {/* Brillos decorativos */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="bg-white p-3 lg:p-4 rounded-[3rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] border border-white/20 rotate-1 group-hover:rotate-0 transition-all duration-700 max-h-[75vh] overflow-hidden flex items-center justify-center">
                <img 
                    src={imageUrl} 
                    alt="Zoom" 
                    className="max-w-full max-h-[70vh] object-contain rounded-[2rem] shadow-inner"
                />
            </div>

            {/* Etiqueta inferior */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/50 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 border border-indigo-400">
                Vista Detallada
            </div>
        </div>

        {/* Instrucción de cierre */}
        <p className="mt-12 text-white/30 text-[9px] font-black uppercase tracking-[0.5em] animate-pulse">
            Clic fuera de la imagen para cerrar
        </p>
      </div>
    </div>
  );
};

export default ImageZoomModal;

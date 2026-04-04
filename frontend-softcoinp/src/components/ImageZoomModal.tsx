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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500 transition-colors"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full flex flex-col items-center animate-in zoom-in slide-in-from-bottom-12 duration-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior Estilo Softcoinp */}
        <div className="w-full flex items-center justify-between mb-6 px-6 py-4 bg-card/40 backdrop-blur-md rounded-[2rem] border border-white/10 bg-gradient-to-r from-indigo-500/20 to-transparent transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                <div className="flex flex-col">
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.4em] drop-shadow-md">Registro Visual</h3>
                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">{title}</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-2xl backdrop-blur-md transition-all active:scale-90 border border-white/5 group shadow-2xl"
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
            
            <div className="bg-card p-3 lg:p-4 rounded-[3.5rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-700 max-h-[75vh] overflow-hidden flex items-center justify-center">
                <img 
                    src={imageUrl} 
                    alt="Zoom" 
                    className="max-w-full max-h-[70vh] object-contain rounded-[2.5rem] shadow-inner"
                />
            </div>

            {/* Etiqueta inferior */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/50 group-hover:scale-110 transition-all duration-500 border border-indigo-400/50">
                Vista Detallada
            </div>
        </div>

        {/* Instrucción de cierre */}
        <p className="mt-12 text-white/30 text-[9px] font-black uppercase tracking-[0.5em] animate-pulse">
            Clic fuera para cerrar • Softcoinp Visual Engine
        </p>
      </div>
    </div>
  );
};

export default ImageZoomModal;

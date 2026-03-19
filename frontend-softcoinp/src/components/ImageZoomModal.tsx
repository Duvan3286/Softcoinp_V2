"use client";
import React from 'react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-full flex flex-col items-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Título y Cerrar */}
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-between text-white px-2">
          <h3 className="text-sm font-bold uppercase tracking-widest">{title || "Previsualización"}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Imagen en grande */}
        <div className="bg-white p-1.5 rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <img 
            src={imageUrl} 
            alt="Zoom" 
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
          />
        </div>

        {/* Footer info */}
        <div className="mt-4 text-white/50 text-[10px] font-bold uppercase tracking-widest">
          Haz clic fuera para cerrar
        </div>
      </div>
    </div>
  );
};

export default ImageZoomModal;

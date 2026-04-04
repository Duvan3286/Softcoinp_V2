"use client";

import React, { useEffect } from "react";

export type ModalType = "success" | "error" | "warning" | "info" | "confirm";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}) => {
  const getStyle = () => {
    switch (type) {
      case "success":
        return {
          bar: "bg-emerald-600",
          gradient: "from-emerald-50/50 dark:from-emerald-900/20",
          icon: "✅",
          btn: "btn-success",
        };
      case "error":
        return {
          bar: "bg-rose-600",
          gradient: "from-rose-50/50 dark:from-rose-900/20",
          icon: "❌",
          btn: "btn-danger",
        };
      case "warning":
        return {
          bar: "bg-amber-500",
          gradient: "from-amber-50/50 dark:from-amber-900/20",
          icon: "⚠️",
          btn: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100",
        };
      case "confirm":
        return {
          bar: "bg-indigo-600",
          gradient: "from-indigo-50/50 dark:from-indigo-900/20",
          icon: "❓",
          btn: "btn-primary",
        };
      case "info":
      default:
        return {
          bar: "bg-indigo-600",
          gradient: "from-indigo-50/50 dark:from-indigo-900/20",
          icon: "ℹ️",
          btn: "btn-primary",
        };
    }
  };

  const style = getStyle();
  const primaryButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => primaryButtonRef.current?.focus(), 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (type === "confirm" && onConfirm) onConfirm();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, type, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] transform animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-border transition-colors">
        {/* Cabecera Exacta a UserModal */}
        <div className={`bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r ${style.gradient} to-transparent transition-colors`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-4 ${style.bar} rounded-full`}></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5 text-center flex flex-col items-center transition-colors">
          <p className="text-foreground font-bold text-[10px] leading-relaxed mb-6 whitespace-pre-wrap uppercase tracking-tight opacity-80">
            {message}
          </p>
          
          {/* Icono central más pequeño para encajar en el nuevo padding */}
          <div className="text-3xl mb-2">{style.icon}</div>
        </div>

        {/* Pie de página Exacto a UserModal */}
        <div className="p-4 px-5 flex gap-2 mt-auto border-t border-border bg-background transition-colors">
            {type === "confirm" ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-card border border-border text-slate-400 dark:text-slate-500 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  ref={primaryButtonRef}
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className={`flex-1 px-4 py-2 ${style.bar} text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-[0.98] dark:shadow-none`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                ref={primaryButtonRef}
                onClick={onClose}
                className={`w-full px-4 py-2 ${style.bar} text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-[0.98] dark:shadow-none`}
              >
                Entendido
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;

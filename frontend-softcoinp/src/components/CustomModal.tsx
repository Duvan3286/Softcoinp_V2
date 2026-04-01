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
          header: "bg-emerald-600",
          icon: "✅",
          btn: "btn-success",
        };
      case "error":
        return {
          header: "bg-rose-600",
          icon: "❌",
          btn: "btn-danger",
        };
      case "warning":
        return {
          header: "bg-amber-500",
          icon: "⚠️",
          btn: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100",
        };
      case "confirm":
        return {
          header: "bg-indigo-600",
          icon: "❓",
          btn: "btn-primary",
        };
      case "info":
      default:
        return {
          header: "bg-indigo-600",
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
      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden transform animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-slate-100">
        <div className={`${style.header} p-6 text-white flex items-center justify-between relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <h3 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest relative z-10">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">{style.icon}</span> 
            {title}
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition-all active:scale-90 relative z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-10 text-center flex flex-col items-center">
          <div className="w-16 h-1 bg-slate-100 rounded-full mb-8"></div>
          <p className="text-slate-600 font-bold text-sm leading-relaxed mb-10 whitespace-pre-wrap uppercase tracking-tight">
            {message}
          </p>
          
          <div className="flex gap-4 w-full">
            {type === "confirm" ? (
              <>
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1 !py-4"
                >
                  {cancelText}
                </button>
                <button
                  ref={primaryButtonRef}
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className={`${style.btn} flex-1 !py-4 shadow-xl`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                ref={primaryButtonRef}
                onClick={onClose}
                className={`${style.btn} w-full !py-4 shadow-xl !rounded-2xl`}
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;

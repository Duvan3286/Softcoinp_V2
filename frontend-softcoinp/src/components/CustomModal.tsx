"use client";

import React from "react";

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
  if (!isOpen) return null;

  const getStyle = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-600",
          icon: "✅",
          border: "border-emerald-100",
          text: "text-emerald-800",
          btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        };
      case "error":
        return {
          bg: "bg-red-600",
          icon: "❌",
          border: "border-red-100",
          text: "text-red-800",
          btn: "bg-red-600 hover:bg-red-700 shadow-red-200",
        };
      case "warning":
        return {
          bg: "bg-amber-500",
          icon: "⚠️",
          border: "border-amber-100",
          text: "text-amber-800",
          btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
        };
      case "confirm":
        return {
          bg: "bg-blue-700",
          icon: "❓",
          border: "border-blue-100",
          text: "text-gray-800",
          btn: "bg-blue-700 hover:bg-blue-800 shadow-blue-200",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-600",
          icon: "ℹ️",
          border: "border-blue-100",
          text: "text-blue-800",
          btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in duration-300 border border-gray-100">
        <div className={`${style.bg} p-4 text-white flex items-center justify-between`}>
          <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
            <span>{style.icon}</span> {title}
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-gray-600 font-medium text-base leading-relaxed mb-8 whitespace-pre-wrap">
            {message}
          </p>
          
          <div className="flex gap-3 justify-center">
            {type === "confirm" ? (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className={`px-8 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-95 ${style.btn}`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`px-10 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-95 ${style.btn}`}
              >
                Aceptar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;

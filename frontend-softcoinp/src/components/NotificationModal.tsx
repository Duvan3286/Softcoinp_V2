"use client";

import React from "react";

interface NotificationModalProps {
    show: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export default function NotificationModal({ show, title, message, type = 'success', onClose }: NotificationModalProps) {
    if (!show) return null;

    const getStyle = () => {
        switch (type) {
            case 'success':
                return {
                    bar: "bg-emerald-600",
                    gradient: "from-emerald-50/50 dark:from-emerald-900/20",
                    icon: "✅",
                    btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none"
                };
            case 'error':
                return {
                    bar: "bg-rose-600",
                    gradient: "from-rose-50/50 dark:from-rose-900/20",
                    icon: "❌",
                    btn: "bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 shadow-slate-200 dark:shadow-none"
                };
            case 'info':
            default:
                return {
                    bar: "bg-indigo-600",
                    gradient: "from-indigo-50/50 dark:from-indigo-900/20",
                    icon: "ℹ️",
                    btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none"
                };
        }
    };

    const style = getStyle();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] transform transition-all animate-in zoom-in slide-in-from-bottom border border-border transition-colors">
                {/* Cabecera Exacta a UserModal */}
                <div className={`bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r ${style.gradient} to-transparent transition-colors`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-4 ${style.bar} rounded-full`}></div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                            {title}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors p-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-5 text-center flex flex-col items-center">
                    <div className="text-3xl mb-4">{style.icon}</div>
                    <p className="text-foreground font-bold text-[10px] leading-relaxed mb-2 uppercase tracking-tight opacity-80">
                        {message}
                    </p>
                </div>

                <div className="p-4 px-5 flex gap-2 mt-auto border-t border-border bg-background transition-colors">
                    <button 
                        onClick={onClose}
                        className={`w-full py-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98] ${style.btn}`}
                    >
                        Aceptar y Continuar
                    </button>
                </div>
            </div>
        </div>
    );
}

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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col p-8 text-center items-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-6 shadow-xl
                    ${type === 'success' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 
                      type === 'error' ? 'bg-rose-50 text-rose-600 shadow-rose-100' : 
                      'bg-blue-50 text-blue-600 shadow-blue-100'}
                `}>
                    {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
                </div>
                
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                    {title}
                </h3>
                
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8 leading-relaxed">
                    {message}
                </p>
                
                <button 
                    onClick={onClose}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95
                        ${type === 'success' ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 
                          type === 'error' ? 'bg-slate-800 text-white shadow-slate-200 hover:bg-slate-900' :
                          'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'}
                    `}
                >
                    Aceptar y Continuar
                </button>
            </div>
        </div>
    );
}

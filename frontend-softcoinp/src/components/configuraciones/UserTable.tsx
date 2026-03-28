"use client";

import React from "react";
import { User } from "@/services/userService";
import { getCurrentUser } from "@/utils/auth";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
}

export default function UserTable({ users, onEdit, onDelete, onResetPassword }: UserTableProps) {
  const currentUser = getCurrentUser();

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <span className="text-4xl mb-4 opacity-20">👥</span>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div 
          key={user.id} 
          className="w-full bg-white rounded-2xl p-4 lg:px-8 lg:py-4 border border-slate-100 shadow-sm flex items-center gap-4 lg:gap-8 transition-all hover:bg-emerald-50/40 hover:border-emerald-100 hover:shadow-md group"
        >
          {/* Avatar / Icono */}
          <div className={`w-12 h-12 shrink-0 ${user.role === 'superadmin' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'} rounded-xl flex items-center justify-center text-sm font-black shadow-inner transition-all group-hover:scale-110 uppercase`}>
            {user.nombre?.substring(0, 2) || "U"}
          </div>

          {/* Info Principal */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors truncate">
                {user.nombre || "Usuario sin nombre"}
            </h2>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[150px] lg:max-w-none">
                    {user.email}
                </p>
                <div className="h-1 w-1 bg-slate-300 rounded-full hidden sm:block"></div>
                <p className="text-[9px] font-black text-slate-300 uppercase hidden sm:block">
                    Desde {new Date(user.createdAt).toLocaleDateString()}
                </p>
            </div>
          </div>

          {/* Badge de Rol */}
          <div className="hidden md:block">
            <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${
                user.role === "superadmin" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                user.role === "admin" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                "bg-blue-50 text-blue-600 border border-blue-100"
            }`}>
                {user.role}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {(currentUser?.role === "superadmin" || user.role !== "superadmin") && (
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button
                        onClick={() => onEdit(user)}
                        className="p-2 bg-slate-50 text-slate-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                        title="Editar Usuario"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={() => onResetPassword(user.id)}
                        className="p-2 bg-slate-50 text-slate-500 hover:bg-orange-500 hover:text-white rounded-lg transition-all shadow-sm"
                        title="Resetear Contraseña"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </button>
                    {user.email !== currentUser?.email && (
                        <button
                            onClick={() => onDelete(user.id)}
                            className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm"
                            title="Eliminar Usuario"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            )}
            <div className="group-hover:hidden transition-all text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

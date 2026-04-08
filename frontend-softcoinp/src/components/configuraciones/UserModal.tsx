"use client";

import React, { useState, useEffect } from "react";
import { User, userService } from "@/services/userService";
import { getCurrentUser, UserPayload } from "@/utils/auth";

interface UserModalProps {
  user: User | null; // Si es null, estamos creando
  onClose: () => void;
  onSave: () => void;
}

export default function UserModal({ user, onClose, onSave }: UserModalProps) {
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "user",
  });
  const [currentUser, setCurrentUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        email: user.email,
        password: "",
        role: user.role || "user",
      });
    } else {
      setFormData({
        nombre: "",
        email: "",
        password: "",
        role: "user",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.updateUser(user.id, updateData);
      } else {
        await userService.createUser(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || "Ocurrió un error al guardar el usuario.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] transform transition-all animate-in zoom-in slide-in-from-bottom border border-border transition-colors">
        <div className="bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r from-emerald-50/50 dark:from-emerald-900/20 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}

          <form id="user-form" onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Nombre Completo</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-500 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600 font-bold text-foreground uppercase text-[10px]"
                placeholder="Nombre (Ej: Juan Pérez)"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-500 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600 font-bold text-foreground text-[10px]"
                placeholder="Correo (Ej: j.perez@empresa.com)"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">
                Contraseña {isEditing && <span className="text-emerald-400 opacity-60 ml-1">(OPCIONAL)</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditing}
                autoComplete="new-password"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-500 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600 font-bold text-foreground text-[10px]"
                placeholder={isEditing ? "••••••••" : "Mínimo 6 caracteres"}
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Rol del Sistema</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-500 outline-none transition-all font-black text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-tight cursor-pointer"
              >
                <option value="user">Usuario Básico</option>
                {currentUser?.role === "superadmin" && (
                  <option value="admin">Administrador</option>
                )}
                {formData.role === "superadmin" && currentUser?.role === "superadmin" && (
                   <option value="superadmin">Súper Admin (Root)</option>
                )}
              </select>
            </div>
          </form>
        </div>

        <div className="p-4 px-5 flex gap-2 mt-auto border-t border-border bg-background transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-card border border-border text-slate-400 dark:text-slate-500 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Procesando..." : isEditing ? "Guardar" : "Crear Usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

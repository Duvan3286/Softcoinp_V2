"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userService, User } from "@/services/userService";
import { permissionsService, ViewInfo } from "@/services/permissionsService";
import { getCurrentUser } from "@/utils/auth";
import NotificationModal from "@/components/NotificationModal";

export default function PermissionsPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [catalog, setCatalog] = useState<ViewInfo[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
        show: false, title: '', message: '', type: 'success'
    });

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
            router.push("/dashboard");
            return;
        }
        setCurrentUser(user);
        loadInitialData(user);
    }, [router]);

    const loadInitialData = async (viewer?: any) => {
        try {
            const [usersData, catalogData] = await Promise.all([
                userService.getUsers(),
                permissionsService.getCatalog()
            ]);
            
            // 🛡️ Filtrado Jerárquico de Seguridad
            let filteredUsers = usersData.filter(u => u.id !== viewer?.id);
            
            if (viewer?.role === 'admin') {
                // El Admin solo puede ver y gestionar a los "usuario" (básicos)
                filteredUsers = filteredUsers.filter(u => u.role === 'usuario');
            }
            // El Superadmin puede ver a todos (excepto a sí mismo, ya filtrado arriba)

            setUsers(filteredUsers);
            setCatalog(catalogData);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = async (user: User) => {
        setSelectedUser(user);
        try {
            const permissions = await permissionsService.getUserPermissions(user.id);
            setUserPermissions(permissions);
        } catch (error) {
            console.error("Error al cargar permisos del usuario:", error);
        }
    };

    const togglePermission = (key: string) => {
        setUserPermissions(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const toggleCategory = (category: string, keys: string[]) => {
        const allSelected = keys.every(key => userPermissions.includes(key));
        if (allSelected) {
            // Desactivar todos los del grupo
            setUserPermissions(prev => prev.filter(k => !keys.includes(k)));
        } else {
            // Activar todos los del grupo (evitando duplicados)
            setUserPermissions(prev => [...new Set([...prev, ...keys])]);
        }
    };

    // Agrupar catálogo por categorías
    const groupedCatalog = catalog.reduce((acc, view) => {
        const category = view.category || "General";
        if (!acc[category]) acc[category] = [];
        acc[category].push(view);
        return acc;
    }, {} as Record<string, ViewInfo[]>);

    const handleSave = async () => {
        if (!selectedUser || !currentUser) return;
        
        // 🛡️ Doble chequeo de seguridad en Frontend
        if (currentUser.role === 'admin' && selectedUser.role !== 'usuario') {
            setNotification({
                show: true,
                title: "Error de Seguridad",
                message: "No tienes permisos para modificar este nivel de usuario",
                type: 'error'
            });
            return;
        }

        setSaving(true);
        try {
            await permissionsService.updateUserPermissions(selectedUser.id, userPermissions);
            setNotification({
                show: true,
                title: "Éxito",
                message: "Permisos actualizados con éxito",
                type: 'success'
            });
        } catch (error) {
            console.error("Error al guardar permisos:", error);
            setNotification({
                show: true,
                title: "Error",
                message: "Ocurrió un error al guardar los permisos",
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando Sistema de Permisos...</div>;

    return (
        <div className="h-full bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
            {/* Sidebar Usuarios */}
            <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">👥</span> 
                        Usuarios del Sistema
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Selecciona para gestionar</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar">
                    {users.map(u => (
                        <button
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-4 group relative overflow-hidden border
                                ${selectedUser?.id === u.id 
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm' 
                                    : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'}
                            `}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform group-hover:scale-110
                                ${selectedUser?.id === u.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}
                            `}>
                                {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase truncate tracking-tight">{u.nombre}</p>
                                <p className="text-[9px] font-bold text-slate-400 truncate uppercase mt-0.5 tracking-tighter">{u.email}</p>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter
                                ${u.role === 'superadmin' ? 'bg-rose-100 text-rose-600' : u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}
                            `}>
                                {u.role}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Panel de Permisos */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {selectedUser ? (
                    <>
                        <div className="p-6 lg:p-10 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                            <div>
                                <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none flex items-center gap-3">
                                    Permisos de <span className="text-indigo-600">{selectedUser.nombre}</span>
                                </h1>
                                <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Configuración de acceso granular por categorías</p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95
                                    ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-indigo-200'}
                                `}
                            >
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-50/50">
                            <div className="max-w-7xl mx-auto flex flex-col gap-10">
                                {Object.entries(groupedCatalog).map(([category, views]) => {
                                    const allCategorySelected = views.every(v => userPermissions.includes(v.key));
                                    const someCategorySelected = views.some(v => userPermissions.includes(v.key));
                                    
                                    return (
                                        <section key={category} className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between px-2">
                                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm">
                                                        {views[0]?.icon || "📁"}
                                                    </span>
                                                    {category}
                                                </h3>
                                                <button 
                                                    onClick={() => toggleCategory(category, views.map(v => v.key))}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border
                                                        ${allCategorySelected 
                                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                                                            : someCategorySelected 
                                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}
                                                    `}
                                                >
                                                    {allCategorySelected ? "✓ Todo el Grupo" : someCategorySelected ? "Ajuste Parcial" : "Activar Grupo"}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {views.map(view => {
                                                    const isSelected = userPermissions.includes(view.key);
                                                    return (
                                                        <div 
                                                            key={view.key}
                                                            onClick={() => togglePermission(view.key)}
                                                            className={`group p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[140px] relative overflow-hidden
                                                                ${isSelected 
                                                                    ? 'bg-white border-indigo-600 shadow-indigo-100 shadow-xl' 
                                                                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg opacity-60 hover:opacity-100'}
                                                            `}
                                                        >
                                                            {/* Indicador de check */}
                                                            {isSelected && (
                                                                <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-bl-2xl animate-in zoom-in duration-300">
                                                                    <span className="text-white text-base">✓</span>
                                                                </div>
                                                            )}

                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110
                                                                ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}
                                                            `}>
                                                                {view.icon}
                                                            </div>
                                                            
                                                            <div className="mt-4">
                                                                <h3 className={`text-xs font-black uppercase tracking-tight transition-colors ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                                                                    {view.name}
                                                                </h3>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                                                                     Vista: {view.key}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white mx-10 my-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner">
                            👥
                        </div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestión de Permisos</h2>
                        <p className="text-xs font-bold text-slate-400 mt-2 max-w-xs uppercase tracking-wider leading-relaxed">
                            Selecciona un usuario de la lista de la izquierda para configurar sus permisos de visualización en el sistema.
                        </p>
                    </div>
                )}
            </div>

            <NotificationModal 
                show={notification.show}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ ...notification, show: false })}
            />
        </div>
    );
}

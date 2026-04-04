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

    if (loading) return <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest animate-pulse transition-colors">Cargando Sistema de Permisos...</div>;

    return (
        <div className="h-full bg-background flex flex-col lg:flex-row overflow-hidden font-sans transition-colors duration-300">
            {/* Sidebar Usuarios */}
            <div className="w-full lg:w-80 bg-card border-r border-border flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] dark:shadow-none z-20 transition-colors">
                <div className="p-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">👥</span> 
                            Usuarios
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">Selecciona para editar</p>
                    </div>
                    <button 
                        onClick={() => router.push("/configuraciones")}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all active:scale-95 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                        title="Volver"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
                    {users.map(u => (
                        <button
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className={`w-full text-left p-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3 group relative border-2
                                ${selectedUser?.id === u.id 
                                    ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100 shadow-[0_8px_16px_-6px_rgba(79,70,229,0.1)]' 
                                    : 'bg-card border-card hover:border-border hover:bg-background text-slate-600 dark:text-slate-400 shadow-sm'}
                            `}
                        >
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500
                                ${selectedUser?.id === u.id 
                                    ? 'bg-indigo-600 text-white shadow-lg rotate-3' 
                                    : 'bg-background text-slate-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}
                            `}>
                                {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-black uppercase tracking-tight truncate transition-colors ${selectedUser?.id === u.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {u.nombre}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter
                                        ${u.role === 'superadmin' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : u.role === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}
                                    `}>
                                        {u.role}
                                    </span>
                                </div>
                            </div>
                            {selectedUser?.id === u.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Panel de Permisos */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-background transition-colors duration-300">
                {/* Fondo sutil para dark mode */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]"></div>

                {selectedUser ? (
                    <>
                        <div className="p-6 lg:px-10 lg:py-8 border-b border-border bg-card/90 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="hidden sm:flex w-14 h-14 bg-indigo-600 rounded-3xl items-center justify-center text-white text-xl font-black shadow-xl shadow-indigo-200 dark:shadow-none rotate-3">
                                    {selectedUser.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                        Gestión de <span className="text-indigo-600 dark:text-indigo-400">Permisos</span>
                                    </h1>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        Usuario: {selectedUser.nombre} ({selectedUser.email})
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`relative group px-10 py-4 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 overflow-hidden
                                        ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-indigo-300'}
                                    `}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {saving ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Sincronizando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                Aplicar Cambios
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative z-10">
                            <div className="max-w-6xl mx-auto flex flex-col gap-12">
                                {Object.entries(groupedCatalog).map(([category, views]) => {
                                    const allCategorySelected = views.every(v => userPermissions.includes(v.key));
                                    const someCategorySelected = views.some(v => userPermissions.includes(v.key));
                                    
                                    return (
                                        <section key={category} className="group/section">
                                            <div className="flex items-end justify-between px-2 mb-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] mb-1">Módulo</span>
                                                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                                                        <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-card border border-border shadow-sm text-xl group-hover/section:scale-110 transition-transform duration-500">
                                                            {views[0]?.icon || "📁"}
                                                        </span>
                                                        {category}
                                                    </h3>
                                                </div>
                                                <button 
                                                    onClick={() => toggleCategory(category, views.map(v => v.key))}
                                                    className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2
                                                        ${allCategorySelected 
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' 
                                                            : someCategorySelected 
                                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                                                : 'bg-card text-slate-400 dark:text-slate-500 border-border hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}
                                                    `}
                                                >
                                                    {allCategorySelected ? "✓ Seleccionado" : someCategorySelected ? "Incompleto" : "Seleccionar Todo"}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {views.map(view => {
                                                    const isSelected = userPermissions.includes(view.key);
                                                    return (
                                                        <div 
                                                            key={view.key}
                                                            onClick={() => togglePermission(view.key)}
                                                            className={`group p-4 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex items-center gap-4 relative overflow-hidden
                                                                ${isSelected 
                                                                    ? 'bg-card border-indigo-500 dark:border-indigo-400 shadow-[0_12px_24px_-8px_rgba(79,70,229,0.15)] ring-4 ring-indigo-50 dark:ring-indigo-900/20' 
                                                                    : 'bg-card border-border hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/10 shadow-sm hover:shadow-md'}
                                                            `}
                                                        >
                                                            {/* Checkbox Visual */}
                                                            <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300
                                                                ${isSelected 
                                                                    ? 'bg-indigo-600 border-indigo-600 rotate-[360deg] scale-110' 
                                                                    : 'bg-background border-border group-hover:border-indigo-400'}
                                                            `}>
                                                                {isSelected && (
                                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className={`text-[10px] font-black uppercase tracking-tight transition-colors truncate
                                                                    ${isSelected ? 'text-foreground' : 'text-slate-600 dark:text-slate-400 group-hover:text-indigo-900 dark:group-hover:text-indigo-300'}
                                                                `}>
                                                                    {view.name}
                                                                </h3>
                                                                <p className={`text-[8px] font-bold uppercase mt-0.5 tracking-widest truncate opacity-50
                                                                    ${isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
                                                                `}>
                                                                     {view.key}
                                                                </p>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-16 mb-8 text-center">
                                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em]">Fin de Configuración</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 relative z-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
                            <div className="relative bg-card p-12 lg:p-16 rounded-[4rem] border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col items-center text-center max-w-md transition-colors">
                                <div className="w-28 h-28 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 shadow-inner rotate-3 group-hover:rotate-6 transition-transform duration-500">
                                    🛡️
                                </div>
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Consola de Seguridad</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-[0.1em] leading-relaxed">
                                    Configura los privilegios de acceso para el personal del sistema. Selecciona un usuario para comenzar.
                                </p>
                                <div className="mt-10 flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-200 dark:bg-indigo-800" />
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-600" />
                                    <div className="w-2 h-2 rounded-full bg-indigo-200 dark:bg-indigo-800" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>

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

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userService, User } from "@/services/userService";
import UserTable from "@/components/configuraciones/UserTable";
import UserModal from "@/components/configuraciones/UserModal";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { settingsService } from "@/services/settingsService";

export default function UsuariosConfigPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [systemVersion, setSystemVersion] = useState("");
  const [clientName, setClientName] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 🔄 Estado de los Modales Custom
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (title: string, message: string, type: ModalType, onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    settingsService.getSystemVersion().then(setSystemVersion);
    settingsService.getClientName().then(setClientName);
  }, []);

  const handleOpenModal = (user?: User) => {
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    await fetchUsers(); // Refresh the list
    handleCloseModal();
  };

  const handleDeleteUser = async (id: string) => {
    showModal(
        "¿Eliminar Usuario?", 
        "¿Estás seguro de que deseas eliminar este usuario? Esta acción es irreversible.", 
        "confirm", 
        async () => {
            try {
                await userService.deleteUser(id);
                await fetchUsers();
                showModal("Eliminado", "Usuario eliminado correctamente.", "success");
            } catch (err: any) {
                showModal("Error", err.response?.data?.message || "Error al eliminar usuario.", "error");
            }
        }
    );
  };

  const handleResetPassword = async (id: string) => {
    showModal(
        "¿Resetear Contraseña?", 
        "¿Estás seguro de que deseas resetear la contraseña de este usuario? Se encriptará una predeterminada temporalmente.", 
        "confirm", 
        async () => {
            try {
                const result = await userService.resetPassword(id);
                const passMsg = result.temporaryPassword ? `\nNueva contraseña: ${result.temporaryPassword}` : "";
                showModal("Contraseña Reseteada", result.message + passMsg, "success");
            } catch (err: any) {
                showModal("Error", err.response?.data?.message || "Error al resetear contraseña.", "error");
            }
        }
    );
  };

  return (
    <div className="h-full bg-background p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 font-sans transition-colors duration-300">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-sm transition-transform hover:scale-110">
                    <span className="text-xl">👥</span>
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight leading-none">Gestión de Usuarios</h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Cuentas y niveles de acceso</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push("/configuraciones")}
                  className="bg-card text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-2 px-4 rounded-xl font-black border border-border shadow-sm transition-all active:scale-95 flex items-center gap-2 text-[10px] uppercase tracking-widest"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Volver
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95"
                >
                  + Nuevo Usuario
                </button>
            </div>
        </div>
        <div className="w-full h-px bg-border mt-4 opacity-50"></div>
      </div>

      <main className="w-full max-w-4xl flex flex-col min-h-0 overflow-y-auto pr-1 pb-10 custom-scrollbar">
        {error && <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 p-4 rounded-xl mb-6 text-[11px] font-bold uppercase tracking-tight flex items-center gap-3 animate-in fade-in slide-in-from-top">
          <span className="text-lg">❌</span> {error}
        </div>}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700 gap-4">
            <div className="w-10 h-10 border-4 border-border border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargando usuarios...</p>
          </div>
        )}

        {!loading && !error && (
            <UserTable
               users={users}
               onEdit={handleOpenModal}
               onDelete={handleDeleteUser}
               onResetPassword={handleResetPassword}
            />
        )}

        {isModalOpen && (
          <UserModal
            user={selectedUser}
            onClose={handleCloseModal}
            onSave={handleSaveUser}
          />
        )}

        {/* Modal Único de Alertas/Confirmaciones */}
        <CustomModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      </main>

      <div className="w-full max-w-4xl flex justify-center mt-auto pb-4 shrink-0 px-2 lg:px-0">
         <p className="text-[9px] text-slate-300 dark:text-slate-600 font-black tracking-[0.3em] uppercase">
            Control de Acceso Softcoinp {systemVersion || "..."} • {clientName || "Panel de Administración Profesional"}
         </p>
      </div>
    </div>
  );
}

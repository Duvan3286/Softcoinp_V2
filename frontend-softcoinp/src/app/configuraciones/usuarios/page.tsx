"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userService, User } from "@/services/userService";
import UserTable from "@/components/configuraciones/UserTable";
import UserModal from "@/components/configuraciones/UserModal";
import CustomModal, { ModalType } from "@/components/CustomModal";

export default function UsuariosConfigPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans p-6">
      <main className="flex-1 max-w-7xl mx-auto w-full">
        {/* Header con navegación */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
               onClick={() => router.push("/configuraciones")}
               className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg font-semibold shadow-md transition-all flex items-center text-sm"
               title="Volver a Configuraciones"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Configuraciones
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all active:scale-95"
          >
            + Nuevo Usuario
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
          <span>❌</span> {error}
        </div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
             <UserTable
              users={users}
              onEdit={handleOpenModal}
              onDelete={handleDeleteUser}
              onResetPassword={handleResetPassword}
            />
          </div>
        )}
      </main>

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
    </div>
  );
}

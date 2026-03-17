"use client";

import React, { useState, useEffect } from "react";
import { userService, User } from "@/services/userService";
import UserTable from "@/components/configuraciones/UserTable";
import UserModal from "@/components/configuraciones/UserModal";
import Header from "@/components/Header"; // Asumiendo que existe, o haré un header básico

export default function ConfiguracionesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        await userService.deleteUser(id);
        await fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.message || "Error al eliminar usuario.");
      }
    }
  };

  const handleResetPassword = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas resetear la contraseña de este usuario? Se encriptará una predeterminada temporalmente al guardarlo.")) {
      try {
        const result = await userService.resetPassword(id);
        alert(result.message + (result.temporaryPassword ? `\nNueva contraseña: ${result.temporaryPassword}` : ""));
      } catch (err: any) {
        alert(err.response?.data?.message || "Error al resetear contraseña.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Configuraciones</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            + Nuevo Usuario
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-10 text-gray-500">Cargando usuarios...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
    </div>
  );
}

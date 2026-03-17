import React from "react";
import { User } from "@/services/userService";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
}

export default function UserTable({ users, onEdit, onDelete, onResetPassword }: UserTableProps) {
  if (users.length === 0) {
    return <div className="p-6 text-center text-gray-500">No hay usuarios registrados.</div>;
  }

  return (
    <table className="min-w-full divide-y divide-gray-200 text-sm left-0 text-left">
      <thead className="bg-gray-50 text-gray-600 font-medium">
        <tr>
          <th className="px-6 py-4 text-left font-medium">Nombre</th>
          <th className="px-6 py-4 text-left font-medium">Email</th>
          <th className="px-6 py-4 text-left font-medium">Rol</th>
          <th className="px-6 py-4 text-left font-medium">Registrado</th>
          <th className="px-6 py-4 text-right font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{user.nombre || "-"}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
              }`}>
                {user.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right font-medium space-x-3">
              <button
                onClick={() => onEdit(user)}
                className="text-blue-600 hover:text-blue-900"
                title="Editar Usuario"
              >
                Editar
              </button>
              <button
                onClick={() => onResetPassword(user.id)}
                className="text-orange-600 hover:text-orange-900"
                title="Resetear Contraseña"
              >
                Resetear Contraseña
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="text-red-600 hover:text-red-900"
                title="Eliminar Usuario"
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

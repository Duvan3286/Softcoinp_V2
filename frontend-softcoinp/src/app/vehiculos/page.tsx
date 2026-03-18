"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";

interface VehiculoRow {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipoVehiculo: string;
  fotoUrl: string;
  propietarioId: string;
  propietarioNombre: string;
  propietarioApellido: string;
  propietarioDocumento: string;
  propietarioTipo: string;
}

const BACKEND_BASE_URL = "http://localhost:5004/static";

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 Filtros avanzados
  const [filtros, setFiltros] = useState({
    placa: "",
    documento: "",
    marca: "",
    tipoVehiculo: ""
  });

  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUsuario(user);
    loadVehiculos();
  }, []);

  const loadVehiculos = async (params = {}) => {
    try {
      setLoading(true);
      
      // Construir query string de forma limpia
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });

      const endpoint = queryParams.toString() 
        ? `/vehiculos/buscar?${queryParams.toString()}` 
        : "/vehiculos";
        
      const res = await api.get(endpoint) as any;
      if (res.data?.success) {
        setVehiculos(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando vehículos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadVehiculos(filtros);
  };

  const handleClearFilters = () => {
    const cleared = { placa: "", documento: "", marca: "", tipoVehiculo: "" };
    setFiltros(cleared);
    loadVehiculos(cleared);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🚗 Vehículos Registrados
          </h1>
          <p className="text-sm text-gray-500">Listado histórico de vehículos y propietarios</p>
        </div>


      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Placa</label>
              <input
                type="text"
                name="placa"
                placeholder="Ej: ABC123"
                value={filtros.placa}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition outline-none text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Documento Propietario</label>
              <input
                type="text"
                name="documento"
                placeholder="CC / NIT"
                value={filtros.documento}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Marca</label>
              <input
                type="text"
                name="marca"
                placeholder="Ej: Toyota"
                value={filtros.marca}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tipo de Vehículo</label>
              <select
                name="tipoVehiculo"
                value={filtros.tipoVehiculo}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition outline-none text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="carro">Carro</option>
                <option value="moto">Moto</option>
                <option value="camioneta">Camioneta</option>
                <option value="camion">Camión</option>
                <option value="bus">Bus / Microbús</option>
                <option value="bicicleta">Bicicleta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              🧹 Limpiar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              🔍 Aplicar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-y-auto shadow-md rounded-lg border border-gray-300 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 text-white sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Foto</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Placa</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Marca/Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Color</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Propietario</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Documento</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Vínculo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando vehículos...</span>
                  </div>
                </td>
              </tr>
            ) : vehiculos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500 italic">
                  No hay vehículos registrados para mostrar.
                </td>
              </tr>
            ) : (
              vehiculos.map((v, index) => {
                const isOdd = index % 2 !== 0;
                return (
                  <tr key={v.id} className={`${isOdd ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition duration-150`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {v.fotoUrl ? (
                         <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                            <img src={v.fotoUrl.startsWith('http') ? v.fotoUrl : `${BACKEND_BASE_URL}${v.fotoUrl}`} alt="Vehículo" className="w-full h-full object-cover" />
                         </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          🚗
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-800 uppercase">{v.placa}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium capitalize">
                        {v.tipoVehiculo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {v.marca || '-'} {v.modelo ? `/ ${v.modelo}` : ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{v.color || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {v.propietarioNombre} {v.propietarioApellido}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{v.propietarioDocumento}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                       <span className={`px-2 py-1 rounded-full font-bold uppercase ${v.propietarioTipo === 'empleado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                         {v.propietarioTipo}
                       </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

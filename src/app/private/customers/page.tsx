"use client";

import { useEffect, useState } from "react";
import {
  FaCar,
  FaUser,
  FaCalendarAlt,
  FaEye,
  FaInfo,
  FaPalette,
  FaHashtag,
} from "react-icons/fa";
import { getSessionUser } from "@/utils/session";
import { getUserVehicles, UserVehicleResponse } from "@/features/vehicles/api";

declare global {
  interface Window {
    Swal: any;
  }
}

export default function CustomersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userVehicles, setUserVehicles] = useState<UserVehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);
    setLoading(false);

    if (user?.id) {
      loadUserVehicles(user.id);
    }
  }, []);

  async function loadUserVehicles(userId: string | number) {
    try {
      console.log("[CUSTOMERS] Loading vehicles for user:", userId);
      setVehiclesLoading(true);

      const vehicles = await getUserVehicles(Number(userId));
      console.log("[CUSTOMERS] Vehicles loaded:", vehicles);

      setUserVehicles(Array.isArray(vehicles) ? vehicles : []);
    } catch (err: any) {
      console.error("[CUSTOMERS] Error loading user vehicles:", err);

      // Mostrar error al usuario
      if (window.Swal) {
        window.Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los vehículos. Verifica la conexión.",
          timer: 3000,
          showConfirmButton: false,
        });
      }

      setUserVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }

  function handleViewVehicleDetails(vehicle: UserVehicleResponse) {
    const vehicleData = vehicle.vehicleResponse;
    if (window.Swal) {
      window.Swal.fire({
        title: `Detalles del Vehículo`,
        html: `
          <div class="text-left space-y-3">
            <div class="bg-gray-50 p-3 rounded">
              <p><strong>🚗 Placa:</strong> ${vehicleData.plate}</p>
              <p><strong>🏭 Marca:</strong> ${vehicleData.make}</p>
              <p><strong>🚙 Modelo:</strong> ${vehicleData.model}</p>
            </div>
            <div class="bg-blue-50 p-3 rounded">
              <p><strong>🎨 Color:</strong> ${vehicleData.color || "No especificado"}</p>
              <p><strong>📋 VIN:</strong> ${vehicleData.vin || "No registrado"}</p>
              <p><strong>🆔 ID Vehículo:</strong> ${vehicleData.id}</p>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <p><strong>📅 Registrado:</strong> ${new Date(
                vehicleData.createdAt
              ).toLocaleString()}</p>
            </div>
          </div>
        `,
        icon: "info",
        width: "500px",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Cerrar",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-dark)]">
            Mis Servicios
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta el estado de tus vehículos y servicios
          </p>
        </div>
      </div>

      {/* Customer Info */}
      {currentUser && (
        <div className="bg-[var(--color-light)] border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FaUser className="text-[var(--color-primary)]" size={20} />
            <div>
              <h3 className="font-semibold">{currentUser.name}</h3>
              <p className="text-sm text-gray-600">{currentUser.email}</p>
              <p className="text-xs text-gray-500">
                Cliente ID: {currentUser.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Vehicles Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCar className="text-[var(--color-primary)]" size={20} />
          <h3 className="text-lg font-semibold">Mis Vehículos</h3>
          <span className="text-sm text-gray-500">
            ({userVehicles.length} vehículos registrados)
          </span>
        </div>

        <p className="text-gray-600 mb-4">
          Estos son los vehículos que tienes registrados en el taller.
        </p>

        {vehiclesLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
            <span className="ml-2 text-gray-600">Cargando vehículos...</span>
          </div>
        ) : userVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userVehicles.map((userVehicle) => (
              <div
                key={userVehicle.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaCar className="text-[var(--color-primary)]" size={18} />
                    <h4 className="font-semibold text-lg">
                      {userVehicle.vehicleResponse.plate}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleViewVehicleDetails(userVehicle)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                    title="Ver detalles completos"
                  >
                    <FaEye size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaHashtag className="text-gray-500" size={12} />
                    <span className="text-sm font-medium">
                      {userVehicle.vehicleResponse.make}{" "}
                      {userVehicle.vehicleResponse.model}
                    </span>
                  </div>

                  {userVehicle.vehicleResponse.color && (
                    <div className="flex items-center gap-2">
                      <FaPalette className="text-gray-500" size={12} />
                      <span className="text-sm text-gray-600">
                        {userVehicle.vehicleResponse.color}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-500" size={12} />
                    <span className="text-sm text-gray-600">
                      Registrado:{" "}
                      {new Date(
                        userVehicle.vehicleResponse.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  {userVehicle.vehicleResponse.vin && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <span className="text-xs text-gray-500">
                        VIN: {userVehicle.vehicleResponse.vin}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    ID: {userVehicle.vehicleResponse.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaCar className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-2">No tienes vehículos registrados</p>
            <p className="text-sm text-gray-500">
              Contacta al administrador del taller para registrar tu vehículo
            </p>
          </div>
        )}
      </div>

      {/* Service History Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCalendarAlt className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold">Historial de Servicios</h3>
        </div>

        <p className="text-gray-600 mb-4">
          Consulta el historial de servicios de tus vehículos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (window.Swal) {
                window.Swal.fire({
                  icon: "info",
                  title: "Funcionalidad en desarrollo",
                  text: "Esta función mostrará el historial usando GET /api/vehicle/visit/{id}",
                });
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaEye size={14} />
            Ver Historial
          </button>

          <button
            onClick={() => {
              if (window.Swal) {
                window.Swal.fire({
                  icon: "info",
                  title: "Funcionalidad en desarrollo",
                  text: "Esta función mostrará facturas y pagos",
                });
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaInfo size={14} />
            Ver Facturación
          </button>
        </div>
      </div>
    </div>
  );
}
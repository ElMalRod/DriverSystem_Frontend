export interface VehicleMake {
  id: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  make_id: number;
  name: string;
}

export interface Vehicle {
  id: number;
  vin?: string;
  plate?: string;
  make_id: number;
  model_id: number;
  model_year?: number;
  color?: string;
  created_at: string;
}

// Marcas de vehículos
export async function getVehicleMakes(): Promise<VehicleMake[]> {
  const res = await fetch("/api/vehicle/makes", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener marcas de vehículos");
  }
  return res.json();
}

export async function createVehicleMake(make: { name: string }): Promise<VehicleMake> {
  const res = await fetch("/api/vehicle/makes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(make),
  });
  if (!res.ok) {
    throw new Error("Error al crear marca de vehículo");
  }
  return res.json();
}

export async function updateVehicleMake(make: VehicleMake): Promise<VehicleMake> {
  const res = await fetch("/api/vehicle/makes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(make),
  });
  if (!res.ok) {
    throw new Error("Error al actualizar marca de vehículo");
  }
  return res.json();
}

export async function deleteVehicleMake(id: number): Promise<void> {
  const res = await fetch(`/api/vehicle/makes?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al eliminar marca de vehículo");
  }
}

// Modelos de vehículos
export async function getVehicleModels(): Promise<VehicleModel[]> {
  const res = await fetch("/api/vehicle/model", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener modelos de vehículos");
  }
  return res.json();
}

export async function createVehicleModel(model: { make_id: number; name: string }): Promise<VehicleModel> {
  const res = await fetch("/api/vehicle/model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(model),
  });
  if (!res.ok) {
    throw new Error("Error al crear modelo de vehículo");
  }
  return res.json();
}

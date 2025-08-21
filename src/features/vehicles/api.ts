export interface VehicleMake {
  id: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  makeId: number;
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
  const res = await fetch("/api/vehicle/makes/", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener marcas de vehículos");
  }
  return res.json();
}

export async function getVehicleMakeById(id: number): Promise<VehicleMake> {
  const res = await fetch(`/api/vehicle/makes/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener la marca de vehículo");
  }
  return res.json();
}

// Para CREATE
export async function createVehicleMake(make: { name: string }): Promise<VehicleMake> {
  const res = await fetch("/api/vehicle/makes/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id: 0, name: make.name }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al crear marca de vehículo: ${error}`);
  }
  return res.json();
}

// Para UPDATE: enviar el objeto completo con id y name
export async function updateVehicleMake(make: { id: number; name: string }): Promise<VehicleMake> {
  const res = await fetch("/api/vehicle/makes/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(make), // enviar tal como está: { id, name }
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al actualizar marca de vehículo: ${error}`);
  }
  return res.json();
}

// Para DELETE: usar query parameter
export async function deleteVehicleMake(id: number): Promise<VehicleMake> {
  const res = await fetch(`/api/vehicle/makes/?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al eliminar marca de vehículo: ${error}`);
  }
  return res.json();
}

// Modelos de vehículos
export async function getVehicleModels(): Promise<VehicleModel[]> {
  const res = await fetch("/api/vehicle/model/", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener modelos de vehículos");
  }
  return res.json();
}

export async function getVehicleModelById(id: number): Promise<VehicleModel> {
  const res = await fetch(`/api/vehicle/model/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener el modelo de vehículo");
  }
  return res.json();
}

export async function createVehicleModel(model: { makeId: number; name: string }): Promise<VehicleModel> {
  const res = await fetch("/api/vehicle/model/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id: 0, makeId: model.makeId, name: model.name }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al crear modelo de vehículo: ${error}`);
  }
  return res.json();
}

export async function updateVehicleModel(model: { id: number; makeId: number; name: string }): Promise<VehicleModel> {
  const res = await fetch("/api/vehicle/model/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(model),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al actualizar modelo de vehículo: ${error}`);
  }
  return res.json();
}

export async function deleteVehicleModel(id: number): Promise<VehicleModel> {
  const res = await fetch(`/api/vehicle/model/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al eliminar modelo de vehículo: ${error}`);
  }
  return res.json();
}

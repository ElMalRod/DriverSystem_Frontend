export interface VehicleMake {
  id: number;
  name: string;
}

export interface VehicleModel {
  id: number;
  makeId: number;
  name: string;
}

export interface VehicleVisit {
  id: number;
  vehicleId: number;
  customerId: number;
  arrivedAt?: string;
  departedAt?: string;
  notes?: string;
}

export interface VehicleVisitResponse {
  id: number;
  vehicleId: number;
  vehiclePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  customerId: number;
  customerName?: string;
  arrivedAt: string;
  departedAt?: string | null;
  notes?: string;
  status: 'NUEVA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
}

export interface UpdateVisitStatusRequest {
  status: 'NUEVA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
}

export interface CreateVehicleVisitRequest {
  id?: number;
  vehicleId: number;
  customerId: number;
  departedAt?: string;
  notes?: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
}

export interface CreateVehicleRequest {
  vin?: string;
  plate: string;
  makeId: number;
  modelId: number;
  color?: string;
  modelYear: number;
  customerId?: number; // Nuevo campo opcional
}

export interface VehicleResponse {
  id: number;
  vin?: string;
  plate: string;
  color?: string;
  model: string;
  make: string;
  createdAt: string;
}

export interface UserVehicleAssignment {
  id: number;
  userId: number;
  vehicleId: number;
}

export interface UserVehicleResponse {
  id: number;
  vehicleResponse: VehicleResponse;
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

export async function updateVehicleMake(make: { id: number; name: string }): Promise<VehicleMake> {
  const res = await fetch("/api/vehicle/makes/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(make),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al actualizar marca de vehículo: ${error}`);
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

// Visitas de vehículos
export async function getVehicleVisits(): Promise<VehicleVisitResponse[]> {
  const res = await fetch("/api/vehicle/visit", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener visitas de vehículos");
  }
  return res.json();
}

export async function getVehicleVisitById(id: number): Promise<VehicleVisitResponse> {
  const res = await fetch(`/api/vehicle/visit/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener la visita");
  }
  return res.json();
}

export async function createVehicleVisit(visit: CreateVehicleVisitRequest): Promise<VehicleVisitResponse> {
  const res = await fetch("/api/vehicle/visit/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(visit),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al crear visita: ${error}`);
  }
  return res.json();
}

export async function updateVehicleVisit(id: number, selectedStatus: string, visit: CreateVehicleVisitRequest): Promise<VehicleVisitResponse> {
  const res = await fetch("/api/vehicle/visit/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(visit),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al actualizar visita: ${error}`);
  }
  return res.json();
}

export async function deleteVehicleVisit(id: number): Promise<void> {
  const res = await fetch(`/api/vehicle/visit/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al eliminar visita");
  }
}

export async function updateVehicleVisitDeparture(id: number): Promise<void> {
  const res = await fetch(`/api/vehicle/visit/updateDepartedAt/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al actualizar fecha de salida");
  }
}

// Crear vehículo
export async function createVehicle(vehicle: CreateVehicleRequest): Promise<VehicleResponse> {
  const res = await fetch("/api/vehicle/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(vehicle),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al crear vehículo: ${error}`);
  }
  return res.json();
}

// Obtener todos los vehículos
export async function getAllVehicles(): Promise<VehicleResponse[]> {
  const res = await fetch("/api/vehicle/", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener vehículos");
  }
  return res.json();
}

// Obtener vehículos sin dueño
export async function getUnassignedVehicles(): Promise<VehicleResponse[]> {
  const res = await fetch("/api/vehicle/unassigned", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al obtener vehículos sin asignar");
  }
  return res.json();
}

// Función simplificada para compatibilidad (si es necesaria)
export async function getVehicles(): Promise<VehicleResponse[]> {
  return getAllVehicles();
}

// Asignar vehículo a usuario
export async function assignVehicleToUser(userId: number, vehicleId: number): Promise<UserVehicleAssignment> {
  const res = await fetch("/api/user/vehicle/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id: 0, userId, vehicleId }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Error al asignar vehículo: ${error}`);
  }
  return res.json();
}

// Obtener vehículos de un usuario
export async function getUserVehicles(userId: number): Promise<UserVehicleResponse[]> {
  console.log(`[API] Getting vehicles for user: ${userId}`)
  
  const url = `/api/user/vehicle/${userId}`
  console.log(`[API] Full URL: ${window.location.origin}${url}`)
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: "include"
    })

    console.log(`[API] Response status: ${response.status}`)
    console.log(`[API] Response URL: ${response.url}`)
    
    const responseText = await response.text()
    console.log(`[API] Raw response: ${responseText.substring(0, 500)}...`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    console.log(`[API] Parsed data:`, data)
    
    return Array.isArray(data) ? data : []

  } catch (error: any) {
    // Si es un error 404, no lo mostramos como error en consola
    if (error.message && error.message.includes('HTTP 404')) {
      console.log(`[API] Client ${userId} has no vehicles (404)`)
    } else {
      console.error(`[API] Error:`, error)
    }
    
    // Si el proxy falla, intentar directamente (solo para debug)
    if (window.location.hostname === 'localhost') {
      console.log('[API] Trying direct backend call as fallback...')
      try {
        const directResponse = await fetch(`http://localhost:8080/api/user/vehicle/${userId}`, {
          method: "GET",
          headers: { 'Content-Type': 'application/json' }
        })
      
        if (directResponse.ok) {
          const directData = await directResponse.json()
          console.log('[API] Direct backend call successful:', directData)
          return Array.isArray(directData) ? directData : []
        }
      } catch (directError) {
        console.error('[API] Direct call also failed:', directError)
      }
    }
    
    throw error
  }
}

// Desasignar vehículo de usuario
export async function unassignVehicleFromUser(userId: number, id: number): Promise<void> {
  const res = await fetch(`/api/user/vehicle/${userId}?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Error al desasignar vehículo");
  }
}

// Actualizar estado de visita (temporal simple)
export async function updateVisitStatus(id: number, status: string): Promise<VehicleVisitResponse | { message: string }> {
  console.log(`[API] Using simple proxy for visit ${id} status: ${status}`)
  
  const res = await fetch(`/api/patch-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ visitId: id, status }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error: ${errorText}`);
  }
  
  // Verificar el tipo de contenido de la respuesta
  const contentType = res.headers.get('content-type');
  console.log(`[API] Response content-type: ${contentType}`)
  
  if (contentType && contentType.includes('application/json')) {
    // Si la respuesta es JSON, parseamos normalmente
    return res.json()
  } else {
    // Si la respuesta es texto plano (como cuando se cancela y elimina)
    const textResponse = await res.text();
    console.log(`[API] Text response: ${textResponse}`)
    
    // Retornamos un objeto con el mensaje para mantener consistencia
    return { 
      message: textResponse,
      status: status as any, // Mantenemos el status que se envió
      id: id
    }
  }
}
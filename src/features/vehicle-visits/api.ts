import { httpClient } from "@/services/http"

export interface VehicleVisit {
  id: number
  vehicleId: number
  customerId: number
  arrivedAt: string
  departureAt: string | null
  notes: string
  status: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA'
}

export interface VehicleVisitCreateRequest {
  vehicleId: number
  customerId: number
  arrivedAt?: string
  notes?: string
  status?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function getAllVehicleVisits(): Promise<VehicleVisit[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/vehicle/visit`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error getting vehicle visits:', error)
    throw error
  }
}

export async function getVehicleVisitById(id: number): Promise<VehicleVisit | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/vehicle/visit/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error getting vehicle visit ${id}:`, error)
    throw error
  }
}

export async function getVehicleVisitsByCustomer(customerId: number): Promise<VehicleVisit[]> {
  try {
    const allVisits = await getAllVehicleVisits()
    return allVisits.filter(visit => visit.customerId === customerId)
  } catch (error) {
    console.error(`Error getting vehicle visits for customer ${customerId}:`, error)
    throw error
  }
}

export async function getVehicleVisitsByVehicle(vehicleId: number): Promise<VehicleVisit[]> {
  try {
    const allVisits = await getAllVehicleVisits()
    return allVisits.filter(visit => visit.vehicleId === vehicleId)
  } catch (error) {
    console.error(`Error getting vehicle visits for vehicle ${vehicleId}:`, error)
    throw error
  }
}

export async function createVehicleVisit(visitData: VehicleVisitCreateRequest): Promise<VehicleVisit> {
  try {
    const response = await fetch(`${BASE_URL}/api/vehicle/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(visitData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating vehicle visit:', error)
    throw error
  }
}

export async function updateVehicleVisitStatus(id: number, status: string): Promise<VehicleVisit> {
  try {
    const response = await fetch(`${BASE_URL}/api/vehicle/visit/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ status })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error updating vehicle visit ${id} status:`, error)
    throw error
  }
}

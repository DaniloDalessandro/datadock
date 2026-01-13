"use client"

import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { config } from '@/lib/config'

export interface Dataset {
  id: number
  table_name: string
  endpoint_url: string
  status: 'active' | 'inactive'
  status_display: string
  record_count: number
  column_structure: Record<string, unknown>
  error_message: string | null
  created_by: number | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export interface DatasetFormData {
  import_type: 'endpoint' | 'file'
  table_name: string
  endpoint_url?: string
  file?: File
}

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDatasets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiGet('/api/data-import/processes/?page_size=100') as {
        results: Dataset[]
      }
      setDatasets(response.results || [])
    } catch (error) {
      console.error('Error fetching datasets:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch datasets')
      setDatasets([])
    } finally {
      setIsLoading(false)
    }
  }

  const createDataset = async (data: DatasetFormData) => {
    try {
      const formData = new FormData()
      formData.append('import_type', data.import_type)
      formData.append('table_name', data.table_name)

      if (data.import_type === 'endpoint' && data.endpoint_url) {
        formData.append('endpoint_url', data.endpoint_url)
      }

      if (data.import_type === 'file' && data.file) {
        formData.append('file', data.file)
      }

      // Content-Type não é definido manualmente - o browser define automaticamente para multipart/form-data com boundary
      const token = localStorage.getItem('access_token')
      const headers: HeadersInit = {}

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${config.apiUrl}/api/data-import/`, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to create dataset'

        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.details?.table_name?.[0] ||
                        errorJson.details?.endpoint_url?.[0] ||
                        errorJson.details?.file?.[0] ||
                        errorJson.error ||
                        errorJson.detail ||
                        errorMessage
        } catch {
          console.error('Error response:', errorText)
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      await fetchDatasets()
      return result
    } catch (error) {
      console.error('Error creating dataset:', error)
      throw error
    }
  }

  const updateDataset = async (id: number, data: Partial<Dataset>) => {
    try {
      await apiPost(`/api/data-import/processes/${id}/`, data)
      await fetchDatasets()
    } catch (error) {
      console.error('Error updating dataset:', error)
      throw error
    }
  }

  const deleteDataset = async (id: number) => {
    try {
      await apiDelete(`/api/data-import/processes/${id}/delete/`)
      await fetchDatasets()
    } catch (error) {
      console.error('Error deleting dataset:', error)
      throw error
    }
  }

  const getDataset = async (id: number): Promise<Dataset> => {
    try {
      const response = await apiGet(`/api/data-import/processes/${id}/`) as Dataset
      return response
    } catch (error) {
      console.error('Error getting dataset:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [])

  return {
    datasets,
    vehicles: datasets,
    isLoading,
    loading: isLoading,
    error,
    fetchDatasets,
    createDataset,
    updateDataset,
    deleteDataset,
    getDataset,
    getVehicle: getDataset,
  }
}

export default useDatasets

export type Vehicle = Dataset
export type VehicleFormData = DatasetFormData
export const useVehicles = useDatasets

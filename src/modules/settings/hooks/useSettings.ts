import { useState, useEffect, useCallback } from 'react'
import { settingsService } from '../services/settings.service'
import { LoanSettings, UpdateSettingsDTO } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<LoanSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await settingsService.getSettings()
      setSettings(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar la configuración.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleUpdate = async (dto: UpdateSettingsDTO) => {
    try {
      setSaving(true)
      setError(null)
      const updated = await settingsService.updateSettings(dto)
      setSettings(updated)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar configuración.')
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    settings,
    loading,
    saving,
    error,
    reload: loadSettings,
    updateSettings: handleUpdate,
  }
}


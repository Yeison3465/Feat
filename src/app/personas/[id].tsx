import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { usePeople } from '../../modules/people/hooks/usePeople'
import { peopleService } from '../../modules/people/services/people.service'
import { Person, UpdatePersonDTO } from '../../modules/people/types'
import { PersonDetailView } from '../../modules/people/components/PersonDetailView'
import { PersonForm } from '../../modules/people/components/PersonForm'
import { ErrorMessage } from '../../shared/components/ErrorMessage'
import { ConfirmModal } from '../../shared/components/ConfirmModal'
import { useLoans } from '../../modules/loans/hooks/useLoans'

export default function DetallePersonaScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getPersonById, updatePerson, archivePerson, deletePerson } = usePeople()
  const { allLoans, reload: reloadLoans } = useLoans()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Mientras se elimina (y justo después) no se vuelve a consultar la persona: ya no existe y daría un error falso
  const deletingRef = useRef(false)

  const cachedPerson = id ? getPersonById(id) : undefined
  const [person, setPerson] = useState<Person | null>(cachedPerson ?? null)
  const [loading, setLoading] = useState(!cachedPerson)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const loadPerson = useCallback(async () => {
    if (!id || deletingRef.current) return
    try {
      if (!cachedPerson) setLoading(true)
      setError(null)
      const data = await peopleService.getPersonById(id)
      setPerson(data)
    } catch (err: any) {
      if (!cachedPerson) {
        setError(err.message || 'Error al cargar la información de la persona.')
      }
    } finally {
      setLoading(false)
    }
  }, [id, cachedPerson])

  useEffect(() => {
    if (deletingRef.current) return
    if (!cachedPerson) {
      loadPerson()
    } else {
      setPerson(cachedPerson)
    }
  }, [cachedPerson, loadPerson])

  const handleUpdate = async (dto: UpdatePersonDTO) => {
    if (!id) return
    try {
      setSaving(true)
      const updated = await updatePerson(id, dto)
      setPerson(updated)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!id || !person) return
    try {
      setSaving(true)
      await archivePerson(id, !person.archivado)
      router.back()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#0A0A0B] items-center justify-center">
        <ActivityIndicator size="small" color="#F5F5F3" />
      </View>
    )
  }

  if (error || !person) {
    return (
      <View className="flex-1 bg-[#0A0A0B] px-6 justify-center items-center">
        <ErrorMessage
          message={error || 'No se encontró la información de la persona.'}
          onRetry={loadPerson}
        />
      </View>
    )
  }

  if (isEditing) {
    return (
      <PersonForm
        initialData={person}
        onSubmit={handleUpdate}
        loading={saving}
      />
    )
  }

  const personLoansCount = allLoans.filter((l) => l.persona_id === person.id).length

  const handleConfirmDelete = async () => {
    try {
      deletingRef.current = true
      setDeleting(true)
      setDeleteError(null)
      await deletePerson(person.id)
      // Sus préstamos también se borraron: refrescar la cartera
      await reloadLoans()
      setShowDeleteConfirm(false)
      router.back()
    } catch (err: any) {
      deletingRef.current = false
      setDeleteError(err.message || 'Error al eliminar la persona.')
      // Puede haber borrado algunos préstamos antes de fallar
      reloadLoans()
    } finally {
      setDeleting(false)
    }
  }

  const deleteMessage =
    personLoansCount > 0
      ? `${person.nombre} tiene ${personLoansCount} ${personLoansCount === 1 ? 'préstamo' : 'préstamos'}. Se eliminarán también, junto con sus cuotas, pagos y movimientos. Esta acción no se puede deshacer.`
      : `Se eliminará a ${person.nombre} del directorio. Esta acción no se puede deshacer.`

  return (
    <>
      <PersonDetailView
        person={person}
        onEdit={() => setIsEditing(true)}
        onArchive={handleArchive}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        title="¿Eliminar persona?"
        message={deleteMessage}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        error={deleteError}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteError(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

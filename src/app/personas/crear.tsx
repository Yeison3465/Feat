import React, { useState } from 'react'
import { PersonForm } from '../../modules/people/components/PersonForm'
import { usePeople } from '../../modules/people/hooks/usePeople'
import { CreatePersonDTO } from '../../modules/people/types'

export default function CrearPersonaScreen() {
  const [loading, setLoading] = useState(false)
  const { createPerson } = usePeople()

  const handleCreate = async (dto: CreatePersonDTO) => {
    try {
      setLoading(true)
      await createPerson(dto)
    } finally {
      setLoading(false)
    }
  }

  return <PersonForm onSubmit={handleCreate} loading={loading} />
}

'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardBody } from '@nextui-org/card'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Панель управления</h1>
      <Card>
        <CardBody>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </CardBody>
      </Card>
    </div>
  )
}

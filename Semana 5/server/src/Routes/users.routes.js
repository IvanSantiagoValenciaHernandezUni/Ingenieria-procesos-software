import { Router } from 'express'
import { publicUser, readDb, writeDb } from '../Services/store.service.js'
import { getBearerToken, getSupabaseClient, hasSupabaseConfig } from '../Services/supabase.service.js'

const router = Router()

router.get('/', async (req, res) => {
  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json(data.map((user) => ({
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.created_at,
    })))
  }

  const db = await readDb()
  res.json(db.users.map(publicUser))
})

router.patch('/:id/status', async (req, res) => {
  const { active } = req.body

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const { data, error } = await supabase
      .from('profiles')
      .update({ active: Boolean(active) })
      .eq('id', req.params.id)
      .select('id, full_name, email, role, active, created_at')
      .single()

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json({
      id: data.id,
      name: data.full_name,
      email: data.email,
      role: data.role,
      active: data.active,
      createdAt: data.created_at,
    })
  }

  const db = await readDb()
  const user = db.users.find((candidate) => candidate.id === req.params.id)

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' })
  }

  user.active = Boolean(active)
  await writeDb(db)

  res.json(publicUser(user))
})

export default router

import { Router } from 'express'
import { publicUser, readDb, writeDb } from '../Services/store.service.js'
import {
  getBearerToken,
  getSupabaseClient,
  getSupabaseServiceClient,
  hasSupabaseConfig,
} from '../Services/supabase.service.js'

const router = Router()

router.get('/', async (req, res) => {
  if (hasSupabaseConfig()) {
    const token = getBearerToken(req)
    const supabase = getSupabaseClient(token)
    const { data: authData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authData.user) {
      return res.status(401).json({ message: 'Sesion no valida' })
    }

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', authData.user.id)
      .single()

    if (currentProfileError || currentProfile?.role !== 'admin' || !currentProfile.active) {
      return res.status(403).json({ message: 'Solo el administrador puede ver los usuarios' })
    }

    const serviceClient = getSupabaseServiceClient()
    const usersClient = serviceClient || supabase
    const { data, error } = await usersClient
      .from('profiles')
      .select('id, full_name, email, role, active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    const usersById = new Map((data || []).map((user) => [
      user.id,
      {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role || 'cliente',
        active: user.active !== false,
        createdAt: user.created_at,
        emailVerified: null,
      },
    ]))

    if (serviceClient) {
      const { data: authUsers, error: authUsersError } = await serviceClient.auth.admin.listUsers()

      if (authUsersError) {
        return res.status(403).json({ message: authUsersError.message })
      }

      authUsers.users.forEach((authUser) => {
        const existing = usersById.get(authUser.id)
        const metadata = authUser.user_metadata || {}
        usersById.set(authUser.id, {
          id: authUser.id,
          name: existing?.name || metadata.full_name || metadata.name || 'Usuario sin nombre',
          email: existing?.email || authUser.email,
          role: existing?.role || metadata.role || 'cliente',
          active: existing?.active ?? true,
          createdAt: existing?.createdAt || authUser.created_at,
          emailVerified: Boolean(authUser.email_confirmed_at),
        })
      })
    }

    return res.json([...usersById.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
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

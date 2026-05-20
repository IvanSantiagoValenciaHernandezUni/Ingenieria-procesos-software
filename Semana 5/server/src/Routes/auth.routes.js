import { Router } from 'express'
import { createId, createPasswordHash, publicUser, readDb, writeDb } from '../Services/store.service.js'
import { getSupabaseClient, hasSupabaseConfig } from '../Services/supabase.service.js'

const router = Router()
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  const cleanEmail = email?.trim().toLowerCase()

  if (!name || !cleanEmail || !password) {
    return res.status(400).json({ message: 'Nombre, correo y contrasena son obligatorios' })
  }

  if (!strongPassword.test(password)) {
    return res.status(400).json({
      message: 'La contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y caracter especial',
    })
  }

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: name.trim(),
          role: 'cliente',
        },
      },
    })

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    return res.status(201).json({
      message: data.session
        ? 'Cuenta creada correctamente'
        : 'Cuenta creada correctamente. Revisa la configuracion de confirmacion de correo en Supabase si no puedes iniciar sesion',
      user: data.user
        ? {
            id: data.user.id,
            name: name.trim(),
            email: data.user.email,
            role: 'cliente',
            active: true,
          }
        : null,
      session: data.session,
    })
  }

  const db = await readDb()
  const exists = db.users.some((user) => user.email === cleanEmail)

  if (exists) {
    return res.status(409).json({ message: 'Ya existe una cuenta con este correo' })
  }

  const user = {
    id: createId('usr'),
    name: name.trim(),
    email: cleanEmail,
    passwordHash: createPasswordHash(password),
    role: 'cliente',
    active: true,
    createdAt: new Date().toISOString(),
  }

  db.users.push(user)
  await writeDb(db)

  res.status(201).json({
    message: 'Cuenta creada correctamente',
    user: publicUser(user),
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const cleanEmail = email?.trim().toLowerCase()

  if (!cleanEmail || !password) {
    return res.status(400).json({ message: 'Correo y contrasena son obligatorios' })
  }

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      return res.status(401).json({ message: error.message })
    }

    const authedSupabase = getSupabaseClient(data.session?.access_token)
    const { data: profile, error: profileError } = await authedSupabase
      .from('profiles')
      .select('id, full_name, email, role, active, created_at')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile?.active) {
      // Esto ayuda a diagnosticar si falla por RLS/permisos o por un token no válido.
      console.error('[auth/login] profileError:', {
        message: profileError?.message,
        details: profileError?.details,
        hint: profileError?.hint,
        status: profileError?.status,
      })

      return res.status(profileError ? profileError.status || 400 : 403).json({
        message: profileError?.message || 'La cuenta esta desactivada o bloqueada',
        code: profileError?.code || null,
        status: profileError?.status || null,
      })
    }


    return res.json({
      message: 'Sesion iniciada correctamente',
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        active: profile.active,
        createdAt: profile.created_at,
      },
      session: data.session,
    })
  }

  const db = await readDb()
  const user = db.users.find((candidate) => candidate.email === cleanEmail)

  if (!user || user.passwordHash !== createPasswordHash(password)) {
    return res.status(401).json({ message: 'Credenciales incorrectas' })
  }

  if (!user.active) {
    return res.status(403).json({ message: 'La cuenta esta desactivada o bloqueada' })
  }

  res.json({
    message: 'Sesion iniciada correctamente',
    user: publicUser(user),
  })
})

export default router

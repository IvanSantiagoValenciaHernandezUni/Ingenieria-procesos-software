import { Router } from 'express'
import { readDb, writeDb } from '../Services/store.service.js'
import { extraProducts, getBearerToken, getSupabaseClient, hasSupabaseConfig, mapProduct } from '../Services/supabase.service.js'

const router = Router()

router.get('/', async (req, res) => {
  const { category, search, featured } = req.query

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient()
    let query = supabase
      .from('products')
      .select('id, name, description, category, price, image_url, featured, active')
      .eq('active', true)
      .order('id', { ascending: true })

    if (category && category !== 'all') query = query.eq('category', category)
    if (search) query = query.ilike('name', `%${search}%`)
    if (featured === 'true') query = query.eq('featured', true)

    const { data, error } = await query

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    let products = data.map(mapProduct)

    if (!category && !search && featured !== 'true' && products.length < 10) {
      products = [...products, ...extraProducts]
    }

    return res.json(products)
  }

  const db = await readDb()
  let products = db.products.filter((product) => product.active)

  if (category && category !== 'all') {
    products = products.filter((product) => product.category === category)
  }

  if (search) {
    const term = search.toLowerCase()
    products = products.filter((product) => product.name.toLowerCase().includes(term))
  }

  if (featured === 'true') {
    products = products.filter((product) => product.featured)
  }

  res.json(products)
})

router.post('/', async (req, res) => {
  const { name, description, price, category, image, featured = false } = req.body

  if (!name || !category || Number.isNaN(Number(price))) {
    return res.status(400).json({ message: 'Nombre, categoria y precio son obligatorios' })
  }

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        description: description || '',
        price: Number(price),
        category,
        image_url: image || '',
        featured: Boolean(featured),
        active: true,
      })
      .select('id, name, description, category, price, image_url, featured, active')
      .single()

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.status(201).json(mapProduct(data))
  }

  const db = await readDb()
  const nextId = Math.max(0, ...db.products.map((product) => product.id)) + 1
  const product = {
    id: nextId,
    name: name.trim(),
    description: description || '',
    price: Number(price),
    category,
    image: image || '',
    featured: Boolean(featured),
    active: true,
  }

  db.products.push(product)
  await writeDb(db)

  res.status(201).json(product)
})

router.put('/:id', async (req, res) => {
  const productId = Number(req.params.id)

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const payload = {
      ...req.body,
      image_url: req.body.image,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    }
    delete payload.image

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select('id, name, description, category, price, image_url, featured, active')
      .single()

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json(mapProduct(data))
  }

  const db = await readDb()
  const productIndex = db.products.findIndex((product) => product.id === productId)

  if (productIndex === -1) {
    return res.status(404).json({ message: 'Producto no encontrado' })
  }

  db.products[productIndex] = {
    ...db.products[productIndex],
    ...req.body,
    id: productId,
    price: req.body.price !== undefined ? Number(req.body.price) : db.products[productIndex].price,
  }
  await writeDb(db)

  res.json(db.products[productIndex])
})

router.delete('/:id', async (req, res) => {
  const productId = Number(req.params.id)

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', productId)

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json({ message: 'Producto desactivado correctamente' })
  }

  const db = await readDb()
  const product = db.products.find((candidate) => candidate.id === productId)

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' })
  }

  product.active = false
  await writeDb(db)

  res.json({ message: 'Producto desactivado correctamente' })
})

export default router

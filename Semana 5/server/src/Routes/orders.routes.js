import { Router } from 'express'
import { createId, readDb, writeDb } from '../Services/store.service.js'
import { extraProducts, getBearerToken, getSupabaseClient, hasSupabaseConfig, mapOrder } from '../Services/supabase.service.js'

const router = Router()
const statuses = ['Pendiente', 'Aceptado', 'En Preparacion', 'En Camino', 'Entregado', 'Cancelado']

router.get('/', async (req, res) => {
  const { userId } = req.query

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json(data.map((order) => mapOrder(order, order.order_items || [])))
  }

  const db = await readDb()
  const orders = userId ? db.orders.filter((order) => order.userId === userId) : db.orders
  res.json(orders)
})

router.get('/:id', async (req, res) => {
  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .single()

    if (error) {
      return res.status(404).json({ message: 'Pedido no encontrado' })
    }

    return res.json(mapOrder(data, data.order_items || []))
  }

  const db = await readDb()
  const order = db.orders.find((candidate) => candidate.id === req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Pedido no encontrado' })
  }

  res.json(order)
})

router.post('/', async (req, res) => {
  const { userId, items, deliveryAddress = 'Calle Principal 123, Ciudad' } = req.body

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Usuario e items son obligatorios' })
  }

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const productIds = items.map((item) => Number(item.productId))
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .in('id', productIds)

    if (productsError) {
      return res.status(400).json({ message: productsError.message })
    }

    const orderItems = items.map((item) => {
      const product = products.find((candidate) => candidate.id === Number(item.productId))
        || extraProducts.find((candidate) => candidate.id === Number(item.productId))
      if (!product) return null

      const quantity = Math.max(1, Number(item.quantity) || 1)
      return {
        product_id: product.virtual ? null : product.id,
        product_name: product.name,
        product_image: product.image_url || product.image || '',
        quantity,
        unit_price: Number(product.price),
      }
    }).filter(Boolean)

    if (!orderItems.length) {
      return res.status(400).json({ message: 'No hay productos validos en el pedido' })
    }

    const total = Number(orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0).toFixed(2))
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: statuses[0],
        status_index: 0,
        total,
        delivery_address: deliveryAddress,
      })
      .select('*')
      .single()

    if (orderError) {
      return res.status(403).json({ message: orderError.message })
    }

    const { data: savedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })))
      .select('*')

    if (itemsError) {
      return res.status(403).json({ message: itemsError.message })
    }

    return res.status(201).json(mapOrder(order, savedItems))
  }

  const db = await readDb()
  const orderItems = items.map((item) => {
    const product = db.products.find((candidate) => candidate.id === Number(item.productId))
    if (!product) return null

    const quantity = Math.max(1, Number(item.quantity) || 1)
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      quantity,
      subtotal: Number((product.price * quantity).toFixed(2)),
    }
  }).filter(Boolean)

  if (!orderItems.length) {
    return res.status(400).json({ message: 'No hay productos validos en el pedido' })
  }

  const total = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2))
  const order = {
    id: createId('ord'),
    code: `#hf${Math.random().toString(36).slice(2, 7)}`,
    userId,
    items: orderItems,
    status: statuses[0],
    statusIndex: 0,
    total,
    deliveryAddress,
    estimatedTime: '30 minutos',
    courier: 'Juan Perez',
    createdAt: new Date().toISOString(),
  }

  db.orders.unshift(order)
  await writeDb(db)

  res.status(201).json(order)
})

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body

  if (hasSupabaseConfig()) {
    const statusIndex = statuses.indexOf(status)
    if (statusIndex === -1) {
      return res.status(400).json({ message: 'Estado no valido' })
    }

    const supabase = getSupabaseClient(getBearerToken(req))
    const { data, error } = await supabase
      .from('orders')
      .update({ status, status_index: statusIndex })
      .eq('id', req.params.id)
      .select('*, order_items(*)')
      .single()

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json(mapOrder(data, data.order_items || []))
  }

  const db = await readDb()
  const order = db.orders.find((candidate) => candidate.id === req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Pedido no encontrado' })
  }

  const statusIndex = statuses.indexOf(status)
  if (statusIndex === -1) {
    return res.status(400).json({ message: 'Estado no valido' })
  }

  order.status = status
  order.statusIndex = statusIndex
  await writeDb(db)

  res.json(order)
})

router.post('/:id/advance', async (req, res) => {
  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient(getBearerToken(req))
    const { data: currentOrder, error: currentError } = await supabase
      .from('orders')
      .select('status_index')
      .eq('id', req.params.id)
      .single()

    if (currentError) {
      return res.status(404).json({ message: 'Pedido no encontrado' })
    }

    const nextIndex = Math.min((currentOrder.status_index || 0) + 1, statuses.length - 1)
    const { data, error } = await supabase
      .from('orders')
      .update({ status: statuses[nextIndex], status_index: nextIndex })
      .eq('id', req.params.id)
      .select('*, order_items(*)')
      .single()

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json(mapOrder(data, data.order_items || []))
  }

  const db = await readDb()
  const order = db.orders.find((candidate) => candidate.id === req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Pedido no encontrado' })
  }

  order.statusIndex = Math.min((order.statusIndex || 0) + 1, statuses.length - 1)
  order.status = statuses[order.statusIndex]
  await writeDb(db)

  res.json(order)
})

export default router

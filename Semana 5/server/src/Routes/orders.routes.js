import { Router } from 'express'
import { createId, readDb, writeDb } from '../Services/store.service.js'
import {
  extraProducts,
  getBearerToken,
  getSupabaseClient,
  getSupabaseServiceClient,
  hasSupabaseConfig,
  mapOrder,
} from '../Services/supabase.service.js'

const router = Router()
const statuses = ['Pendiente', 'Aceptado', 'En Preparacion', 'En Camino', 'Entregado', 'Cancelado']

async function getProfilesByUserId(client, userIds) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return new Map()

  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids)

  if (error) return new Map()

  return new Map((data || []).map((profile) => [profile.id, profile]))
}

async function mapOrdersWithProfiles(client, orders) {
  const profiles = await getProfilesByUserId(client, orders.map((order) => order.user_id))
  return orders.map((order) => {
    const profile = profiles.get(order.user_id)
    return mapOrder({
      ...order,
      customerName: profile?.full_name,
      customerEmail: profile?.email,
    }, order.order_items || [])
  })
}

router.get('/', async (req, res) => {
  const { userId } = req.query

  if (hasSupabaseConfig()) {
    const token = getBearerToken(req)
    const supabase = getSupabaseClient(token)
    const queryClient = userId ? supabase : getSupabaseServiceClient() || supabase
    let query = queryClient
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    return res.json(await mapOrdersWithProfiles(queryClient, data || []))
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

    const [order] = await mapOrdersWithProfiles(supabase, [data])
    return res.json(order)
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
    const profileClient = getSupabaseServiceClient() || supabase
    const { data: profile } = await profileClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle()

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
        code: `#hf${Math.random().toString(36).slice(2, 7)}`,
        user_id: userId,
        status: statuses[0],
        status_index: 0,
        total,
        delivery_address: deliveryAddress,
        estimated_time: '30 minutos',
        courier: profile?.full_name || profile?.email || 'Cliente FastBite',
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

    return res.status(201).json(mapOrder({
      ...order,
      customerName: profile?.full_name,
      customerEmail: profile?.email,
    }, savedItems))
  }

  const db = await readDb()
  const customer = db.users.find((user) => user.id === userId)
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
    customerName: customer?.name || 'Cliente FastBite',
    customerEmail: customer?.email || '',
    items: orderItems,
    status: statuses[0],
    statusIndex: 0,
    total,
    deliveryAddress,
    estimatedTime: '30 minutos',
    courier: customer?.name || 'Cliente FastBite',
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

    const supabase = getSupabaseServiceClient() || getSupabaseClient(getBearerToken(req))
    const { data, error } = await supabase
      .from('orders')
      .update({ status, status_index: statusIndex })
      .eq('id', req.params.id)
      .select('*, order_items(*)')
      .single()

    if (error) {
      return res.status(403).json({ message: error.message })
    }

    const [order] = await mapOrdersWithProfiles(supabase, [data])
    return res.json(order)
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
    const supabase = getSupabaseServiceClient() || getSupabaseClient(getBearerToken(req))
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

    const [order] = await mapOrdersWithProfiles(supabase, [data])
    return res.json(order)
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

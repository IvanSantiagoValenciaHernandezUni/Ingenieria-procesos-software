import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseKey)
}

export function hasSupabaseServiceConfig() {
  return Boolean(supabaseUrl && supabaseServiceKey)
}

export function getSupabaseClient(accessToken) {
  if (!hasSupabaseConfig()) return null

  return createClient(supabaseUrl, supabaseKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  })
}

export function getSupabaseServiceClient() {
  if (!hasSupabaseServiceConfig()) return null

  return createClient(supabaseUrl, supabaseServiceKey)
}

export function getBearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

export function localImageFor(category) {
  const images = {
    hamburguesas: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    pizzas: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80',
    salchipapas: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=80',
    bebidas: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',
    postres: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
    combos: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=900&q=80',
  }

  return images[category] || images.hamburguesas
}

export const extraProducts = [
  {
    id: 1001,
    name: 'Perro Caliente Especial',
    description: 'Pan suave, salchicha premium, papas ripio, queso y salsas de la casa',
    category: 'hamburguesas',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=900&q=80',
    featured: false,
    active: true,
    virtual: true,
  },
  {
    id: 1002,
    name: 'Malteada de Chocolate',
    description: 'Malteada cremosa de chocolate con crema batida',
    category: 'bebidas',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80',
    featured: false,
    active: true,
    virtual: true,
  },
]

export function mapProduct(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: Number(product.price),
    image: product.image_url || localImageFor(product.category),
    featured: product.featured,
    active: product.active,
  }
}

export function mapOrder(order, items = []) {
  return {
    id: order.id,
    code: order.code,
    userId: order.user_id,
    customerName: order.customerName || order.customer_name || order.profiles?.full_name || '',
    customerEmail: order.customerEmail || order.customer_email || order.profiles?.email || '',
    status: order.status,
    statusIndex: order.status_index,
    total: Number(order.total),
    deliveryAddress: order.delivery_address,
    estimatedTime: order.estimated_time,
    courier: order.courier,
    createdAt: order.created_at,
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      image: item.product_image,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  }
}

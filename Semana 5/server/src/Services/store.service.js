import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.resolve(__dirname, '../data/db.json')

const products = [
  {
    id: 1,
    name: 'Hamburguesa Clasica',
    description: 'Jugosa hamburguesa con carne, lechuga, tomate, queso y nuestra salsa especial',
    price: 12.99,
    category: 'hamburguesas',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    featured: true,
    active: true,
  },
  {
    id: 2,
    name: 'Hamburguesa Doble',
    description: 'Doble carne, doble queso, doble sabor',
    price: 16.99,
    category: 'hamburguesas',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
    featured: true,
    active: true,
  },
  {
    id: 3,
    name: 'Pizza Pepperoni',
    description: 'Pizza con abundante pepperoni y queso mozzarella',
    price: 18.99,
    category: 'pizzas',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80',
    featured: true,
    active: true,
  },
  {
    id: 4,
    name: 'Pizza Pollo BBQ',
    description: 'Pollo, cebolla morada, cilantro fresco y salsa BBQ',
    price: 20.99,
    category: 'pizzas',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80',
    featured: false,
    active: true,
  },
  {
    id: 5,
    name: 'Salchipapas Especiales',
    description: 'Papas fritas crujientes con salchichas y salsas variadas',
    price: 8.99,
    category: 'salchipapas',
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=80',
    featured: true,
    active: true,
  },
  {
    id: 6,
    name: 'Coca Cola',
    description: 'Bebida refrescante 500ml',
    price: 2.99,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',
    featured: false,
    active: true,
  },
  {
    id: 7,
    name: 'Brownie con Helado',
    description: 'Delicioso brownie de chocolate con helado de vainilla',
    price: 6.99,
    category: 'postres',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
    featured: false,
    active: true,
  },
  {
    id: 8,
    name: 'Combo Familiar',
    description: '2 Hamburguesas + 2 Papas + 2 Bebidas',
    price: 29.99,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=900&q=80',
    featured: true,
    active: true,
  },
]

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

const initialData = {
  users: [
    {
      id: 'usr_admin',
      name: 'Administrador',
      email: 'ivan.valenciah@uniagustiniana.edu.co',
      passwordHash: hashPassword('admin'),
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  products,
  orders: [],
}

async function ensureDb() {
  try {
    await fs.access(dbPath)
  } catch {
    await fs.mkdir(path.dirname(dbPath), { recursive: true })
    await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2))
  }
}

export async function readDb() {
  await ensureDb()
  const content = await fs.readFile(dbPath, 'utf8')
  return JSON.parse(content)
}

export async function writeDb(data) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true })
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2))
  return data
}

export function publicUser(user) {
  const { passwordHash, ...safeUser } = user
  return safeUser
}

export function createPasswordHash(password) {
  return hashPassword(password)
}

export function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`
}

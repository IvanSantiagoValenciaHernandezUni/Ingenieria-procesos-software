import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './Routes/auth.routes.js'
import productRoutes from './Routes/products.routes.js'
import orderRoutes from './Routes/orders.routes.js'
import userRoutes from './Routes/users.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://127.0.0.1:5174',
].filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    app: 'FastBite API',
    status: 'ok',
    message: 'API lista para usuarios, productos y pedidos.',
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' })
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(error.status || 500).json({
    message: error.message || 'Error interno del servidor',
  })
})

const server = app.listen(PORT, () => {
  console.log(`FastBite API running on http://localhost:${PORT}`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya esta en uso. Cierra el otro servidor o cambia PORT en .env.`)
    process.exit(1)
  }

  throw error
})

import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  LogOut,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Trash2,
  Truck,
  User,
  UtensilsCrossed,
} from 'lucide-react'
import './styles.css'
import { api } from './api'

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: UtensilsCrossed },
  { id: 'hamburguesas', label: 'Hamburguesas', labelIcon: 'B' },
  { id: 'pizzas', label: 'Pizzas', labelIcon: 'P' },
  { id: 'salchipapas', label: 'Salchipapas', labelIcon: 'S' },
  { id: 'bebidas', label: 'Bebidas', labelIcon: 'D' },
  { id: 'postres', label: 'Postres', labelIcon: 'T' },
  { id: 'combos', label: 'Combos', labelIcon: 'C' },
]

const ORDER_STEPS = [
  { label: 'Pendiente', icon: Clock },
  { label: 'Aceptado', icon: Check },
  { label: 'En Preparacion', icon: UtensilsCrossed },
  { label: 'En Camino', icon: Truck },
  { label: 'Entregado', icon: PackageCheck },
]

const FALLBACK_IMAGES = {
  hamburguesas: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
  pizzas: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80',
  salchipapas: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=80',
  bebidas: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',
  postres: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
  combos: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=900&q=80',
}


function productImage(product) {
  return product?.image || product?.image_url || FALLBACK_IMAGES[product?.category] || FALLBACK_IMAGES.hamburguesas
}

function App() {
  const [page, setPage] = React.useState('home')
  const [products, setProducts] = React.useState([])
  const [cart, setCart] = React.useState([])
  const [toast, setToast] = React.useState('')
  const [user, setUser] = React.useState(() => {
    const savedUser = window.localStorage.getItem('fastbite_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [authMode, setAuthMode] = React.useState('login')
  const [currentOrder, setCurrentOrder] = React.useState(null)

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const isAdmin = user?.role === 'admin'

  React.useEffect(() => {
    loadProducts()
  }, [])

  const showError = (error) => {
    setToast(error.message || 'Ocurrio un error')
  }

  const loadProducts = async () => {
    try {
      setProducts(await api.getProducts())
    } catch (error) {
      showError(error)
    }
  }

  const navigate = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const requireAccount = (nextAction) => {
    if (!user) {
      setAuthMode('login')
      setPage('auth')
      setToast('Inicia sesion o registrate para continuar')
      return false
    }
    return nextAction()
  }

  const addToCart = (product) => {
    requireAccount(() => {
      setCart((current) => {
        const found = current.find((item) => item.id === product.id)
        if (found) {
          return current.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
        }
        return [...current, { ...product, qty: 1 }]
      })
      setToast(`${product.name} agregado al carrito`)
      return true
    })
  }

  const updateQty = (productId, amount) => {
    setCart((current) =>
      current
        .map((item) => (item.id === productId ? { ...item, qty: Math.max(0, item.qty + amount) } : item))
        .filter((item) => item.qty > 0),
    )
  }

  const emptyCart = () => {
    setCart([])
    setToast('Carrito vaciado exitosamente')
  }

  const finishOrder = async () => {
    if (!cart.length || !user) return

    try {
      const order = await api.createOrder({
        userId: user.id,
        items: cart.map((item) => ({ productId: item.id, quantity: item.qty })),
      })
      setCurrentOrder(order)
      setCart([])
      setToast('Pedido confirmado correctamente')
      navigate('tracking')
    } catch (error) {
      showError(error)
    }
  }

  const advanceOrder = async () => {
    if (!currentOrder) return

    try {
      const order = await api.advanceOrder(currentOrder.id)
      setCurrentOrder(order)
    } catch (error) {
      showError(error)
    }
  }

  const login = async ({ email, password }) => {
    try {
      const result = await api.login({ email, password })
      setUser(result.user)
      window.localStorage.setItem('fastbite_user', JSON.stringify(result.user))
      if (result.session?.access_token) {
        window.localStorage.setItem('fastbite_token', result.session.access_token)
      }
      setToast(result.message)
      navigate(result.user.role === 'admin' ? 'admin' : 'home')
    } catch (error) {
      showError(error)
    }
  }

  const register = async ({ name, email, password, confirmPassword }) => {
    if (password !== confirmPassword) {
      setToast('Las contrasenas no coinciden')
      return
    }

    try {
      const result = await api.register({ name, email, password })
      setAuthMode('login')
      setToast(`${result.message}. Ahora inicia sesion`)
    } catch (error) {
      showError(error)
    }
  }

  const logout = () => {
    setUser(null)
    window.localStorage.removeItem('fastbite_user')
    window.localStorage.removeItem('fastbite_token')
    setToast('Sesion cerrada')
    navigate('home')
  }

  return (
    <>
      <Navbar
        cartCount={cartCount}
        isAdmin={isAdmin}
        user={user}
        page={page}
        onNavigate={navigate}
        onLogout={logout}
      />

      <main>
        {page === 'home' && <Home products={products} onNavigate={navigate} />}
        {page === 'menu' && <Menu products={products} onAddToCart={addToCart} />}
        {page === 'cart' && (
          <Cart
            cart={cart}
            onNavigate={navigate}
            onQty={updateQty}
            onRemove={(id) => setCart((items) => items.filter((item) => item.id !== id))}
            onEmpty={emptyCart}
            onFinish={finishOrder}
          />
        )}
        {page === 'tracking' && (
          <Tracking
            order={currentOrder}
            onNext={advanceOrder}
            onNavigate={navigate}
          />
        )}
        {page === 'auth' && (
          <Auth
            mode={authMode}
            onMode={setAuthMode}
            onLogin={login}
            onRegister={register}
          />
        )}
        {page === 'admin' && <Admin onNavigate={navigate} onTrackOrder={setCurrentOrder} onToast={setToast} />}
      </main>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}

function Navbar({ cartCount, isAdmin, user, page, onNavigate, onLogout }) {
  return (
    <header className="navbar">
      <button className="brand" onClick={() => onNavigate('home')} aria-label="Ir al inicio">
        <span>Fast</span>Bite
      </button>
      <nav className="nav-links">
        <button className={page === 'home' ? 'active' : ''} onClick={() => onNavigate('home')}>INICIO</button>
        <button className={page === 'menu' ? 'active' : ''} onClick={() => onNavigate('menu')}>MENU</button>
        <button className="pill-nav" onClick={() => onNavigate('menu')}>ORDENAR AHORA</button>
        {isAdmin && <button onClick={() => onNavigate('admin')}>ADMIN</button>}
        <button className="icon-button" onClick={() => onNavigate('cart')} aria-label="Carrito">
          <ShoppingCart size={25} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        {user ? (
          <button className="icon-button" onClick={onLogout} aria-label="Cerrar sesion">
            <LogOut size={24} />
          </button>
        ) : (
          <button className="icon-button" onClick={() => onNavigate('auth')} aria-label="Cuenta">
            <User size={24} />
          </button>
        )}
      </nav>
    </header>
  )
}

function Home({ products, onNavigate }) {
  const featured = products.filter((product) => product.featured).slice(0, 6)
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>La mejor comida rapida a tu puerta!</h1>
          <p>Hamburguesas, pizzas, y mas. Entrega en 30 minutos o menos.</p>
          <div className="hero-actions">
            <button className="yellow-button" onClick={() => onNavigate('menu')}>ORDENAR AHORA <ArrowRight size={22} /></button>
            <button className="outline-white" onClick={() => onNavigate('menu')}>VER MENU</button>
          </div>
        </div>
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1100&q=80"
          alt="Pizza servida en mesa de madera"
        />
      </section>

      <section className="benefits">
        <Benefit icon={Clock} title="Entrega Rapida" text="30 minutos o menos" />
        <Benefit icon={Star} title="Calidad Garantizada" text="Ingredientes frescos" />
        <Benefit icon={Truck} title="Envio Gratis" text="En pedidos mayores a $25" />
      </section>

      <section className="section">
        <h2>Categorias</h2>
        <div className="category-strip">
          {CATEGORIES.slice(1).map((category) => (
            <button key={category.id} onClick={() => onNavigate('menu')}>
              <span>{category.labelIcon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Productos Destacados</h2>
          <button className="text-red" onClick={() => onNavigate('menu')}>VER TODO <ArrowRight size={18} /></button>
        </div>
        <div className="featured-grid">
          {featured.map((product) => <FeaturedProduct key={product.id} product={product} />)}
        </div>
      </section>

      <section className="cta">
        <h2>Listo para ordenar?</h2>
        <p>Descubre nuestro menu completo y haz tu pedido ahora</p>
        <button className="primary-button" onClick={() => onNavigate('menu')}>VER MENU COMPLETO</button>
      </section>
    </>
  )
}

function Benefit({ icon: Icon, title, text }) {
  return (
    <article className="benefit-card">
      <Icon size={44} />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function FeaturedProduct({ product }) {
  return (
    <article className="featured-card">
      <img src={productImage(product)} alt={product.name} onError={(event) => { event.currentTarget.src = productImage({ category: product.category }) }} />
      <div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <span>${product.price.toFixed(2)}</span>
    </article>
  )
}

function Menu({ products, onAddToCart }) {
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === 'all' || product.category === category
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <section className="menu-page page-pad">
      <h1>Nuestro Menu</h1>
      <p>Explora nuestra deliciosa seleccion de comidas rapidas</p>
      <label className="search-box">
        <Search size={22} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar productos..." />
      </label>

      <div className="filters">
        {CATEGORIES.map(({ id, label, labelIcon, icon: Icon }) => (
          <button key={id} className={category === id ? 'selected' : ''} onClick={() => setCategory(id)}>
            {Icon ? <Icon size={18} /> : <span>{labelIcon}</span>}
            {label}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <article key={product.id} className="product-card">
            <img src={productImage(product)} alt={product.name} onError={(event) => { event.currentTarget.src = productImage({ category: product.category }) }} />
            <div className="product-body">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>${product.price.toFixed(2)}</strong>
              <button className="primary-button" onClick={() => onAddToCart(product)}>
                <ShoppingCart size={20} />
                AGREGAR AL CARRITO
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Cart({ cart, onNavigate, onQty, onRemove, onEmpty, onFinish }) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  if (!cart.length) {
    return (
      <section className="empty-cart">
        <ShoppingCart size={78} />
        <h1>Tu carrito esta vacio</h1>
        <p>Agrega algunos productos deliciosos para comenzar</p>
        <button className="primary-button small" onClick={() => onNavigate('menu')}>VER MENU</button>
      </section>
    )
  }

  return (
    <section className="cart-page page-pad">
      <h1>Carrito de Compras</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <article className="cart-row" key={item.id}>
              <img src={productImage(item)} alt={item.name} onError={(event) => { event.currentTarget.src = productImage({ category: item.category }) }} />
              <div className="cart-info">
                <h3>{item.name}</h3>
                <strong>${item.price.toFixed(2)}</strong>
              </div>
              <button className="round-button" onClick={() => onQty(item.id, -1)}><Minus size={18} /></button>
              <span className="qty">{item.qty}</span>
              <button className="round-button" onClick={() => onQty(item.id, 1)}><Plus size={18} /></button>
              <strong className="line-total">${(item.price * item.qty).toFixed(2)}</strong>
              <button className="delete-button" onClick={() => onRemove(item.id)}><Trash2 size={20} /></button>
            </article>
          ))}
        </div>

        <aside className="summary-card">
          <h2>Resumen del Pedido</h2>
          <p><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></p>
          <p><span>Envio</span><span>GRATIS</span></p>
          <hr />
          <p className="total"><span>Total</span><span>${subtotal.toFixed(2)}</span></p>
          <button className="primary-button" onClick={onFinish}>FINALIZAR COMPRA</button>
          <button className="outline-red" onClick={onEmpty}>VACIAR CARRITO</button>
        </aside>
      </div>
    </section>
  )
}

function Tracking({ order, onNext, onNavigate }) {
  const step = order?.statusIndex || 0
  const delivered = step === ORDER_STEPS.length - 1

  return (
    <section className="tracking-page page-pad">
      <div className="tracking-card">
        <h1>Seguimiento de Pedido</h1>
        <p>Pedido {order?.code || '#hf4ptbx'}</p>
        <div className="timeline">
          {ORDER_STEPS.map(({ label, icon: Icon }, index) => (
            <div className={`timeline-row ${index <= step ? 'done' : ''}`} key={label}>
              <span><Icon size={28} /></span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        {delivered && (
          <div className="delivered-box">
            <CheckCircle2 size={54} />
            <h2>Pedido Entregado!</h2>
            <p>Gracias por tu pedido. Esperamos que disfrutes tu comida!</p>
          </div>
        )}
        <div className="tracking-actions">
          <button className="primary-button" onClick={delivered ? () => onNavigate('menu') : onNext}>
            {delivered ? 'HACER NUEVO PEDIDO' : 'AVANZAR ESTADO'}
          </button>
          <button className="outline-red" onClick={() => onNavigate('home')}>VOLVER AL INICIO</button>
        </div>
      </div>
      <div className="delivery-details">
        <h2>Detalles de Entrega</h2>
        <p><span>Direccion:</span><strong>{order?.deliveryAddress || 'Calle Principal 123, Ciudad'}</strong></p>
        <p><span>Tiempo estimado:</span><strong>{order?.estimatedTime || '30 minutos'}</strong></p>
        <p><span>Repartidor:</span><strong>{order?.courier || 'Juan Perez'}</strong></p>
      </div>
    </section>
  )
}

function Auth({ mode, onMode, onLogin, onRegister }) {
  const [form, setForm] = React.useState({ name: '', email: '', password: '', confirmPassword: '' })
  const isLogin = mode === 'login'
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <section className="auth-page">
      <form
        className="auth-card"
        onSubmit={(event) => {
          event.preventDefault()
          isLogin ? onLogin(form) : onRegister(form)
        }}
      >
        <h1>{isLogin ? 'Iniciar Sesion' : 'Crear Cuenta'}</h1>
        <p>{isLogin ? 'Ingresa a tu cuenta de FastBite' : 'Unete a FastBite hoy'}</p>
        {!isLogin && <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Nombre Completo" />}
        <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="Correo Electronico" />
        <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="Contrasena" />
        {!isLogin && <input type="password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} placeholder="Confirmar Contrasena" />}
        {!isLogin && <p className="password-hint">Minimo 8 caracteres, una mayuscula, una minuscula, un numero y un caracter especial.</p>}
        <button className="primary-button" type="submit">{isLogin ? 'INICIAR SESION' : 'CREAR CUENTA'}</button>
        <button className="link-button" type="button" onClick={() => onMode(isLogin ? 'register' : 'login')}>
          {isLogin ? 'No tienes cuenta? Registrate aqui' : 'Ya tienes cuenta? Inicia sesion'}
        </button>
        {isLogin && (
          <div className="test-credentials">
            <strong>Credenciales de prueba:</strong>
            <span>Usuario normal: registra una cuenta nueva</span>
            <span>Admin: admin@fastbite.com / admin</span>
          </div>
        )}
      </form>
    </section>
  )
}

function Admin({ onNavigate, onTrackOrder, onToast }) {
  const [orders, setOrders] = React.useState([])
  const [users, setUsers] = React.useState([])
  const [products, setProducts] = React.useState([])
  const [tab, setTab] = React.useState('orders')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData() {
    setLoading(true)
    try {
      const [ordersData, usersData, productsData] = await Promise.all([
        api.getOrders(),
        api.getUsers(),
        api.getProducts(),
      ])
      setOrders(ordersData)
      setUsers(usersData)
      setProducts(productsData)
    } catch (error) {
      onToast(error.message || 'No se pudo cargar el panel admin')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = async (targetUser) => {
    try {
      const updated = await api.updateUserStatus(targetUser.id, !targetUser.active)
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      onToast(`Usuario ${updated.active ? 'activado' : 'desactivado'}`)
    } catch (error) {
      onToast(error.message || 'No se pudo actualizar el usuario')
    }
  }

  const updateOrderStatus = async (order, status) => {
    try {
      const updated = await api.updateOrderStatus(order.id, status)
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      onTrackOrder(updated)
      onToast(`Pedido ${updated.code} actualizado a ${updated.status}`)
    } catch (error) {
      onToast(error.message || 'No se pudo actualizar el pedido')
    }
  }

  return (
    <section className="admin-page page-pad">
      <h1>Panel de Administracion</h1>
      <p>Gestion rapida de pedidos, productos y usuarios de FastBite.</p>

      <div className="admin-tabs">
        <button className={tab === 'orders' ? 'selected' : ''} onClick={() => setTab('orders')}>Pedidos</button>
        <button className={tab === 'inventory' ? 'selected' : ''} onClick={() => setTab('inventory')}>Inventario</button>
        <button className={tab === 'users' ? 'selected' : ''} onClick={() => setTab('users')}>Usuarios</button>
      </div>

      <div className="admin-stats">
        <article><strong>{orders.length}</strong><span>Pedidos</span></article>
        <article><strong>{products.length}</strong><span>Productos activos</span></article>
        <article><strong>{users.filter((item) => item.active).length}</strong><span>Usuarios activos</span></article>
      </div>

      {loading && <p className="admin-empty">Cargando panel...</p>}

      {!loading && tab === 'orders' && (
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Gestion de Pedidos</h2>
            <button className="outline-red small" onClick={loadAdminData}>ACTUALIZAR</button>
          </div>
          {orders.length === 0 && <p className="admin-empty">No hay pedidos todavia.</p>}
          <div className="admin-orders">
            {orders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <div>
                  <h3>{order.code}</h3>
                  <p>{order.items?.length || 0} productos - Total ${Number(order.total).toFixed(2)}</p>
                  <span className={`status-pill status-${order.status.replace(/\s/g, '-').toLowerCase()}`}>{order.status}</span>
                </div>
                <div className="admin-order-items">
                  {(order.items || []).map((item) => (
                    <span key={`${order.id}-${item.productId}-${item.name}`}>{item.quantity}x {item.name}</span>
                  ))}
                </div>
                <div className="admin-actions">
                  <button onClick={() => updateOrderStatus(order, 'Aceptado')}>Aceptar</button>
                  <button onClick={() => updateOrderStatus(order, 'En Preparacion')}>Preparar</button>
                  <button onClick={() => updateOrderStatus(order, 'En Camino')}>Enviar</button>
                  <button onClick={() => updateOrderStatus(order, 'Entregado')}>Entregar</button>
                  <button className="danger" onClick={() => updateOrderStatus(order, 'Cancelado')}>Cancelar</button>
                  <button
                    className="outline-red small"
                    onClick={() => {
                      onTrackOrder(order)
                      onNavigate('tracking')
                    }}
                  >
                    Ver seguimiento
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'inventory' && (
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Inventario de Productos</h2>
            <button className="outline-red small" onClick={() => onNavigate('menu')}>VER MENU</button>
          </div>
          <div className="inventory-grid">
            {products.map((product) => (
              <article className="inventory-card" key={product.id}>
                <img src={productImage(product)} alt={product.name} onError={(event) => { event.currentTarget.src = productImage({ category: product.category }) }} />
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.category}</p>
                  <strong>${Number(product.price).toFixed(2)}</strong>
                  <span>{product.featured ? 'Destacado' : 'Menu'}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'users' && (
        <div className="admin-panel">
          <h2>Control de Usuarios</h2>
          <div className="admin-users">
            {users.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.email}</strong>
                  <span>{item.role} - {item.active ? 'activo' : 'desactivado'}</span>
                </div>
                <button className="outline-red small" onClick={() => toggleUser(item)}>
                  {item.active ? 'DESACTIVAR' : 'ACTIVAR'}
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Toast({ message, onClose }) {
  React.useEffect(() => {
    const id = window.setTimeout(onClose, 3000)
    return () => window.clearTimeout(id)
  }, [onClose])

  return (
    <div className="toast">
      <CheckCircle2 size={19} />
      {message}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)

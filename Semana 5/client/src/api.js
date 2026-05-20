const rawApiUrl = (
  import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')
).replace(/\/$/, '')

const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`

function getToken() {
  return window.localStorage.getItem('fastbite_token') || ''
}

async function request(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Error al conectar con el servidor')
  }

  return data
}

export const api = {
  getProducts: () => request('/products'),
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  createOrder: (payload) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getOrder: (id) => request(`/orders/${id}`),
  getMyOrders: (userId) => request(`/orders?userId=${encodeURIComponent(userId)}`),
  advanceOrder: (id) => request(`/orders/${id}/advance`, {
    method: 'POST',
  }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  getOrders: () => request('/orders'),
  getUsers: () => request('/users'),
  updateUserStatus: (id, active) => request(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }),
}

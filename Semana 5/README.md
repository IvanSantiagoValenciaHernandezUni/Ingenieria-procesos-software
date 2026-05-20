# FastBite Restaurant Web App

Aplicación web para pedidos de comida rápida. El proyecto está separado en frontend, backend y documentación/base de datos para facilitar el despliegue en Render y la conexión con Supabase.

## Estructura

- `client/`: aplicación React + Vite.
- `server/`: backend Node.js/Express preparado para las futuras APIs.
- `Database/`: notas, esquema y scripts relacionados con Supabase.

## Ejecutar en local

Frontend:

```bash
cd client
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
npm start
```

## Rutas del Backend

- `GET /api/health`: prueba de servidor.
- `POST /api/auth/register`: crear cuenta de cliente.
- `POST /api/auth/login`: iniciar sesion.
- `GET /api/products`: listar productos activos.
- `POST /api/products`: crear producto.
- `PUT /api/products/:id`: actualizar producto.
- `DELETE /api/products/:id`: desactivar producto.
- `POST /api/orders`: crear pedido.
- `GET /api/orders`: listar pedidos para admin.
- `GET /api/orders/:id`: consultar un pedido.
- `POST /api/orders/:id/advance`: avanzar el estado del pedido.
- `PATCH /api/orders/:id/status`: cambiar el estado manualmente.
- `GET /api/users`: listar usuarios.
- `PATCH /api/users/:id/status`: activar o desactivar usuarios.

## Credenciales de Prueba

- Admin: `admin@fastbite.com` / `admin`
- Cliente: se crea desde la pantalla de registro.

Por ahora el backend usa un archivo JSON local para que el flujo funcione completo sin depender todavia de llaves de Supabase. La carpeta `Database/` ya tiene el esquema base para migrarlo a Supabase.

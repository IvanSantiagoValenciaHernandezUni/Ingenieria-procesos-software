# Database

Scripts para crear la base de datos de FastBite en Supabase.

## Orden de Ejecucion

1. Abrir Supabase.
2. Ir a `SQL Editor`.
3. Pegar y ejecutar `schema.sql`.
4. Pegar y ejecutar `seed.sql`.

## Tablas

- `profiles`: datos publicos del usuario y rol (`cliente` o `admin`).
- `products`: productos del menu.
- `orders`: pedidos y estado actual.
- `order_items`: productos incluidos en cada pedido.

## Nota de Admin

Primero crea el usuario admin desde Authentication o desde el registro de la app. Luego, en Supabase SQL Editor, cambia su rol:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@fastbite.com';
```

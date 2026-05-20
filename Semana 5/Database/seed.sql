-- FastBite - productos iniciales
-- Ejecutar despues de schema.sql.

insert into public.products (name, description, category, price, image_url, featured, active)
values
  (
    'Hamburguesa Clasica',
    'Jugosa hamburguesa con carne, lechuga, tomate, queso y nuestra salsa especial',
    'hamburguesas',
    12.99,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    'Hamburguesa Doble',
    'Doble carne, doble queso, doble sabor',
    'hamburguesas',
    16.99,
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    'Pizza Pepperoni',
    'Pizza con abundante pepperoni y queso mozzarella',
    'pizzas',
    18.99,
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    'Pizza Pollo BBQ',
    'Pollo, cebolla morada, cilantro fresco y salsa BBQ',
    'pizzas',
    20.99,
    'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80',
    false,
    true
  ),
  (
    'Salchipapas Especiales',
    'Papas fritas crujientes con salchichas y salsas variadas',
    'salchipapas',
    8.99,
    'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    'Coca Cola',
    'Bebida refrescante 500ml',
    'bebidas',
    2.99,
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',
    false,
    true
  ),
  (
    'Brownie con Helado',
    'Delicioso brownie de chocolate con helado de vainilla',
    'postres',
    6.99,
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
    false,
    true
  ),
  (
    'Combo Familiar',
    '2 Hamburguesas + 2 Papas + 2 Bebidas',
    'combos',
    29.99,
    'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    'Perro Caliente Especial',
    'Pan suave, salchicha premium, papas ripio, queso y salsas de la casa',
    'hamburguesas',
    9.99,
    '/assets/product-burger.svg',
    false,
    true
  ),
  (
    'Malteada de Chocolate',
    'Malteada cremosa de chocolate con crema batida',
    'bebidas',
    5.99,
    '/assets/product-drink.svg',
    false,
    true
  )
on conflict do nothing;

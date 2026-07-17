-- ============================================================
-- IRREAL — Fase 1: Motor Web, Motor de Pedidos, Motor de Clientes
-- Ver sección 4 (Dominios y Motores) y sección 19 (Roadmap) del Blueprint.
-- ============================================================

-- ---------- MOTOR WEB: categorías y productos del menú ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_categories_org on categories(organization_id);
create index idx_products_org on products(organization_id);
create index idx_products_category on products(category_id);

-- ---------- MOTOR DE CLIENTES ----------
create table customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  unique (organization_id, phone)
);

create index idx_customers_org on customers(organization_id);

-- ---------- MOTOR DE PEDIDOS ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  channel text not null check (channel in ('web', 'whatsapp', 'table')),
  order_type text not null check (order_type in ('delivery', 'pickup', 'scheduled')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_kitchen', 'ready', 'delivered', 'cancelled')),
  scheduled_for timestamptz,
  payment_method text check (payment_method in ('cash', 'nequi', 'daviplata', 'pse', 'card')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,   -- copia al momento de la venta (el producto puede cambiar de precio después)
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(12,2) not null
);

create index idx_orders_org on orders(organization_id);
create index idx_orders_branch on orders(branch_id);
create index idx_order_items_order on order_items(order_id);

-- ---------- RLS ----------
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Menú: público, para que el Motor Web funcione sin login.
create policy "public can read active categories" on categories
  for select using (true);

create policy "public can read active products" on products
  for select using (is_active = true);

create policy "staff can manage own products" on products
  for all using (organization_id = auth_user_organization_id() and auth_user_has_role(array['owner','admin','gerente']));

create policy "staff can manage own categories" on categories
  for all using (organization_id = auth_user_organization_id() and auth_user_has_role(array['owner','admin','gerente']));

-- Clientes: solo staff de la organización los ve. La creación de un customer nuevo
-- ocurre siempre dentro de la Edge Function create-order (service role), nunca desde el cliente anónimo.
create policy "staff can read own customers" on customers
  for select using (organization_id = auth_user_organization_id());

-- Pedidos: el staff ve y actualiza los de su organización. La creación de pedidos desde
-- el sitio público NO usa una policy de insert directa (ver Edge Function create-order):
-- así se evita exponer lógica de precio/stock a un cliente sin autenticar.
create policy "staff can read own orders" on orders
  for select using (organization_id = auth_user_organization_id());

create policy "staff can update own orders" on orders
  for update using (organization_id = auth_user_organization_id());

create policy "staff can read own order items" on order_items
  for select using (
    order_id in (select id from orders where organization_id = auth_user_organization_id())
  );

-- ============================================================
-- IRREAL — Dominio Plataforma
-- Jerarquía multi-tenant: Platform → Organizations → Branches → Users → Roles → Permissions
-- Ver sección 5 del Platform Blueprint.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ORGANIZATIONS ----------
-- Un restaurante o cadena cliente. Límite de aislamiento de datos.
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,               -- usado en subdominio: {slug}.irreal.ia
  custom_domain text unique,                -- dominio propio, plan Profesional+
  logo_url text,
  primary_color text default '#16233B',
  plan text not null default 'esencial' check (plan in ('esencial', 'profesional', 'empresarial')),
  is_founder_pricing boolean not null default false,  -- Precio Fundador (primeros 20)
  tax_id text,                              -- NIT para facturación electrónica DIAN
  created_at timestamptz not null default now()
);

comment on table organizations is 'Organization en la jerarquía multi-tenant. Equivale a Restaurant en el modelo de datos conceptual.';

-- ---------- BRANCHES ----------
-- Una sede física dentro de una organización.
create table branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  is_main boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_branches_org on branches(organization_id);

-- ---------- ROLES (catálogo fijo de la plataforma, sección 9 del Blueprint) ----------
create table roles (
  id serial primary key,
  code text not null unique,   -- owner, admin, gerente, supervisor, caja, mesero, cocina, delivery, cliente
  name text not null
);

insert into roles (code, name) values
  ('owner', 'Owner'),
  ('admin', 'Administrador'),
  ('gerente', 'Gerente'),
  ('supervisor', 'Supervisor'),
  ('caja', 'Caja'),
  ('mesero', 'Mesero'),
  ('cocina', 'Cocina'),
  ('delivery', 'Delivery');
  -- 'cliente' no se modela como staff role; los compradores finales usan la tabla customers.

-- ---------- APP_USERS ----------
-- Perfil de staff, vinculado 1:1 a auth.users. Todo User pertenece a una Organization.
create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_app_users_org on app_users(organization_id);

-- ---------- USER_ROLES ----------
-- Un usuario puede tener un rol global de la organización, o un rol acotado a una sucursal.
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,  -- null = aplica a toda la organización
  role_id int not null references roles(id),
  created_at timestamptz not null default now(),
  unique (user_id, organization_id, branch_id, role_id)
);

create index idx_user_roles_user on user_roles(user_id);

-- ---------- Helper: rol(es) del usuario autenticado en una organización ----------
-- Usada por las políticas RLS de los demás módulos.
create or replace function auth_user_organization_id()
returns uuid
language sql stable
as $$
  select organization_id from app_users where id = auth.uid();
$$;

create or replace function auth_user_has_role(required_codes text[])
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.code = any(required_codes)
  );
$$;

-- ---------- RLS base ----------
alter table organizations enable row level security;
alter table branches enable row level security;
alter table app_users enable row level security;
alter table user_roles enable row level security;

-- Cualquiera puede leer datos públicos mínimos de una organización (para el Motor Web, sin login).
create policy "public can read organizations" on organizations
  for select using (true);

-- Solo staff de la propia organización puede modificarla.
create policy "staff can update own organization" on organizations
  for update using (id = auth_user_organization_id() and auth_user_has_role(array['owner']));

-- Branches: lectura pública (el sitio necesita mostrar sede/dirección), escritura solo staff propio.
create policy "public can read branches" on branches
  for select using (true);

create policy "staff can manage own branches" on branches
  for all using (organization_id = auth_user_organization_id() and auth_user_has_role(array['owner','admin']));

-- app_users y user_roles: solo visibles/editables dentro de la misma organización.
create policy "staff can read own org users" on app_users
  for select using (organization_id = auth_user_organization_id());

create policy "owners manage own org users" on app_users
  for all using (organization_id = auth_user_organization_id() and auth_user_has_role(array['owner','admin']));

create policy "staff can read own org roles" on user_roles
  for select using (organization_id = auth_user_organization_id());

create policy "owners manage own org roles" on user_roles
  for all using (organization_id = auth_user_organization_id() and auth_user_has_role(array['owner','admin']));

# IRREAL — Arranque técnico (Fase 1)

Este proyecto implementa la Fase 1 del roadmap del Platform Blueprint:
**Dominio Plataforma** (multi-tenant) + **Motor Web** + **Motor de Pedidos** + **Motor de Clientes**.

No es el producto terminado. Es la base sobre la que Miguel construye el resto —
pensada para que el primer restaurante demo funcione de punta a punta en un día,
no en varias semanas.

---

## 1. Plataformas a usar (y por qué)

| Capa | Plataforma | Por qué |
|---|---|---|
| Backend / base de datos | **Supabase** (Postgres + Auth + Edge Functions + Realtime) | Ya definido en el plan original. Da multi-tenant vía Row Level Security sin construir un sistema de permisos desde cero. |
| Frontend | **React + Vite** (compatible con **Horizons**) | Horizons genera y edita apps React; este scaffold es código React estándar que se puede importar o usar como base directamente. |
| Hosting frontend | **Vercel** o **Netlify** (gratis para empezar) | Despliegue automático desde GitHub, soporta subdominios wildcard fácilmente. |
| Dominio y DNS | Tu registrador actual (ej. Namecheap, GoDaddy) + registro **wildcard** `*.irreal.ia` | Necesario para que `{slug}.irreal.ia` resuelva a cualquier restaurante sin configurar DNS por cliente. |
| Control de versiones | **GitHub** | Estándar; Vercel/Netlify se conectan directo a un repo. |

No se necesita nada más para la Fase 1. No hay servidor propio que administrar.

---

## 2. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta (puedes usar GitHub).
2. **New Project** → nómbralo `irreal-platform` → elige una región cercana (São Paulo es la más cercana a Colombia).
3. Guarda la contraseña de la base de datos que te pida — la necesitas una sola vez si te conectas por línea de comandos.
4. Cuando el proyecto esté listo, ve a **Project Settings → API** y copia:
   - `Project URL` → esto es `VITE_SUPABASE_URL`
   - `anon public key` → esto es `VITE_SUPABASE_ANON_KEY`
   - `service_role key` (¡secreta, nunca la pongas en el frontend!) → la necesitas en el paso 4.

---

## 3. Aplicar el schema de base de datos

Tienes dos formas de hacerlo. La más simple si es tu primera vez:

### Opción A — Copiar y pegar en el SQL Editor (recomendada para empezar)

1. En el dashboard de Supabase, abre **SQL Editor**.
2. Pega y ejecuta, en este orden exacto, el contenido de:
   1. `supabase/migrations/0001_dominio_plataforma.sql`
   2. `supabase/migrations/0002_fase1_motores.sql`
   3. `supabase/migrations/0003_seed_demo.sql` (esto crea el restaurante demo)

### Opción B — Supabase CLI (recomendada cuando ya tengas más de un ambiente)

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU-PROJECT-REF   # está en la URL del dashboard
supabase db push                              # aplica las migraciones de supabase/migrations
```

Al terminar, en **Table Editor** deberías ver `organizations`, `branches`, `roles`,
`app_users`, `user_roles`, `categories`, `products`, `customers`, `orders`, `order_items`,
y un restaurante llamado **"Restaurante Demo IRREAL"** con 4 productos ya cargados.

---

## 4. Desplegar la Edge Function (Motor de Pedidos)

La función `create-order` es la que recibe pedidos del sitio público y los valida
en el servidor (nunca confía en precios que vengan del navegador).

```bash
cd supabase
supabase functions deploy create-order
```

La función usa automáticamente las variables `SUPABASE_URL` y
`SUPABASE_SERVICE_ROLE_KEY` que Supabase ya inyecta en sus Edge Functions —
no necesitas configurarlas a mano.

---

## 5. Correr el frontend en local

```bash
cd frontend
cp .env.example .env
# Edita .env y pega tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

Abre en el navegador:

```
http://localhost:5173/?tenant=demo
```

Deberías ver el menú del "Restaurante Demo IRREAL" con sus 4 productos.
Agrega productos al carrito, ve al checkout, llena tus datos y confirma el
pedido — si todo está bien configurado, el pedido aparece en la tabla
`orders` de Supabase con sus `order_items`.

---

## 6. Desplegar a producción

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel o Netlify: **Import Project** → conecta el repo → selecciona la carpeta `frontend` como raíz del proyecto.
3. Configura las mismas variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en el panel de la plataforma de hosting.
4. Configura un dominio **wildcard** en tu hosting (`*.irreal.ia`) apuntando al proyecto desplegado. Tanto Vercel como Netlify permiten dominios wildcard en sus planes pagos; revisa la documentación vigente de la plataforma que elijas antes de comprometerte, porque estas políticas cambian.
5. En tu registrador de dominio, crea un registro `CNAME` o `A` para `*.irreal.ia` apuntando a lo que la plataforma de hosting te indique.

A partir de ahí, cualquier restaurante nuevo con `slug = "pizza-don-jose"` queda
disponible automáticamente en `pizza-don-jose.irreal.ia`, sin ningún despliegue
adicional — el multi-tenant vive en la base de datos, no en la infraestructura.

---

## 7. Cómo se conecta esto con el resto del roadmap

Este scaffold cubre exactamente la Fase 1 del Platform Blueprint. Los siguientes
pasos técnicos, en orden, según el roadmap ya definido:

- **Fase 2** — Motor de Ventas (Centro de Ventas), Motor de Cocina, Motor CRM básico.
  El Motor de Ventas necesita sus propias tablas (`cash_registers`, `cash_sessions`,
  `sale_reconciliations`) y un panel administrativo separado del sitio público —
  se recomienda crearlo como una segunda app dentro de `frontend/` (ej. `/admin`)
  protegida con Supabase Auth y las políticas RLS de `app_users` / `user_roles`
  que ya están en `0001_dominio_plataforma.sql`.
- **Fase 3** — Motor de Inventario, Motor de Inteligencia, Motor Multi-Sucursal.
- **Fase 4** — API abierta, integraciones de pago directas, kit de hardware.

---

## 9. Panel de administración — cargar fotos y contenido sin tocar código

A partir de la migración `0004_storage_y_marca.sql`, existe un panel en `/admin` donde
tú misma puedes agregar productos con foto, editar precios y personalizar la marca del
restaurante (logo, portada, color, frase corta) — sin editar SQL.

### 9.1 Aplicar la nueva migración

Igual que las anteriores: copia y pega el contenido de
`supabase/migrations/0004_storage_y_marca.sql` en el **SQL Editor** de Supabase y dale **Run**.
Esto crea el bucket de imágenes (`product-images`) y los campos de marca en `organizations`.

### 9.2 Crear tu usuario de acceso al panel (un paso manual, una sola vez por persona)

El panel usa el sistema de login de Supabase (Auth), separado de las cuentas de los
clientes finales. Para crear tu propio acceso:

1. En el dashboard de Supabase, ve a **Authentication → Users → Add user**.
2. Crea el usuario con tu correo y una contraseña — marca la opción de que el correo
   quede confirmado automáticamente (o confírmalo desde el enlace que llega al correo).
3. Copia el **UUID** de ese usuario (aparece en la lista de usuarios).
4. Ve al **SQL Editor** y ejecuta esto, reemplazando el UUID por el que copiaste
   (este ejemplo te da acceso de `owner` al restaurante demo):

   ```sql
   insert into app_users (id, organization_id, full_name)
   values ('PEGA-AQUI-TU-UUID', '00000000-0000-0000-0000-000000000001', 'Clara');

   insert into user_roles (user_id, organization_id, role_id)
   select 'PEGA-AQUI-TU-UUID', '00000000-0000-0000-0000-000000000001', id
   from roles where code = 'owner';
   ```

5. Entra a `tudominio.vercel.app/admin/login` (o `?tenant=demo` con `/admin/login` si
   aún no tienes el subdominio configurado) e inicia sesión con el correo y contraseña
   del paso 2.

Desde ahí ya puedes:
- **Productos** — agregar, editar, subir foto, ocultar o eliminar productos, y crear categorías nuevas.
- **Mi restaurante** — cambiar el logo, la foto de portada, el color de marca y la frase corta que aparece bajo el nombre.

Cuando dan de alta un restaurante real, este mismo paso (crear su usuario `owner`) es
parte del proceso de implementación — más adelante conviene automatizarlo para que no
dependa de hacerlo a mano en el SQL Editor cada vez.

## 8. Checklist antes de vender el primer restaurante real

- [ ] El restaurante demo funciona de punta a punta (menú → carrito → checkout → pedido guardado).
- [ ] Se creó un flujo (aunque sea manual, vía SQL Editor) para dar de alta una organización nueva en menos de 15 minutos.
- [ ] El wildcard de dominio `*.irreal.ia` resuelve correctamente.
- [ ] Existe al menos un usuario `owner` de prueba que puede loguearse (Supabase Auth) y ver sus propios datos, y **no** puede ver datos de otra organización — pruébalo creando una segunda organización de prueba y confirmando el aislamiento.

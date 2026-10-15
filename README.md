# Tortas Artesanales: tienda web

Tienda de tortas con catálogo, personalización, carrito, puntos de fidelización, pedido por WhatsApp y redes sociales. Es un sitio estático (HTML, CSS y JavaScript). No necesita instalar nada ni compilar.

## Estructura

```
index.html        Estructura de la página (encabezado, secciones, pie, ventanas)
css/styles.css    Estilos y colores de la marca (variables al inicio)
js/config.js      DATOS QUE MÁS VAS A EDITAR: marca, WhatsApp, redes, tortas, precios, opciones
js/utils.js       Funciones de apoyo (formato de precios, guardado local, avisos)
js/cake.js        Dibujo de las ilustraciones de las tortas
js/app.js         Lógica: catálogo, carrito, cuenta y puntos, pedido por WhatsApp
img/              Fotos reales de las tortas (opcional)
favicon.svg       Ícono de la pestaña del navegador
vercel.json       Configuración para publicar en Vercel
```

## Qué cambiar primero (js/config.js)

1. `brand` y `tagline`: nombre y frase del logo.
2. `wa`: número de WhatsApp con código de país, sin `+` ni espacios (ejemplo Colombia: `573001234567`).
3. `waDisplay`: cómo se ve el número en la página.
4. `social`: enlaces reales de Instagram, Facebook y TikTok. Puedes agregar o quitar redes.
5. `PRODUCTS`: nombre, descripción y precios por tamaño `[pequeña, mediana, grande]` de cada torta.
6. `SIZES`, `COLORS`, `CANDLES`, `FLOWERS`, `TOYS`, `PHRASES`: tamaños, colores de crema, extras con su precio y frases sugeridas.
7. `TIERS` y `CONFIG.pointStep`, `redeemPoints`, `redeemValue`: reglas del programa de puntos.

## Colores y tipografía (css/styles.css)

Las variables están al inicio, en `:root`. El rojo es `--brand` y el beige `--beige`. Hay una versión para modo oscuro justo debajo. Las fuentes son Gloock (títulos) y Figtree (texto), cargadas desde Google Fonts en `index.html`.

## Logo

El logo es un SVG dentro de `index.html` (busca `class="logo"`; aparece en el encabezado y en el pie). Para usar el logo real, reemplaza ese `<svg>` por `<img src="img/logo.png" alt="">`. La versión del pie usa la clase `alt` (colores invertidos).

## Fotos reales

Guarda las fotos en `img/` y en `js/config.js` agrega a cada torta:

```js
photo: 'img/chocolate.jpg',                        // tarjeta del catálogo
photos: ['img/chocolate-1.jpg', 'img/chocolate-2.jpg'] // galería de la ficha
```

Usa fotos cuadradas y livianas (menos de 300 KB cada una, formato JPG o WebP).

## Probar en tu computador

Opción simple: abre `index.html` con doble clic.
Opción recomendada (se comporta como en producción):

```
npx serve .
```

## Publicar en Vercel

**Con GitHub (recomendado, se actualiza solo):**
1. Sube esta carpeta a un repositorio nuevo en GitHub.
2. En vercel.com entra a *Add New → Project* e importa el repositorio.
3. En *Framework Preset* deja **Other**. No pongas comando de build ni carpeta de salida.
4. Pulsa *Deploy*. Cada cambio que subas a GitHub se publica automáticamente.

**Con la terminal:**
```
npm i -g vercel
vercel          # primera vez: responde las preguntas
vercel --prod   # publicar en producción
```

Para usar el dominio de la marca: Vercel → proyecto → *Settings → Domains*.

## Limitaciones de esta versión

- **Cuentas y puntos:** se guardan en el navegador de cada persona (localStorage). No se comparten entre dispositivos y quien limpie el navegador los pierde. Para una fidelización real hay que conectar una base de datos con inicio de sesión (por ejemplo Supabase o Firebase). Se puede hacer cambiando las funciones de cuenta en `js/app.js`.
- **Pedidos:** no hay pasarela de pago. El pedido llega a la tienda como mensaje de WhatsApp y el pago se acuerda por ahí.
- **Precios, sabores y puntos** que trae el proyecto son de ejemplo.

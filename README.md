# Sistema de control de stock para hamburgueseria

Aplicacion web para controlar insumos en tiempo real desde cualquier dispositivo. El frontend esta hecho con HTML, CSS y JavaScript. El backend usa Node.js con Express y guarda los datos en Firebase Firestore, por lo que no depende de localStorage ni de archivos locales.

## Que incluye

- Alta de productos
- Listado con stock actual
- Edicion completa de productos
- Ajuste rapido de stock con botones +1 y -1
- Eliminacion de productos
- Alertas visuales cuando el stock baja del minimo configurado
- API REST con JSON
- Autenticacion basica opcional
- Frontend y backend separados

## Estructura del proyecto

```text
control_stock/
  backend/
    src/
      config/
      controllers/
      middleware/
      routes/
      services/
    .env.example
    package.json
    server.js
  frontend/
    app.js
    config.js
    index.html
    styles.css
  .github/
    copilot-instructions.md
  package.json
  README.md
```

## Base de datos remota

Este proyecto usa Firebase Firestore mediante firebase-admin. Eso permite que los datos vivan en la nube y se compartan entre varios dispositivos en tiempo real en el sentido practico del negocio: todos leen y actualizan el mismo origen remoto de datos.

## Como configurar Firebase

1. Crea un proyecto en Firebase.
2. Activa Firestore Database en modo produccion o prueba.
3. Ve a Project Settings > Service Accounts.
4. Genera una nueva clave privada de administrador.
5. Copia los valores en un archivo backend/.env tomando como base backend/.env.example.

Variables necesarias:

- PORT: puerto del backend.
- FRONTEND_ORIGIN: origen permitido por CORS para el frontend.
- ENABLE_BASIC_AUTH: true o false.
- BASIC_AUTH_USER: usuario para autenticacion basica opcional.
- BASIC_AUTH_PASSWORD: clave para autenticacion basica opcional.
- FIREBASE_PROJECT_ID: id del proyecto de Firebase.
- FIREBASE_CLIENT_EMAIL: email de la cuenta de servicio.
- FIREBASE_PRIVATE_KEY: clave privada completa con saltos de linea escapados como \n.

## Instalacion paso a paso

### 1. Instalar dependencias del proyecto raiz

```bash
npm install
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
cd ..
```

### 3. Crear el archivo de entorno

Duplica backend/.env.example como backend/.env y reemplaza los valores de ejemplo por tus credenciales reales.

## Como ejecutarlo en tu computadora

### Opcion A: ejecutar todo junto

Desde la raiz del proyecto:

```bash
npm run dev
```

Esto levanta:

- Backend en http://localhost:4000
- Frontend en http://localhost:5500

Si luego despliegas el backend en otro dominio, cambia la URL en frontend/config.js.

### Opcion B: ejecutar por separado

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
npx serve frontend -l 5500
```

## API REST

Base URL:

```text
http://localhost:4000/api/products
```

### GET /api/products

Devuelve todos los productos.

### POST /api/products

Crea un producto nuevo.

Ejemplo:

```json
{
  "name": "Carne 120g",
  "category": "Carnes",
  "stock": 50,
  "minimumStock": 10,
  "unit": "medallones"
}
```

### PUT /api/products/:id

Actualiza todos los campos del producto.

### PATCH /api/products/:id/stock

Suma o resta stock.

Ejemplo:

```json
{
  "quantityChange": -3
}
```

### DELETE /api/products/:id

Elimina un producto.

## Explicacion paso a paso del codigo

### Frontend

- frontend/index.html: define el panel administrativo con formulario, metricas y tabla de inventario.
- frontend/styles.css: aplica el estilo visual del panel, estados de alerta y responsividad para celular y escritorio.
- frontend/app.js: consume la API REST con fetch, actualiza la tabla, maneja altas, ediciones, bajas y ajustes de stock.

Flujo del frontend:

1. Al abrir la pagina, app.js llama a loadProducts().
2. loadProducts() hace un GET al backend y dibuja la tabla.
3. Cuando envias el formulario, createOrUpdateProduct() decide si crear o editar segun exista o no un id.
4. Los botones +1 y -1 llaman a PATCH para modificar solo el stock.
5. Si un producto queda por debajo del minimo, la fila se muestra con alerta visual.

### Backend

- backend/server.js: arranca el servidor Express.
- backend/src/app.js: configura middlewares, CORS, JSON, logs y rutas.
- backend/src/routes/products.js: declara los endpoints REST.
- backend/src/controllers/productsController.js: recibe las peticiones HTTP y delega la logica.
- backend/src/services/productService.js: contiene la logica real de negocio y acceso a Firestore.
- backend/src/config/firestore.js: inicializa Firebase Admin y expone la conexion a Firestore.
- backend/src/middleware/basicAuth.js: protege la API si activas autenticacion basica.

Flujo del backend:

1. Express recibe una solicitud.
2. La ruta correspondiente la deriva al controlador.
3. El controlador llama al servicio.
4. El servicio valida datos, consulta Firestore y devuelve el resultado.
5. El controlador responde en JSON al frontend.

## Como funciona la alerta de stock bajo

Cada producto tiene dos valores:

- stock: cantidad disponible.
- minimumStock: umbral minimo aceptable.

En el frontend, si stock es menor que minimumStock, se muestra el estado Stock bajo. Esto te permite configurar distintos minimos segun el producto.

## Autenticacion basica opcional

Si quieres proteger la API:

1. En backend/.env cambia ENABLE_BASIC_AUTH=true.
2. Define BASIC_AUTH_USER y BASIC_AUTH_PASSWORD.
3. El backend pedira credenciales Basic Auth en cada request bajo /api.

Nota: para un negocio real a mediano plazo conviene migrar luego a autenticacion con usuarios y roles, por ejemplo con Firebase Authentication o JWT.

## Deploy sugerido

### Frontend

- Vercel
- Netlify
- Firebase Hosting

### Backend

- Render
- Railway
- Firebase Functions

### Base de datos

- Firebase Firestore

Para deploy:

1. Publica el backend y copia su URL publica.
2. Edita frontend/config.js y reemplaza apiBaseUrl por la URL final del backend, por ejemplo https://tu-backend.onrender.com/api/products.
3. Configura en backend/.env la variable FRONTEND_ORIGIN con la URL publica de tu frontend.

## Mejora recomendada para produccion

- Agregar buscador y filtros por categoria.
- Registrar historial de movimientos de stock.
- Crear usuarios con permisos.
- Mostrar fecha y hora del ultimo cambio.
- Agregar dashboard de compras pendientes.
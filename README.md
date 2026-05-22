# SISTRA-TEC — Backend

API REST construida con Node.js, Express y PostgreSQL.

## Requisitos previos

- Node.js 18+

## Instalación

```bash
npm install
```

## Variables de entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3000) |
| `FRONTEND_URL` | URL del frontend para CORS |
| `DB_USER` | Usuario de PostgreSQL |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL (default: 5432) |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |

## Correr el proyecto

**Desarrollo** (con hot reload):
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

## Estructura

```
src/
├── server.js        # Punto de entrada
├── app.js           # Configuración de Express
├── config/          # Conexión a la BD
├── controllers/     # Manejo de requests HTTP
├── services/        # Lógica de negocio
├── models/          # Queries a la base de datos
├── routes/          # Definición de rutas
├── middleware/      # Auth, validación y errores
├── validations/     # Esquemas Joi
├── utils/           # Funciones reutilizables
└── errors/          # Clases de error personalizadas
```

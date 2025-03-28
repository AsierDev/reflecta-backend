# Reflecta Backend

RESTful API for the Reflecta application, a personal journal and reflection tool.

## Requirements

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) or SQLite for development
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone https://github.com/usuario/reflecta.git
cd reflecta/reflecta-backend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```
Edit the `.env` file with your database credentials and other configurations.

4. Initialize the database
```bash
npm run prisma:migrate
```

## Available Scripts

- `npm run dev`: Starts the server in development mode (with auto-reload)
- `npm run build`: Compiles TypeScript code to JavaScript
- `npm run start`: Starts the server in production mode
- `npm run test`: Runs unit tests
- `npm run test:watch`: Runs tests in watch mode
- `npm run test:coverage`: Runs tests and generates coverage report
- `npm run lint`: Checks code with ESLint
- `npm run lint:fix`: Automatically fixes style issues with ESLint
- `npm run prisma:generate`: Generates Prisma client
- `npm run prisma:migrate`: Runs database migrations
- `npm run prisma:studio`: Opens Prisma data viewer

## Project Structure

```
reflecta-backend/
├── prisma/             # Prisma schemas and migrations
├── src/                # Source code
│   ├── controllers/    # Route controllers
│   ├── lib/            # Libraries and singletons (like Prisma)
│   ├── middlewares/    # Express middlewares
│   ├── routes/         # Route definitions
│   ├── services/       # Business services
│   ├── utils/          # Utilities
│   ├── validations/    # Validation schemas (Zod)
│   ├── app.ts          # Express configuration
│   └── index.ts        # Main entry point and HTTP server
├── .env                # Environment variables (not included in git)
├── .env.example        # Example environment variables
└── package.json        # Dependencies and scripts
```

## Database Structure

### Main Entities

#### User
- **id**: String (UUID) - Unique identifier
- **email**: String (unique) - Email address
- **name**: String (optional) - Username
- **passwordHash**: String - Hashed password
- **createdAt**: DateTime - Creation date
- **updatedAt**: DateTime - Update date
- **Relations**: entries (Entry[]), tags (Tag[]), loginAttempts (LoginAttempt[])

#### Entry
- **id**: String (UUID) - Unique identifier
- **title**: String - Entry title
- **content**: String - Entry content (HTML)
- **createdAt**: DateTime - Creation date
- **updatedAt**: DateTime - Update date
- **userId**: String - User reference
- **Relations**: user (User), tags (Tag[])

#### Tag
- **id**: String (UUID) - Unique identifier
- **name**: String - Tag name
- **color**: String (optional) - Display color
- **createdAt**: DateTime - Creation date
- **userId**: String - User reference
- **Relations**: user (User), entries (Entry[])

#### LoginAttempt
- **id**: String (UUID) - Unique identifier
- **email**: String - Email used in attempt
- **ipAddress**: String (optional) - IP address
- **success**: Boolean - Whether attempt was successful
- **createdAt**: DateTime - Attempt date
- **userId**: String (optional) - User reference
- **Relations**: user (User)

### Relationship Diagram

```
User 1 ---> * Entry
User 1 ---> * Tag
User 1 ---> * LoginAttempt
Entry * <---> * Tag
```

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login
- `GET /api/auth/profile`: Get user profile (requires authentication)

### Entries

- `GET /api/entries`: Get all user entries
- `GET /api/entries/:id`: Get a specific entry
- `POST /api/entries`: Create a new entry
- `PUT /api/entries/:id`: Update an existing entry
- `DELETE /api/entries/:id`: Delete an entry
- `GET /api/entries/:id/export`: Export an entry (text/json)

### Tags

- `GET /api/tags`: Get all user tags
- `POST /api/tags`: Create a new tag
- `PUT /api/tags/:id`: Update an existing tag
- `DELETE /api/tags/:id`: Delete a tag

## Security

The API implements the following security measures:

- JWT (JSON Web Tokens) based authentication
- Password hashing with bcrypt
- Data validation with Zod
- Authorization middleware for protected routes
- HTTPS protocol for all communications (in production)
- Common attack protection with Helmet

## Running Tests

The project includes unit and integration tests to verify proper functionality:

```bash
# Run all tests
npm test

# View test coverage
npm run test:coverage

# Run specific tests
npm run test:controllers
npm run test:services
npm run test:middlewares
npm run test:routes
```

### Coverage Report Interpretation

Coverage reports show:
- **Statements**: Percentage of executed statements
- **Branches**: Percentage of evaluated conditional branches
- **Functions**: Percentage of called functions
- **Lines**: Percentage of executed lines

For writing new tests, check the examples in the `__tests__` directories.

## Troubleshooting Common Issues

### Database Connection Issues

1. **Error: Database connection failed**
   - Verify credentials in `.env` are correct
   - Check database exists and is accessible
   - For SQLite, ensure path is correct and you have permissions

2. **Error: Prisma schema validation error**
   - Run `npm run prisma:generate` to update client
   - Verify schema in `prisma/schema.prisma` is valid

### JWT Issues

1. **Error: JWT secret not set**
   - Ensure `JWT_SECRET` is defined in `.env`
   - Never use default value in production

2. **Error: Token expired/invalid**
   - Verify `JWT_EXPIRES_IN` has a reasonable value
   - Ensure server clock is accurate

### Node.js Issues

1. **Error: Node version incompatible**
   - Use Node.js v18 or higher
   - Install recommended version with `nvm`

## Contributing Guide

### Code Conventions

This project uses:
- TypeScript for static typing
- ESLint for code linting
- Prettier for consistent formatting
- Zod for data validation
- Jest for unit testing

### Contribution Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linter (`npm run lint`)
6. Commit changes (`git commit -m 'feat: add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes (no code changes)
- `refactor`: Code refactoring
- `test`: Adding or fixing tests
- `chore`: Build process, tools, etc. changes

### Reporting Bugs

Open an issue describing:
- Steps to reproduce
- Expected behavior
- Current behavior
- Environment (Node.js, OS, etc.)

## Deployment

### Deploying to Railway
1. Create a Railway account
2. Connect your GitHub repository
3. Configure environment variables
4. Railway will automatically detect the Procfile and deploy

### Deploying to Heroku
1. Install Heroku CLI
2. Run `heroku create`
3. Configure environment variables: `heroku config:set KEY=VALUE`
4. Deploy with `git push heroku main`

### Deploying to AWS
1. Create an EC2 instance or ECS/EKS service
2. Configure RDS PostgreSQL database
3. Configure environment variables
4. Use PM2 or Docker to manage Node.js process

## Current Version and Roadmap

- **Current Version**: 1.0.0
- **Status**: Beta

### Upcoming Features
- Password recovery system
- Email verification
- Bulk entry export
- File storage integration

## License

ISC

---

# Reflecta Backend 

API RESTful para la aplicación Reflecta, una herramienta de diario personal y reflexión.

## Requisitos

- Node.js (v18 o superior)
- PostgreSQL (v14 o superior) o SQLite para desarrollo
- npm o yarn

## Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/usuario/reflecta.git
cd reflecta/reflecta-backend
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
```
Editar el archivo `.env` con tus credenciales de base de datos y otras configuraciones.

4. Inicializar la base de datos
```bash
npm run prisma:migrate
```

## Scripts disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo (con recarga automática)
- `npm run build`: Compila el código TypeScript a JavaScript
- `npm run start`: Inicia el servidor en modo producción
- `npm run test`: Ejecuta las pruebas unitarias
- `npm run test:watch`: Ejecuta las pruebas en modo observador (watch)
- `npm run test:coverage`: Ejecuta las pruebas y genera informe de cobertura
- `npm run lint`: Verifica el código con ESLint
- `npm run lint:fix`: Corrige automáticamente problemas de estilo con ESLint
- `npm run prisma:generate`: Genera el cliente Prisma
- `npm run prisma:migrate`: Ejecuta migraciones de base de datos
- `npm run prisma:studio`: Abre el visor de datos de Prisma

## Estructura del proyecto

```
reflecta-backend/
├── prisma/             # Esquemas y migraciones de Prisma
├── src/                # Código fuente
│   ├── controllers/    # Controladores de rutas
│   ├── lib/            # Bibliotecas y singleton (como Prisma)
│   ├── middlewares/    # Middlewares de Express
│   ├── routes/         # Definición de rutas
│   ├── services/       # Servicios de negocio
│   ├── utils/          # Utilidades
│   ├── validations/    # Esquemas de validación (Zod)
│   ├── app.ts          # Configuración de Express
│   └── index.ts        # Punto de entrada principal y servidor HTTP
├── .env                # Variables de entorno (no incluido en git)
├── .env.example        # Ejemplo de variables de entorno
└── package.json        # Dependencias y scripts
```

## Estructura de la base de datos

### Entidades principales

#### User
- **id**: String (UUID) - Identificador único
- **email**: String (único) - Correo electrónico
- **name**: String (opcional) - Nombre de usuario
- **passwordHash**: String - Contraseña hasheada
- **createdAt**: DateTime - Fecha de creación
- **updatedAt**: DateTime - Fecha de actualización
- **Relaciones**: entries (Entry[]), tags (Tag[]), loginAttempts (LoginAttempt[])

#### Entry
- **id**: String (UUID) - Identificador único
- **title**: String - Título de la entrada
- **content**: String - Contenido de la entrada (HTML)
- **createdAt**: DateTime - Fecha de creación
- **updatedAt**: DateTime - Fecha de actualización
- **userId**: String - Referencia al usuario
- **Relaciones**: user (User), tags (Tag[])

#### Tag
- **id**: String (UUID) - Identificador único
- **name**: String - Nombre de la etiqueta
- **color**: String (opcional) - Color para visualización
- **createdAt**: DateTime - Fecha de creación
- **userId**: String - Referencia al usuario
- **Relaciones**: user (User), entries (Entry[])

#### LoginAttempt
- **id**: String (UUID) - Identificador único
- **email**: String - Correo utilizado en el intento
- **ipAddress**: String (opcional) - Dirección IP
- **success**: Boolean - Si el intento fue exitoso
- **createdAt**: DateTime - Fecha del intento
- **userId**: String (opcional) - Referencia al usuario
- **Relaciones**: user (User)

### Diagrama de relaciones

```
User 1 ---> * Entry
User 1 ---> * Tag
User 1 ---> * LoginAttempt
Entry * <---> * Tag
```

## API Endpoints

### Autenticación

- `POST /api/auth/register`: Registrar un nuevo usuario
- `POST /api/auth/login`: Iniciar sesión
- `GET /api/auth/profile`: Obtener perfil de usuario (requiere autenticación)

### Entradas

- `GET /api/entries`: Obtener todas las entradas del usuario
- `GET /api/entries/:id`: Obtener una entrada específica
- `POST /api/entries`: Crear una nueva entrada
- `PUT /api/entries/:id`: Actualizar una entrada existente
- `DELETE /api/entries/:id`: Eliminar una entrada
- `GET /api/entries/:id/export`: Exportar una entrada (texto/json)

### Etiquetas

- `GET /api/tags`: Obtener todas las etiquetas del usuario
- `POST /api/tags`: Crear una nueva etiqueta
- `PUT /api/tags/:id`: Actualizar una etiqueta existente
- `DELETE /api/tags/:id`: Eliminar una etiqueta

## Seguridad

La API implementa las siguientes medidas de seguridad:

- Autenticación basada en JWT (JSON Web Tokens)
- Contraseñas hasheadas con bcrypt
- Validación de datos con Zod
- Middleware de autorización para rutas protegidas
- Protocolo HTTPS para todas las comunicaciones (en producción)
- Protección contra ataques comunes con Helmet

## Ejecución de pruebas

El proyecto incluye pruebas unitarias e integración para verificar el correcto funcionamiento:

```bash
# Ejecutar todas las pruebas
npm test

# Ver cobertura de pruebas
npm run test:coverage

# Ejecutar pruebas específicas
npm run test:controllers
npm run test:services
npm run test:middlewares
npm run test:routes
```

### Interpretación de informes de cobertura

Los informes de cobertura muestran:
- **Statements**: Porcentaje de declaraciones ejecutadas
- **Branches**: Porcentaje de ramas condicionales evaluadas
- **Functions**: Porcentaje de funciones llamadas
- **Lines**: Porcentaje de líneas ejecutadas

Para escribir nuevas pruebas, consulta los ejemplos en los directorios `__tests__`.

## Solución de problemas comunes

### Problemas de conexión a la base de datos

1. **Error: Database connection failed**
   - Verifica que las credenciales en `.env` son correctas
   - Comprueba que la base de datos existe y está accesible
   - Para SQLite, asegúrate que la ruta es correcta y tienes permisos

2. **Error: Prisma schema validation error**
   - Ejecuta `npm run prisma:generate` para actualizar el cliente
   - Verifica que el esquema en `prisma/schema.prisma` es válido

### Problemas con JWT

1. **Error: JWT secret not set**
   - Asegúrate de que `JWT_SECRET` está definido en `.env`
   - Nunca uses el valor predeterminado en producción

2. **Error: Token expired/invalid**
   - Verifica que `JWT_EXPIRES_IN` tiene un valor razonable
   - Asegúrate de que el reloj del servidor es preciso

### Problemas de Node.js

1. **Error: Node version incompatible**
   - Usa Node.js v18 o superior
   - Instala la versión recomendada con `nvm`

## Guía de contribución

### Convenciones de código

Este proyecto utiliza:
- TypeScript para tipado estático
- ESLint para linting de código
- Prettier para formato consistente
- Zod para validación de datos
- Jest para pruebas unitarias

### Flujo de trabajo para contribuciones

1. Realiza un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios
4. Ejecuta las pruebas (`npm test`) 
5. Ejecuta el linter (`npm run lint`)
6. Haz commit de tus cambios (`git commit -m 'feat: add amazing feature'`)
7. Haz push a la rama (`git push origin feature/amazing-feature`)
8. Abre un Pull Request

### Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nueva característica
- `fix`: Corrección de error
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización de código
- `test`: Añadir o arreglar pruebas
- `chore`: Cambios en proceso de build, herramientas, etc.

### Reportar bugs

Abre un issue describiendo:
- Pasos para reproducir el error
- Comportamiento esperado
- Comportamiento actual
- Entorno (Node.js, OS, etc.)

## Despliegue

### Despliegue en Railway
1. Crea una cuenta en Railway
2. Conecta tu repositorio de GitHub
3. Configura variables de entorno
4. Railway detectará automáticamente el Procfile y desplegará

### Despliegue en Heroku
1. Instala Heroku CLI
2. Ejecuta `heroku create`
3. Configura variables de entorno: `heroku config:set KEY=VALUE`
4. Despliega con `git push heroku main`

### Despliegue en AWS
1. Crea una instancia EC2 o un servicio de ECS/EKS
2. Configura la base de datos RDS PostgreSQL
3. Configura variables de entorno
4. Usa PM2 o Docker para gestionar el proceso Node.js

## Versión actual y Roadmap

- **Versión actual**: 1.0.0
- **Estado**: Beta

### Próximas características
- Sistema de recuperación de contraseñas
- Verificación de email
- Exportación masiva de entradas
- Integración con almacenamiento de archivos

## Licencia

ISC 
# Pole Dance - Sistema de Inscripción de Alumnos

## Descripción

Aplicación web para gestionar inscripciones de alumnas a clases de Pole Dance. Las alumnas pueden inscribirse sin necesidad de crear cuenta, y el profesor gestiona las clases y asistencia desde su panel.

## Stack Tecnológico

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Despliegue**: Vercel
- **Base de datos**: Supabase (PostgreSQL)

## Funcionalidades

### Para Alumnas
- Ingresar nombre y teléfono para identificarse
- Ver los días de clase disponibles en la semana actual
- Marcar asistencia a las clases que desea asistir (una por una)
- No requiere registro ni contraseña

### Para el Profesor
- **Login** con contraseña segura
- **Gestión de clases semanales**:
  - Definir qué días habrá clase cada semana
  - Copiar estructura de clase de una semana anterior
  - Editar/eliminar clases existentes
- **Ver inscripciones**:
  - Lista de alumnas por cada clase
  - Filtrar por semana
  - Acceso a historial de semanas anteriores
- **Gestionar asistencia**:
  - Eliminar inscripción de alumna que avisa no asistirá
  - Registrar ausencias

## Estructura de la Base de Datos (Supabase)

### Tabla: `profesores`
- `id`: UUID (PK)
- `email`: VARCHAR
- `password_hash`: VARCHAR
- `nombre`: VARCHAR
- `created_at`: TIMESTAMP

### Tabla: `semanas`
- `id`: UUID (PK)
- `profesor_id`: UUID (FK)
- `fecha_inicio`: DATE (inicio de la semana)
- `nombre`: VARCHAR (opcional, ej: "Semana 15-21 Abril")
- `created_at`: TIMESTAMP

### Tabla: `clases`
- `id`: UUID (PK)
- `semana_id`: UUID (FK)
- `dia_semana`: INTEGER (0=Domingo, 1=Lunes, etc.)
- `hora`: TIME (opcional, para futuro)
- `nivel`: VARCHAR (Básico, Intermedio, Avanzado)
- `created_at`: TIMESTAMP

### Tabla: `inscripciones`
- `id`: UUID (PK)
- `clase_id`: UUID (FK)
- `nombre_alumna`: VARCHAR
- `telefono`: VARCHAR
- `asistira`: BOOLEAN (TRUE = confirmada)
- `created_at`: TIMESTAMP

## Flujo de Uso

### Alumna
1. Abre la app
2. Ingresa su nombre y teléfono
3. Ve los días disponibles en la semana
4. Marca las clases a las que asistirá
5. Confirmación visual

### Profesor
1. Accede a `/admin` y hace login
2. Ve dashboard con semanas disponibles
3. Crea nueva semana o selecciona una existente
4. Define los días de clase (puede copiar de semana anterior)
5. Ve lista de alumnas inscritas por clase
6. Puede eliminar inscripciones si la alumna avisa que no asistirá
7. Puede navegar entre semanas para ver historial

## Estructura de Archivos

```
/inscripcion-alumnos
├── index.html          # Página principal (alumnas)
├── admin.html          # Panel del profesor
├── css/
│   └── styles.css      # Estilos globales
├── js/
│   ├── app.js          # Lógica para alumna
│   ├── admin.js        # Lógica para profesor
│   └── supabase.js     # Configuración cliente
├── .env.example        # Variables de entorno ejemplo
└── README.md
```

## Configuración Supabase

1. Crear proyecto en Supabase
2. Obtener URL y API Key
3. Crear tablas según estructura definida
4. Configurar políticas RLS (Row Level Security)
5. Copiar credenciales a variables de entorno

## Pendientes de Implementación

- [ ] Configurar proyecto Supabase
- [ ] Crear estructura HTML (index.html, admin.html)
- [ ] Implementar estilos CSS
- [ ] Conectar cliente Supabase
- [ ] Funcionalidad: Registro de alumna
- [ ] Funcionalidad: Inscripción a clases
- [ ] Funcionalidad: Login profesor
- [ ] Funcionalidad: Crear/gestionar semanas
- [ ] Funcionalidad: Definir días de clase
- [ ] Funcionalidad: Ver inscripciones por clase
- [ ] Funcionalidad: Eliminar inscripciones
- [ ] Funcionalidad: Navegar entre semanas
- [ ] Desplegar en Vercel

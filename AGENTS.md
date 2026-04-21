# AGENTS.md - Guía para Agentes IA

## Proyecto: Pole Dance - Sistema de Inscripción

App web vanilla JS con Supabase y Vercel para inscripción de alumnos a clases de Pole Dance.

## Reglas Generales

1. **Sin frameworks** - Solo JavaScript vanilla, HTML y CSS
2. **Supabase** - Usar cliente oficial `@supabase/supabase-js`
3. **Vercel** - Despliegue en vercel.com
4. **Metodología** - Crear siempre archivos nuevos, nunca sobreescribir sin leer primero
5. **Commits** - Nunca hacer commit sin autorización explícita del usuario

## Configuración de Entorno

Crear archivo `.env` con:
```
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## Estructura de Base de Datos

### Tablas principales:
- `profesores` - Usuarios del profesor (login)
- `semanas` - Semanas lectivas
- `clases` - Días/horarios de clase por semana
- `inscripciones` - Alumnas inscritas por clase

### RLS (Row Level Security):
- Tabla `profesores`: Solo el profesor puede leer/escribir sus datos
- Tabla `semanas`: Público lectura, profesor escritura
- Tabla `clases`: Público lectura, profesor escritura
- Tabla `inscripciones`: Público lectura/escritura (inscripción), profesor puede eliminar

## Estructura de Archivos

```
/js
  supabase.js      # Cliente Supabase inicializado
  app.js           # Lógica página alumna (index.html)
  admin.js         # Lógica panel profesor (admin.html)
/css
  styles.css       # Estilos compartidos
index.html         # Página para alumnas
admin.html         # Panel del profesor
.env               # Variables (nunca commitear)
```

## Flujos de Usuario

### Alumna (index.html)
1. Formulario: nombre + teléfono
2. Mostrar semana actual con clases disponibles
3. Checkboxes para confirmar asistencia por clase
4. Guardar en Supabase tabla `inscripciones`

### Profesor (admin.html)
1. Login con email/password
2. Dashboard: lista de semanas
3. Crear semana nueva o copiar de anterior
4. Agregar/quitar días de clase
5. Ver inscripciones por clase
6. Eliminar inscripción si alumna no asistirá

## Comandos Útiles

```bash
# Instalar dependencias cliente Supabase
npm install @supabase/supabase-js

# Variables de Vite disponibles como import.meta.env
```

## Configuración Supabase

### Paso 1: Crear proyecto
1. Ir a https://supabase.com y crear cuenta
2. Nuevo proyecto → nombre: "pole-dance-inscripcion"
3. Esperar que-provisione (Database URL disponible)

### Paso 2: Ejecutar schema
1. SQL Editor en Supabase Dashboard
2. Copiar contenido de `supabase/schema.sql`
3. Ejecutar
4. Insertar profesor de prueba (cambiar email/password)

### Paso 3: Obtener credenciales
1. Settings → API
2. Copiar "Project URL" → `VITE_SUPABASE_URL`
3. Copiar "anon public" key → `VITE_SUPABASE_ANON_KEY`

### Paso 4: Archivo .env
Crear `.env` en raíz del proyecto:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

## Pendientes Actuales

- [x] Configurar proyecto Supabase (crear tablas)
- [x] Crear estructura HTML/CSS/JS base
- [x] Implementar frontend alumna
- [x] Implementar frontend profesor
- [ ] Probar y desplegar

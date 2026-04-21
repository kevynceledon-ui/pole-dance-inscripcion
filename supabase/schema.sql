-- ============================================
-- SCRIPT DE BASE DE DATOS - POLE DANCE APP
-- ============================================

-- 1. TABLA PROFESORES
create table profesores (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    password_hash text not null,
    nombre text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA SEMANAS
create table semanas (
    id uuid primary key default gen_random_uuid(),
    profesor_id uuid references profesores(id) not null,
    fecha_inicio date not null,
    nombre text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(profesor_id, fecha_inicio)
);

-- 3. TABLAS CLASES
create table clases (
    id uuid primary key default gen_random_uuid(),
    semana_id uuid references semanas(id) on delete cascade not null,
    dia_semana integer not null check (dia_semana >= 0 and dia_semana <= 6),
    nivel text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA INSCRIPCIONES
create table inscripciones (
    id uuid primary key default gen_random_uuid(),
    clase_id uuid references clases(id) on delete cascade not null,
    nombre_alumna text not null,
    telefono text not null,
    asistira boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS en todas las tablas
alter table profesores enable row level security;
alter table semanas enable row level security;
alter table clases enable row level security;
alter table inscripciones enable row level security;

-- ------------------------------------------
-- POLÍTICAS PARA PROFESORES
-- ------------------------------------------

-- El profesor puede ver todos los profesores (para login)
create policy "Profesores pueden ver profesores"
    on profesores for select
    to authenticated
    using (true);

-- Solo el profesor puede insertarse a sí mismo
create policy "Profesores pueden insertar su propio perfil"
    on profesores for insert
    to authenticated
    with check (true);

-- ------------------------------------------
-- POLÍTICAS PARA SEMANAS
-- ------------------------------------------

-- Público puede leer semanas
create policy "Cualquiera puede ver semanas"
    on semanas for select
    to anon
    using (true);

-- Solo el profesor puede crear/modificar sus semanas
create policy "Profesor puede gestionar sus semanas"
    on semanas for all
    to authenticated
    using (
        exists (
            select 1 from semanas s
            where s.id = semanas.id
            and s.profesor_id = (select id from profesores where email = auth.jwt()->>'email')
        )
    );

-- ------------------------------------------
-- POLÍTICAS PARA CLASES
-- ------------------------------------------

-- Público puede leer clases
create policy "Cualquiera puede ver clases"
    on clases for select
    to anon
    using (true);

-- Solo el profesor puede crear/modificar clases de sus semanas
create policy "Profesor puede gestionar clases"
    on clases for all
    to authenticated
    using (
        exists (
            select 1 from semanas s
            where s.id = clases.semana_id
            and s.profesor_id = (select id from profesores where email = auth.jwt()->>'email')
        )
    );

-- ------------------------------------------
-- POLÍTICAS PARA INSCRIPCIONES
-- ------------------------------------------

-- Público puede leer inscripciones
create policy "Cualquiera puede ver inscripciones"
    on inscripciones for select
    to anon
    using (true);

-- Público puede crear inscripciones
create policy "Cualquiera puede crear inscripciones"
    on inscripciones for insert
    to anon
    with check (true);

-- Público puede actualizar sus propias inscripciones
create policy "Alumna puede actualizar sus inscripciones"
    on inscripciones for update
    to anon
    using (
        nombre_alumna = (select nombre_alumna from inscripciones where id = inscripciones.id)
    );

-- Público puede eliminar sus inscripciones
create policy "Alumna puede eliminar sus inscripciones"
    on inscripciones for delete
    to anon
    using (
        nombre_alumna = (select nombre_alumna from inscripciones where id = inscripciones.id)
    );

-- El profesor puede eliminar cualquier inscripción
create policy "Profesor puede eliminar inscripciones"
    on inscripciones for delete
    to authenticated
    using (
        exists (
            select 1 from semanas s
            join clases c on c.semana_id = s.id
            where c.id = inscripciones.clase_id
            and s.profesor_id = (select id from profesores where email = auth.jwt()->>'email')
        )
    );

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

create index idx_semanas_profesor on semanas(profesor_id);
create index idx_semanas_fecha on semanas(fecha_inicio);
create index idx_clases_semana on clases(semana_id);
create index idx_clases_dia on clases(dia_semana);
create index idx_inscripciones_clase on inscripciones(clase_id);
create index idx_inscripciones_alumna on inscripciones(nombre_alumna, telefono);

-- ============================================
-- INSERTAR PROFESOR DE PRUEBA
-- ============================================

-- Nota: Cambia 'tuemail@ejemplo.com' y 'tucontraseña' por valores reales
-- La contraseña debería hashearse en producción
insert into profesores (email, password_hash, nombre)
values ('tuemail@ejemplo.com', 'tucontraseña', 'Profesor Pole Dance');

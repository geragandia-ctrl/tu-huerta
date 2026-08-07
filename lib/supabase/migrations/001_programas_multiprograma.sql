-- =====================================================================
-- Migración 001 — Sistema multi-programa
-- Fecha: 2026
-- Autor: GG Desarrollos
--
-- CONTEXTO:
-- El sistema arrancó con un solo programa ("Tu Huerta") y las etapas
-- estaban como columnas fijas en la tabla `materiales`
-- (taller_capacitacion, semillas, herramientas, certificacion).
--
-- El ministerio sumó 3 programas más (Jardines Biodiversos, Bosque
-- Educativo, EcoFov), cada uno con etapas distintas. Una institución
-- puede estar inscripta en uno, varios o todos los programas.
--
-- SOLUCIÓN:
-- Modelo relacional flexible. Las etapas dejan de ser columnas y pasan
-- a ser datos. Agregar un programa futuro = insertar filas, no tocar
-- el esquema ni el código.
--
-- La tabla `materiales` NO se toca en esta migración: queda como backup
-- hasta confirmar que la migración de datos fue correcta. Se elimina en
-- la migración 002.
-- =====================================================================


-- ---------------------------------------------------------------------
-- TABLA: programas
-- Los programas del ministerio. Datos semi-fijos (rara vez cambian).
-- ---------------------------------------------------------------------
create table programas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  slug text not null unique,          -- identificador corto: 'tu-huerta'
  icono text,                          -- emoji para la UI
  orden int default 0,                 -- orden de visualización
  created_at timestamp with time zone default now()
);


-- ---------------------------------------------------------------------
-- TABLA: programa_etapas
-- Las etapas de cada programa. Cada programa tiene sus propias etapas.
-- ---------------------------------------------------------------------
create table programa_etapas (
  id uuid default gen_random_uuid() primary key,
  programa_id uuid references programas(id) on delete cascade,
  nombre text not null,                -- 'Diagnóstico', 'Planificación', etc.
  orden int default 0,                 -- orden dentro del programa
  created_at timestamp with time zone default now()
);


-- ---------------------------------------------------------------------
-- TABLA: inscripciones
-- Relación institución <-> programa. Una fila por cada programa en el
-- que una institución está inscripta.
-- ---------------------------------------------------------------------
create table inscripciones (
  id uuid default gen_random_uuid() primary key,
  escuela_id uuid references escuelas(id) on delete cascade,
  programa_id uuid references programas(id) on delete cascade,
  activa boolean default true,
  created_at timestamp with time zone default now(),
  unique (escuela_id, programa_id)     -- no duplicar inscripción al mismo programa
);


-- ---------------------------------------------------------------------
-- TABLA: etapas_completadas
-- El "tilde" de cada etapa, por inscripción. Si no existe la fila,
-- la etapa se considera pendiente.
-- ---------------------------------------------------------------------
create table etapas_completadas (
  id uuid default gen_random_uuid() primary key,
  inscripcion_id uuid references inscripciones(id) on delete cascade,
  etapa_id uuid references programa_etapas(id) on delete cascade,
  completada boolean default false,
  fecha date,                          -- cuándo se completó
  created_at timestamp with time zone default now(),
  unique (inscripcion_id, etapa_id)    -- una fila por etapa por inscripción
);


-- ---------------------------------------------------------------------
-- SEED: Carga inicial de los 4 programas y sus etapas
-- ---------------------------------------------------------------------

-- Programa 1: Tu Huerta
with p as (
  insert into programas (nombre, slug, icono, orden)
  values ('Tu Huerta', 'tu-huerta', '🌱', 1)
  returning id
)
insert into programa_etapas (programa_id, nombre, orden)
select p.id, etapa.nombre, etapa.orden
from p, (values
  ('Taller de capacitación', 1),
  ('Entrega de semillas', 2),
  ('Kit de herramientas', 3),
  ('Certificación', 4)
) as etapa(nombre, orden);


-- Programa 2: Jardines Biodiversos
with p as (
  insert into programas (nombre, slug, icono, orden)
  values ('Jardines Biodiversos', 'jardines-biodiversos', '🌼', 2)
  returning id
)
insert into programa_etapas (programa_id, nombre, orden)
select p.id, etapa.nombre, etapa.orden
from p, (values
  ('Diagnóstico', 1),
  ('Planificación', 2),
  ('Armado de jardín (plantas, corteza y cartel)', 3),
  ('Taller de especies nativas (arbustivo, herbáceo, rastrero, floral)', 4)
) as etapa(nombre, orden);


-- Programa 3: Bosque Educativo
with p as (
  insert into programas (nombre, slug, icono, orden)
  values ('Bosque Educativo', 'bosque-educativo', '🌳', 3)
  returning id
)
insert into programa_etapas (programa_id, nombre, orden)
select p.id, etapa.nombre, etapa.orden
from p, (values
  ('Diagnóstico', 1),
  ('Planificación', 2),
  ('Armado de bosque (plantas, corteza y cartel)', 3),
  ('Taller de especies nativas (arbóreo y arbustivo)', 4)
) as etapa(nombre, orden);


-- Programa 4: EcoFov
with p as (
  insert into programas (nombre, slug, icono, orden)
  values ('EcoFov', 'ecofov', '🌿', 4)
  returning id
)
insert into programa_etapas (programa_id, nombre, orden)
select p.id, etapa.nombre, etapa.orden
from p, (values
  ('Diagnóstico', 1),
  ('Planificación', 2),
  ('Ejecución (invernadero, intervención forestal, cartelería)', 3),
  ('Taller (huerta y/o producción forestal)', 4)
) as etapa(nombre, orden);
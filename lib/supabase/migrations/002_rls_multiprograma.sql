-- =====================================================================
-- Migración 002 — Políticas RLS para el sistema multi-programa
-- Fecha: 2026
-- Autor: GG Desarrollos
--
-- CONTEXTO:
-- Las tablas creadas en la migración 001 tienen RLS activado pero sin
-- políticas, por lo que están bloqueadas. Acá definimos quién puede
-- leer y escribir cada una.
--
-- CRITERIO:
-- - programas / programa_etapas: catálogo. Lectura para todos los
--   usuarios logueados; escritura solo admin.
-- - inscripciones: admin gestiona todo; escuela ve solo las suyas.
-- - etapas_completadas: admin gestiona todo (es quien tilda);
--   escuela ve solo las de sus inscripciones.
-- =====================================================================


-- ---------------------------------------------------------------------
-- programas — catálogo de programas
-- ---------------------------------------------------------------------
create policy "Todos los logueados leen programas" on programas
  for select using (auth.uid() is not null);

create policy "Admin gestiona programas" on programas
  for all using (
    exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );


-- ---------------------------------------------------------------------
-- programa_etapas — etapas de cada programa
-- ---------------------------------------------------------------------
create policy "Todos los logueados leen etapas" on programa_etapas
  for select using (auth.uid() is not null);

create policy "Admin gestiona etapas" on programa_etapas
  for all using (
    exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );


-- ---------------------------------------------------------------------
-- inscripciones — qué institución está en qué programa
-- ---------------------------------------------------------------------
create policy "Admin gestiona inscripciones" on inscripciones
  for all using (
    exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

create policy "Escuela ve sus inscripciones" on inscripciones
  for select using (
    escuela_id in (
      select escuela_id from perfiles where id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- etapas_completadas — el tilde de cada etapa por inscripción
-- ---------------------------------------------------------------------
create policy "Admin gestiona etapas completadas" on etapas_completadas
  for all using (
    exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

create policy "Escuela ve sus etapas completadas" on etapas_completadas
  for select using (
    inscripcion_id in (
      select i.id from inscripciones i
      join perfiles p on p.escuela_id = i.escuela_id
      where p.id = auth.uid()
    )
  );
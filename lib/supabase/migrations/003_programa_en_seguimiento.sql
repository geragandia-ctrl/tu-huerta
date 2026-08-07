-- =====================================================================
-- Migración 003 — Etiqueta de programa en actualizaciones y problemas
-- Fecha: 2026
-- Autor: GG Desarrollos
--
-- CONTEXTO:
-- Las actualizaciones y problemas son una sola lista por institución
-- (no se separan por programa). Pero como una institución puede tener
-- varios programas, cada actualización/problema lleva una etiqueta que
-- indica a qué programa corresponde.
--
-- DISEÑO:
-- programa_id es NULLABLE a propósito:
--   - Los registros históricos no tienen programa asignado.
--   - Si la institución tiene un solo programa, el frontend lo asigna
--     automáticamente sin pedírselo al usuario.
-- on delete set null: si se borrara un programa, la actualización no se
-- pierde, solo queda sin etiqueta.
-- =====================================================================

alter table actualizaciones
  add column programa_id uuid references programas(id) on delete set null;

alter table problemas
  add column programa_id uuid references programas(id) on delete set null;
  
# EspaciosVerdes — Estado del Proyecto

## ¿Qué es?
SaaS de seguimiento de huertas agroecológicas escolares para el **Ministerio de Ambiente y Economía Circular de Córdoba, Argentina**. El programa se llama "Tu Huerta" y es gestionado por la Dirección General de Viveros y Espacios Verdes.

El sistema tiene dos tipos de usuarios:
- **Admin (ministerio):** ve todas las escuelas, gestiona materiales entregados, responde problemas, genera informes
- **Escuela:** carga actualizaciones semanales con fotos, reporta problemas, ve el estado de sus materiales

---

## Stack
- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS v3
- **Backend/DB:** Supabase (auth + base de datos + storage)
- **Deploy:** Vercel
- **Repo:** https://github.com/geragandia-ctrl/tu-huerta

---

## Estructura de carpetas

```
app/
  page.tsx                          → Landing pública
  login/
    escuela/page.tsx                → Login escuela
    admin/page.tsx                  → Login admin
  dashboard/
    escuela/
      page.tsx                      → Dashboard escuela
      nueva-actualizacion/page.tsx  → Cargar actualización semanal
      reportar-problema/page.tsx    → Reportar problema con fotos
    admin/
      page.tsx                      → Dashboard admin (lista escuelas)
      resumen/page.tsx              → Tabla resumen materiales + estado
      gestion/page.tsx              → Activar/desactivar + reenviar invitación
      escuelas/
        nueva/page.tsx              → Crear escuela + enviar invitación
        [id]/page.tsx               → Detalle escuela (materiales, casos, historial)
lib/
  supabase.js                       → Cliente Supabase
middleware.ts                       → Gestión de sesión
```

---

## Base de datos (Supabase)

### Tablas
- **escuelas** — nombre, direccion, localidad, telefono, email_contacto, activa
- **perfiles** — id (ref auth.users), rol (admin|escuela), escuela_id, nombre_completo
- **materiales** — escuela_id, taller_capacitacion, taller_fecha, semillas, semillas_fecha, herramientas, herramientas_fecha, certificacion, certificacion_fecha
- **actualizaciones** — escuela_id, descripcion, estado (bien|regular|mal)
- **fotos** — actualizacion_id, url
- **problemas** — escuela_id, tipo, descripcion, resuelto, respuesta_admin
- **fotos_problemas** — problema_id, url
- **blog** — titulo, contenido, categoria, publicado

### Storage
- Bucket: `fotos-huertas` (público)
- Fotos de actualizaciones: `{escuela_id}/{actualizacion_id}/{timestamp}-{nombre}`
- Fotos de problemas: `problemas/{problema_id}/{timestamp}-{nombre}`

### RLS
Todas las tablas tienen RLS activado. Políticas principales:
- Admin tiene ALL en todas las tablas
- Escuela tiene SELECT de sus propios datos y INSERT en actualizaciones, problemas y fotos

---

## Design System (Tailwind)

Paleta definida en `tailwind.config.js`:
- `primary-600` → #1a5c2e (verde ministerio principal)
- `primary-500` → #2e8f53
- `tierra-500` → #8b6914
- `neutral-900` → #1a241a

Clases globales en `globals.css`:
- `.btn-primary` — botón verde principal
- `.btn-secondary` — botón outline verde
- `.card` — tarjeta blanca con border-radius
- `.badge-bien` — verde
- `.badge-regular` — amarillo
- `.badge-mal` — rojo
- `.badge-problema` — naranja

---

## Estado actual

### ✅ Completado
- Landing pública responsive con preview del sistema
- Login separado para escuela y admin
- Dashboard escuela: materiales, actualizaciones con modal+fotos, casos abiertos
- Dashboard admin: lista escuelas con filtros, estadísticas, semáforo de estado
- Detalle escuela admin: materiales (con toggle entregado), casos con respuesta, historial actualizaciones con modal
- Vista resumen general: tabla imprimible con materiales y estado de todas las escuelas
- Panel gestión: activar/desactivar escuelas, reenviar invitación
- Crear nueva escuela con invitación por email
- Upload de fotos en actualizaciones (hasta 5) y problemas (hasta 2)
- RLS configurado en todas las tablas
- Deploy en Vercel funcionando

### 🔴 Pendiente (antes de entregar)
1. **Escuela inactiva no puede ingresar** — falta bloqueo en login
2. **Políticas INSERT sin `with check`** — actualizaciones, fotos, problemas, fotos_problemas tienen `qual: null`
3. **Crear usuario Susana** (admin real del ministerio)
4. **Configurar email con dominio propio** — hoy usa Supabase default, hay que configurar Resend
5. **Dar de alta segunda escuela de prueba** y probar flujo completo
6. **Probar invitaciones por email** — verificar que llegan y que el link funciona
7. **Probar en celular** — el sistema está diseñado mobile-first pero no se probó en dispositivo real
8. **Revisión final de seguridad** completa

### 🟡 Segunda etapa (no urgente)
- Blog/Recursos técnicos para escuelas
- Chat con IA para consultas sobre plagas y problemas
- Informe PDF general de todas las escuelas

---

## Usuarios de prueba actuales
- **Admin:** el email que configuraste en Supabase + contraseña que elegiste
- **Escuela prueba:** escuela.prueba@test.com / prueba1234 → Escuela Primaria Nº 1

---

## Notas importantes
- El dueño del proyecto es **GG Desarrollos** (Gera) — footer con link a ggdesarrollos.com
- El programa puede escalar a otros módulos: invernaderos, bosques — el nombre "EspaciosVerdes" fue elegido para ser genérico
- La escuela carga datos principalmente desde celular
- El ministerio (Susana) es la usuaria admin principal — 2 o 3 admins máximo
- Las escuelas NO se registran solas — el admin las crea y les manda invitación
- Supabase proyecto: `oqwjehcmqutobkuuuapa`
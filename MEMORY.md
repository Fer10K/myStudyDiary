# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1.3: registrar sesiones (fecha, tema, minutos), racha actual 🔥, bloque variable con menú ☰ (mejor racha / tiempo estudiado / días del mes) y lista de sesiones.
- Rediseño visual con enfoque "cuaderno cuadriculado": papel con rejilla, tinta azul, subrayador amarillo en la racha, margen rojo, números en serif, campos como renglones.
- localStorage: `diario-estudio-sesiones` (sesiones) y `diario-estudio-dato` (elección del bloque variable). Sin backend ni dependencias.
- `specs/001-heat-map/spec.md`: spec **cerrada** del mapa de calor (8 semanas estilo GitHub, 4 niveles de tinta azul #C7D2F7→#1B2A9E, navegación por periodos, aviso de día nuevo). 15 RF con CA en EARS, sin dudas abiertas. Revisión QA del 4 oct: 21 decisiones con preguntas individuales (registro en la sección 9).

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Todo lo que se muestra se recalcula en cada pintado (sin claves aparte): mejor racha, total y días del mes derivan de las sesiones → sin migraciones ni desincronización.
- La tarjeta tiene solo 2 bloques: racha actual (fijo) + dato variable elegible con ☰. El bloque variable **nunca se oculta aunque valga 0**: si se ocultara, desaparecería el menú y no se podría cambiar de dato (rompe el bucle).
- La elección se guarda en `diario-estudio-dato` (`mejor|total|mes`), por defecto `mes`; valor ausente o corrupto → vuelve al por defecto. Menú con botón + JS, cierra con clic fuera o Esc, marca con ✓ la opción activa.
- Fechas corruptas descartadas al leer (pérdida irreversible al volver a guardar): solo afecta a registros que ya eran inválidos.
- Unidad única con decimales y coma española: 60 exacto se queda en min, 1440 exacto en h y a partir de 24 h en días. Las fechas futuras no suman en ningún dato.
- Rediseño: una sola animación (el subrayador al cargar) con `prefers-reduced-motion`, foco de teclado visible con `:focus-visible` y sin fuentes externas (todo offline).

## Aprendizajes y errores a evitar
- `AGENTS.md` describía los datos en inglés y el código usa `{ fecha, tema, minutos }`: el formato real siempre se verifica en `app.js`.
- Para fechas usar solo `hoyISO()/aISO()/desdeISO()/menosUnDia()`; nada de `toISOString()`.
- "Días del mes" se resuelve comparando el prefijo `AAAA-MM`: sin aritmética, sin milisegundos y a prueba de cambios de hora.
- El singular "1 día" se comprueba sobre el valor ya formateado (puede salir "1").
- Antes de sumar `minutos` guardados: `Number()` + `isFinite(m) && m > 0`.
- Para revisar el diseño sin navegador conectado: copiar los 3 archivos a /tmp, sembrar `localStorage` ahí y capturar con `firefox-esr -headless -new-instance -profile DIR -window-size 760,1000 -screenshot salida.png file://...`

## Próximos pasos
- **Plan redactado en `specs/001-heat-map/plan.md` (pendiente de aprobación)**: nada de código hasta que se apruebe.
- Decisiones del plan: todo el mapa en `app.js` (sin archivos nuevos); tests en `/tmp/opencode` cargando `app.js` en un contexto aislado con `document`/`localStorage` falsos; cuadrícula `grid-auto-flow: column` con 7 filas (DOM cronológico); array fijo de meses (`toLocaleDateString` da `sept`); id del aviso nuevo = `avisoDia` (el `aviso` ya lo usa el formulario); estado en 3 variables en memoria; código nuevo en español.
- Constitución: el principio 6 ya dice "código, interfaz y documentación en español" (4 oct) → D-15 del plan cumple, sin pendientes.
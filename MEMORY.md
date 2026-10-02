# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1.3: registrar sesiones (fecha, tema, minutos), racha actual 🔥, bloque variable con
  menú ☰ (mejor racha / tiempo estudiado / días del mes) y lista de sesiones.
- localStorage: `diario-estudio-sesiones` (sesiones) y `diario-estudio-dato` (elección del
  bloque variable). Sin backend ni dependencias.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Todo lo que se muestra se recalcula en cada pintado (sin claves aparte): mejor racha,
  total y días del mes derivan de las sesiones → sin migraciones ni desincronización.
- La tarjeta tiene solo 2 bloques: racha actual (fijo) + dato variable elegible con ☰.
  El bloque variable **nunca se oculta aunque valga 0**: si se ocultara, desaparecería el
  menú y no se podría cambiar de dato (rompe el bucle).
- La elección se guarda en `diario-estudio-dato` (`mejor|total|mes`), por defecto `mes`;
  valor ausente o corrupto → vuelve al por defecto. Menú con botón + JS, cierra con clic
  fuera o Esc, marca con ✓ la opción activa.
- Fechas corruptas descartadas al leer (pérdida irreversible al volver a guardar): solo
  afecta a registros que ya eran inválidos.
- Unidad única con decimales y coma española: 60 exacto se queda en min, 1440 exacto en
  h y a partir de 24 h en días. Las fechas futuras no suman en ningún dato.

## Aprendizajes y errores a evitar
- `AGENTS.md` describía los datos en inglés y el código usa `{ fecha, tema, minutos }`:
  el formato real siempre se verifica en `app.js`.
- Para fechas usar solo `hoyISO()/aISO()/desdeISO()/menosUnDia()`; nada de `toISOString()`.
- "Días del mes" se resuelve comparando el prefijo `AAAA-MM`: sin aritmética, sin
  milisegundos y a prueba de cambios de hora.
- El singular "1 día" se comprueba sobre el valor ya formateado (puede salir "1").
- Antes de sumar `minutos` guardados: `Number()` + `isFinite(m) && m > 0`.

## Próximos pasos
- (vacío por ahora)

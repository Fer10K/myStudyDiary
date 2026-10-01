# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- v1.2: registrar sesiones (fecha, tema, minutos), racha actual 🔥, mejor racha, total
  estudiado y lista de sesiones.
- Datos en localStorage (`diario-estudio-sesiones`); sin backend ni dependencias.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha calculada en cada pintado, no guardada: deriva de las sesiones, así que no
  hay migración ni riesgo de desincronización. Bloque oculto si no hay días con sesión.
- Fechas corruptas descartadas al leer (decidido, con pérdida irreversible al volver a
  guardar): solo afecta a registros que ya eran inválidos.
- Mejor racha en la misma tarjeta que la actual (debajo en móvil, al lado desde 520px),
  sin icono y con la etiqueta fija "mejor racha" (evita el singular/plural).
- Total estudiado en esa misma tarjeta, como tercer bloque (3 columnas desde 520px);
  etiqueta fija "total estudiado" y bloque oculto si el total es 0.
- Unidad única con decimales y coma española: 60 exacto se queda en minutos, 1440 exacto
  en horas y a partir de 24 h en días. Fechas futuras no suman ni en rachas ni en el
  total, así que el total siempre cuadra con lo realmente estudiado.

## Aprendizajes y errores a evitar
- `AGENTS.md` describía los datos en inglés (`{ date, topic, minutes }`) y el código usa
  `{ fecha, tema, minutos }`: el formato real siempre se verifica en `app.js`.
- Para fechas usar solo `hoyISO()/aISO()/desdeISO()/menosUnDia()`; nada de `toISOString()`.
- El singular "1 día" se comprueba sobre el valor ya formateado: con 1 decimal puede
  salir "1" y quedaría "1 días".
- Antes de sumar `minutos` guardados: `Number()` + `Number.isFinite(m) && m > 0`
  (acepta "45" escrito a mano e ignora `null`, `"abc"`, 0 o negativos).

## Próximos pasos
- (vacío por ahora)

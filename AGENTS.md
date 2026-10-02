# AGENTS.md — Diario de Estudio

Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.
## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
(`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.
- La tarjeta de rachas tiene **2 bloques**: la racha actual (fijo, siempre visible) y un
bloque variable con un menú ☰ para elegir entre mejor racha, tiempo estudiado y días del
mes. Las tres estadísticas están en el código; solo se pinta la elegida.
## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
- Aspecto de cuaderno cuadriculado: papel con rejilla, tinta azul, subrayador amarillo y
  margen rojo. Sin fuentes externas (solo `--serif` y `--sans` del `:root`), sin sombras
  suaves en tarjetas, todo alineado a la izquierda. Mantén esos tokens al retocar el CSS.
## Datos
- localStorage, clave `diario-estudio-sesiones`: array de `{ fecha: "AAAA-MM-DD", tema,
minutos }`.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario
perderá sus sesiones.
- Las sesiones con fecha mal formada se descartan al leer (`esFechaValida`): no se pintan
ni cuentan para las rachas, y desaparecen del almacenamiento al volver a guardar.
- localStorage, clave `diario-estudio-dato`: dato del bloque variable, con valor `mejor`,
`total` o `mes`. Si no existe o no es válido se usa `mes` (el por defecto).
## Fechas y racha (fácil equivocarse)
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new
Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión
pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
- Mejor racha = el tramo más largo de días consecutivos con sesión (`calcularMejorRacha`).
  Se recalcula a partir de las sesiones en cada pintado (no hay una clave aparte en
  localStorage) y se muestra aunque sea 0.
- Los cortes entre tramos se comprueban con `menosUnDia()`, nunca incrementando fechas
  a mano ni comparando con `Date`.
- El total estudiado también se recalcula en cada pintado (sin clave aparte): suma los
  `minutos` numéricos > 0 de las sesiones no futuras (`sumarMinutos`) y cambia de unidad
  a los 60 min y a las 24 h, con coma decimal (`formatearTiempo`).
- Días del mes = fechas con el mismo prefijo `AAAA-MM` que `hoyISO()` (`calcularDiasEsteMes`),
  excluyendo las futuras: es solo comparación de texto local, sin aritmética.
- El bloque variable **nunca se oculta**, ni siquiera con valor 0: si se ocultara, el menú
  ☰ desaparecería y no se podría cambiar de dato.
## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.
## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).
## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
## Verificación
- No hay tests ni lint. Probar abriendo `index.html` en el navegador.
- Para empezar de cero: DevTools → Application → Local Storage → borrar las claves
`diario-estudio-sesiones` (sesiones) y `diario-estudio-dato` (dato elegido).
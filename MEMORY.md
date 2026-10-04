# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1.4: registrar sesiones, racha actual 🔥, bloque variable con menú ☰ (mejor racha / total / días del mes), lista de sesiones y **mapa de calor de 8 semanas** (56 celdas, 4 niveles de tinta azul, navegación por periodos, detalle al pasar/tocar, aviso de día nuevo).
- Rediseño "cuaderno cuadriculado": papel con rejilla, tinta azul, subrayador amarillo, margen rojo, serif en números, sin fuentes externas.
- localStorage sin cambios: `diario-estudio-sesiones` y `diario-estudio-dato`. **El mapa no añade claves.**
- **Spec 001 implementada al 100 %** (`specs/001-heat-map/`: spec, plan y 25 tareas marcadas). `node --test` en `/tmp/opencode`: **83 pruebas, 0 fallos**. Interfaz verificada en Firefox DevTools a 320 px y escritorio, sin errores de consola.

## Decisiones (y por qué)
- Todo lo que se muestra se recalcula en cada pintado (sin claves aparte): no hay migraciones ni desincronización.
- El bloque variable **nunca se oculta aunque valga 0**: si se ocultara, desaparecería el menú ☰.
- `diario-estudio-dato` con por defecto `mes`; valor ausente o corrupto → por defecto.
- Fechas corruptas descartadas al leer; las futuras no suman en ningún dato; unidad única con coma española.
- Mapa: todo en `app.js` (D-1); celdas en orden cronológico con `grid-auto-flow: column` + 8 columnas × 7 filas; meses con array fijo en español (`toLocaleDateString` da `sept`); **estado en 3 variables en memoria** (`periodoMostrado`, `fechaUltimoPintado`, `diaAvisoCerrado`) → recargar vuelve al periodo actual y solo la referencia del aviso cancela el aviso; id del aviso nuevo = `avisoDia` (el `aviso` es del formulario).
- Celdas son `<div>` (no `<button>`) y la cuadrícula es `role="img"`: **RNF-7 prohíbe foco en celdas** (decisión 25 / D-8). Texto alternativo: rango + leyenda + resumen.
- Marca de hoy con `outline` por fuera de la celda → se ve igual con color o sin él (RF-5).
- A 320 px, el relleno lateral de la tarjeta baja a 16 px (plan B del riesgo RNF-2): celda 29,5 px ≥ 28 px.
- Función extra `datosDelMapa(periodo, sesiones, hoy)` (pseudocódigo del plan, fuera de su tabla de funciones): deja RF-1/2/3/5 comprobables sin DOM.
- Código nuevo en español (principio 6 de la constitución, ya corregido).

## Aprendizajes y errores a evitar
- Fechas: solo `hoyISO()/aISO()/desdeISO()/sumarDias()` (usa `setDate`); nada de `toISOString()`, `new Date("AAAA-MM-DD")` ni 86400000. Comparar `AAAA-MM-DD` como texto.
- Arnés `/tmp/opencode`: `crearApp({ hoy })` ejecuta `app.js` en un contexto `vm`. El DOM falso necesita: `innerHTML = ""` vacía `hijos`, `tagName` en mayúsculas y `visibilityState` (los tests lo exigen).
- `assert.deepEqual` **falla** con objetos/arrays creados dentro del `vm` (prototipos de otro realm): comparar campo a campo.
- Para medir a 320 px sin poder reducir la ventana: `<iframe>` de 320 px dentro de la página y leer `contentDocument` (file:// con la misma ruta sí deja).
- El MCP de Firefox no expone la consola: capturar `window.addEventListener('error')` + `console.error` antes de una batería de interacciones.
- Sin `touch-action: manipulation` en los botones, el doble toque en `◀` dispara el zoom en móvil.
- Al ocultarse el botón `◀` (llegar al límite), el foco de teclado cae en `<body>`; no lo pide la spec, pero conviene revisarlo.

## Próximos pasos
- Pendiente del usuario: revisar el resultado, commit de `index.html`, `styles.css`, `app.js`, `MEMORY.md` y `specs/001-heat-map/tasks.md`.
- Sin responder de T1: (1) reloj fijo `hoy = "2026-10-03"` en los tests, (2) helper `disparar()` dejado por adelantado para RF-11/RF-14.
- Si algo se vuelve regla permanente, proponer moverlo a `AGENTS.md` (p. ej. las 3 variables del mapa y `datosDelMapa`).

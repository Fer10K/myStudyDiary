# Tareas — Especificación 001 (mapa de calor)

**Spec:** `specs/001-heat-map/spec.md` (cerrada) · **Plan:** `specs/001-heat-map/plan.md`
**Orden:** de arriba abajo; una tarea cada vez y sin avanzar con `node --test` en rojo
(constitución 4). Cada tarea cabe en 20-30 minutos.

**Cómo se verifica:**
- Lógica → `node --test` ejecutado en `/tmp/opencode` (los tests viven ahí, fuera del repo).
- Interfaz → Firefox DevTools con `index.html` abierto (`file://`), consola limpia, móvil y escritorio.

---

## Fase 0 · Base y red de seguridad

- [x] **T1 · Arnés de pruebas en `/tmp/opencode`** — *Depende de: ninguna* ✅ (24 pruebas en verde)
  - **RF:** ninguno nuevo (base de verificación)
  - **Hecho cuando:** existe un cargador que lee `app.js` y lo ejecuta en un contexto
    aislado con `document` y `localStorage` falsos, y las pruebas recreadas de racha,
    total y bloque variable pasan con el `app.js` actual **sin modificar nada del repo**.

## Fase 1 · Estructura (HTML)

- [x] **T2 · Tarjeta del mapa con su orden interno y leyenda estática** — *Depende de: T1*
  - **RF:** RF-12, RF-9
  - **Hecho cuando:** entre la tarjeta del formulario y la de la lista hay una tarjeta
    que contiene, en este orden: rango + huecos de `◀` `▶` `Volver a hoy`, cuadrícula
    vacía, fila de 8 huecos de mes, línea de detalle, leyenda con `sin sesión`,
    `1-14`, `15-44`, `45-89`, `90+`, y un único `<p>` de resumen; y la tarjeta de
    rachas conserva sus 2 bloques y el menú ☰.
- [x] **T3 · Franja del aviso de día nuevo** — *Depende de: T2*
  - **RF:** RF-14 (estructura)
  - **Hecho cuando:** el primer hijo de `<main>` es una franja `hidden` con id
    **`avisoDia`** (nunca `aviso`, que ya lo usa el formulario), el texto exacto
    `Un nuevo día comienza: recarga la página para actualizar los datos` y un botón
    `Cerrar`.

## Fase 2 · Estilos (CSS)

- [x] **T4 · Cuadrícula de 8 columnas × 7 filas** — *Depende de: T2*
  - **RF:** RF-1, RNF-2
  - **Hecho cuando:** las celdas quedan en 8 columnas × 7 filas con flujo de columnas
    (DOM cronológico), y a **320 px** cada celda mide **≥ 28 px** con ≥ 2 px de hueco,
    sin scroll horizontal (medido con DevTools).
- [x] **T5 · Los 4 niveles y la marca de hoy** — *Depende de: T4*
  - **RF:** RF-3, RF-4, RF-5
  - **Hecho cuando:** existen las clases `nivel-1`…`nivel-4` con `#C7D2F7`, `#7E95EE`,
    `#3D5AE0`, `#1B2A9E`; una celda sin nivel queda a papel con borde fino; y la clase
    de hoy aplica su borde distintivo **con o sin color**.
- [x] **T6 · Estilos del resto de la tarjeta y de la franja** — *Depende de: T4*
  - **RF:** RF-6, RF-7, RF-8, RF-9, RF-11, RF-12, RF-14, RF-15 (capa visual), RNF-7,
    RNF-8
  - **Hecho cuando:** debajo de la cuadrícula se apilan **detalle → leyenda →
    resumen**, la fila de mes comparte las 8 columnas, los controles quedan arriba a la
    derecha, todo usa los tokens del cuaderno (sin sombras suaves, alineado a la
    izquierda) y el `:focus-visible` existente resalta también los botones nuevos.

## Fase 3 · Lógica pura (siempre con `hoy` como parámetro)

- [x] **T7 · Periodos y días** — *Depende de: T1*
  - **RF:** RF-1
  - **Hecho cuando:** con `hoy = 2026-10-03`, `periodoActual` da de `2026-08-09` a
    `2026-10-03`, `diasDelPeriodo` devuelve 56 fechas consecutivas ninguna de ellas
    posterior a `hoy`, y hay prueba verde de que el periodo anterior son 56 días que
    terminan el día anterior al inicio del siguiente.
- [x] **T8 · Minutos de cada día** — *Depende de: T7*
  - **RF:** RF-2
  - **Hecho cuando:** las pruebas demuestran que 30 + 45 del mismo día dan 75, que los
    minutos no numéricos o ≤ 0 no suman, que una fecha corrupta se ignora y que una
    fecha fuera del periodo no aparece en el mapa.
- [x] **T9 · Nivel de intensidad** — *Depende de: T8*
  - **RF:** RF-3
  - **Hecho cuando:** hay pruebas verdes de las fronteras (14→1, 15→2, 44→2, 45→3,
    89→3, 90→4, 400→4) y del redondeo previo (14,6→2, 0,4→1, vacío→0).
- [x] **T10 · Etiquetas de mes** — *Depende de: T7*
  - **RF:** RF-6
  - **Hecho cuando:** para `hoy = 2026-10-03`, `etiquetasDeMes` devuelve
    `["ago", "", "", "", "sep", "", "", ""]` y una prueba confirma que nunca hay una
    sola etiqueta para todo el periodo.
- [x] **T11 · Rango del periodo y fecha corta** — *Depende de: T7*
  - **RF:** RF-7 (y el helper de fecha de RF-8)
  - **Hecho cuando:** `rangoDelPeriodo` devuelve exactamente `9 ago 26 – 3 oct 26` para
    `hoy = 2026-10-03`, `fechaCorta("2026-09-29")` devuelve `29 sep`, y hay prueba de
    que un periodo anterior también sale con año.
- [x] **T12 · Resumen y textos de vacío** — *Depende de: T8*
  - **RF:** RF-10, RF-15
  - **Hecho cuando:** las pruebas dan `5 días estudiados · 7,8 h en este periodo`
    (5 días y 465 min), `1 día estudiado · 45 min en este periodo` con un solo día, y
    el texto de vacío correcto según el periodo (invitación si es el actual,
    `No hay sesiones en este periodo` si es anterior).

## Fase 4 · Pintado en pantalla

- [x] **T13 · Pintar mapa, meses y rango** — *Depende de: T6, T7, T9, T10, T11*
  - **RF:** RF-1, RF-4, RF-5, RF-6, RF-7, RF-13 (casos 1-3)
  - **Hecho cuando:** al abrir la página, la cuadrícula tiene 56 celdas cuyo
    `data-fecha` va de (hoy − 55) a hoy, la de hoy está en la esquina inferior derecha
    con su marca, cada celda lleva su clase `nivel-N`, la fila de mes muestra los
    cambios y la cabecera pone el rango con formato `9 ago 26 – 3 oct 26`.
- [x] **T14 · Pintar el resumen en su único hueco** — *Depende de: T12, T13*
  - **RF:** RF-10, RF-15, RF-12
  - **Hecho cuando:** con datos, el resumen pone días y tiempo; con el periodo vacío,
    ese mismo hueco muestra el texto de RF-10 **y no aparece en ningún otro sitio** de
    la tarjeta.
- [x] **T15 · Los 5 casos de actualización repintan** — *Depende de: T13*
  - **RF:** RF-13, RNF-6
  - **Hecho cuando:** guardar una sesión colorea su celda en la misma actualización en
    que se actualizan racha y lista; el menú ☰ y cambiar de periodo también repintan el
    mapa; y estando en un periodo anterior, **guardar devuelve el mapa al periodo
    actual** (sin añadir ninguna clave nueva a `localStorage`).

## Fase 5 · Navegación

- [x] **T16 · Lógica de navegación** — *Depende de: T7*
  - **RF:** RF-11
  - **Hecho cuando:** hay pruebas verdes de `periodoAnterior` (56 días), de
    `puedeRetroceder` falso **en el periodo que contiene la primera sesión válida** y
    también sin ninguna sesión, y verdadero en los periodos posteriores.
- [x] **T17 · Controles `◀` `▶` y `Volver a hoy`** — *Depende de: T14, T16*
  - **RF:** RF-11, RF-13 (caso 4), RNF-7
  - **Hecho cuando:** `◀` retrocede y desaparece en el límite; `▶` y `Volver a hoy`
    solo se ven en periodos antiguos; al recargar se vuelve al periodo actual; cambiar
    de pestaña no lo cambia; y los tres se operan con teclado viendo el foco.

## Fase 6 · Línea de detalle

- [x] **T18 · Texto de la línea de detalle** — *Depende de: T11*
  - **RF:** RF-8
  - **Hecho cuando:** las pruebas dan `29 sep · 1,3 h` para 75 minutos y
    `1 oct · sin sesión` para un día sin sesiones.
- [x] **T19 · Eventos de la línea (ratón y tacto)** — *Depende de: T13, T18*
  - **RF:** RF-8
  - **Hecho cuando:** al pasar por una celda se muestra su fecha y tiempo; al salir de
    la cuadrícula, tocar la leyenda o pulsar `◀` se vacía; al pasar de una celda a otra
    muestra la última; y tocar dos veces la misma celda **no** la alterna.

## Fase 7 · Aviso de día nuevo

- [x] **T20 · Referencia y condición del aviso** — *Depende de: T15*
  - **RF:** RF-14 (lógica), RF-13 (referencia)
  - **Hecho cuando:** hay pruebas verdes de `debeMostrarAvisoDia` en los cuatro casos
    (mismo día → no; día distinto → sí; cerrado hoy → no; cerrado ayer y hoy distinto
    → sí) y `pintarTodo()` actualiza `fechaUltimoPintado` y oculta el aviso.
- [x] **T21 · La franja del aviso, viva** — *Depende de: T3, T20*
  - **RF:** RF-14
  - **Hecho cuando:** cambiando `fechaUltimoPintado` a un día anterior desde DevTools,
    el aviso aparece **arriba de todo** sin desplazar la página; aparece al volver la
    pestaña o al interactuar (clic, toque o tecla) y nunca por un temporizador;
    `Cerrar` lo oculta y ningún clic posterior lo rehace ese día.

## Fase 8 · Verificación

- [x] **T22 · Todas las pruebas en verde** — *Depende de: T7 a T21*
  - **RF:** CA de lógica de RF-1, RF-2, RF-3, RF-5, RF-6, RF-7, RF-8, RF-10, RF-11,
    RF-14 y RF-15
  - **Hecho cuando:** `node --test` en `/tmp/opencode` termina sin un solo fallo y el
    repo solo tiene modificados `index.html`, `styles.css` y `app.js`.
- [x] **T23 · Lista manual de CA de interfaz (plan §6.3)** — *Depende de: T22*
  - **RF:** CA de UI de RF-1, RF-4, RF-8, RF-9, RF-11, RF-12, RF-13, RF-14, RF-15 y
    RNF-2, RNF-5, RNF-6
  - **Hecho cuando:** los 12 puntos del plan §6.3 están comprobados en Firefox
    DevTools a **320 px** y en escritorio, sin errores en consola y con doble clic
    funcionando sin conexión.
- [x] **T24 · Revisión con las skills** — *Depende de: T23*
  - **RF:** RNF-1, RNF-3, RNF-4, RNF-8
  - **Hecho cuando:** se ha pasado `web-design-guidelines` por la interfaz y el
    checklist de `local-dates` confirma que el código nuevo no usa `toISOString()`,
    ni `new Date("AAAA-MM-DD")`, ni cálculos con 86400000 milisegundos, y que las
    fechas futuras no pintan.
- [x] **T25 · Cierre de la tarea** — *Depende de: T24*
  - **RF:** ninguno (proceso)
  - **Hecho cuando:** `MEMORY.md` refleja el estado final sin pasar de ~50 líneas, y el
    resumen indica qué se ha cambiado y qué decisiones deben revisarse (AGENTS.md,
    "Forma de trabajar").

---

## Cobertura: cada RF aparece en

| RF | Tareas |
| --- | --- |
| RF-1 | T4, T7, T13 |
| RF-2 | T8 |
| RF-3 | T5, T9 |
| RF-4 | T5, T13, T23 |
| RF-5 | T5, T13, T22 |
| RF-6 | T6, T10, T13 |
| RF-7 | T6, T11, T13 |
| RF-8 | T6, T11, T18, T19, T23 |
| RF-9 | T2, T6, T23 |
| RF-10 | T12, T14, T22 |
| RF-11 | T6, T16, T17, T23 |
| RF-12 | T2, T6, T14, T23 |
| RF-13 | T13, T15, T17, T20, T23 |
| RF-14 | T3, T6, T20, T21, T23 |
| RF-15 | T6, T12, T14, T22, T23 |
| RNF-1 | T24 |
| RNF-2 | T4, T23 |
| RNF-3 | T24 |
| RNF-4 | T24 |
| RNF-5 | T23 |
| RNF-6 | T15, T23 |
| RNF-7 | T6, T17 |
| RNF-8 | T6, T24 |

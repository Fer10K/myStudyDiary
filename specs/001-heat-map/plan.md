# Plan de implementación — Especificación 001 (mapa de calor)

**Spec:** `specs/001-heat-map/spec.md` (cerrada, 4 de octubre de 2026)
**Estado:** borrador **pendiente de aprobación** — hasta que se apruebe, no se escribe
código (AGENTS.md y constitución, principio 2: "la spec manda").
**Prueba de vida de este documento:** toda decisión ambigua de la spec se resolvió antes
con 21 preguntas individuales (sección 9 de la spec). Aquí solo queda lo técnico.

---

## 1. Archivos: qué se crea y qué se modifica

| Archivo | Acción | Responsabilidad | RF |
| --- | --- | --- | --- |
| `index.html` | modificar | Estructura: franja del aviso (arriba de todo) y tarjeta del mapa con sus huecos (rango, controles, cuadrícula, meses, detalle, leyenda estática, resumen) | RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-14, RF-15 |
| `styles.css` | modificar | Rejilla de 8×7, los 4 tonos, marca de hoy, fila de meses, línea de detalle, leyenda, resumen, franja de aviso y ajuste a 320 px | RF-1, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-12, RF-14, RNF-2, RNF-7, RNF-8 |
| `app.js` | modificar | Toda la lógica nueva (funciones puras + pintado + eventos + estado en memoria). Los archivos existentes no se reescriben: se añaden secciones | RF-1, RF-2, RF-3, RF-5, RF-6, RF-7, RF-8, RF-10, RF-11, RF-13, RF-14, RF-15 |
| `specs/001-heat-map/plan.md` | **creado** (este) | Documento de plan aprobado antes de tocar código | — |
| `/tmp/opencode/test-*.js` | **creado** (fuera del repo) | Pruebas con `node --test`; no se versionan, como se acordó | ver §6 |
| `MEMORY.md` | modificar al terminar | Estado del proyecto y decisiones nuevas | — |
| `AGENTS.md`, `docs/constitution.md` | sin cambios | El principio 6 de la constitución ya dice "código, interfaz y documentación en español" (corregido el 4 de oct), así que no hay choque con la convención del proyecto | — |

**No se crea ningún archivo de código nuevo.** El mapa vive en `app.js`, junto al resto
del diario (AGENTS.md documenta 3 archivos: `index.html`, `styles.css`, `app.js`).

---

## 2. Lógica pura nueva (siempre con `hoy` como parámetro)

Constitución, principio 3: los cálculos no tocan DOM ni localStorage y **reciben `hoy`**.
Todo lo nuevo va en `app.js`, en una sección `// ---------- Mapa de calor ----------`
situada antes de `// ---------- Mostrar en pantalla ----------`.

### 2.1 Funciones existentes que se reutilizan tal cual (no se tocan)

`hoyISO`, `aISO`, `desdeISO`, `menosUnDia`, `esFechaValida`, `fechaLegible`,
`leerSesiones`, `formatearTiempo`, `formatearNumero`, `pintarTodo` (se amplía, ver §4.3).

### 2.2 Funciones nuevas

| Función | Entrada → salida | Qué resuelve | RF |
| --- | --- | --- | --- |
| `sumarDias` | `fecha, n` → fecha | Suma/resta días con `setDate` (nunca 24 h ni milisegundos) | RF-1, RF-11 |
| `periodoActual` | `hoy` → `{ inicio, fin }` | `fin = hoy`, `inicio = hoy − 55 días` | RF-1, RF-7, RF-11 |
| `periodoAnterior` | `periodo` → periodo | 56 días que terminan el día antes de `inicio` | RF-1, RF-11 |
| `periodoSiguiente` | `periodo, hoy` → periodo | Avanza 56 días sin pasar del periodo actual | RF-11 |
| `periodoQueContiene` | `fecha, hoy` → periodo | Periodo (de 56 en 56 hacia atrás) donde cae una fecha | RF-11 |
| `diasDelPeriodo` | `periodo` → lista de 56 fechas | Las 56 celdas en orden cronológico | RF-1, RF-5 |
| `minutosPorDia` | `sesiones, hoy` → `{fecha: suma}` | Minutos válidos por día (fecha válida, no futura, minutos > 0) | RF-2 |
| `nivelDeDia` | `minutosDelDia` → 0..4 | Redondea (`Math.round`, si da 0 → 1) y aplica los intervalos | RF-3, RF-4 |
| `etiquetasDeMes` | `periodo` → lista de 8 | Mes bajo cada columna: solo si cambia respecto a la anterior (la 1ª siempre) | RF-6 |
| `rangoDelPeriodo` | `periodo` → texto | `9 ago 26 – 3 oct 26` | RF-7 |
| `fechaCorta` | `fecha` → texto | `29 sep` (día y mes abreviado, sin año) | RF-8 |
| `textoDetalle` | `fecha, minutosDelDia` → texto | `29 sep · 1,3 h` o `1 oct · sin sesión` | RF-8 |
| `textoVacio` | `esPeriodoActual` → texto | Invitación o texto neutro, una sola vez en la tarjeta | RF-10, RF-15 |
| `puedeRetroceder` | `periodo, sesiones, hoy` → bool | `◀` disponible mientras no se llegue al periodo de la primera sesión válida; sin sesiones → falso | RF-11 |
| `resumenDelPeriodo` | `periodo, sesiones, hoy` → texto | `5 días estudiados · 7,8 h en este periodo` (singular si hay 1 día) o el texto de vacío | RF-10, RF-15 |
| `debeMostrarAvisoDia` | `fechaUltimoPintado, hoy, diaDeCierre` → bool | `hoy` ≠ último pintado **y** `hoy` ≠ día en que se cerró | RF-14 |
| `MESES_CORTOS` | constante | `ene feb mar abr may jun jul ago sep oct nov dic` | RF-6, RF-7, RF-8 |

Cobertura: ninguna función nueva toca `document` ni `localStorage` (RF-2 se limita a
leer el array que ya devuelve `leerSesiones`; el mapa no guarda nada → RNF-6).

### 2.3 Estado en memoria (tres variables globales, sin persistir)

- `periodoMostrado`: periodo visible. Nace como `periodoActual` (RF-11: al recargar vuelve al actual).
- `fechaUltimoPintado`: fecha del último `pintarTodo()` — es la referencia del RF-14.
- `diaAvisoCerrado`: día en que el usuario cerró el aviso (`null` si nunca).

Ninguna se guarda: RNF-6 prohíbe almacenamiento nuevo y RNF-6/RF-11 obligan a que la
posición de navegación solo viva mientras la pestaña está abierta.

---

## 3. Algoritmo del mapa (pseudocódigo)

### 3.1 Componer las 56 celdas — RF-1, RF-2, RF-3, RF-5

```
funcion pintarMapa(sesiones, hoy, periodo):
    dias      := diasDelPeriodo(periodo)          // 56 fechas, de la más antigua a hoy
    minutos   := minutosPorDia(sesiones, hoy)     // {fecha: suma}
    vaciar la cuadricula

    para cada i desde 0 hasta 55:
        fecha     := dias[i]
        sinDatos  := no minutos tiene clave "fecha"
        nivel     := nivelDeDia(minutos[fecha])   // 0 si sinDatos
        celda     := crear celda con: fecha, nivel (clase "nivel-N"), texto alternativo
        si fecha = hoy  entonces marcar celda como "hoy"      // RF-5
        añadir celda a la cuadricula                // en orden cronológico
```

La cuadrícula usa `grid-auto-flow: column` con 7 filas: el orden cronológico del DOM
produce solo, sin transponer nada:

- columna = `piso(i / 7)` → 7 días consecutivos por columna ✔ RF-1
- fila superior = índices 0, 7, 14 … → empieza por el primer día del periodo ✔ RF-1
- hoy = índice 55 → columna 8, fila 7 → esquina inferior derecha ✔ RF-1

### 3.2 Nivel de un día — RF-3, RF-4

```
funcion nivelDeDia(minutosDelDia):
    si minutosDelDia no existe  entonces devolver 0        // celda vacía (papel)
    m := redondear(minutosDelDia al entero mas cercano)    // Math.round
    si m = 0  entonces m := 1                              // 0,4 min → nivel 1
    si m >= 90  entonces devolver 4
    si m >= 45  entonces devolver 3
    si m >= 15  entonces devolver 2
    devolver 1
```

Los colores viven solo en CSS (clases `nivel-1`…`nivel-4`); la lógica no pinta.

### 3.3 Etiquetas de mes — RF-6

```
funcion etiquetasDeMes(periodo):
    dias := diasDelPeriodo(periodo)
    etiquetas := []
    mesAnterior := null
    para columna desde 0 hasta 7:
        primeraCelda := dias[columna * 7]
        mes := MESES_CORTOS[ mes de primeraCelda ]
        si columna = 0 o mes <> mesAnterior  entonces etiquetas += mes
        sino                       etiquetas += ""
        mesAnterior := mes
    devolver etiquetas
```

### 3.4 Rango del periodo — RF-7

```
funcion rangoDelPeriodo(periodo):
    devolver  dia(inicio) + " " + mes(inicio) + " " + dosDigitos(anio(inicio))
            + " – " +
              dia(fin)   + " " + mes(fin)   + " " + dosDigitos(anio(fin))
// "9 ago 26 – 3 oct 26": se lee directamente del texto "AAAA-MM-DD", sin Date
```

### 3.5 Resumen y periodo vacío — RF-10, RF-15

```
funcion resumenDelPeriodo(periodo, sesiones, hoy):
    dias := contar fechas distintas con sesiones validas dentro del periodo
    mins := sumar minutos validos dentro del periodo

    si dias = 0  entonces
        devolver textoVacio(el periodo mostrado es el actual)
                    // una sola vez en la tarjeta: RF-10 en el hueco de RF-15

    primerParte := dias = 1 ? "1 dia estudiado" : dias + " dias estudiados"
    devolver primerParte + " · " + formatearTiempo(mins) + " en este periodo"
```

### 3.6 Navegación — RF-11

```
al pulsar "◀":
    periodoMostrado := periodoAnterior(periodoMostrado)
    pintarTodo()

al pulsar "▶":
    periodoMostrado := periodoSiguiente(periodoMostrado, hoy)
    pintarTodo()

al pulsar "Volver a hoy":
    periodoMostrado := periodoActual(hoy)
    pintarTodo()

pintarControles():
    mostrar "▶"     solo si periodoMostrado <> periodoActual
    mostrar "Volver a hoy" si periodoMostrado <> periodoActual
    mostrar "◀"     solo si puedeRetroceder(periodoMostrado, sesiones, hoy)
```

`puedeRetroceder` es falso si no hay sesiones válidas o si el periodo mostrado ya es el
que contiene la primera sesión válida (RF-11 CA 2 y 3).

### 3.7 Línea de detalle — RF-8

```
al pasar el ratón por la cuadrícula (mouseover sobre cualquier celda):
    pintar textoDetalle(fechaDeLaCelda, minutosDeEsaFecha)

al hacer clic/tocar una celda:
    pintar textoDetalle(...)              // dos veces la misma celda: se queda (no alterna)

al salir de la cuadrícula con el ratón (mouseleave de la cuadrícula):
    vaciar la línea

al hacer clic/tocar FUERA de la cuadrícula (incluye leyenda, ◀, ▶, aviso, fondo):
    vaciar la línea                       // el manejador comprueba si el destino está dentro
```

### 3.8 Aviso de día nuevo — RF-13, RF-14

```
pintarTodo():                     // casos 1, 2, 3, 4 y 5 del RF-13
    fechaUltimoPintado := hoyISO()      // cancela el aviso: una sola moneda para los 5 casos
    ocultar el aviso
    pintar racha, dato, lista y mapa

comprobarDia():                   // (a) pestaña visible  ·  (b) clic, toque o tecla
    si debeMostrarAvisoDia(fechaUltimoPintado, hoyISO(), diaAvisoCerrado)
        entonces mostrar el aviso       // sin repintar nada

funcion debeMostrarAvisoDia(fechaUltimoPintado, hoy, diaAvisoCerrado):
    devolver  hoy <> fechaUltimoPintado  y  hoy <> diaAvisoCerrado

al pulsar "Cerrar":
    diaAvisoCerrado := hoyISO()
    ocultar el aviso                     // no vuelve a salir hasta el siguiente cambio de día

eventos que llaman a comprobarDia():
    "visibilitychange" cuando la pestaña queda visible
    "click" y "keydown" en el documento   // el toque móvil genera "click" (ver D-5)
```

Comprobación de coherencia (por qué funciona con una sola referencia): si el clic
dispara algo que repinta (guardar, `◀`, `▶`, ☰), ese repinta actualiza
`fechaUltimoPintado` a hoy y oculta el aviso; después llega el `click` global y
`comprobarDia` decide con la referencia ya nueva → no vuelve a aparecer. El orden de los
manejadores da igual: la condición es siempre la misma.

---

## 4. Cómo se pinta en la interfaz

### 4.1 `index.html`

Dentro de `<main class="contenedor">`, en este orden (RF-12):

1. **Franja de aviso** (RF-14), primer elemento de la página, "arriba de todo, sobre el
   formulario", `hidden` por defecto: párrafo con el texto exacto + botón `Cerrar`.
   *Colisión a evitar:* el id `aviso` ya existe (mensaje de validación del formulario) →
   este bloque usa `avisoDia`.
2. Tarjeta de rachas — **sin tocar** (2 bloques + menú ☰, RF-12 CA 3).
3. Tarjeta del formulario — **sin tocar**.
4. **Nueva tarjeta del mapa** (RF-12), entre formulario y lista:
   - fila superior: `<span>` con el rango (RF-7) + controles `◀`, `▶`, `Volver a hoy` (RF-11);
   - cuadrícula vacía (las 56 celdas las crea JS) con etiqueta accesible;
   - fila de 8 huecos para los meses (RF-6);
   - `<p>` línea de detalle (RF-8);
   - leyenda **estática**: `sin sesión`, `1-14`, `15-44`, `45-89`, `90+` (RF-9);
   - `<p>` resumen (RF-15 / RF-10), un único hueco para cifras o texto de vacío.
5. Tarjeta de la lista — **sin tocar**.

### 4.2 `styles.css`

- `.mapa__cuadricula`: `display: grid`, `grid-auto-flow: column`,
  `grid-template-rows: repeat(7, 1fr)`, `gap: 2px` (4 px desde 480 px).
- `.mapa__celda`: cuadrada (`aspect-ratio: 1`), borde fino; `.nivel-1`…`.nivel-4` con
  los 4 azules de la spec (RF-4); `.mapa__celda--hoy` con borde distintivo (RF-5);
  sin relleno = papel (RF-4 CA 2).
- `.mapa__meses`: misma plantilla de 8 columnas que la cuadrícula, para que cada mes
  quede bajo su columna (RF-6).
- `.mapa__cabecera`: fila con rango a la izquierda y controles a la derecha, encima de la
  cuadrícula (RF-7, RF-11, RF-12). Debajo, en orden: detalle → leyenda → resumen.
- `.avisoDia`: franja superior con los tokens del cuaderno (tinta azul, sin sombras
  suaves) y botón con foco visible (RNF-8, RNF-7).
- **Cálculo de 320 px (RNF-2):** 320 − 36 (padding del contenedor) − 2 (borde de la
  tarjeta) − 44 (padding de la tarjeta) = 238 px; con `gap: 2px` cada celda mide
  (238 − 14) / 8 = **28,0 px** y el hueco es de 2 px → cumple exactamente el mínimo.
  Si al medir sale por debajo, se baja el padding horizontal de la tarjeta a 16 px solo
  en pantallas de menos de 480 px (quedaría 28,5 px).
- Foco: se reutiliza el `:focus-visible` global que ya existe (RNF-7 gratis).

### 4.3 `app.js`

- `pintarTodo()` se amplía: tras pintar racha/dato/lista → `pintarMapa`,
  `pintarMeses`, `pintarRango`, `pintarControles`, `pintarResumen`; al final,
  `fechaUltimoPintado := hoyISO()` y se oculta el aviso (RF-13: los 5 casos repintan).
- **Guardar en un periodo antiguo** (RF-13 CA 3): en el `submit` del formulario, antes de
  repintar, `periodoMostrado := periodoActual(hoyISO())`.
- Escuchadores nuevos: los tres controles de periodo, la cuadrícula (`mouseover`,
  `click`), el documento (`click` → detalle fuera + `comprobarDia`), `keydown`
  (`comprobarDia`), `visibilitychange`, y el botón `Cerrar`.
- La tarjeta de rachas, el menú ☰ y el formulario **no cambian** (RF-12 CA 3).

---

## 5. Decisiones técnicas (y su alternativa descartada)

| # | Decisión | Por qué | Alternativa descartada |
| --- | --- | --- | --- |
| D-1 | Todo el mapa en `app.js`, sin archivo nuevo | Respeta AGENTS.md (3 archivos), no reescribe código que funciona y evita mover 200 líneas | Crear `logica.js` con la lógica pura: sería más limpio estructuralmente, pero exige mover código vivo, tocar `index.html` y AGENTS.md, y regenerar todas las pruebas por un alcance que la spec 001 no pide |
| D-2 | Cuadrícula con `grid-auto-flow: column` y 7 filas | El DOM queda en orden cronológico (fácil de leer y de probar) y las reglas de RF-1 (columna = 7 días, fila superior = primer día, hoy abajo a la derecha) se cumplen solas | Generar el DOM ya transpuesto (día 1, 8, 15…) con 8 columnas en flujo de fila: mismo resultado visual, pero el orden del DOM deja de ser cronológico y hay que calcular índices a mano |
| D-3 | Array fijo de meses `ene…dic` | RF-6 exige "tres primeras letras"; `toLocaleDateString("es-ES", {month:"short"})` devuelve **`sept`** para septiembre en algunos motores | Usar la API de fechas del navegador: incumpliría RF-6 sin querer y cambiaría según el equipo |
| D-4 | Estado en tres variables globales sin guardar | RF-11 pide que la posición "solo viva en memoria"; RNF-6 prohíbe almacenamiento nuevo | Guardar periodo/aviso en `localStorage`: añadiría claves y rompería RNF-6 |
| D-5 | Escuchar `click` + `keydown` (el toque genera `click`) | Cubre "clic, toque o tecla" del RF-14 con dos escuchadores | Escuchar `touchstart`: se dispararía dos veces por toque (toca + clic) y obligaría a `preventDefault`, con riesgo de romper el scroll |
| D-6 | Una sola referencia (`fechaUltimoPintado`) para los 5 casos y la comprobación | Hace imposible la contradicción RF-13/RF-14: cualquier repinta cancela el aviso y cualquier comprobación compara lo mismo | Tener un "contador de casos ocurridos" aparte del repinto: dos fuentes de verdad que pueden desincronizarse |
| D-7 | Leyenda fija en HTML con las clases de color | Es contenido inmutable, más accesible y sin JS; los colores siguen viviendo en un solo sitio (CSS) | Generar la leyenda desde JS: repetiría la información de niveles en dos sitios |
| D-8 | La cuadrícula es `role="img"` con etiqueta del rango; celdas sin foco | RF-15/RNF-3 dan el soporte en texto (leyenda, detalle, resumen) y RNF-7 prohíbe foco en celdas | `role="grid"` navegable con teclado: implicaría foco en las 56 celdas, prohibido por RNF-7 |
| D-9 | `Math.round` para el redondeo previo (mitad hacia arriba) | Es "el entero más cercano" que pide RF-3; 14,6 → 15 ✔ y 0,4 → 0 → tratado como 1 ✔ | `Math.floor`: 14,6 → 14 daría nivel 1 y contradiría la CA de RF-3 |
| D-10 | Reconstruir las 56 celdas en cada pintado | 56 nodos es ridículo (RNF-5) y el código queda lineal, como `pintarLista` | Reutilizar nodos y cambiar solo clases: menos código ejecutado, pero mucha más lógica de sincronización |
| D-11 | Las etiquetas de mes van dentro del bloque de la cuadrícula | RF-6 dice "bajo la columna": es parte del mapa; así el orden de RF-12 (detalle → leyenda → resumen) se respeta sin inventar huecos | Tratarlas como bloque independiente: introduciría un elemento que RF-12 no contempla |
| D-12 | El aviso usa `role="status"` (anuncio cortés) | Aparece sin foco y no debe robar el foco a quien está escribiendo | `role="alert"`/`aria-live="assertive"`: interrumpe la lectura del lector de pantalla en mitad de una frase |
| D-13 | El límite de `◀` se calcula con `periodoQueContiene(primeraSesiónVálida)` | Directo del EARS de RF-11 y barato (unos pocos saltos de 56 días) | Recorrer fechas día a día desde hoy: mismo resultado, más pasos y más código |
| D-14 | Las pruebas cargan `app.js` en un contexto aislado de Node (`vm`, incorporado) con un `document` y `localStorage` falsos de ~15 líneas | Prueba el código real, sin extraerlo ni duplicarlo, sin dependencias y sin tocar el repo (acuerdo: tests en `/tmp`) | Extraer la sección de lógica del fuente por marcadores: frágil (rompe si cambia un comentario); o `logica.js` (ver D-1) |
| D-15 | Idioma del código nuevo: **español**, como todo `app.js` | Coherencia con `hoyISO`, `calcularRacha`, `pintarRacha`… y con el lector principiante del proyecto. **Cumple el principio 6 de la constitución** ("código, interfaz y documentación en español", redactado así el 4 de octiembre) | Inglés en lo nuevo: hoy iría contra la constitución y dejaría el archivo con dos idiomas |

---

## 6. Estrategia de pruebas (`node --test`, en `/tmp`)

### 6.1 Cómo cargan las pruebas el código

Arneses en `/tmp/opencode/` (no se versionan):

- `cargador.js`: lee `app.js` como texto y lo ejecuta en un contexto aislado de Node con
  `document` y `localStorage` falsos (objetos con los métodos mínimos que el arranque usa:
  `getElementById`, `addEventListener`, `textContent`, `hidden`, `value`…). Devuelve el
  contexto, del que salen las funciones puras.
- `test-mapa.js` · `test-navegacion.js` · `test-aviso.js`: los tres bloques de la spec.
- *Red de seguridad (recomendada):* `test-rachas.js`, `test-total.js`,
  `test-bloque-variable.js`, recreados desde las descripciones de `MEMORY.md`, para
  demostrar que tocar `app.js` no ha roto lo que ya funcionaba.

Se pasa `hoy` explícito en cada prueba (constitución 3): casi todos los casos usan la
fecha del ejemplo de la spec, **2026-10-03**, donde el periodo va de 2026-08-09 a 2026-10-03.

### 6.2 Qué prueba cada test (CA → RF)

| Prueba | CA que cubre | RF |
| --- | --- | --- |
| `hoy = 2026-10-03` → 56 días, primero 2026-08-09, último 2026-10-03 | CA 1 | RF-1 |
| Ninguna fecha > `hoy`; longitud 56; índice de hoy = 55 (columna 8, fila 7) | CA 2, 3 | RF-1 |
| Orden cronológico: fila superior = primer día; periodo anterior = 56 días que terminan el día antes | CA 4, 5 | RF-1 |
| Dos sesiones de 30 + 45 = 75; minutos ≤ 0 o no numéricos no suman; fecha corrupta ignorada; fecha fuera del periodo no aparece | CA 1-4 | RF-2 |
| Fronteras 14/15, 44/45, 89/90, 400 → 4; 14,6 → 2; 0,4 → 1; 0 o sin sesión → vacío | CA 1-7 | RF-3 |
| Celda de hoy marcada solo cuando el periodo es el actual | CA 1-3 | RF-5 |
| Periodo ago→sep: `ago`, huecos, `sep`; nunca una sola etiqueta | CA 1-2 | RF-6 |
| `rangoDelPeriodo` = `9 ago 26 – 3 oct 26`; también en periodo antiguo | CA 1, 2, 3 | RF-7 |
| `textoDetalle`: 75 min → `29 sep · 1,3 h`; sin sesión → `1 oct · sin sesión` | CA 1-2 | RF-8 |
| `textoVacio`: invitación en periodo actual, neutro en anterior | CA 1-2 | RF-10 |
| `periodoAnterior` = 56 días; `puedeRetroceder` falso en el periodo de la primera sesión y sin sesiones, verdadero antes | CA 1-3 | RF-11 |
| `resumenDelPeriodo`: 5 días / 465 min → `5 días estudiados · 7,8 h…`; 1 día → singular; vacío → texto de RF-10 | CA 1-3 | RF-15 |
| `debeMostrarAvisoDia`: mismo día → no; día distinto → sí; cerrado hoy → no; cerrado ayer y hoy distinto → sí | CA 1-7 (parte lógica) | RF-14 |

### 6.3 Lo que se verifica a mano (CA de UI — lista del DoD)

1. **RF-1:** sin rótulos de días; hoy abajo a la derecha; 8 columnas.
2. **RF-4:** los 4 azules se distinguen entre sí y del papel.
3. **RF-8:** hover cambia la línea; salir de la cuadrícula, tocar leyenda o `◀` la vacía;
   tocar dos veces la misma celda no alterna.
4. **RF-9:** leyenda siempre visible, orden claro → oscuro.
5. **RF-11:** `▶` y `Volver a hoy` solo en periodos antiguos; `◀` se desactiva en el
   límite; tras recargar se vuelve al periodo actual; cambiar de pestaña no lo cambia;
   foco visible con teclado.
6. **RF-12:** tarjeta entre formulario y lista; orden detalle → leyenda → resumen;
   la tarjeta de rachas conserva sus 2 bloques y el menú ☰.
7. **RF-13:** los 5 casos repintan; guardar en periodo antiguo vuelve al actual.
8. **RF-14:** franja arriba de todo sin desplazar; texto exacto y botón `Cerrar`; cerrado
   no reaparece hasta el día siguiente; comprobación solo por visibilidad e interacción
   (nunca periódica). *Procedimiento sin tocar el reloj:* con DevTools se cambia la
   global `fechaUltimoPintado` a un día anterior y se hace clic → aparece el aviso.
9. **RF-15 / RF-10:** resumen visible siempre; con periodo vacío aparece **un solo**
   texto.
10. **RNF-2:** a 320 px no hay scroll horizontal y cada celda mide ≥ 28 px con ≥ 2 px de
    hueco (medir con DevTools).
11. **Consola sin errores**, doble clic en `index.html` y sin conexión.
12. Al acabar: skill `web-design-guidelines` sobre la interfaz y `local-dates` sobre las
    fechas (puntos comprobados: sin `toISOString` ni `new Date("AAAA-MM-DD")`, sin
    milisegundos, fechas futuras fuera, día 00:30 y cambio de hora cubiertos porque todo
    se compara como texto local y se suma con `setDate`).

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Colisión con el id `aviso` del formulario | El aviso del día usa `avisoDia` desde el primer momento (§4.1) |
| Las celdas quedan por debajo de 28 px a 320 px | Cálculo previo = 28,0 px; verificación midiendo; plan B: padding de tarjeta a 16 px en < 480 px |
| Mezclar redondeo (para el tono) y valor real (para textos) | `nivelDeDia` redondea; `textoDetalle` y `resumenDelPeriodo` usan `formatearTiempo` sin redondear |
| Cambio de hora o husos | Solo `setDate` y comparación de textos `AAAA-MM-DD`; nada de 24 h ni milisegundos |
| Que un clic "inocente" cancele o reabra mal el aviso | Un único criterio (`fechaUltimoPintado`) + `diaAvisoCerrado`; pruebas unitarias de `debeMostrarAvisoDia` |
| Que el toque deje la línea de detalle colgada | El mismo `click` global decide: dentro de la cuadrícula → mostrar; fuera → vaciar |
| Romper el menú ☰ o la lista al tocar `app.js` | Solo se *añade* código; red de seguridad con las pruebas antiguas (§6.1) |
| El resumen se anuncia en exceso con `aria-live` | Se limita al `<p>` del resumen, igual que ya hace la tarjeta de rachas |

---

## 8. Trazabilidad RF/RNF → secciones del plan

| RF | Dónde está en este plan |
| --- | --- |
| RF-1 | §2.2 (`periodoActual`, `diasDelPeriodo`), §3.1, §4.2, §6.2 |
| RF-2 | §2.2 (`minutosPorDia`), §3.1, §6.2 |
| RF-3 | §2.2 (`nivelDeDia`), §3.2, §6.2 |
| RF-4 | §4.2 (clases `nivel-1…4`), §6.3 |
| RF-5 | §3.1 (marca `hoy`), §4.2, §6.2 |
| RF-6 | §2.2 (`etiquetasDeMes`), §3.3, §4.2, §6.2 |
| RF-7 | §2.2 (`rangoDelPeriodo`), §3.4, §4.1/§4.2, §6.2 |
| RF-8 | §2.2 (`textoDetalle`), §3.7, §4.1/§4.2, §6.2 + §6.3 |
| RF-9 | §4.1 (leyenda estática), §4.2, §6.3 |
| RF-10 | §3.5 (`textoVacio`), §4.1 (hueco único), §6.2 |
| RF-11 | §2.2 (`puedeRetroceder`, `periodoQueContiene`), §3.6, §4.3, §6.2 + §6.3 |
| RF-12 | §4.1 (orden), §4.2, §6.3 |
| RF-13 | §3.8 (`pintarTodo`), §4.3 (reset del periodo al guardar), §6.3 |
| RF-14 | §2.3, §3.8, §4.1, §4.3, §6.2 + §6.3 |
| RF-15 | §3.5, §4.1, §6.2 + §6.3 |
| RNF-1 | §1 (sin archivos ni recursos nuevos), §5 (D-1) |
| RNF-2 | §4.2 (cálculo 320 px), §6.3 |
| RNF-3 | §4.1 (leyenda + resumen), §5 (D-8) |
| RNF-4 | textos en español, ya fijados en la spec |
| RNF-5 | §5 (D-10), §6.3 |
| RNF-6 | §2.3 (estado sin persistir), §1 (sin claves nuevas) |
| RNF-7 | §4.2 (foco existente), §5 (D-8), §6.3 |
| RNF-8 | §4.2 (tokens del cuaderno) |

---

## 9. Secuencia de trabajo (cambio pequeño en cambio pequeño)

1. `index.html` + `styles.css`: tarjeta del mapa, cuadrícula, niveles, marca de hoy,
   meses, leyenda y rango (RF-1, RF-4, RF-5, RF-6, RF-7, RF-9, RF-12 en modo estático).
2. `app.js`: funciones puras + `pintarMapa` → pruebas de `test-mapa.js` en verde.
3. Navegación y controles (RF-11) + rango dinámico + resumen (RF-15/RF-10) →
   `test-navegacion.js`.
4. Línea de detalle (RF-8) + eventos de puntero/tacto.
5. Aviso de día nuevo (RF-13, RF-14) → `test-aviso.js`.
6. Verificación manual completa (§6.3), skill `web-design-guidelines`, `node --test`
   sin rojos y actualización de `MEMORY.md`.

**Coste estimado:** ninguna dependencia, ningún archivo nuevo de código, ninguna clave
de `localStorage` nueva, ninguna sesión tocada.

---

## 10. Cumplimiento de la constitución

| Principio | Cómo se cumple en este plan | Dónde |
| --- | --- | --- |
| 1. Simplicidad primero | Solo `index.html`, `styles.css` y `app.js`; sin dependencias, sin build y sin `type="module"`; sigue abriéndose con doble clic | §1, D-1 |
| 2. La spec manda | Trazabilidad completa RF/RNF → plan; las 21 decisiones ambiguas se resolvieron en la spec antes de escribir este documento; si aparece una nueva, se para y se pregunta | §8, spec §9 |
| 3. Lógica separada de interfaz | Las 16 funciones nuevas no tocan DOM ni `localStorage` y **reciben `hoy`**; los colores y el pintado viven en CSS/JS de interfaz | §2.2, §4, D-10 |
| 4. Tests como puerta | `node --test` con arneses en `/tmp`, sin paquetes; no se avanza con pruebas en rojos | §6 |
| 5. Los datos son sagrados | Ninguna clave nueva, el mapa solo lee `leerSesiones()`; fechas en texto local y suma de días con `setDate` (sin UTC ni milisegundos) | §1, §2.3, RNF-6, §7 |
| 6. Idioma | Código, interfaz y documentación en español (incluidas las funciones nuevas y este plan) | D-15 |

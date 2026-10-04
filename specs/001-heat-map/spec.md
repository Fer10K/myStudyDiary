# Especificación 001 — Mapa de calor de días estudiados

**Estado:** cerrada (sin dudas abiertas) · **Fecha:** 4 de octubre de 2026

Esta especificación define el **qué** y el **por qué**. No contiene tecnología,
arquitectura ni nombres de archivos: eso va en el plan de implementación.
Notación: cada requisito (RF) se enuncia en **EARS** (CUANDO / SI-ENTONCES /
MIENTRAS / DONDE / ANTES DE) y lleva sus **criterios de aceptación** en formato
Dado-Cuando-Entonces.

---

## 1. Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, un bloque variable con menú
(mejor racha / total estudiado / días del mes) y la lista de sesiones, pero no
da una visión visual de la **constancia**: la racha solo dice "días seguidos" y
los agregados esconden los huecos.

**Objetivo:** mostrar un mapa de calor tipo GitHub de las **últimas 8 semanas**
donde cada día tiene un tono de tinta azul según los minutos estudiados: cuantos
más minutos, más intenso el color. El usuario debe ver de un vistazo sus semanas
completas, sus huecos y su evolución (también retrocediendo a periodos
anteriores) para motivarse a mantener el hábito.

**Por qué ahora:** es la pieza visual que complementa a la racha (que mide
"días seguidos") con el patrón completo del trimestre.

---

## 2. Usuarios

- **Usuario único:** la persona dueña del diario (estudiante), que lo usa a
  diario, en móvil y escritorio, en sesiones cortas de 1 a 5 minutos para
  registrar y consultar.
- **Persona usuaria con lector de pantalla o baja visión**, que necesita entender
  el periodo sin depender del color.

---

## 3. Historias de usuario

- **HU-1:** Como estudiante, quiero ver las últimas 8 semanas con un color por
  día según los minutos estudiados, para detectar huecos de un vistazo.
- **HU-2:** Como estudiante, quiero consultar los minutos concretos de un día al
  pasar el ratón o tocarlo, para comprobar qué estudié ese día.
- **HU-3:** Como estudiante, quiero entender qué significa cada tono con una
  leyenda, para no tener que adivinar.
- **HU-4:** Como estudiante, quiero retroceder a periodos anteriores de 8
  semanas, para ver cómo estudié hace dos o tres meses.
- **HU-5:** Como estudiante, quiero ver siempre qué periodo estoy mirando, para
  no confundir fechas.
- **HU-6:** Como persona usuaria con lector de pantalla, quiero un resumen en
  texto de los días y minutos del periodo, para no depender del color.
- **HU-7:** Como estudiante, quiero que el mapa se actualice al guardar y que me
  avise si ha cambiado el día, para no mirar datos viejos sin saberlo.

---

## 4. Requisitos funcionales

### RF-1 · Composición y orden del mapa

**EARS:** CUANDO se muestre un periodo, EL SISTEMA DEBERÁ componer exactamente
**56 celdas (8 columnas × 7 filas)** con 56 días consecutivos; DONDE cada
columna agrupe 7 días consecutivos contados desde el primer día del periodo, las
columnas se ordenen de izquierda a derecha en orden cronológico y **la fila
superior contenga el primer día del periodo** (la fila inferior, el último), las
filas NO llevarán rótulo de día de la semana. El **periodo actual** va desde
**hoy menos 55 días** hasta **hoy** inclusive; un **periodo anterior** ocupa
también 56 días y termina el día anterior al día en que empieza el periodo
siguiente.

**Criterios de aceptación:**
- Dado que hoy es el 3 de octubre de 2026, cuando se pinta el mapa, entonces la
  primera celda es el 9 de agosto de 2026 y la última es el 3 de octubre de
  2026.
- Dado cualquier fecha, cuando se pinta el mapa, entonces hay 56 celdas y ninguna
  con fecha posterior a hoy.
- Dado que la última columna contiene los 7 últimos días del periodo, cuando se
  pinta el mapa, entonces la celda de hoy es la esquina inferior derecha.
- Dado el mapa, cuando se observa, entonces la fila superior contiene el primer
  día del periodo y la inferior el último.
- Dado un periodo anterior, cuando se navega a él, entonces tiene 56 celdas
  consecutivas que terminan el día anterior al inicio del periodo siguiente.
- Dado el mapa, cuando se observa, entonces no hay ninguna etiqueta de día de la
  semana en las filas.

### RF-2 · Minutos de cada día

**EARS:** SI un día del periodo tiene al menos una sesión válida, ENTONCES EL
SISTEMA DEBERÁ acumular para ese día la suma de sus minutos; CUANDO se guarde una
sesión, EL SISTEMA DEBERÁ tenerla en cuenta en el recálculo. Una sesión es
**válida** —sin depender del periodo mostrado— si su fecha está bien formada, no
es futura y sus minutos son un número mayor que 0; de esas, solo las que caen en
el periodo se pintan en el mapa.

**Criterios de aceptación:**
- Dado un día con dos sesiones de 30 y 45 minutos, cuando se pinta el mapa,
  entonces ese día acumula 75 minutos.
- Dado una sesión con minutos no numéricos o iguales o menores que 0, cuando se
  pinta el mapa, entonces no suma; si es la única del día, el día queda vacío.
- Dado una sesión con fecha corrupta, cuando se pinta el mapa, entonces no pinta
  ninguna celda; como en todo el diario, esa sesión se descarta al leer y
  desaparece de lo guardado al volver a guardar.
- Dado una sesión con fecha fuera del periodo mostrado, cuando se pinta el mapa,
  entonces no aparece en el mapa aunque sí en la lista.

### RF-3 · Niveles de intensidad

**EARS:** SI un día del periodo no tiene sesiones válidas, ENTONCES EL SISTEMA
DEBERÁ pintarlo como celda vacía; SI tiene sesiones válidas, ENTONCES tomará
**m = suma de sus minutos redondeada al entero más cercano** (si m sale 0, se
trata como 1) y aplicará los niveles: **m de 1 a 14 → nivel 1; m de 15 a 44 →
nivel 2; m de 45 a 89 → nivel 3; m ≥ 90 → nivel 4**.

**Criterios de aceptación:**
- Dado un día con 14 minutos, cuando se pinta, entonces es nivel 1; con 15 es
  nivel 2.
- Dado un día con 44 minutos, cuando se pinta, entonces es nivel 2; con 45 es
  nivel 3.
- Dado un día con 89 minutos, cuando se pinta, entonces es nivel 3; con 90 es
  nivel 4.
- Dado un día con 400 minutos, cuando se pinta, entonces sigue siendo nivel 4
  (sin techo).
- Dado un día con 14,6 minutos, cuando se pinta, entonces es nivel 2 (15 tras
  redondear).
- Dado un día con 0,4 minutos, cuando se pinta, entonces es nivel 1 (0 tratado
  como 1).
- Dado un día con 0 minutos o sin sesiones, cuando se pinta, entonces queda vacío.

### RF-4 · Paleta

**EARS:** EL SISTEMA DEBERÁ representar los niveles 1 a 4 con **cuatro tonos de
tinta azul** del más claro al más oscuro (nivel 4 el más oscuro) y el nivel 0 con
el fondo de papel del cuaderno; DONDE el diseño del diario usa tinta azul,
subrayador amarillo y línea roja, el mapa no usará ninguna otra familia de color.

| Nivel | Minutos redondeados del día | Tono |
| --- | --- | --- |
| 0 | sin sesión | papel del cuaderno |
| 1 | 1 – 14 | `#C7D2F7` |
| 2 | 15 – 44 | `#7E95EE` |
| 3 | 45 – 89 | `#3D5AE0` |
| 4 | 90 o más | `#1B2A9E` |

Condición ineludible: **cada tono debe distinguirse de los otros tres y del
papel**. Si un tono deja de distinguirse (p. ej. por cambios de accesibilidad),
se sustituye manteniendo el orden claro → oscuro.

**Criterios de aceptación:**
- Dado el mapa, cuando se observa, entonces los cuatro tonos se distinguen entre
  sí y el orden de intensidad coincide con los minutos.
- Dado un día vacío, cuando se pinta, entonces tiene el fondo de papel con su
  borde fino, sin relleno de color.

### RF-5 · Marca de hoy

**EARS:** MIENTRAS el periodo mostrado sea el actual (el que termina hoy), la
celda de hoy llevará un **borde sutil** distintivo, con o sin color.

**Criterios de aceptación:**
- Dado que hoy tiene sesión, cuando se pinta el mapa, entonces su celda tiene
  color y además el borde de hoy.
- Dado que hoy no tiene sesión, cuando se pinta el mapa, entonces su celda está
  vacía pero conserva el borde de hoy.
- Dado un periodo anterior, cuando se navega a él, entonces ninguna celda lleva
  la marca de hoy (hoy no está en ese periodo).

### RF-6 · Nombre del mes bajo las columnas

**EARS:** CUANDO el mes de la primera celda de una columna sea distinto del mes
de la primera celda de la columna anterior, EL SISTEMA DEBERÁ mostrar bajo esa
columna el nombre del mes en español abreviado con las tres primeras letras de la palabra (p. ej. `ago`, `sep`, `oct`);
DONDE el mes no cambie respecto a la columna anterior, no se mostrará texto bajo
la columna. La primera columna siempre muestra su mes.

**Criterios de aceptación:**
- Dado un periodo que cruza de agosto a septiembre, cuando se pinta, entonces la
  primera columna lleva `ago` y la primera columna cuya primera celda cae en
  septiembre lleva `sep`, sin texto en las intermedias.
- Dado que todo periodo de 56 días cruza al menos dos meses, cuando se pinta,
  entonces siempre hay etiquetas de mes distintas de la primera columna, nunca
  una sola etiqueta para todo el periodo.

### RF-7 · Rango del periodo visible

**EARS:** EL SISTEMA DEBERÁ mostrar, junto a los controles de navegación y de
forma **siempre visible**, el rango de fechas del periodo en formato
`d d mes año – d d mes año` con meses abreviados en español y los últimos dos
números del año (p. ej. `9 ago 26 – 3 oct 26`); DONDE un periodo dura 56 días y
ningún mes llega a 56, el rango **cruza siempre dos meses** y no existe el caso
de un solo mes.

**Criterios de aceptación:**
- Dado el periodo actual, cuando se pinta, entonces la etiqueta empieza en hoy
  menos 55 días y acaba en hoy.
- Dado cualquier periodo, cuando se pinta, entonces la etiqueta usa siempre el
  formato completo con año (p. ej. `9 ago 26 – 3 oct 26`).
- Dado que el usuario retrocede un periodo, cuando se navega, entonces la
  etiqueta cambia al rango de ese periodo.
- Dado el periodo actual, cuando se observa, entonces la etiqueta también está
  visible (no solo en periodos antiguos).

### RF-8 · Línea de detalle

**EARS:** CUANDO el usuario pase el ratón por una celda o la toque, EL SISTEMA
DEBERÁ mostrar en la línea bajo el mapa la fecha de esa celda y su tiempo
formateado con el formato del diario (minutos, horas, día o días; p. ej.
`29 sep · 1,3 h` con 75 minutos); SI la celda no tiene sesiones válidas, ENTONCES
mostrará la fecha y `sin sesión` (p. ej. `1 oct · sin sesión`); CUANDO el ratón
salga de la cuadrícula o el usuario toque o haga clic **fuera de la cuadrícula de
celdas** (leyenda, controles, texto o fondo), EL SISTEMA DEBERÁ vaciar la línea;
DONDE el usuario toque dos veces la misma celda, la línea se mantiene visible,
sin alternar.

**Criterios de aceptación:**
- Dado un día con 75 minutos, cuando el usuario pasa el ratón por su celda,
  entonces la línea pone `29 sep · 1,3 h`.
- Dado un día sin sesiones, cuando el usuario toca su celda, entonces la línea
  pone `1 oct · sin sesión`.
- Dado que la línea muestra un día, cuando el usuario retira el ratón, toca la
  leyenda o pulsa `◀`, entonces la línea queda vacía.
- Dado que la línea muestra un día, cuando el usuario toca dos veces la misma
  celda, entonces la línea sigue mostrando ese día.
- Dado dos celdas seguidas, cuando el usuario pasa de una a otra, entonces la
  línea muestra los datos de la última celda.

### RF-9 · Leyenda

**EARS:** EL SISTEMA DEBERÁ mostrar bajo el mapa una leyenda formada por una
celda vacía etiquetada `sin sesión` y cuatro muestras con sus rangos `1-14`,
`15-44`, `45-89` y `90+` minutos (sobre los minutos redondeados del RF-3), en
el mismo orden de intensidad que el mapa.

**Criterios de aceptación:**
- Dado el mapa, cuando se observa, entonces la leyenda está siempre presente, con
  o sin datos.
- Dado el orden de la leyenda, cuando se observa, entonces los rangos coinciden
  con los niveles del RF-3 y el tono más oscuro queda a la derecha.

### RF-10 · Periodo sin sesiones

**EARS:** SI el periodo visible no contiene ninguna sesión válida, ENTONCES EL
SISTEMA DEBERÁ mostrar la cuadrícula vacía, la leyenda y, **en el hueco del
resumen (RF-15)**, un texto según el periodo: si es el periodo actual → `Aún no
hay sesiones, apunta la primera y empieza a pintar el mapa`; si es un periodo
anterior → `No hay sesiones en este periodo`. Ese texto se pinta **una sola
vez**.

**Criterios de aceptación:**
- Dado el periodo actual sin sesiones, cuando se pinta, entonces se ven la
  cuadrícula vacía, la leyenda y la invitación a apuntar la primera sesión.
- Dado un periodo anterior sin sesiones, cuando se navega a él, entonces se ve el
  texto neutro `No hay sesiones en este periodo`, sin invitar a registrar nada.
- Dado un periodo con sesiones, cuando se pinta, entonces no aparece ninguno de
  los dos textos.

### RF-11 · Navegación entre periodos

**EARS:** CUANDO el usuario pulse `◀`, EL SISTEMA DEBERÁ mostrar el periodo
anterior de 8 semanas; CUANDO pulse `▶`, EL SISTEMA DEBERÁ mostrar el periodo
siguiente; SI el periodo mostrado es el actual, ENTONCES `▶` no se mostrará;
DONDE el periodo mostrado no sea el actual, deberá verse además el botón
`Volver a hoy`; MIENTRAS no se llegue al periodo que contiene la primera sesión
válida registrada, `◀` permanecerá disponible; DONDE el periodo mostrado sea el más
antiguo posible, `◀` no estará disponible. La posición del periodo **solo vive en
memoria**: CUANDO se cargue o recargue la página, EL SISTEMA DEBERÁ mostrar el
periodo actual; DONDE el usuario solo cambie de pestaña y vuelva, el periodo
visible no cambiará.

**Criterios de aceptación:**
- Dado el periodo actual, cuando el usuario pulsa `◀`, entonces se muestran los
  56 días inmediatamente anteriores a él.
- Dado que el periodo mostrado contiene la primera sesión válida registrada, cuando se
  pinta, entonces `◀` no está disponible.
- Dado que no hay ninguna sesión válida, cuando se pinta, entonces `◀` no está
  disponible.
- Dado un periodo anterior, cuando el usuario pulsa `▶`, entonces avanza un
  periodo; al llegar al periodo actual, `▶` desaparece.
- Dado un periodo anterior en pantalla, cuando el usuario recarga o abre la
  página, entonces se vuelve al periodo actual.
- Dado un periodo anterior en pantalla, cuando el usuario cambia de pestaña y
  vuelve, entonces el periodo visible no cambia.
- Dado un periodo anterior, cuando se pinta, entonces se ve `Volver a hoy` y,
  al pulsarlo, se vuelve al periodo que termina hoy.
- Dado que todos los controles responden al teclado, cuando se navega sin ratón,
  entonces el foco siempre permanece visible.

### RF-12 · Ubicación del mapa

**EARS:** EL SISTEMA DEBERÁ mostrar el mapa en **su propia tarjeta**, entre el
formulario de nueva sesión y la lista de sesiones, presente siempre, también sin
datos. **Orden interno:** (1) fila superior con el rango de fechas (RF-7) y los
controles de navegación (RF-11); (2) la cuadrícula (RF-1); (3) debajo, en este
orden: la línea de detalle (RF-8), la leyenda (RF-9) y el resumen (RF-15), que
con periodo vacío lleva el texto del RF-10.

**Criterios de aceptación:**
- Dado el diario, cuando se pinta la página, entonces el mapa aparece después del
  formulario y antes de la lista de sesiones.
- Dado la tarjeta del mapa, cuando se observa, entonces los controles están
  encima de la cuadrícula y, debajo, se apilan en orden detalle → leyenda →
  resumen (y este, con periodo vacío, lleva el texto del RF-10).
- Dado el diario, cuando se observa, entonces la tarjeta de rachas conserva sus
  2 bloques y la elección del menú ☰ sigue funcionando.
- Dado un periodo vacío, cuando se pinta, entonces la tarjeta del mapa no
  desaparece.

### RF-13 · Actualización

**EARS:** CUANDO ocurra cualquiera de los casos de actualización, EL SISTEMA
DEBERÁ pintar los datos y el mapa con la información nueva; DONDE los casos 4 y 5
no cambian lo guardado.

**Casos de actualización:**

_Actualizan lo que se muestra (cuentan como «repintado reciente» y cancelan el
aviso del RF-14):_
1. Abrir la página.
2. Recargar la página.
3. Guardar una sesión.
4. Cambiar de periodo (`◀`, `▶` o `Volver a hoy`).
5. Cambiar el dato con el menú ☰ de la tarjeta de rachas.

_No repintan nada:_ mostrar el aviso de día nuevo → RF-14.

**Criterios de aceptación:**
- Dado el periodo actual, cuando el usuario guarda una sesión de hoy, entonces la
  celda de hoy se colorea en la misma actualización en la que se actualizan la
  racha y la lista.
- Dada la página recién abierta, cuando se pinta, entonces el mapa muestra el
  periodo actual con las sesiones guardadas.
- Dado que el usuario está en un periodo anterior, cuando guarda una sesión,
  entonces el mapa **vuelve al periodo actual**.
- Dado un aviso de día nuevo pendiente, cuando el usuario realice un clic, un
  toque o una tecla **que resulte en una actualización de estadísticas** (guardar,
  cambiar de periodo, cambiar el dato con ☰), entonces el aviso **se cancela**.

### RF-14 · Aviso de día nuevo

**EARS:** CUANDO se detecte que ha cambiado el día con la página abierta —la
comprobación se hace **(a) al volver la pestaña a estar visible** y **(b) al
interactuar con la página (clic, toque o tecla)**, y compara la fecha de hoy con la
**fecha del último pintado** (los casos 1 a 5 del RF-13 actualizan esa
fecha)— y desde ese cambio de día no haya
ocurrido ninguno de los **casos 1 a 5** del RF-13, EL SISTEMA DEBERÁ mostrar un
**aviso persistente** en una franja **arriba de todo, sobre el formulario**
(visible sin desplazamiento), con el texto `Un nuevo día comienza: recarga la
página para actualizar los datos` y un botón `Cerrar`; ese texto único es todo lo
que dice el aviso, y la recarga que pide actualiza todas las **estadísticas
calculables** (racha actual,
mejor racha, total estudiado, días del mes y mapa de calor); DONDE ya haya
ocurrido cualquiera de los casos 1 a 5 desde el cambio de día, no se mostrará
ningún aviso. Todo clic, toque o tecla que **resulte en una actualización de
estadísticas** cancela el aviso; el resto de interacciones solo lo muestran si
se dan las condiciones. CUANDO el usuario cierre el aviso, EL SISTEMA DEBERÁ
ocultarlo y **no volver a mostrarlo hasta el siguiente cambio de día**.

**Criterios de aceptación:**
- Dada la página abierta de un día para otro sin recargar, cuando el usuario
  vuelve a la pestaña, hace clic o toca, entonces aparece el aviso con el texto
  exacto `Un nuevo día comienza: recarga la página para actualizar los datos` y se
  mantiene en pantalla.
- Dado que la pantalla queda abierta y quieta cruzando la medianoche, cuando el
  usuario vuelve a estar visible o interactúa por primera vez, entonces aparece
  el aviso (nunca por comprobación periódica).
- Dado que la fecha de referencia es la del último pintado (ayer), cuando el
  usuario vuelve a la pestaña sin haber ocurrido ningún caso 1 a 5, entonces hay
  aviso; si en cambio hubo un caso 1 a 5, entonces la referencia ya es la fecha
  nueva y no lo hay.
- Dado que el usuario recarga, guarda, cambia de periodo o cambia el dato con ☰
  después del cambio de día, entonces no aparece el aviso.
- Dado el aviso visible, cuando el usuario lo cierra, entonces desaparece y
  ninguna interacción posterior (clic, toque o tecla) lo vuelve a mostrar hasta el
  siguiente cambio de día.
- Dado el aviso cerrado, cuando llega un nuevo cambio de día, entonces puede
  volver a mostrarse si se dan las condiciones del RF-14.
- Dado el aviso, cuando aparece, entonces se ve en una franja arriba de todo,
  sobre el formulario, sin necesidad de desplazar la página, con su botón
  `Cerrar`.
- Dado el aviso, cuando se lee, entonces muestra exactamente el texto
  `Un nuevo día comienza: recarga la página para actualizar los datos`, sin
  enumerar estadísticas (esa recarga las actualiza todas).

### RF-15 · Resumen del periodo (texto accesible)

**EARS:** EL SISTEMA DEBERÁ mostrar bajo el mapa un texto con los **días
estudiados y los minutos totales** del periodo visible (p. ej. `5 días
estudiados · 7,8 h en este periodo`), en el mismo formato de tiempo que el
resto del diario; DONDE los días estudiados sean 1, se escribirá en singular
(`1 día estudiado · 45 min en este periodo`); SI el periodo no tiene sesiones válidas, ENTONCES en lugar de
las cifras mostrará el texto de vacío definido en el RF-10 (la invitación si es
el periodo actual o `No hay sesiones en este periodo` si es anterior), pintado
una sola vez; DONDE la información no debe depender solo del color, este
resumen junto con la leyenda y la línea de detalle serán sus soportes en texto.

**Criterios de aceptación:**
- Dado un periodo con 5 días y 465 minutos, cuando se pinta, entonces el
  resumen indica 5 días estudiados y el tiempo equivalente con el formato del
  resto del diario.
- Dado un periodo con 1 día y 45 minutos, cuando se pinta, entonces el resumen
  pone `1 día estudiado · 45 min en este periodo`.
- Dado un periodo vacío, cuando se pinta, entonces el resumen muestra el texto
  de vacío del RF-10 en lugar de cifras, y ese texto no aparece en ningún otro
  hueco de la tarjeta.
- Dado el mapa, cuando se pinta, entonces el resumen siempre está visible.

---

## 5. Requisitos no funcionales

- **RNF-1 · Sin recursos externos:** el mapa se compone con lo que ya usa el
  diario; no añade fuentes, imágenes ni peticiones de red, y sigue funcionando
  abriendo el archivo con doble clic y sin conexión.
- **RNF-2 · Responsive:** usable desde 320 px de ancho hasta escritorio, sin
  desplazamiento horizontal; las 56 celdas deben distinguirse y ser tocables en
  móvil: **celdas cuadradas de al menos 28 px de lado a 320 px, con al menos 2 px
  de separación** entre ellas.
- **RNF-3 · No solo color:** los cuatro tonos se distinguen entre sí y del papel,
  y el periodo siempre puede entenderse con texto (RF-7, RF-9, RF-15).
- **RNF-4 · Idioma:** todos los textos del mapa y sus estados están en español
  (meses abreviados, fechas con coma decimal cuando proceda).
- **RNF-5 · Rendimiento:** las 56 celdas se calculan en cada pintado sin bloquear
  la interfaz ni el guardado de sesiones.
- **RNF-6 · Datos intactos:** el mapa se calcula siempre a partir de las sesiones
  ya registradas; no introduce almacenamiento nuevo, no cambia el formato de lo
  guardado y no puede perder sesiones (un guardado recalcula el mapa).
- **RNF-7 · Teclado:** los controles del mapa (`◀`, `▶`, `Volver a hoy`, cierre
  del aviso) son manejables con teclado con foco visible; las celdas no reciben
  foco (decisión de la pregunta 25).
- **RNF-8 · Coherencia visual:** se mantienen los tokens del cuaderno (tinta azul,
  papel con rejilla, sin sombras suaves) y la tarjeta de rachas con sus 2 bloques.

---

## 6. Casos límite

- **Día sin sesiones** → celda vacía con borde fino.
- **Día con minutos no numéricos o ≤ 0** → no suman; si es lo único del día, el
  día queda vacío.
- **Sesión con fecha corrupta** → se descarta al leer, no pinta ninguna celda.
- **Sesión con fecha futura** → no pinta: el mapa nunca tiene celdas futuras.
- **Varias sesiones el mismo día** → se suman en una sola celda.
- **Fronteras de nivel** (14/15, 44/45, 89/90) → manda la regla de intervalos
  del RF-3 (el valor de la frontera sube de nivel).
- **Día con muchas horas** → nivel 4, sin techo.
- **Minutos no enteros** → se redondean al entero más cercano antes de elegir
  tono y etiqueta (14,6 → nivel 2; 0,4 → nivel 1); la línea de detalle y el
  resumen muestran el tiempo real sin redondear.
- **Periodo que cruza meses** (todos los periodos cruzan) → la etiqueta de mes
  solo aparece al cambiar de mes.
- **Hoy sin sesión** → celda vacía con el borde de hoy.
- **Navegación al periodo más antiguo** → `◀` deja de estar disponible justo en
  el periodo que contiene la primera sesión.
- **Sin ninguna sesión** → no hay retroceso; el periodo actual muestra la
  invitación.
- **Periodo anterior sin sesiones** → texto neutro, sin invitación a registrar.
- **Datos guardados corruptos o vacíos** → el mapa se dibuja con lo que haya,
  nunca rompe la página ni borra sesiones.
- **Página abierta al cruzar la medianoche** → aviso persistente (RF-14); la
  comprobación ocurre al volver la pestaña a estar visible o al interactuar
  (nunca de forma periódica); si desde el cambio de día hubo un caso 1 a 5 del
  RF-13 (recargar, guardar, navegar, ☰), no aparece.
- **Periodo anterior** → no existe celda de hoy, por lo que no hay marca.

---

## 7. Fuera de alcance (versión 1)

- Cambiar el número de semanas (siempre 8).
- Ver el detalle de las sesiones de un día (tema y minutos de cada una).
- Exportar o compartir el mapa como imagen.
- Filtrar el mapa por tema.
- Comparar el periodo mostrado con el anterior (sin cifras de comparación).
- Todo lo que no esté descrito en los RF: la espec es la que manda.

---

## 8. Criterios de finalización

- Todos los RF y RNF verificados con sus criterios de aceptación en verde:
  - **CA comprobables con código** (rango, niveles, minutos por día, minutos
    redondeados, navegación y reglas del aviso) → pruebas automáticas con
    `node --test`, sin instalar nada y sin pruebas en rojo.
  - **CA de UI** (sitio, disparo y cierre del aviso, línea de detalle, orden
    interno de la tarjeta, controles, apilado, teclado y 320 px) → lista de
    comprobación manual con Firefox DevTools.
- Funcionamiento con doble clic y sin conexión, sin errores en consola.
- Revisión en móvil (320 px) y escritorio, con Firefox DevTools.
- Textos en español y sin dependencias nuevas.
- Los datos existentes siguen intactos: las sesiones guardadas no cambian de
  formato ni se pierden.
- **Especificación sin `[NECESITA ACLARACIÓN]` pendientes antes de empezar a
  codificar** (constitución, principio "la spec manda").

---

## 9. Dudas abiertas

**Sin dudas abiertas.** Las 6 dudas iniciales se resolvieron el 3 de octubre de
2026:

1. **Textos exactos** → invitación `Aún no hay sesiones, apunta la primera y
   empieza a pintar el mapa`; periodo anterior `No hay sesiones en este periodo`;
   aviso `Un nuevo día comienza: recarga la página para actualizar los datos`.
2. **Casos de actualización** → lista del RF-13: los 5 (abrir, recargar, guardar,
   navegar de periodo y el menú ☰) actualizan lo que se muestra y **cancelan el
   aviso** del RF-14.
3. **Comprobación del cambio de día** → al volver la pestaña a estar visible y al
   interactuar (clic, toque o tecla); nunca de forma periódica; compara contra la
   fecha del último pintado.
4. **Alcance del aviso** → texto único, sin enumerar estadísticas: la recarga
   que pide actualiza todas las calculables (racha, mejor racha, total, días del
   mes y mapa).
5. **Tonos de azul** → decididos en el RF-4 (`#C7D2F7`, `#7E95EE`, `#3D5AE0`,
   `#1B2A9E`), con la única condición de que cada uno se distinga de los otros.
6. **Guardar en un periodo antiguo** → el mapa vuelve al periodo actual.

**Revisión QA (4 de octubre de 2026)** — una pregunta individual por conflicto:

1. **Cancelación del aviso** → todo clic, toque o tecla que resulte en una
   actualización de estadísticas lo cancela; los casos 4 y 5 pasaron a cancelar.
2. **Cierre del aviso** → no reaparece hasta el siguiente cambio de día.
3. **Día de referencia** → la fecha del último pintado (los casos 1 a 5 la
   actualizan).
4. **Texto del aviso** → único, sin enumerar estadísticas.
5. **RF-1 para todos los periodos** → 56 días consecutivos en cada uno; el
   anterior termina el día anterior al inicio del siguiente; fila superior = primer
   día del periodo.
6. **Decimales** → se redondean al entero más cercano antes de clasificar; si el
   redondeo da 0, nivel 1.
7. **«Fuera del mapa»** → significa fuera de la cuadrícula; tocar dos veces la
   misma celda no alterna.
8. **Orden interno** → controles y rango encima; debajo: detalle → leyenda →
   resumen.
9. **Navegación** → solo en memoria: al recargar o abrir, periodo actual.
10. **Fecha corrupta** → la CA sigue el comportamiento real del diario (se
    descarta al leer y desaparece al volver a guardar).
11. **Ancho mínimo** → 320 px en RNF-2 y en el DoD (se quitó el 375 px).
12. **Verificación** → CA de lógica con `node --test`; CA de UI con lista de
    comprobación manual en Firefox DevTools.
13. **Resumen con periodo vacío** → muestra el texto de RF-10, una sola vez.
14. **Ejemplos de tiempo** → ajustados al formato real (`1,3 h` con 75 min,
    `7,8 h` con 465 min).
15. **Rama de un solo mes** → retirada de RF-7 y RF-6: 56 días no caben en un
    mes, así que todo periodo cruza dos meses.
16. **Tamaño de celda** → ≥ 28 px de lado a 320 px y ≥ 2 px de separación.
17. **Toque en móvil** → cuenta como interacción: la comprobación es «clic,
    toque o tecla».
18. **Validez de una sesión** → no depende del periodo (fecha correcta, no
    futura, minutos > 0); del periodo solo depende si se pinta.
19. **Fecha de la cabecera** → actualizada al 4 de octubre de 2026.
20. **Sitio del aviso** → franja arriba de todo, sobre el formulario, visible sin
    desplazamiento, con botón `Cerrar`.
21. **Resumen con 1 día** → singular: `1 día estudiado · 45 min en este periodo`.

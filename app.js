// ============================================================
// Diario de Estudio - lógica principal
// ============================================================

var CLAVE = "diario-estudio-sesiones";

// Dato que se muestra en el bloque variable de la tarjeta.
var CLAVE_DATO = "diario-estudio-dato";
var DATO_POR_DEFECTO = "mes";
var DATOS_VALIDOS = ["mes", "mejor", "total"];

// ---------- Utilidades de fecha (siempre fecha local) ----------

// Devuelve "YYYY-MM-DD" de hoy según el reloj local del usuario.
function hoyISO() {
  var d = new Date();
  return aISO(d);
}

// Convierte un Date a "YYYY-MM-DD" usando la fecha LOCAL (no UTC).
function aISO(d) {
  var anio = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, "0");
  var dia = String(d.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// Convierte "YYYY-MM-DD" a un Date a medianoche LOCAL.
function desdeISO(iso) {
  var partes = iso.split("-");
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

// Resta un día a una fecha "YYYY-MM-DD".
function menosUnDia(iso) {
  var d = desdeISO(iso);
  d.setDate(d.getDate() - 1);
  return aISO(d);
}

// Fecha legible en español: "30 sep 2026"
function fechaLegible(iso) {
  var opciones = { day: "numeric", month: "short", year: "numeric" };
  return desdeISO(iso).toLocaleDateString("es-ES", opciones);
}

// Comprueba que es una fecha real "AAAA-MM-DD": vale el formato y que no
// exista solo en el calendario (2026-02-30 o 2026-13-45 no son válidas).
function esFechaValida(fecha) {
  if (typeof fecha !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  return aISO(desdeISO(fecha)) === fecha;
}

// ---------- Datos ----------

function leerSesiones() {
  try {
    var guardado = localStorage.getItem(CLAVE);
    if (!guardado) return [];
    var datos = JSON.parse(guardado);
    if (!Array.isArray(datos)) return [];

    // Se ignoran por completo las sesiones con fecha corrupta: no se pintan
    // en la lista ni cuentan para las rachas. Al guardar de nuevo, dejan de
    // estar en localStorage (es un cambio irreversible, pero solo afecta a
    // registros que ya eran inválidos).
    return datos.filter(function (s) {
      return s !== null && typeof s === "object" && esFechaValida(s.fecha);
    });
  } catch (e) {
    return [];
  }
}

function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE, JSON.stringify(sesiones));
}

// Qué dato muestra el bloque variable: "mes", "mejor" o "total".
function leerDatoElegido() {
  var guardado = null;
  try {
    guardado = localStorage.getItem(CLAVE_DATO);
  } catch (e) {
    guardado = null;
  }

  // Si no hay nada o el valor no es de los conocidos, se usa el por defecto.
  if (DATOS_VALIDOS.indexOf(guardado) === -1) return DATO_POR_DEFECTO;
  return guardado;
}

function guardarDatoElegido(dato) {
  if (DATOS_VALIDOS.indexOf(dato) === -1) return;
  localStorage.setItem(CLAVE_DATO, dato);
}

// ---------- Racha ----------

// Mapa de los días que tienen al menos 1 sesión válida.
// Descarta fechas mal formadas y fechas futuras (no suman).
function crearDiasConSesion(sesiones) {
  var hoy = hoyISO();
  var dias = {};

  sesiones.forEach(function (s) {
    if (!esFechaValida(s.fecha)) return;
    if (s.fecha > hoy) return;
    dias[s.fecha] = true;
  });

  return dias;
}

// Un día "tiene sesión" si al menos una sesión cae en esa fecha.
function calcularRacha(sesiones) {
  var diasConSesion = crearDiasConSesion(sesiones);

  var racha = 0;
  var dia = hoyISO();

  // Si hoy todavía no he estudiado, la racha no se rompe:
  // empezamos a contar desde ayer.
  if (!diasConSesion[dia]) {
    dia = menosUnDia(dia);
    if (!diasConSesion[dia]) return 0;
  }

  // Contamos hacia atrás mientras haya sesión cada día.
  while (diasConSesion[dia]) {
    racha++;
    dia = menosUnDia(dia);
  }

  return racha;
}

// La mejor racha es el tramo más largo de días consecutivos con sesión.
// Se calcula siempre con las sesiones guardadas: no se guarda aparte.
function calcularMejorRacha(sesiones) {
  var diasConSesion = crearDiasConSesion(sesiones);

  // Un texto "AAAA-MM-DD" ya ordena cronológicamente, sin usar UTC.
  var fechas = Object.keys(diasConSesion).sort();

  var mejor = 0;
  var actual = 0;
  var anterior = "";

  fechas.forEach(function (fecha) {
    // Si la fecha anterior es justo el día previo, el tramo continúa.
    if (anterior !== "" && menosUnDia(fecha) === anterior) {
      actual++;
    } else {
      actual = 1;
    }

    if (actual > mejor) mejor = actual;
    anterior = fecha;
  });

  return mejor;
}

// ---------- Total estudiado ----------

// Suma los minutos de las sesiones guardadas.
// Las fechas futuras no suman, igual que en las rachas.
function sumarMinutos(sesiones) {
  var hoy = hoyISO();
  var total = 0;

  sesiones.forEach(function (s) {
    if (!esFechaValida(s.fecha)) return;
    if (s.fecha > hoy) return;

    var minutos = Number(s.minutos);
    if (!Number.isFinite(minutos) || minutos <= 0) return;

    total += minutos;
  });

  return total;
}

// Cambia de unidad: minutos -> horas (al pasar de 60) -> días (al pasar de 24 h).
function formatearTiempo(minutos) {
  if (minutos <= 60) return formatearNumero(minutos) + " min";
  if (minutos <= 24 * 60) return formatearNumero(minutos / 60) + " h";

  var dias = formatearNumero(minutos / (24 * 60));
  return dias === "1" ? "1 día" : dias + " días";
}

// Número con coma decimal española y como mucho 1 decimal.
function formatearNumero(valor) {
  return valor.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

// ---------- Días del mes ----------

// Días del mes en curso (el de hoy) con al menos 1 sesión.
// Solo se compara el texto de la fecha: sin aritmética y sin UTC.
function calcularDiasEsteMes(sesiones) {
  var diasConSesion = crearDiasConSesion(sesiones);
  var mesActual = hoyISO().slice(0, 7); // "2026-10"
  var total = 0;

  Object.keys(diasConSesion).forEach(function (fecha) {
    if (fecha.slice(0, 7) === mesActual) total++;
  });

  return total;
}

// ---------- Mapa de calor: lógica (sin DOM ni localStorage) ----------

// Meses abreviados a tres letras en español: evita depender del
// idioma del navegador (en algunos motores "septiembre" sale "sept").
var MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"
];

// Estado del mapa: solo vive en memoria, se pierde al recargar (RF-11).
var periodoMostrado = null;

// Fecha del último pintado: es la referencia del aviso (RF-14). Los
// cinco casos del RF-13 la actualizan y con ello cancelan el aviso.
var fechaUltimoPintado = null;

// Día en el que el usuario cerró el aviso (null si nunca lo cerró).
var diaAvisoCerrado = null;

// Suma (o resta) días con el calendario, nunca con milisegundos:
// así no le afectan los cambios de hora.
function sumarDias(iso, cantidad) {
  var d = desdeISO(iso);
  d.setDate(d.getDate() + cantidad);
  return aISO(d);
}

// Periodo actual: hoy menos 55 días hasta hoy (56 días en total).
function periodoActual(hoy) {
  return { inicio: sumarDias(hoy, -55), fin: hoy };
}

// El periodo anterior también dura 56 días y termina el día antes
// de que empiece el siguiente.
function periodoAnterior(periodo) {
  return {
    inicio: sumarDias(periodo.inicio, -56),
    fin: sumarDias(periodo.inicio, -1)
  };
}

// Avanza 56 días sin pasar nunca del periodo actual.
function periodoSiguiente(periodo, hoy) {
  var actual = periodoActual(hoy);
  var siguiente = {
    inicio: sumarDias(periodo.inicio, 56),
    fin: sumarDias(periodo.fin, 56)
  };
  if (siguiente.inicio > actual.inicio) return actual;
  return siguiente;
}

// Periodo (de 56 en 56, hacia atrás) que contiene una fecha.
function periodoQueContiene(fecha, hoy) {
  var periodo = periodoActual(hoy);
  if (!esFechaValida(fecha)) return periodo;
  while (fecha < periodo.inicio) {
    periodo = periodoAnterior(periodo);
  }
  return periodo;
}

// Las 56 fechas del periodo, de la más antigua a la más reciente.
function diasDelPeriodo(periodo) {
  var dias = [];
  var dia = periodo.inicio;
  for (var i = 0; i < 56; i++) {
    dias.push(dia);
    dia = sumarDias(dia, 1);
  }
  return dias;
}

// Minutos válidos de cada día. Una sesión es válida si su fecha está
// bien formada, no es futura y sus minutos son un número mayor que 0
// (la validez no depende del periodo mostrado: RF-2).
function minutosPorDia(sesiones, hoy) {
  var totales = {};
  sesiones.forEach(function (s) {
    if (!esFechaValida(s.fecha)) return;
    if (s.fecha > hoy) return;

    var minutos = Number(s.minutos);
    if (!Number.isFinite(minutos) || minutos <= 0) return;

    totales[s.fecha] = (totales[s.fecha] || 0) + minutos;
  });
  return totales;
}

// Nivel de intensidad (RF-3): sin datos es 0; con datos se redondea
// al entero más cercano (y un 0 redondeado se trata como 1).
function nivelDeDia(minutos) {
  if (typeof minutos !== "number" || !(minutos > 0)) return 0;

  var m = Math.round(minutos);
  if (m <= 0) m = 1;

  if (m >= 90) return 4;
  if (m >= 45) return 3;
  if (m >= 15) return 2;
  return 1;
}

// Los 56 días con su nivel y su marca de hoy: es lo que luego se
// pinta en pantalla (la interfaz no calcula nada).
function datosDelMapa(periodo, sesiones, hoy) {
  var minutos = minutosPorDia(sesiones, hoy);
  return diasDelPeriodo(periodo).map(function (fecha) {
    return {
      fecha: fecha,
      minutos: minutos[fecha],
      nivel: nivelDeDia(minutos[fecha]),
      esHoy: fecha === hoy
    };
  });
}

// Mes abreviado de una fecha, leyendo el texto (sin usar Date).
function mesDeFecha(iso) {
  return MESES_CORTOS[Number(iso.slice(5, 7)) - 1];
}

// "29 sep": día y mes, sin año.
function fechaCorta(iso) {
  return Number(iso.slice(8, 10)) + " " + mesDeFecha(iso);
}

// "9 ago 26": día, mes y los dos últimos números del año.
function fechaRango(iso) {
  return fechaCorta(iso) + " " + iso.slice(2, 4);
}

// Un texto por columna y solo cuando cambia el mes (RF-6): la
// primera columna siempre lleva su mes.
function etiquetasDeMes(periodo) {
  var dias = diasDelPeriodo(periodo);
  var etiquetas = [];
  var mesAnterior = null;

  for (var columna = 0; columna < 8; columna++) {
    var mes = mesDeFecha(dias[columna * 7]);
    if (columna === 0 || mes !== mesAnterior) etiquetas.push(mes);
    else etiquetas.push("");
    mesAnterior = mes;
  }
  return etiquetas;
}

// "9 ago 26 – 3 oct 26" (RF-7).
function rangoDelPeriodo(periodo) {
  return fechaRango(periodo.inicio) + " – " + fechaRango(periodo.fin);
}

// ¿El periodo mostrado es el que termina hoy?
function esPeriodoActual(periodo, hoy) {
  return periodo.inicio === periodoActual(hoy).inicio;
}

// Texto de la línea de detalle (RF-8): siempre el tiempo real.
function textoDetalle(fecha, minutos) {
  if (typeof minutos === "number" && minutos > 0) {
    return fechaCorta(fecha) + " · " + formatearTiempo(minutos);
  }
  return fechaCorta(fecha) + " · sin sesión";
}

// Texto único para un periodo sin sesiones (RF-10).
function textoVacio(esActual) {
  if (esActual) return "Aún no hay sesiones, apunta la primera y empieza a pintar el mapa";
  return "No hay sesiones en este periodo";
}

// Días estudiados y minutos totales del periodo (RF-15).
function resumenDelPeriodo(periodo, sesiones, hoy) {
  var minutos = minutosPorDia(sesiones, hoy);
  var dias = 0;
  var total = 0;

  diasDelPeriodo(periodo).forEach(function (fecha) {
    if (minutos[fecha] === undefined) return;
    dias++;
    total += minutos[fecha];
  });

  if (dias === 0) return textoVacio(esPeriodoActual(periodo, hoy));

  var primerParte = dias === 1 ? "1 día estudiado" : dias + " días estudiados";
  return primerParte + " · " + formatearTiempo(total) + " en este periodo";
}

// Primera fecha con sesión válida, o null si no hay ninguna.
function primeraSesionValida(sesiones, hoy) {
  var primera = null;
  sesiones.forEach(function (s) {
    if (!esFechaValida(s.fecha)) return;
    if (s.fecha > hoy) return;
    if (primera === null || s.fecha < primera) primera = s.fecha;
  });
  return primera;
}

// ◀ sigue disponible mientras no se llegue al periodo que contiene
// la primera sesión válida (RF-11).
function puedeRetroceder(periodo, sesiones, hoy) {
  var primera = primeraSesionValida(sesiones, hoy);
  if (primera === null) return false;

  var limite = periodoQueContiene(primera, hoy);
  return periodo.inicio > limite.inicio;
}

// Regla única del aviso (RF-14): hay aviso si hoy es distinto del
// día del último pintado y no se ha cerrado hoy.
function debeMostrarAvisoDia(ultimoPintado, hoy, diaDeCierre) {
  if (ultimoPintado === null || ultimoPintado === undefined) return false;
  return hoy !== ultimoPintado && hoy !== diaDeCierre;
}

// ---------- Mostrar en pantalla ----------

function pintarRacha(sesiones) {
  var racha = calcularRacha(sesiones);
  document.getElementById("rachaNumero").textContent = racha;

  var texto = document.getElementById("rachaTexto");
  if (racha === 1) {
    texto.textContent = "día seguido estudiando";
  } else {
    texto.textContent = "días seguidos estudiando";
  }
}

// El bloque variable muestra solo 1 de las 3 estadísticas: la elegida.
// Se pinta siempre (también con 0) para no quedarse sin menú.
function pintarDatoVariable(sesiones) {
  var dato = leerDatoElegido();
  var valor = "";
  var etiqueta = "";

  if (dato === "mejor") {
    valor = String(calcularMejorRacha(sesiones));
    etiqueta = "mejor racha";
  } else if (dato === "total") {
    valor = formatearTiempo(sumarMinutos(sesiones));
    etiqueta = "total estudiado";
  } else {
    valor = String(calcularDiasEsteMes(sesiones));
    etiqueta = "días este mes";
  }

  document.getElementById("datoNumero").textContent = valor;
  document.getElementById("datoTexto").textContent = etiqueta;
}

// Marca con ✓ la opción del menú que se está mostrando.
function pintarOpcionActiva() {
  var elegido = leerDatoElegido();
  var opciones = document.querySelectorAll("#menuDato [data-dato]");

  for (var i = 0; i < opciones.length; i++) {
    var activo = opciones[i].getAttribute("data-dato") === elegido;
    opciones[i].classList.toggle("activo", activo);
    opciones[i].setAttribute("aria-checked", activo ? "true" : "false");
  }
}

function pintarLista(sesiones) {
  var lista = document.getElementById("lista");
  var vacio = document.getElementById("vacio");

  lista.innerHTML = "";

  if (sesiones.length === 0) {
    vacio.hidden = false;
    return;
  }
  vacio.hidden = true;

  // De la más reciente a la más antigua.
  var ordenadas = sesiones.slice().sort(function (a, b) {
    if (a.fecha === b.fecha) return 0;
    return a.fecha < b.fecha ? 1 : -1;
  });

  ordenadas.forEach(function (s) {
    var li = document.createElement("li");

    var izquierda = document.createElement("div");
    izquierda.innerHTML =
      '<span class="fecha"></span><span class="tema"></span>';
    izquierda.querySelector(".fecha").textContent = fechaLegible(s.fecha);
    izquierda.querySelector(".tema").textContent = s.tema;

    var derecha = document.createElement("span");
    derecha.className = "minutos";
    derecha.textContent = s.minutos + " min";

    li.appendChild(izquierda);
    li.appendChild(derecha);
    lista.appendChild(li);
  });
}

// Pinta las 56 celdas: cada una lleva su fecha y su nivel, y la de
// hoy su marca (RF-1, RF-3, RF-4 y RF-5). Las celdas son <div> para
// que no reciban foco (RF-11).
function pintarMapa(sesiones, periodo, hoy) {
  var cuadricula = document.getElementById("mapaCuadricula");
  var celdas = datosDelMapa(periodo, sesiones, hoy);

  cuadricula.innerHTML = "";
  celdas.forEach(function (celda) {
    var nueva = document.createElement("div");
    nueva.className = "mapa__celda nivel-" + celda.nivel +
      (celda.esHoy ? " mapa__celda--hoy" : "");
    nueva.setAttribute("data-fecha", celda.fecha);
    cuadricula.appendChild(nueva);
  });

  cuadricula.setAttribute(
    "aria-label",
    "Mapa de calor, del " + rangoDelPeriodo(periodo)
  );
}

// Ocho columnas de mes: una etiqueta cuando cambia de mes (RF-6).
function pintarMeses(periodo) {
  var fila = document.getElementById("mapaMeses");
  var etiquetas = etiquetasDeMes(periodo);

  fila.innerHTML = "";
  etiquetas.forEach(function (texto) {
    var columna = document.createElement("span");
    columna.className = "mapa__mes";
    columna.textContent = texto;
    fila.appendChild(columna);
  });
}

// El rango del periodo: arriba a la izquierda (RF-7).
function pintarRango(periodo) {
  document.getElementById("mapaRango").textContent = rangoDelPeriodo(periodo);
}

// ◀ se oculta en el límite; ▶ y "Volver a hoy" solo faltan en el
// periodo actual (RF-11).
function pintarControles(periodo, sesiones, hoy) {
  var enActual = esPeriodoActual(periodo, hoy);

  document.getElementById("mapaAnterior").hidden =
    !puedeRetroceder(periodo, sesiones, hoy);
  document.getElementById("mapaSiguiente").hidden = enActual;
  document.getElementById("mapaHoy").hidden = enActual;
}

// Días estudiados y total del periodo, o el texto de vacío (RF-10 y RF-15).
function pintarResumen(periodo, sesiones, hoy) {
  document.getElementById("mapaResumen").textContent =
    resumenDelPeriodo(periodo, sesiones, hoy);
}

function pintarTodo() {
  var sesiones = leerSesiones();
  var hoy = hoyISO();

  // Al abrir o recargar, el mapa empieza en el periodo actual (RF-11).
  if (periodoMostrado === null) periodoMostrado = periodoActual(hoy);

  pintarRacha(sesiones);
  pintarDatoVariable(sesiones);
  pintarOpcionActiva();
  pintarLista(sesiones);

  pintarMapa(sesiones, periodoMostrado, hoy);
  pintarMeses(periodoMostrado);
  pintarRango(periodoMostrado);
  pintarControles(periodoMostrado, sesiones, hoy);
  pintarResumen(periodoMostrado, sesiones, hoy);

  // Los cinco casos del RF-13 actualizan la referencia del aviso y
  // con eso lo cancelan (RF-13 y RF-14).
  fechaUltimoPintado = hoy;
  ocultarAvisoDia();
}

// ---------- Menú del bloque variable ----------

var botonMenu = document.getElementById("botonMenu");
var menuDato = document.getElementById("menuDato");

function abrirMenu() {
  menuDato.hidden = false;
  botonMenu.setAttribute("aria-expanded", "true");
}

function cerrarMenu() {
  menuDato.hidden = true;
  botonMenu.setAttribute("aria-expanded", "false");
}

// El botón ☰ abre y cierra el menú.
botonMenu.addEventListener("click", function (evento) {
  evento.stopPropagation();
  if (menuDato.hidden) {
    abrirMenu();
  } else {
    cerrarMenu();
  }
});

// Al elegir una opción se guarda y se vuelve a pintar.
menuDato.addEventListener("click", function (evento) {
  var opcion = evento.target.closest("[data-dato]");
  if (!opcion) return;

  guardarDatoElegido(opcion.getAttribute("data-dato"));
  cerrarMenu();
  pintarTodo();
});

// El menú también se cierra al pulsar fuera.
document.addEventListener("click", function (evento) {
  if (menuDato.hidden) return;
  if (menuDato.contains(evento.target)) return;
  if (botonMenu.contains(evento.target)) return;
  cerrarMenu();
});

// Y con la tecla Esc.
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") cerrarMenu();
});

// ---------- Formulario ----------

var formulario = document.getElementById("formulario");
var aviso = document.getElementById("aviso");

// Fecha por defecto: hoy.
document.getElementById("fecha").value = hoyISO();

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  var fecha = document.getElementById("fecha").value;
  var tema = document.getElementById("tema").value.trim();
  var minutos = Number(document.getElementById("minutos").value);

  // Validaciones (el "required" ya ayuda, aquí reforzamos).
  if (!fecha) {
    mostrarAviso("Elige una fecha.");
    return;
  }
  if (tema === "") {
    mostrarAviso("Escribe el tema de la sesión.");
    return;
  }
  if (!Number.isFinite(minutos) || minutos <= 0) {
    mostrarAviso("Los minutos deben ser un número mayor que 0.");
    return;
  }

  var sesiones = leerSesiones();
  sesiones.push({
    fecha: fecha,
    tema: tema,
    minutos: minutos
  });
  guardarSesiones(sesiones);

  formulario.reset();
  document.getElementById("fecha").value = hoyISO();
  ocultarAviso();
  // Guardar es el caso 3 del RF-13: aunque se esté en un periodo
  // antiguo, el mapa vuelve al periodo actual.
  periodoMostrado = periodoActual(hoyISO());
  pintarTodo();
});

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.hidden = false;
}

function ocultarAviso() {
  aviso.hidden = true;
  aviso.textContent = "";
}

// ---------- Mapa: navegación entre periodos ----------

var mapaCuadricula = document.getElementById("mapaCuadricula");

document.getElementById("mapaAnterior").addEventListener("click", function () {
  periodoMostrado = periodoAnterior(periodoMostrado);
  pintarTodo();
});

document.getElementById("mapaSiguiente").addEventListener("click", function () {
  periodoMostrado = periodoSiguiente(periodoMostrado, hoyISO());
  pintarTodo();
});

document.getElementById("mapaHoy").addEventListener("click", function () {
  periodoMostrado = periodoActual(hoyISO());
  pintarTodo();
});

// ---------- Mapa: línea de detalle ----------

function mostrarDetalle(fecha) {
  var minutos = minutosPorDia(leerSesiones(), hoyISO())[fecha];
  document.getElementById("mapaDetalle").textContent = textoDetalle(fecha, minutos);
}

function vaciarDetalle() {
  document.getElementById("mapaDetalle").textContent = "";
}

// La fecha vive en la celda; si el evento viene de fuera no hay nada.
function fechaDeCelda(elemento) {
  if (!elemento || typeof elemento.getAttribute !== "function") return null;
  return elemento.getAttribute("data-fecha");
}

// Ratón: al pasar por una celda se pinta (RF-8) y al salir de la
// cuadrícula se vacía.
mapaCuadricula.addEventListener("mouseover", function (evento) {
  var fecha = fechaDeCelda(evento.target);
  if (fecha) mostrarDetalle(fecha);
});

mapaCuadricula.addEventListener("mouseleave", vaciarDetalle);

// Toque o clic: se mantiene visible aunque se repita en la misma
// celda (no alterna).
mapaCuadricula.addEventListener("click", function (evento) {
  var fecha = fechaDeCelda(evento.target);
  if (fecha) mostrarDetalle(fecha);
});

// ---------- Aviso de día nuevo (RF-14) ----------

// Muestra el aviso si ha cambiado el día y no se ha cerrado hoy.
// Solo consulta y pinta la franja: nunca repinta el resto.
function comprobarDia() {
  if (!debeMostrarAvisoDia(fechaUltimoPintado, hoyISO(), diaAvisoCerrado)) return;
  document.getElementById("avisoDia").hidden = false;
}

function ocultarAvisoDia() {
  document.getElementById("avisoDia").hidden = true;
}

// (a) Al volver la pestaña a estar visible.
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") comprobarDia();
});

// (b) Al interactuar: clic (también los toques), y tecla.
// También se vacía el detalle al pulsar fuera de la cuadrícula:
// fuera de la leyenda, de ◀ o de ▶ (RF-8).
document.addEventListener("click", function (evento) {
  var dentroDeLaCuadricula = mapaCuadricula.contains(evento.target);
  if (!dentroDeLaCuadricula) vaciarDetalle();
  comprobarDia();
});

document.addEventListener("keydown", comprobarDia);

document.getElementById("avisoDiaCerrar").addEventListener("click", function () {
  diaAvisoCerrado = hoyISO();
  ocultarAvisoDia();
});

// ---------- Arranque ----------
pintarTodo();

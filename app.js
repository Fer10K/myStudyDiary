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

function pintarTodo() {
  var sesiones = leerSesiones();
  pintarRacha(sesiones);
  pintarDatoVariable(sesiones);
  pintarOpcionActiva();
  pintarLista(sesiones);
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

// ---------- Arranque ----------
pintarTodo();

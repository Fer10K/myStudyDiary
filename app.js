// ============================================================
// Diario de Estudio - lógica principal
// ============================================================

var CLAVE = "diario-estudio-sesiones";

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

function pintarMejorRacha(sesiones) {
  var bloque = document.getElementById("mejorRacha");
  var mejor = calcularMejorRacha(sesiones);

  // Todavía no hay ningún día con sesión: no se muestra.
  if (mejor === 0) {
    bloque.hidden = true;
    return;
  }

  bloque.hidden = false;
  document.getElementById("mejorNumero").textContent = mejor;
  document.getElementById("mejorTexto").textContent = "mejor racha";
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
  pintarMejorRacha(sesiones);
  pintarLista(sesiones);
}

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

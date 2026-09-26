// SARCE — interacciones de maquetado (sin backend real; es una demo visual)

document.addEventListener("DOMContentLoaded", function () {
  // --- Menú lateral en móvil ---
  var btnMenu = document.querySelector(".btn-menu-movil");
  var sidebar = document.querySelector(".app-sidebar");
  var overlay = document.querySelector(".overlay-sidebar");

  function abrirMenu() {
    sidebar && sidebar.classList.add("abierto");
    overlay && overlay.classList.add("visible");
  }
  function cerrarMenu() {
    sidebar && sidebar.classList.remove("abierto");
    overlay && overlay.classList.remove("visible");
  }

  if (btnMenu) btnMenu.addEventListener("click", abrirMenu);
  if (overlay) overlay.addEventListener("click", cerrarMenu);

  // --- Selector de rol en el login (estudiante / docente) ---
  var botonesRol = document.querySelectorAll(".btn-rol");
  var inputRol = document.getElementById("rolSeleccionado");
  var formLogin = document.getElementById("formLogin");

  botonesRol.forEach(function (btn) {
    btn.addEventListener("click", function () {
      botonesRol.forEach(function (b) { b.classList.remove("activo"); });
      btn.classList.add("activo");
      if (inputRol) inputRol.value = btn.dataset.rol;
    });
  });

  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      var rol = inputRol ? inputRol.value : "estudiante";
      window.location.href = rol === "docente"
        ? "docente-calificaciones.html"
        : "estudiante-notas.html";
    });
  }

  // --- Confirmación para desactivar/reactivar estudiante ---
  var modalEstadoEl = document.getElementById("modalEstado");
  if (modalEstadoEl && window.bootstrap) {
    var modalEstado = new bootstrap.Modal(modalEstadoEl);
    document.querySelectorAll("[data-cambiar-estado]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nombre = btn.dataset.nombreEstudiante || "";
        var accion = btn.dataset.accion || "desactivar";
        var titulo = document.getElementById("modalEstadoNombre");
        var textoAccion = document.getElementById("modalEstadoAccion");
        var btnConfirmar = document.getElementById("btnConfirmarEstado");
        if (titulo) titulo.textContent = nombre;
        if (textoAccion) {
          textoAccion.textContent = accion === "desactivar"
            ? "desactivar temporalmente"
            : "reactivar";
        }
        if (btnConfirmar) {
          btnConfirmar.className = accion === "desactivar"
            ? "btn btn-sarce"
            : "btn btn-dorado";
          btnConfirmar.style.background = accion === "desactivar" ? "" : "";
        }
        modalEstado.show();
      });
    });
  }
});

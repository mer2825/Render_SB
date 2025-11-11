document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formIniciarSesion");

  form.addEventListener("submit", function (e) {
    // 1. Recolección de datos
    const usuario = document.getElementById("nombreUsuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    // 2. Validación simple de campos vacíos
    if (!usuario || !contrasena) {
      alert("Por favor, ingresa tu Usuario y Contraseña.");
      e.preventDefault(); // Detiene el envío si faltan datos
      return;
    }

    // El formulario se envía al servidor (a /login)
  });
});
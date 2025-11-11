package com.example.acceso.controller;

import com.example.acceso.model.Empresa;
import com.example.acceso.model.Opcion;
import com.example.acceso.model.Usuario;
import com.example.acceso.service.EmpresaService;
import com.example.acceso.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Controller
public class LoginController {
    private final UsuarioService usuarioService;
    private final EmpresaService empresaService; // Inyectar EmpresaService

    public LoginController(UsuarioService usuarioService, EmpresaService empresaService) {
        this.usuarioService = usuarioService;
        this.empresaService = empresaService; // Añadir al constructor
    }

    @GetMapping("/login")
    public String mostrarFormularioLogin(HttpSession session, Model model) { // Añadir Model
        if (session.getAttribute("usuarioLogueado") != null) {
            return "redirect:/";
        }
        
        // Cargar la información de la empresa y añadirla al modelo
        Empresa empresa = empresaService.getEmpresaInfo();
        model.addAttribute("empresa", empresa);

        return "login";
    }

    @PostMapping("/login")
    public String procesarLogin(@RequestParam String usuario, @RequestParam String clave, HttpSession session,
            RedirectAttributes redirectAttributes) {
        Optional<Usuario> usuarioOpt = usuarioService.findByUsuario(usuario);

        if (usuarioOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Usuario no encontrado.");
            return "redirect:/login";
        }

        Usuario usuarioEncontrado = usuarioOpt.get();

        if (usuarioEncontrado.getEstado() != 1) {
            redirectAttributes.addFlashAttribute("error", "Este usuario se encuentra inactivo.");
            return "redirect:/login";
        }

        if (usuarioService.verificarContrasena(clave, usuarioEncontrado.getClave())) {
            session.setAttribute("usuarioLogueado", usuarioEncontrado);

            // --- INICIO DE LA LÓGICA DE ADMINISTRADOR ---
            boolean isAdmin = usuarioEncontrado.getPerfil() != null && "administrador".equalsIgnoreCase(usuarioEncontrado.getPerfil().getNombre());
            session.setAttribute("isAdmin", isAdmin);
            // --- FIN DE LA LÓGICA DE ADMINISTRADOR ---

            List<Opcion> opcionesMenu = new ArrayList<>(usuarioEncontrado.getPerfil().getOpciones().stream()
                    .sorted(Comparator.comparing(Opcion::getId))
                    .toList());

            // Crear y añadir la opción de Dashboard/Inicio
            Opcion dashboardOpcion = new Opcion();
            dashboardOpcion.setId(0L); // Asumiendo que 0 lo colocará al principio o no causará conflicto
            dashboardOpcion.setNombre("Inicio");
            dashboardOpcion.setRuta("/");
            dashboardOpcion.setIcono("bi-house-door-fill"); // Un ícono de ejemplo para 'Inicio'
            opcionesMenu.add(0, dashboardOpcion);

            if (isAdmin) {
                Opcion ventasWebOpcion = new Opcion();
                ventasWebOpcion.setNombre("Ventas Web");
                ventasWebOpcion.setRuta("/ventas/web");
                ventasWebOpcion.setIcono("bi-cart-check-fill");
                opcionesMenu.add(ventasWebOpcion);
            }


            session.setAttribute("menuOpciones", opcionesMenu);

            return "redirect:/";
        } else {
            redirectAttributes.addFlashAttribute("error", "Contraseña incorrecta.");
            return "redirect:/login";
        }
    }

    @GetMapping("/logout")
    public String logout(HttpSession session, RedirectAttributes redirectAttributes) {
        session.invalidate();
        redirectAttributes.addFlashAttribute("logout", "Has cerrado sesión exitosamente.");
        return "redirect:/login";
    }
}

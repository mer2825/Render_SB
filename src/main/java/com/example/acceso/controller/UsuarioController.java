package com.example.acceso.controller;

import com.example.acceso.dto.AuditDetailsDto;
import com.example.acceso.model.Usuario;
import com.example.acceso.service.PerfilService;
import com.example.acceso.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final PerfilService perfilService;

    public UsuarioController(UsuarioService usuarioService, PerfilService perfilService) {
        this.usuarioService = usuarioService;
        this.perfilService = perfilService;
    }

    private boolean esAdministrador(HttpSession session) {
        Boolean isAdmin = (Boolean) session.getAttribute("isAdmin");
        return isAdmin != null && isAdmin;
    }

    @GetMapping("/listar")
    public String listarUsuarios(Model model) {
        return "usuarios";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarUsuariosApi() {
        Map<String, Object> response = new HashMap<>();
        List<Usuario> usuarios = usuarioService.listarUsuarios();
        response.put("success", true);
        response.put("data", usuarios);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/perfiles")
    @ResponseBody
    public ResponseEntity<?> listarPerfilesActivosApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("data", perfilService.listarPerfilesActivos());
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarUsuarioAjax(@Valid @RequestBody Usuario usuario, BindingResult bindingResult, HttpSession session) {
        if (!esAdministrador(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "Acceso denegado."));
        }
        Map<String, Object> response = new HashMap<>();
        if (bindingResult.hasErrors()) {
            Map<String, String> errores = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> errores.put(error.getField(), error.getDefaultMessage()));
            response.put("success", false);
            response.put("message", "Datos inválidos");
            response.put("errors", errores);
            return ResponseEntity.badRequest().body(response);
        }
        try {
            Usuario usuarioGuardado = usuarioService.guardarUsuario(usuario);
            response.put("success", true);
            response.put("usuario", usuarioGuardado);
            response.put("message", usuario.getId() != null ? "Usuario actualizado" : "Usuario creado");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        return usuarioService.obtenerUsuarioPorId(id)
                .map(usuario -> ResponseEntity.ok(Map.of("success", true, "data", usuario)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarUsuarioAjax(@PathVariable Long id, HttpSession session) {
        if (!esAdministrador(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "Acceso denegado."));
        }
        try {
            usuarioService.eliminarUsuario(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Usuario eliminado"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/cambiar-estado/{id}")
    @ResponseBody
    public ResponseEntity<?> cambiarEstadoUsuarioAjax(@PathVariable Long id, HttpSession session) {
        if (!esAdministrador(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", "Acceso denegado."));
        }
        return usuarioService.cambiarEstadoUsuario(id)
                .map(usuario -> ResponseEntity.ok(Map.of("success", true, "message", "Estado actualizado")))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Usuario no encontrado")));
    }

    @GetMapping("/api/audit-details/{id}")
    @ResponseBody
    public ResponseEntity<AuditDetailsDto> getAuditDetails(@PathVariable Long id) {
        try {
            AuditDetailsDto dto = usuarioService.getAuditDetails(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
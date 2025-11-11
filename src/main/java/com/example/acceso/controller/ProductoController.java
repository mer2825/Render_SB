package com.example.acceso.controller;

import java.io.IOException; // Se asume este modelo
import java.nio.file.Files; // Se asume este servicio
import java.nio.file.Path; // Se asume este servicio
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.example.acceso.model.Producto;
import com.example.acceso.service.CategoriaService;
import com.example.acceso.service.ProductoService;
import com.example.acceso.dto.AuditDetailsDto;

import jakarta.validation.Valid;

// @Controller: Indica que esta clase es un controlador web.
// @RequestMapping("/productos"): Todas las rutas de este controlador empezarán con "/productos".
@Controller
@RequestMapping("/productos")
public class ProductoController {
    // Inyección de los servicios necesarios.
    private final ProductoService productoService;
    private final CategoriaService categoriaService; // Análogo a PerfilService

    public ProductoController(ProductoService productoService, CategoriaService categoriaService) {
        this.productoService = productoService;
        this.categoriaService = categoriaService;
    }

    // GET /productos/listar: Muestra la página HTML principal de gestión de
    // productos.
    @GetMapping("/listar")
    public String listarProductos(Model model) {
        // Prepara el modelo inicial y carga los datos para los modales (ej. lista de categorías).
        List<Producto> productos = productoService.listarProductos();
        model.addAttribute("productos", productos);
        model.addAttribute("formProducto", new Producto());
        // El nombre de la vista cambia de "usuarios" a "productos"
        return "productos";
    }

    @GetMapping("/activos")
    public String listarProductosActivos(Model model) {
        // Prepara el modelo inicial y carga los datos para los modales (ej. lista de categorías).
        List<Producto> productos = productoService.listarProductosActivos();
        model.addAttribute("productos", productos);
        model.addAttribute("formProducto", new Producto());
        // El nombre de la vista cambia de "usuarios" a "productos"
        return "productos";
    }

    @GetMapping("/api/activos")
    @ResponseBody
    public ResponseEntity<?> listarProductosActivosApi() {
        Map<String, Object> response = new HashMap<>();
        List<Producto> productos = productoService.listarProductosActivos();
        response.put("success", true);
        response.put("data", productos);
        return ResponseEntity.ok(response);
    }


    // GET /productos/api/listar: Endpoint de la API que devuelve la lista de
    // productos en formato JSON.
    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarProductosApi() {
        Map<String, Object> response = new HashMap<>();
        List<Producto> productos = productoService.listarProductos();
        response.put("success", true);
        response.put("data", productos);
        return ResponseEntity.ok(response);
    }

    // GET /productos/api/categorias: Endpoint para obtener la lista de categorías
    // activas (análogo a /api/perfiles).
    @GetMapping("/api/categorias")
    @ResponseBody
    public ResponseEntity<?> listarCategoriasActivasApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        // Se llama al servicio de Categoría (análogo a perfilService)
        response.put("data", categoriaService.listarCategoriasActivas());
        return ResponseEntity.ok(response);
    }

    // POST /productos/api/guardar: Endpoint para crear o actualizar un producto.
    // @RequestBody: Convierte el cuerpo JSON de la petición en un objeto Producto.
    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarProductoAjax(@Valid @RequestBody Producto producto, BindingResult bindingResult) {
        Map<String, Object> response = new HashMap<>();

        // Si hay errores de validación (ej. un campo obligatorio está vacío).
        if (bindingResult.hasErrors()) {
            // Recopila los errores y los devuelve en la respuesta JSON.
            Map<String, String> errores = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> errores.put(error.getField(), error.getDefaultMessage()));
            response.put("success", false);
            response.put("message", "Datos de producto inválidos");
            response.put("errors", errores);
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Llama al servicio para guardar el producto.
            Producto productoGuardado = productoService.guardarProducto(producto);
            response.put("success", true);
            response.put("producto", productoGuardado);
            response.put("message",
                    producto.getId() != null ? "Producto actualizado correctamente" : "Producto creado correctamente");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage()); // Mensaje directo de la excepción
            return ResponseEntity.badRequest().body(response); // 400 Bad Request
        } catch (Exception e) {
            // Captura cualquier otra excepción del servicio.
            response.put("success", false);
            response.put("message", "Error interno del servidor al guardar producto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // POST /productos/api/subir-imagen: Endpoint para subir la imagen de un producto.
    @PostMapping("/api/subir-imagen")
    @ResponseBody
    public ResponseEntity<?> subirImagen(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "El archivo está vacío.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Ruta externa donde se guardarán las imágenes.
            String uploadDir = "C:/acceso/Images/";
            Path uploadPath = Paths.get(uploadDir);

            // Crear el directorio si no existe.
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generar un nombre de archivo único para evitar sobreescrituras.
            String originalFilename = file.getOriginalFilename();
            String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);

            // La URL pública que se guardará en la base de datos y usará el frontend.
            String imageUrl = "/images/" + uniqueFilename;

            response.put("success", true);
            response.put("message", "Imagen subida correctamente.");
            response.put("imageUrl", imageUrl); // Devolvemos la URL pública.
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Error al subir la imagen: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/view")
    public String viewProductos() {
        // Devuelve el nombre del archivo HTML de Thymeleaf sin la extensión
        return "productosView";
        // Spring Boot buscará en src/main/resources/templates/productosView.html
    }

    @GetMapping("/api/{id}")
    // GET /productos/api/{id}: Devuelve los datos de un único producto por su ID.
    @ResponseBody
    public ResponseEntity<?> obtenerProducto(@PathVariable Long id) {
        try {
            return productoService.obtenerProductoPorId(id).map(producto -> {
                // Si el producto se encuentra, lo envuelve en una respuesta exitosa.
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", producto);
                return ResponseEntity.ok(response);
            }).orElseGet(() -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Producto no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            });
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error al obtener producto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // DELETE /productos/api/eliminar/{id}: Realiza el borrado lógico de un producto (cambio de estado a inactivo).
    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarProductoAjax(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Se asume que el método 'eliminarProducto' en el servicio hace un borrado lógico (cambio de estado).
            if (!productoService.obtenerProductoPorId(id).isPresent()) {
                response.put("success", false);
                response.put("message", "Producto no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            productoService.eliminarProducto(id);
            response.put("success", true);
            response.put("message", "Producto marcado como inactivo (eliminado lógicamente) correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar producto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // POST /productos/api/cambiar-estado/{id}: Activa o desactiva un producto.
    @PostMapping("/api/cambiar-estado/{id}")
    @ResponseBody
    public ResponseEntity<?> cambiarEstadoProductoAjax(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Llama al servicio para cambiar el estado.
            return productoService.cambiarEstadoProducto(id)
                    .map(producto -> {
                        response.put("success", true);
                        response.put("producto", producto);
                        response.put("message", "Estado del producto actualizado correctamente");
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        // Si el servicio no encuentra el producto, devuelve un error 404.
                        response.put("success", false);
                        response.put("message", "Producto no encontrado");
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                    });
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al cambiar estado del producto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/api/audit-details/{id}")
    @ResponseBody
    public ResponseEntity<AuditDetailsDto> getAuditDetails(@PathVariable Long id) {
        try {
            AuditDetailsDto dto = productoService.getAuditDetails(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
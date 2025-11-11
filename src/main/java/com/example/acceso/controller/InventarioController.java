package com.example.acceso.controller;

import com.example.acceso.model.Producto;
import com.example.acceso.service.ProductoService;
import com.example.acceso.dto.MovimientoProductoDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class InventarioController {

    private final ProductoService productoService;

    public InventarioController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping("/inventario/listar")
    public String listarInventario(Model model) {
        List<Producto> productos = productoService.listarProductos();
        model.addAttribute("productos", productos);
        model.addAttribute("activeUri", "/inventario/listar");
        return "inventario";
    }

    @GetMapping("/inventario/api/movimientos/{id}")
    @ResponseBody
    public ResponseEntity<?> getMovimientosProducto(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<MovimientoProductoDTO> movimientos = productoService.getMovimientosByProductId(id);
            response.put("success", true);
            response.put("data", movimientos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener movimientos del producto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

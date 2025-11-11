package com.example.acceso.controller;

import com.example.acceso.model.*;
import com.example.acceso.service.*;
import com.example.acceso.dto.ProductoMasVendidoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/ventas")
public class VentaController {

    private final VentaService ventaService;
    private final ProductoService productoService;
    private final CategoriaService categoriaService;
    private final EmpresaService empresaService;
    private final VentaWebService ventaWebService;

    @Autowired
    public VentaController(VentaService ventaService, ProductoService productoService, CategoriaService categoriaService, EmpresaService empresaService, VentaWebService ventaWebService) {
        this.ventaService = ventaService;
        this.productoService = productoService;
        this.categoriaService = categoriaService;
        this.empresaService = empresaService;
        this.ventaWebService = ventaWebService;
    }

    @GetMapping("/listar")
    public String listarVentas() {
        return "ventas";
    }

    @GetMapping("/web")
    public String listarVentasWeb() {
        return "ventas-web";
    }

    @GetMapping("/nueva")
    public String nuevaVenta(Model model) {
        List<Categoria> categoriasActivas = categoriaService.listarCategoriasActivas();
        List<Producto> productosActivos = productoService.listarProductosActivos();
        Map<Categoria, List<Producto>> productosPorCategoria = categoriasActivas.stream()
                .collect(Collectors.toMap(
                        categoria -> categoria,
                        categoria -> productosActivos.stream()
                                .filter(p -> p.getCategoria() != null && p.getCategoria().getId().equals(categoria.getId()))
                                .collect(Collectors.toList())
                ));
        model.addAttribute("productosPorCategoria", productosPorCategoria);
        return "nueva-venta";
    }

    @GetMapping("/modificar/{id}")
    public String modificarVenta(@PathVariable Long id, Model model) {
        List<Categoria> categoriasActivas = categoriaService.listarCategoriasActivas();
        List<Producto> productosActivos = productoService.listarProductosActivos();
        Map<Categoria, List<Producto>> productosPorCategoria = categoriasActivas.stream()
                .collect(Collectors.toMap(
                        categoria -> categoria,
                        categoria -> productosActivos.stream()
                                .filter(p -> p.getCategoria() != null && p.getCategoria().getId().equals(categoria.getId()))
                                .collect(Collectors.toList())
                ));
        model.addAttribute("productosPorCategoria", productosPorCategoria);
        model.addAttribute("ventaId", id); // Pasar el ID de la venta a la vista
        return "modificar-venta";
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarVenta(@RequestBody Venta venta) {
        try {
            Venta ventaCreada = ventaService.crearVenta(venta);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta registrada con éxito", "ventaId", ventaCreada.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/web/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarVentaWeb(@RequestBody VentaWeb ventaWeb) {
        try {
            VentaWeb ventaGuardada = ventaWebService.guardarVentaWeb(ventaWeb);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pedido web registrado con éxito", "ventaWebId", ventaGuardada.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarVentasApi(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        List<Map<String, Object>> ventas;
        if (desde != null && hasta != null) {
            LocalDateTime fechaInicio = desde.atStartOfDay();
            LocalDateTime fechaFin = hasta.atTime(23, 59, 59);
            ventas = ventaService.buscarVentasPorRangoDeFechas(fechaInicio, fechaFin);
        } else {
            ventas = ventaService.listarTodasLasVentas();
        }
        return ResponseEntity.ok(Map.of("success", true, "data", ventas));
    }

    @GetMapping("/api/web")
    @ResponseBody
    public ResponseEntity<?> listarVentasWebApi() {
        List<VentaWeb> ventas = ventaWebService.listarTodasLasVentasWeb();
        return ResponseEntity.ok(Map.of("success", true, "data", ventas));
    }

    @PostMapping("/api/web/procesar/{id}")
    @ResponseBody
    public ResponseEntity<?> procesarVentaWeb(@PathVariable Long id) {
        try {
            ventaWebService.procesarVentaWeb(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta procesada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Error al procesar la venta: " + e.getMessage()));
        }
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarVenta(@PathVariable Long id) {
        try {
            ventaService.eliminarVenta(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta anulada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Error al anular la venta: " + e.getMessage()));
        }
    }

    @GetMapping("/api/detalle/{id}")
    @ResponseBody
    public ResponseEntity<?> obtenerDetalleVenta(@PathVariable Long id) {
        return ventaService.obtenerVentaDetalladaPorId(id)
                .map(ventaMap -> ResponseEntity.ok(Map.of("success", true, "data", ventaMap)))
                .orElse(ResponseEntity.badRequest().body(Map.of("success", false, "message", "Venta no encontrada")));
    }

    @PutMapping("/api/actualizar/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarVenta(@PathVariable Long id, @RequestBody Venta venta) {
        try {
            ventaService.actualizarVenta(id, venta);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta actualizada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Error al actualizar la venta: " + e.getMessage()));
        }
    }

    @GetMapping("/imprimir/{id}")
    public String imprimirBoleta(@PathVariable Long id, Model model) {
        return ventaService.obtenerVentaPorId(id)
                .map(venta -> {
                    model.addAttribute("venta", venta);
                    model.addAttribute("empresa", empresaService.getEmpresaInfo());
                    return "boleta";
                })
                .orElseGet(() -> {
                    model.addAttribute("errorMessage", "Venta no encontrada para imprimir.");
                    return "error";
                });
    }

    @GetMapping("/api/top5-productos-semana")
    @ResponseBody
    public ResponseEntity<List<ProductoMasVendidoDTO>> getTop5ProductosMasVendidosDeLaSemana() {
        List<ProductoMasVendidoDTO> topProductos = ventaService.obtenerTop5ProductosMasVendidosDeLaSemana();
        return ResponseEntity.ok(topProductos);
    }
}

package com.example.acceso.controller;

import com.example.acceso.service.VentaService;
import com.example.acceso.dto.ProductoMasVendidoDTO;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.math.BigDecimal;
import java.util.List;

@Controller
public class DashboardController {

    private final VentaService ventaService;

    public DashboardController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @GetMapping("/")
    public String mostrarDashboard(Model model) {
        long ventasDiariasNumero = ventaService.obtenerNumeroVentasDiarias();
        BigDecimal ventasDiariasTotal = ventaService.obtenerTotalVentasDiarias();
        long ventasMensualesNumero = ventaService.obtenerNumeroVentasMensuales();
        BigDecimal ventasMensualesTotal = ventaService.obtenerTotalVentasMensuales();

        List<ProductoMasVendidoDTO> top5Productos = ventaService.obtenerTop5ProductosMasVendidosDeLaSemana();

        model.addAttribute("ventasDiariasNumero", ventasDiariasNumero);
        model.addAttribute("ventasDiariasTotal", ventasDiariasTotal);
        model.addAttribute("ventasMensualesNumero", ventasMensualesNumero);
        model.addAttribute("ventasMensualesTotal", ventasMensualesTotal);
        model.addAttribute("top5Productos", top5Productos);

        return "index";
    }
}

package com.example.acceso.controller;

import com.example.acceso.model.Categoria;
import com.example.acceso.model.Empresa;
import com.example.acceso.model.Producto;
import com.example.acceso.service.CategoriaService;
import com.example.acceso.service.EmpresaService;
import com.example.acceso.service.ProductoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class CatalogoController {

    private final ProductoService productoService;
    private final CategoriaService categoriaService;
    private final EmpresaService empresaService;

    public CatalogoController(ProductoService productoService, CategoriaService categoriaService, EmpresaService empresaService) {
        this.productoService = productoService;
        this.categoriaService = categoriaService;
        this.empresaService = empresaService;
    }

    @GetMapping("/catalogo")
    public String verCatalogo(Model model) {
        // Cargar información de la empresa, que ahora contiene los productos destacados
        Empresa empresa = empresaService.getEmpresaInfo();
        model.addAttribute("empresaGlobal", empresa);

        // La lista para el carrusel ahora viene directamente de la entidad Empresa
        // model.addAttribute("productosDestacados", empresa.getProductosDestacados());

        // --- Lógica para el catálogo por categorías (sin cambios) ---
        List<Categoria> categoriasActivas = categoriaService.listarCategoriasActivas();
        List<Producto> productosActivos = productoService.listarProductosActivos();
        Map<Categoria, List<Producto>> productosPorCategoria = categoriasActivas.stream()
                .collect(Collectors.toMap(
                        categoria -> categoria,
                        categoria -> productosActivos.stream()
                                .filter(producto -> producto.getCategoria() != null && producto.getCategoria().getId().equals(categoria.getId()))
                                .collect(Collectors.toList())
                ))
                .entrySet().stream()
                .filter(entry -> !entry.getValue().isEmpty())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        model.addAttribute("productosPorCategoria", productosPorCategoria);

        return "catalogo";
    }
}

package com.example.acceso.service;

import com.example.acceso.model.Producto;
import com.example.acceso.model.DetalleVenta;
import com.example.acceso.model.Usuario;
import com.example.acceso.repository.ProductoRepository;
import com.example.acceso.repository.DetalleVentaRepository;
import com.example.acceso.repository.UsuarioRepository;
import com.example.acceso.dto.MovimientoProductoDTO;
import com.example.acceso.dto.AuditDetailsDto;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final UsuarioRepository usuarioRepository; // Inyectar UsuarioRepository

    public ProductoService(ProductoRepository productoRepository, DetalleVentaRepository detalleVentaRepository, UsuarioRepository usuarioRepository) {
        this.productoRepository = productoRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.usuarioRepository = usuarioRepository; // Inicializar
    }

    @Transactional(readOnly = true)
    public List<Producto> listarProductos() {
        return productoRepository.findAllByEstadoNot(2);
    }

    @Transactional(readOnly = true)
    public List<Producto> listarProductosActivos() {
        return productoRepository.findByEstado(1);
    }

    @Transactional(readOnly = true)
    public long contarProductos() {
        return productoRepository.countByEstado(1);
    }

    @Transactional
    public Producto guardarProducto(Producto producto) {
        boolean isNew = producto.getId() == null;
        
        if (producto.getNombre() == null || producto.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del producto es obligatorio");
        }
        if (producto.getPrecio() == null || producto.getPrecio().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor a cero");
        }
        if (producto.getStock() == null || producto.getStock() < 0) {
            throw new IllegalArgumentException("El stock no puede ser negativo");
        }
        if (producto.getStockMinimo() == null || producto.getStockMinimo() < 0) {
            throw new IllegalArgumentException("El stock mínimo no puede ser negativo");
        }
        if (producto.getCategoria() == null || producto.getCategoria().getId() == null) {
            throw new IllegalArgumentException("La categoría es obligatoria");
        }

        producto.setNombre(producto.getNombre().trim());
        if (producto.getDescripcion() != null) {
            producto.setDescripcion(producto.getDescripcion().trim());
        }

        // --- Duplicate name validation ---
        Optional<Producto> existingProduct = productoRepository.findByNombreIgnoreCaseAndEstadoNot(producto.getNombre(), 2);

        if (isNew) {
            if (existingProduct.isPresent()) {
                throw new IllegalArgumentException("No se puede crear este producto, porque ya existe un producto con el mismo nombre.");
            }
            producto.setEstado(1); // Nuevo producto, estado 1 (activo) por defecto
            producto.setUltimaAccion("Creación"); // Establecer acción de creación
        } else {
            if (existingProduct.isPresent() && !existingProduct.get().getId().equals(producto.getId())) {
                throw new IllegalArgumentException("No se puede actualizar este producto, porque ya existe otro producto con el mismo nombre.");
            }
            Producto productoExistente = obtenerProductoPorId(producto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado para actualizar"));
            if (producto.getEstado() == null) {
                producto.setEstado(productoExistente.getEstado());
            }
            // Si no se proporciona una nueva imagen, mantener la existente
            if (producto.getFoto() == null || producto.getFoto().isEmpty()) {
                producto.setFoto(productoExistente.getFoto());
            }
            producto.setUltimaAccion("Edición"); // Establecer acción de edición
        }

        try {
            return productoRepository.save(producto);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Ya existe un producto con este nombre");
        }
    }

    @Transactional(readOnly = true)
    public Optional<Producto> obtenerProductoPorId(Long id) {
        if (id == null || id <= 0) {
            return Optional.empty();
        }
        return productoRepository.findById(id);
    }

    @Transactional
    public void eliminarProducto(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("ID de producto inválido");
        }
        Producto producto = obtenerProductoPorId(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        producto.setEstado(2); // Borrado lógico: estado 2 (eliminado)
        producto.setUltimaAccion("Eliminación"); // Establecer acción de eliminación
        productoRepository.save(producto);
    }

    @Transactional
    public Optional<Producto> cambiarEstadoProducto(Long id) {
        if (id == null || id <= 0) {
            return Optional.empty();
        }
        return obtenerProductoPorId(id).map(producto -> {
            if (producto.getEstado() == 1) {
                producto.setEstado(0); // Desactivar
                producto.setUltimaAccion("Inactivación"); // Establecer acción de inactivación
            } else if (producto.getEstado() == 0) {
                producto.setEstado(1); // Activar
                producto.setUltimaAccion("Activación"); // Establecer acción de activación
            }
            // No se hace nada si el estado es 2 (eliminado)
            return productoRepository.save(producto);
        });
    }

    // Nuevo método para obtener los movimientos de un producto
    @Transactional(readOnly = true)
    public List<MovimientoProductoDTO> getMovimientosByProductId(Long productId) {
        List<DetalleVenta> detallesVenta = detalleVentaRepository.findByProductoId(productId);

        return detallesVenta.stream()
                .map(detalle -> new MovimientoProductoDTO(
                        detalle.getVenta().getNumeroVenta(),
                        detalle.getVenta().getFechaVenta(),
                        detalle.getPrecioUnitario(),
                        detalle.getCantidad(),
                        detalle.getSubtotal()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuditDetailsDto getAuditDetails(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");

        String creadoPorNombre = "Dato no disponible";
        if (producto.getCreadoPor() != null) {
            creadoPorNombre = usuarioRepository.findById(producto.getCreadoPor()).map(Usuario::getNombre).orElse("Usuario no encontrado");
        }

        String fechaCreacion = "Dato no disponible";
        if (producto.getFechaCreacion() != null) {
            fechaCreacion = producto.getFechaCreacion().format(formatter);
        }

        String modificadoPorNombre = "N/A";
        if (producto.getModificadoPor() != null) {
            modificadoPorNombre = usuarioRepository.findById(producto.getModificadoPor()).map(Usuario::getNombre).orElse("Usuario no encontrado");
        }

        String fechaModificacion = "N/A";
        if (producto.getFechaModificacion() != null) {
            fechaModificacion = producto.getFechaModificacion().format(formatter);
        }

        String ultimaAccion = producto.getUltimaAccion() != null ? producto.getUltimaAccion() : "N/A";

        return new AuditDetailsDto(creadoPorNombre, fechaCreacion, modificadoPorNombre, fechaModificacion, ultimaAccion);
    }
}
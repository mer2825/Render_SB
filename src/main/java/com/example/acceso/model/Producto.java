package com.example.acceso.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal; // Importación necesaria para el tipo Decimal

@Entity
@Table(name = "productos")
public class Producto extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación ManyToOne con Categorias (Análogo a Usuario -> Perfil)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria", nullable = false)
    @NotNull(message = "La categoría del producto es obligatoria")
    private Categoria categoria; // Asume la existencia de la clase Categoria

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(min = 2, max = 150, message = "El nombre debe tener entre 2 y 150 caracteres")
    @Column(nullable = false, length = 150)
    private String nombre;

    @Size(max = 1000, message = "La descripción no debe exceder los 1000 caracteres")
    @Column(length = 1000)
    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.01", inclusive = true, message = "El precio debe ser mayor a cero")
    @Column(nullable = false, precision = 12, scale = 2) // Coincide con DECIMAL(12,2)
    private BigDecimal precio;

    @NotNull(message = "El stock es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    @Column(nullable = false)
    private Integer stock; // Coincide con INT(11)

    @NotNull(message = "El stock mínimo es obligatorio")
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    @Column(nullable = false)
    private Integer stockMinimo; // Nuevo campo para el stock mínimo

    @Column(length = 255)
    private String foto; // Ruta de la foto del producto

    // Estado del producto (análogo a estado del usuario)
    // Usamos Integer para consistencia con los otros modelos (0: Inactivo, 1: Activo, 2: Eliminado)
    @Column(nullable = false)
    private Integer estado = 1; // 1: Activo, 0: Inactivo, 2: Eliminado

    // Constructor por defecto
    public Producto() {
    }

    // Constructor con parámetros (sin ID)
    public Producto(Categoria categoria, String nombre, String descripcion, BigDecimal precio, Integer stock, Integer stockMinimo, String foto) {
        this.categoria = categoria;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
        this.stockMinimo = stockMinimo; // Inicializar el nuevo campo
        this.foto = foto;
        this.estado = 1; // Estado activo por defecto
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Integer getStockMinimo() { // Getter para stockMinimo
        return stockMinimo;
    }

    public void setStockMinimo(Integer stockMinimo) { // Setter para stockMinimo
        this.stockMinimo = stockMinimo;
    }

    public String getFoto() {
        return foto;
    }

    public void setFoto(String foto) {
        this.foto = foto;
    }

    public Integer getEstado() {
        return estado;
    }

    public void setEstado(Integer estado) {
        this.estado = estado;
    }

    @Override
    public String toString() {
        return "Producto{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", precio=" + precio +
                ", stock=" + stock +
                ", stockMinimo=" + stockMinimo + // Incluir en toString
                ", foto='" + foto + '\'' +
                ", estado=" + estado +
                ", categoria=" + (categoria != null ? categoria.getNombre() : "null") +
                '\'' +
                '}';
    }
}
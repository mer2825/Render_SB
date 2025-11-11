package com.example.acceso.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ventas_web")
public class VentaWeb {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombreCliente;

    @Column(nullable = false)
    private String numeroDocumentoCliente;

    @Column(nullable = false)
    private LocalDateTime fechaPedido;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @OneToMany(mappedBy = "ventaWeb", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<DetalleVentaWeb> detalles;

    // Getters y Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public String getNumeroDocumentoCliente() {
        return numeroDocumentoCliente;
    }

    public void setNumeroDocumentoCliente(String numeroDocumentoCliente) {
        this.numeroDocumentoCliente = numeroDocumentoCliente;
    }

    public LocalDateTime getFechaPedido() {
        return fechaPedido;
    }

    public void setFechaPedido(LocalDateTime fechaPedido) {
        this.fechaPedido = fechaPedido;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public List<DetalleVentaWeb> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetalleVentaWeb> detalles) {
        this.detalles = detalles;
    }
}

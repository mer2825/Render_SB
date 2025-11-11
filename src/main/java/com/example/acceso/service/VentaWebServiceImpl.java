package com.example.acceso.service;

import com.example.acceso.model.*;
import com.example.acceso.repository.ClienteRepository;
import com.example.acceso.repository.VentaRepository;
import com.example.acceso.repository.VentaWebRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class VentaWebServiceImpl implements VentaWebService {

    private final VentaWebRepository ventaWebRepository;
    private final VentaService ventaService;
    private final ClienteRepository clienteRepository;

    @Autowired
    public VentaWebServiceImpl(VentaWebRepository ventaWebRepository, VentaService ventaService, ClienteRepository clienteRepository) {
        this.ventaWebRepository = ventaWebRepository;
        this.ventaService = ventaService;
        this.clienteRepository = clienteRepository;
    }

    @Override
    @Transactional
    public VentaWeb guardarVentaWeb(VentaWeb ventaWeb) {
        ventaWeb.setFechaPedido(LocalDateTime.now());
        for (DetalleVentaWeb detalle : ventaWeb.getDetalles()) {
            detalle.setVentaWeb(ventaWeb);
        }
        return ventaWebRepository.save(ventaWeb);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VentaWeb> listarTodasLasVentasWeb() {
        return ventaWebRepository.findAll();
    }

    @Override
    @Transactional
    public void procesarVentaWeb(Long idVentaWeb) {
        VentaWeb ventaWeb = ventaWebRepository.findById(idVentaWeb)
                .orElseThrow(() -> new RuntimeException("Venta web no encontrada con id: " + idVentaWeb));

        Optional<Cliente> clienteExistente = clienteRepository.findByNumeroDocumento(ventaWeb.getNumeroDocumentoCliente());

        Cliente clienteParaVenta = clienteExistente.orElseGet(() -> {
            Cliente nuevoCliente = new Cliente();
            nuevoCliente.setNombre(ventaWeb.getNombreCliente());
            nuevoCliente.setNumeroDocumento(ventaWeb.getNumeroDocumentoCliente());
            nuevoCliente.setTipoDocumento("DNI");
            nuevoCliente.setEstado(1);
            return clienteRepository.save(nuevoCliente);
        });

        Venta nuevaVenta = new Venta();
        nuevaVenta.setCliente(clienteParaVenta);
        nuevaVenta.setTotal(ventaWeb.getTotal());
        nuevaVenta.setTipoComprobante("Nota de Venta");
        nuevaVenta.setMetodoPago("Por coordinar");
        nuevaVenta.setOrigen("pos");

        List<DetalleVenta> detallesVenta = new ArrayList<>();
        for (DetalleVentaWeb detalleWeb : ventaWeb.getDetalles()) {
            DetalleVenta detalleVenta = new DetalleVenta();
            detalleVenta.setProducto(detalleWeb.getProducto());
            detalleVenta.setCantidad(detalleWeb.getCantidad());
            detalleVenta.setPrecioUnitario(detalleWeb.getPrecioUnitario());
            detallesVenta.add(detalleVenta);
        }
        nuevaVenta.setDetalles(detallesVenta);

        ventaService.crearVenta(nuevaVenta);
        ventaWebRepository.delete(ventaWeb);
    }
}

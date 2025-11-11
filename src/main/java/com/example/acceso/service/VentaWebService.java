package com.example.acceso.service;

import com.example.acceso.model.VentaWeb;

import java.util.List;

public interface VentaWebService {
    VentaWeb guardarVentaWeb(VentaWeb ventaWeb);
    List<VentaWeb> listarTodasLasVentasWeb();
    void procesarVentaWeb(Long idVentaWeb);
}

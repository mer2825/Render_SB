package com.example.acceso.config;

import com.example.acceso.model.Empresa;
import com.example.acceso.model.Opcion;
import com.example.acceso.model.Usuario;
import com.example.acceso.service.EmpresaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;

@Component
public class SessionInterceptor implements HandlerInterceptor {

    private final EmpresaService empresaService;

    public SessionInterceptor(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        String requestURI = request.getRequestURI();

        // Permitir acceso público al endpoint para guardar ventas web
        if ("/ventas/api/web/guardar".equals(requestURI)) {
            return true;
        }

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("usuarioLogueado") == null) {
            response.sendRedirect("/login");
            return false;
        }

        if (requestURI.contains("/api/") || requestURI.equals("/")) {
            return true;
        }

        @SuppressWarnings("unchecked")
        List<Opcion> menuOpciones = (List<Opcion>) session.getAttribute("menuOpciones");

        boolean isAuthorized = false;
        if (menuOpciones != null) {
            isAuthorized = menuOpciones.stream()
                                     .map(Opcion::getRuta)
                                     .anyMatch(requestURI::startsWith);
        }

        // Si no está autorizado directamente, verificar casos especiales como la modificación de ventas
        if (!isAuthorized && requestURI.startsWith("/ventas/modificar")) {
            if (menuOpciones != null) {
                // Permitir si el usuario tiene acceso a la lista de ventas
                isAuthorized = menuOpciones.stream()
                                         .map(Opcion::getRuta)
                                         .anyMatch("/ventas/listar"::equals);
            }
        }

        if (isAuthorized) {
            return true;
        } else {
            session.setAttribute("access_denied_error", "No tienes permiso para acceder a esta página.");
            response.sendRedirect("/");
            return false;
        }
    }

    @Override
    public void postHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler, ModelAndView modelAndView) throws Exception {
        if (modelAndView != null && !isRedirectView(modelAndView)) {
            HttpSession session = request.getSession(false);
            
            Empresa empresa = empresaService.getEmpresaInfo();
            modelAndView.addObject("empresaGlobal", empresa);

            if (session != null) {
                Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");
                if (usuario != null) {
                    modelAndView.addObject("usuarioGlobal", usuario);
                }

                if (session.getAttribute("access_denied_error") != null) {
                    modelAndView.addObject("access_denied_error", session.getAttribute("access_denied_error"));
                    session.removeAttribute("access_denied_error");
                }
            }
        }
    }

    private boolean isRedirectView(ModelAndView modelAndView) {
        String viewName = modelAndView.getViewName();
        return viewName != null && viewName.startsWith("redirect:");
    }
}

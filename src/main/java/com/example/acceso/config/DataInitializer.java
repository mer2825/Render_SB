package com.example.acceso.config;

import com.example.acceso.model.Cliente;
import com.example.acceso.model.Opcion;
import com.example.acceso.model.Perfil;
import com.example.acceso.repository.ClienteRepository;
import com.example.acceso.repository.OpcionRepository;
import com.example.acceso.repository.PerfilRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final OpcionRepository opcionRepository;
    private final PerfilRepository perfilRepository;
    private final ClienteRepository clienteRepository; // Se añade el repositorio de clientes

    @Autowired
    public DataInitializer(OpcionRepository opcionRepository, PerfilRepository perfilRepository, ClienteRepository clienteRepository) {
        this.opcionRepository = opcionRepository;
        this.perfilRepository = perfilRepository;
        this.clienteRepository = clienteRepository; // Se inicializa
    }

    @Override
    public void run(String... args) throws Exception {
        // Crear datos iniciales esenciales
        crearPerfilSiNoExiste("Administrador", "Acceso total al sistema");
        crearClienteSiNoExiste("Consumidor Final", "-", "-", "-");

        // Crear opciones de menú
        crearOpcionSiNoExiste("Gestión de Usuarios", "/usuarios/listar", "bi-people");
        crearOpcionSiNoExiste("Gestión de Perfiles", "/perfiles/listar", "bi-person-check");
        crearOpcionSiNoExiste("Gestión de Categorías", "/categorias/listar", "bi-tags");
        crearOpcionSiNoExiste("Gestión de Productos", "/productos/listar", "bi-cake2");
        crearOpcionSiNoExiste("Gestión de Clientes", "/clientes/listar", "bi-person-vcard");
        crearOpcionSiNoExiste("Gestión de Empresa", "/empresa/listar", "bi-shop-window");
        crearOpcionSiNoExiste("Listado de Ventas", "/ventas/listar", "bi-receipt"); // Icono de ejemplo
        crearOpcionSiNoExiste("Nueva Venta", "/ventas/nueva", "bi-cart-plus"); // Icono de ejemplo
        crearOpcionSiNoExiste("Gestión Inventario", "/inventario/listar", "bi-boxes"); // Nueva opción de inventario, ruta actualizada
    }

    private void crearPerfilSiNoExiste(String nombre, String descripcion) {
        if (perfilRepository.findByNombre(nombre).isEmpty()) {
            Perfil nuevoPerfil = new Perfil();
            nuevoPerfil.setNombre(nombre);
            nuevoPerfil.setDescripcion(descripcion);
            nuevoPerfil.setEstado(1);
            perfilRepository.save(nuevoPerfil);
            System.out.println("Perfil por defecto creado: " + nombre);
        }
    }

    private void crearClienteSiNoExiste(String nombre, String tipoDoc, String numDoc, String direccion) {
        if (clienteRepository.findByNombre(nombre).isEmpty()) {
            Cliente clienteGenerico = new Cliente();
            clienteGenerico.setNombre(nombre);
            clienteGenerico.setTipoDocumento(tipoDoc);
            clienteGenerico.setNumeroDocumento(numDoc);
            clienteGenerico.setDireccion(direccion);
            clienteGenerico.setEstado(1);
            clienteGenerico.setEstado(1);
            clienteRepository.save(clienteGenerico);
            System.out.println("Cliente por defecto creado: " + nombre);
        }
    }

    private void crearOpcionSiNoExiste(String nombre, String ruta, String icono) {
        if (opcionRepository.findByRuta(ruta).isEmpty()) {
            Opcion nuevaOpcion = new Opcion();
            nuevaOpcion.setNombre(nombre);
            nuevaOpcion.setRuta(ruta);
            nuevaOpcion.setIcono(icono); // Asignar el icono
            nuevaOpcion.setEstado(true); // Asumiendo que las opciones creadas por defecto están activas
            opcionRepository.save(nuevaOpcion);
            System.out.println("Opción de menú creada: " + nombre);
        }
    }
}

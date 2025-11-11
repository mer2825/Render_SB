$(document).ready(function() {
    let carrito = [];
    let productosCargados = {};

    // --- Inicialización ---
    cargarProductos();
    setupEventListeners();
    updateFormularioUI(); // Configuración inicial de la UI

    function cargarProductos() {
        $('.product-list-item').each(function() {
            const item = $(this);
            const producto = {
                id: item.data('product-id'),
                nombre: item.data('product-nombre'),
                precio: parseFloat(item.data('product-precio')),
                foto: item.data('product-foto'),
                stock: parseInt(item.data('product-stock'))
            };
            productosCargados[producto.id] = producto;
        });
    }

    function setupEventListeners() {
        $('#tipoComprobanteVenta').on('change', updateFormularioUI);
        $('#btnBuscarCliente').on('click', buscarOCrearCliente);
        $('#btnLimpiarCliente').on('click', () => limpiarCliente(true));
        $('#product-selection-area').on('click', '.product-list-item', agregarAlCarrito);
        $('#carrito-items').on('change', '.cantidad-item', actualizarCantidad);
        $('#carrito-items').on('click', '.remover-item', removerDelCarrito);
        $('#btnFinalizarVenta').on('click', finalizarVenta);
        $('#filtroNombre, #filtroPrecioMin, #filtroPrecioMax').on('keyup input change', filtrarProductos);
        $('.category-header').on('click', function() {
            const target = $(this).data('bs-target');
            $(target).collapse('toggle');
        });
    }

    // --- Lógica de Comprobante y Cliente (VERSIÓN FINAL) ---

    function updateFormularioUI() {
        const tipoComprobante = $('#tipoComprobanteVenta').val();
        const seccionCliente = $('#seccionCliente');
        const tipoDocumentoSelect = $('#tipoDocumento');
        const inputComprobanteFinal = $('#tipoComprobante');

        // 1. Resetear la UI: Ocultar la sección de cliente por defecto y habilitar el selector de documento
        seccionCliente.hide();
        tipoDocumentoSelect.prop('disabled', false);

        // 2. Aplicar lógica específica para la opción seleccionada
        if (tipoComprobante === 'factura') {
            inputComprobanteFinal.val('Factura');
            tipoDocumentoSelect.val('ruc').prop('disabled', true);
            seccionCliente.show();
        } else if (tipoComprobante === 'boleta') {
            inputComprobanteFinal.val('Boleta');
            tipoDocumentoSelect.val('dni').prop('disabled', true); // DNI por defecto y deshabilitado para boleta
            seccionCliente.show(); // Mostrar siempre la sección de cliente para boletas
        } else { // nota_venta
            inputComprobanteFinal.val('Nota de Venta');
            // La sección de cliente ya está oculta. Limpiar datos si es necesario.
            limpiarCliente(false);
        }
    }

    function limpiarCliente(resetearSeleccion = false) {
        $('#numeroDocumento').val('');
        $('#nombreCliente').text('Consumidor Final');
        $('#direccionCliente').text('-');
        $('#clienteId').val('');

        if (resetearSeleccion) {
            $('#tipoComprobanteVenta').val('nota_venta');
            updateFormularioUI();
        }
    }

    async function buscarOCrearCliente() {
        const tipo = $('#tipoDocumento').val();
        const numero = $('#numeroDocumento').val();
        if (!numero) return showNotification('Ingrese un número de documento', 'error');

        showLoading(true);
        try {
            const response = await fetch(`/clientes/api/buscar-o-crear?tipo=${tipo}&numero=${numero}`);
            if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
            const result = await response.json();

            if (result.success) {
                const cliente = result.cliente;
                $('#nombreCliente').text(cliente.nombre);
                $('#direccionCliente').text(cliente.direccion || '-');
                $('#clienteId').val(cliente.id);
                showNotification('Cliente asignado con éxito.', 'success');
            } else {
                showNotification(result.message || 'Error al buscar cliente.', 'error');
                limpiarCliente(false);
            }
        } catch (error) {
            showNotification('Error al procesar el cliente.', 'error');
            limpiarCliente(false);
        } finally {
            showLoading(false);
        }
    }

    // --- Lógica de Carrito y Filtros ---
    function filtrarProductos() {
        const nombreFiltro = $('#filtroNombre').val().toLowerCase();
        const precioMin = parseFloat($('#filtroPrecioMin').val()) || 0;
        const precioMax = parseFloat($('#filtroPrecioMax').val()) || Infinity;
        $('.category-group').each(function() {
            let productosVisibles = 0;
            $(this).find('.product-list-item').each(function() {
                const item = $(this);
                const nombre = item.data('product-nombre').toLowerCase();
                const precio = parseFloat(item.data('product-precio'));
                if (nombre.includes(nombreFiltro) && precio >= precioMin && precio <= precioMax) {
                    item.show();
                    productosVisibles++;
                } else {
                    item.hide();
                }
            });
            $(this).toggle(productosVisibles > 0);
        });
    }

    function agregarAlCarrito(e) {
        const productoId = $(e.currentTarget).data('product-id');
        const producto = productosCargados[productoId];

        if (!producto) return showNotification('Error: Producto no encontrado', 'error');

        if (producto.stock <= 0) {
            return showNotification('Este producto está agotado.', 'error');
        }

        const itemExistente = carrito.find(item => item.producto.id === productoId);

        if (itemExistente) {
            if (itemExistente.cantidad + 1 > producto.stock) {
                return showNotification(`No puedes agregar más. Stock disponible: ${producto.stock}`, 'warning');
            }
            itemExistente.cantidad++;
        } else {
            carrito.push({ producto: producto, cantidad: 1 });
        }
        renderizarCarrito();
    }

    function actualizarCantidad(e) {
        const productoId = $(e.currentTarget).data('id');
        const nuevaCantidad = parseInt($(e.currentTarget).val());
        const item = carrito.find(item => item.producto.id === productoId);
        const producto = productosCargados[productoId];

        if (item && nuevaCantidad > 0) {
            if (nuevaCantidad > producto.stock) {
                $(e.currentTarget).val(item.cantidad);
                return showNotification(`Cantidad excede el stock disponible (${producto.stock}).`, 'warning');
            }
            item.cantidad = nuevaCantidad;
        } else if (item) {
            $(e.currentTarget).val(item.cantidad);
        }
        renderizarCarrito();
    }

    function removerDelCarrito(e) {
        const productoId = $(e.currentTarget).data('id');
        carrito = carrito.filter(item => item.producto.id !== productoId);
        renderizarCarrito();
    }

    function renderizarCarrito() {
        const tbody = $('#carrito-items');
        tbody.empty();
        let subtotalVenta = 0;
        carrito.forEach(item => {
            const subtotalItem = item.producto.precio * item.cantidad;
            subtotalVenta += subtotalItem;
            tbody.append(`<tr><td>${item.producto.nombre}</td><td><input type="number" class="form-control form-control-sm cantidad-item" value="${item.cantidad}" data-id="${item.producto.id}" min="1" max="${item.producto.stock}"></td><td>S/ ${subtotalItem.toFixed(2)}</td><td><button class="btn btn-danger btn-sm remover-item" data-id="${item.producto.id}"><i class="bi bi-x-circle"></i></button></td></tr>`);
        });
        $('#venta-subtotal').text(`S/ ${subtotalVenta.toFixed(2)}`);
        $('#venta-total').text(`S/ ${subtotalVenta.toFixed(2)}`);
    }

    // --- Finalizar Venta ---
    async function finalizarVenta() {
        if (carrito.length === 0) return showNotification('Agregue al menos un producto.', 'error');

        const tipoComprobanteFinal = $('#tipoComprobante').val();
        if (!tipoComprobanteFinal) {
            return showNotification('Debe definir el tipo de comprobante.', 'error');
        }

        const tipoComprobanteVenta = $('#tipoComprobanteVenta').val();
        let clienteId = $('#clienteId').val();

        if (tipoComprobanteVenta === 'factura' && !clienteId) {
            return showNotification('Debe buscar y asignar un cliente con RUC para la factura.', 'error');
        }
        // Para boletas, si no hay clienteId, se asignará el ID 1 (Consumidor Final) automáticamente.

        if (!clienteId) {
            clienteId = 1; // Asumir ID 1 para "Consumidor Final"
        }

        const ventaData = {
            tipoComprobante: tipoComprobanteFinal,
            cliente: { id: clienteId },
            metodoPago: $('#metodoPago').val(),
            nota: $('#notaVenta').val(),
            total: parseFloat($('#venta-total').text().replace('S/ ', '')),
            detalles: carrito.map(item => ({ 
                producto: { id: item.producto.id }, 
                cantidad: item.cantidad, 
                precioUnitario: item.producto.precio 
            }))
        };

        showLoading(true);
        try {
            const response = await fetch('/ventas/api/guardar', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(ventaData) 
            });
            const result = await response.json();
            if (result.success) {
                Swal.fire('¡Venta Registrada!', result.message, 'success').then(() => { 
                    window.location.href = '/ventas/listar';
                });
            } else {
                showNotification(result.message || 'Error al guardar la venta.', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión al guardar la venta.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // --- Funciones de Utilidad ---
    function showNotification(message, type = 'success') {
        const toastContainer = $('#notification-container');
        if (!toastContainer.length) return;
        const toastClass = type === 'success' ? 'text-bg-success' : (type === 'warning' ? 'text-bg-warning' : 'text-bg-danger');
        const toastHTML = `<div class="toast align-items-center ${toastClass} border-0" role="alert" aria-live="assertive" aria-atomic="true"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>`;
        toastContainer.append(toastHTML);
        const toast = new bootstrap.Toast(toastContainer.children().last(), { delay: 3000 });
        toast.show();
    }

    function showLoading(show) {
        let loadingOverlay = $('#loading-overlay');
        if (loadingOverlay.length === 0) {
            $('body').append('<div id="loading-overlay" class="loading-overlay"><div class="spinner"></div></div>');
            loadingOverlay = $('#loading-overlay');
        }
        loadingOverlay.toggleClass('loading-overlay-visible', show);
    }
});
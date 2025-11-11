$(document).ready(function() {
    let carrito = [];
    let productosCargados = {};
    let ventaId = null;

    // --- Inicialización ---
    cargarProductos();
    setupEventListeners();

    const pathParts = window.location.pathname.split('/');
    ventaId = pathParts[pathParts.length - 1];

    if (ventaId && !isNaN(ventaId)) {
        cargarDatosVenta(ventaId);
    } else {
        showNotification('ID de venta no válido en la URL.', 'error');
        // Redirigir si no hay ID
        setTimeout(() => { window.location.href = '/ventas/listar'; }, 2000);
    }

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
        $('#btnLimpiarCliente').on('click', () => limpiarCliente(false));
        $('#product-selection-area').on('click', '.product-list-item', agregarAlCarrito);
        $('#carrito-items').on('change', '.cantidad-item', actualizarCantidad);
        $('#carrito-items').on('click', '.remover-item', removerDelCarrito);
        $('#btnFinalizarVenta').on('click', modificarVenta);
        $('#filtroNombre, #filtroPrecioMin, #filtroPrecioMax').on('keyup input change', filtrarProductos);
        $('.category-header').on('click', function() {
            const target = $(this).data('bs-target');
            $(target).collapse('toggle');
        });
    }

    async function cargarDatosVenta(id) {
        showLoading(true);
        try {
            const response = await fetch(`/ventas/api/detalle/${id}`);
            if (!response.ok) throw new Error(`Error al cargar la venta: ${response.status}`);
            const result = await response.json();

            if (result.success) {
                const venta = result.data;

                // 1. Establecer el tipo de comprobante en el selector
                const tipoComprobanteOriginal = venta.tipoComprobante.toLowerCase();
                if (tipoComprobanteOriginal.includes('factura')) {
                    $('#tipoComprobanteVenta').val('factura');
                } else if (tipoComprobanteOriginal.includes('boleta')) {
                    $('#tipoComprobanteVenta').val('boleta');
                } else {
                    $('#tipoComprobanteVenta').val('nota_venta');
                }

                // 2. Cargar datos del cliente si existe
                if (venta.cliente && venta.cliente.id !== 1) {
                    $('#clienteId').val(venta.cliente.id);
                    $('#nombreCliente').text(venta.cliente.nombre);
                    // Nota: El número de documento no se puede cargar aquí si no viene de la API.
                    // El usuario deberá buscarlo de nuevo si desea cambiarlo.
                }

                // 3. Actualizar la UI para que coincida con los datos cargados
                updateFormularioUI();

                // 4. Cargar el resto de los datos de la venta
                carrito = venta.detalles.map(detalle => {
                    const productoCompleto = productosCargados[detalle.producto.id];
                    return {
                        producto: { ...productoCompleto, precio: detalle.precioUnitario },
                        cantidad: detalle.cantidad
                    };
                });
                renderizarCarrito();

                $('#metodoPago').val(venta.metodoPago);
                $('#notaVenta').val(venta.nota);

            } else {
                showNotification(result.message || 'Error al obtener detalles de la venta.', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión al cargar la venta.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // --- Lógica de Comprobante y Cliente (Reutilizada de nueva-venta.js) ---

    function updateFormularioUI() {
        const tipoComprobante = $('#tipoComprobanteVenta').val();
        const seccionCliente = $('#seccionCliente');
        const tipoDocumentoSelect = $('#tipoDocumento');
        const inputComprobanteFinal = $('#tipoComprobante');

        seccionCliente.hide();
        tipoDocumentoSelect.prop('disabled', false);

        if (tipoComprobante === 'factura') {
            inputComprobanteFinal.val('Factura');
            tipoDocumentoSelect.val('ruc').prop('disabled', true);
            seccionCliente.show();
        } else if (tipoComprobante === 'boleta') {
            inputComprobanteFinal.val('Boleta');
            tipoDocumentoSelect.val('dni').prop('disabled', true);
            seccionCliente.show();
        } else { // nota_venta
            inputComprobanteFinal.val('Nota de Venta');
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

    // --- Lógica de Carrito y Filtros (Sin cambios) ---
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
        if (producto.stock <= 0) return showNotification('Este producto está agotado.', 'error');

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
        if (!item) return;

        const producto = productosCargados[productoId];
        if (nuevaCantidad > 0) {
            if (nuevaCantidad > producto.stock) {
                $(e.currentTarget).val(item.cantidad);
                return showNotification(`Cantidad excede el stock disponible (${producto.stock}).`, 'warning');
            }
            item.cantidad = nuevaCantidad;
        } else {
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
            tbody.append(`<tr><td>${item.producto.nombre}</td><td><input type="number" class="form-control form-control-sm cantidad-item" value="${item.cantidad}" data-id="${item.producto.id}" min="1"></td><td>S/ ${subtotalItem.toFixed(2)}</td><td><button class="btn btn-danger btn-sm remover-item" data-id="${item.producto.id}"><i class="bi bi-x-circle"></i></button></td></tr>`);
        });
        $('#venta-subtotal').text(`S/ ${subtotalVenta.toFixed(2)}`);
        $('#venta-total').text(`S/ ${subtotalVenta.toFixed(2)}`);
    }

    // --- Modificar Venta ---
    async function modificarVenta() {
        if (carrito.length === 0) return showNotification('Agregue al menos un producto.', 'error');

        const tipoComprobanteVenta = $('#tipoComprobanteVenta').val();
        let clienteId = $('#clienteId').val();

        if (tipoComprobanteVenta === 'factura' && !clienteId) {
            return showNotification('Debe buscar y asignar un cliente con RUC para la factura.', 'error');
        }

        if (!clienteId) {
            clienteId = 1; // Asumir ID 1 para "Consumidor Final"
        }

        const ventaData = {
            tipoComprobante: $('#tipoComprobante').val(),
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
            const response = await fetch(`/ventas/api/actualizar/${ventaId}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(ventaData) 
            });
            const result = await response.json();
            if (result.success) {
                Swal.fire('¡Venta Modificada!', result.message, 'success').then(() => { 
                    window.parent.postMessage('ventaActualizada', '*');
                });
            } else {
                showNotification(result.message || 'Error al actualizar la venta.', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión al actualizar la venta.', 'error');
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
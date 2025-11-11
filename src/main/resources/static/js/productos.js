/**
 * Script para la gestión de productos con Bootstrap 5
 * Archivo: src/main/resources/static/js/productos.js
 */

$(document).ready(function() {
    // Variables globales
    let dataTable;
    let isEditing = false;
    let productoModal;

    // Configuración inicial
    const API_BASE = '/productos/api';
    const ENDPOINTS = {
        list: `${API_BASE}/listar`,
        save: `${API_BASE}/guardar`,
        get: (id) => `${API_BASE}/${id}`,
        delete: (id) => `${API_BASE}/eliminar/${id}`,
        categories: `${API_BASE}/categorias`,
        toggleStatus: (id) => `${API_BASE}/cambiar-estado/${id}`,
        upload: `${API_BASE}/subir-imagen`,
        auditDetails: (id) => `${API_BASE}/audit-details/${id}` // Nuevo endpoint para detalles de auditoría
    };

    // Inicializar DataTable
    initializeDataTable();

    // Inicializar Modal de Bootstrap
    productoModal = new bootstrap.Modal(document.getElementById('productoModal'));

    // Cargar categorías para el select
    loadCategories();

    // Event Listeners
    setupEventListeners();

    // ----------------------------------------------------------------------
    // Funciones de Inicialización
    // ----------------------------------------------------------------------

    function initializeDataTable() {
        dataTable = $('#tablaProductos').DataTable({
            responsive: true,
            processing: true,
            ajax: {
                url: ENDPOINTS.list,
                dataSrc: function(json) {
                    // Notificar sobre stock bajo después de recibir los datos
                    if (json.data) {
                        json.data.forEach(function(producto) {
                            if (producto.stock <= producto.stockMinimo) {
                                showNotification(`Alerta de Stock: "${producto.nombre}" tiene ${producto.stock} unidades (mínimo ${producto.stockMinimo}).`, 'warning');
                            }
                        });
                    }
                    return json.data || [];
                }
            },
            columns: [
                { data: 'id' },
                {
                    data: 'foto',
                    render: function(data, type, row) {
                        if (data) {
                            return `<img src="${data}" alt="Producto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`;
                        }
                        return '';
                    }
                },
                { data: 'nombre' },
                { data: 'categoria.nombre' },
                {
                    data: 'precio',
                    render: $.fn.dataTable.render.number('.', ',', 2, 'S/ ')
                },
                {
                    data: 'stock',
                    render: function(data, type, row) {
                        if (type === 'display') {
                            let colorClass = data <= row.stockMinimo ? 'text-bg-danger' : 'text-bg-success';
                            return `<span class="badge ${colorClass}">${data}</span>`;
                        }
                        return data;
                    }
                },
                { data: 'stockMinimo' },
                {
                    data: 'descripcion',
                    render: function(data) {
                        return data ? (data.length > 50 ? data.substr(0, 50) + '...' : data) : '';
                    }
                },
                {
                    data: 'estado',
                    render: function(data) {
                        if (data === 1) return '<span class="badge text-bg-success">Activo</span>';
                        if (data === 0) return '<span class="badge text-bg-warning">Inactivo</span>';
                        if (data === 2) return '<span class="badge text-bg-danger">Eliminado</span>';
                        return '';
                    }
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: function(data, type, row) {
                        return createActionButtons(row);
                    }
                }
            ],
            columnDefs: [
                { responsivePriority: 1, targets: 2 },
                { responsivePriority: 2, targets: 9 },
                { responsivePriority: 100, targets: 7 },
            ],
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json", // URL corregida a https
            },
            pageLength: 10
        });
    }

    function createActionButtons(row) {
        let buttons = `<div class="d-flex gap-1">`;

        // Botón de Detalles (siempre visible)
        buttons += `<button data-id="${row.id}" class="action-btn btn-secondary btn-detalles" title="Detalles de Auditoría" data-bs-toggle="modal" data-bs-target="#auditModal"><i class="bi bi-info-circle-fill"></i></button>`;

        if (row.estado !== 2) {
            buttons += `<button data-id="${row.id}" class="action-btn action-btn-edit action-edit" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg></button>`;
            if (row.estado === 1) {
                buttons += `<button data-id="${row.id}" class="action-btn action-status action-btn-status-deactivate" title="Desactivar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588M5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z"/></svg></button>`;
            } else if (row.estado === 0) {
                buttons += `<button data-id="${row.id}" class="action-btn action-status action-btn-status-activate" title="Activar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg></button>`;
            }
            buttons += `<button data-id="${row.id}" class="action-btn action-btn-delete action-delete" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg></button>`;
        } else {
            buttons += `<button class="action-btn btn-secondary" disabled title="Producto Eliminado"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder-x" viewBox="0 0 16 16"><path d="M.5 3l.04.87a1.99 1.99 0 0 0-.342 1.311L.5 7.5l-.007.042A1.99 1.99 0 0 0 0 8.21V13.5A1.5 1.5 0 0 0 1.5 15h13a1.5 1.5 0 0 0 1.5-1.5V6.85L9.648 5.233A1.99 1.99 0 0 0 8.21 5H.5zm-.078 4.697L.5 4h6.5a1 1 0 0 1 .8.4L9 7.331V9H1.5A1.5 1.5 0 0 1 0 7.5v-.003zM11.854 10.146a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0zm2.5-1.5a.5.5 0 0 1 .708 0l.5.5a.5.5 0 0 1-.708.708L13 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708l1.5-1.5a.5.5 0 0 1 .708 0z"/></svg></button>`;
        }
        buttons += `</div>`;
        return buttons;
    }

    function setupEventListeners() {
        $('#btnNuevoRegistro').on('click', openModalForNew);
        $('#formProducto').on('submit', function(e) {
            e.preventDefault();
            saveProducto();
        });
        $('#tablaProductos tbody').on('click', '.action-edit', handleEdit);
        $('#tablaProductos tbody').on('click', '.action-status', handleToggleStatus);
        $('#tablaProductos tbody').on('click', '.action-delete', handleDelete);
    }

    function loadProductos() {
        dataTable.ajax.reload();
    }

    function loadCategories() {
        fetch(ENDPOINTS.categories)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const select = $('#id_categoria');
                    select.empty().append('<option value="">Seleccione una categoría...</option>');
                    data.data.forEach(category => {
                        select.append(`<option value="${category.id}">${category.nombre}</option>`);
                    });
                } else {
                    showNotification('Error al cargar categorías', 'danger');
                }
            }).catch(error => {
                console.error('Error cargando categorías:', error);
                showNotification('Error de conexión al cargar categorías', 'danger');
            });
    }

    async function uploadImage() {
        const imagenFile = document.getElementById('imagenFile').files[0];
        if (!imagenFile) {
            return $('#fotoUrlActual').val() || null;
        }

        const formData = new FormData();
        formData.append('file', imagenFile);

        try {
            const response = await fetch(ENDPOINTS.upload, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success && data.imageUrl) {
                return data.imageUrl;
            } else {
                showNotification(data.message || 'Error al subir la imagen', 'danger');
                return null;
            }
        } catch (error) {
            console.error('Error de conexión al subir imagen:', error);
            showNotification('Error de conexión al subir imagen', 'danger');
            return null;
        }
    }

    async function saveProducto() {
        clearFieldErrors();
        const stock = parseInt($('#stock').val(), 10);
        const stockMinimo = parseInt($('#stockMinimo').val(), 10);

        const partialFormData = {
            nombre: $('#nombre').val().trim(),
            precio: $('#precio').val(),
            stock: isNaN(stock) ? '' : stock,
            stockMinimo: isNaN(stockMinimo) ? '' : stockMinimo,
            categoria: { id: $('#id_categoria').val() }
        };

        if (!validateForm(partialFormData)) return;

        showLoading(true);
        let imageUrl = null;

        try {
            imageUrl = await uploadImage();
            if (imageUrl === null && document.getElementById('imagenFile').files.length > 0) {
                showLoading(false);
                return;
            }
        } catch (error) {
            showLoading(false);
            return;
        }

        const finalFormData = {
            id: $('#id').val() || null,
            nombre: partialFormData.nombre,
            descripcion: $('#descripcion').val() ? $('#descripcion').val().trim() : null,
            precio: partialFormData.precio,
            stock: partialFormData.stock,
            stockMinimo: partialFormData.stockMinimo,
            foto: imageUrl,
            categoria: partialFormData.categoria
        };

        fetch(ENDPOINTS.save, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalFormData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hideModal();
                showNotification(data.message, 'success');
                loadProductos();
            } else {
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => showFieldError(field, data.errors[field]));
                } else {
                    showNotification(data.message, 'danger');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error de conexión al guardar producto', 'danger');
        })
        .finally(() => showLoading(false));
    }

    function handleEdit(e) {
        e.preventDefault();
        const id = $(this).data('id');
        showLoading(true);
        fetch(ENDPOINTS.get(id))
            .then(response => {
                if (!response.ok) throw new Error('Producto no encontrado');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    openModalForEdit(data.data);
                } else {
                    showNotification('Error al cargar producto: ' + data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al cargar los datos del producto', 'danger');
            })
            .finally(() => showLoading(false));
    }

    function handleToggleStatus(e) {
        e.preventDefault();
        const id = $(this).data('id');
        showLoading(true);
        fetch(ENDPOINTS.toggleStatus(id), { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification(data.message, 'success');
                    loadProductos();
                } else {
                    showNotification('Error: ' + data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error de conexión al cambiar estado del producto', 'danger');
            })
            .finally(() => showLoading(false));
    }

    function handleDelete(e) {
        e.preventDefault();
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡El producto será marcado como Eliminado y no se mostrará en la gestión!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, ¡marcar Eliminado!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);
                fetch(ENDPOINTS.delete(id), { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showNotification(data.message, 'success');
                            loadProductos();
                        } else {
                            showNotification('Error: ' + data.message, 'danger');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showNotification('Error de conexión al eliminar producto', 'danger');
                    })
                    .finally(() => showLoading(false));
            }
        });
    }

    function openModalForNew() {
        isEditing = false;
        clearForm();
        $('#modalTitle').text('Agregar Producto');
        showModal();
    }

    function openModalForEdit(producto) {
        clearForm();
        isEditing = true;
        $('#modalTitle').text('Editar Producto');
        $('#id').val(producto.id);
        $('#nombre').val(producto.nombre);
        $('#descripcion').val(producto.descripcion);
        $('#precio').val(producto.precio);
        $('#stock').val(producto.stock);
        $('#stockMinimo').val(producto.stockMinimo);
        $('#id_categoria').val(producto.categoria ? producto.categoria.id : '');
        $('#fotoUrlActual').val(producto.foto || '');
        const previewContainer = $('#imagenPreviewContainer');
        if (producto.foto) {
            previewContainer.html(`<img src="${producto.foto}" alt="Imagen actual" class="img-fluid rounded" style="max-height: 150px;">`);
        } else {
            previewContainer.html('<p class="text-muted">No hay imagen actual.</p>');
        }
        showModal();
    }

    function showModal() { productoModal.show(); }
    function hideModal() { 
        productoModal.hide(); 
        clearForm(); 
        isEditing = false; 
    }

    function clearForm() {
        $('#formProducto')[0].reset();
        $('#formProducto .form-control').removeClass('is-invalid');
        $('.invalid-feedback').text('');
        $('#fotoUrlActual').val('');
        $('#imagenPreviewContainer').html('');
    }

    function validateForm(formData) {
        let hasErrors = false;
        clearFieldErrors();
        if (!formData.nombre) {
            showFieldError('nombre', 'El nombre es obligatorio');
            hasErrors = true;
        } else if (formData.nombre.length < 2) {
            showFieldError('nombre', 'El nombre debe tener al menos 2 caracteres');
            hasErrors = true;
        }
        if (!formData.categoria.id) {
            showFieldError('id_categoria', 'Debe seleccionar una categoría');
            hasErrors = true;
        }
        const precio = parseFloat(formData.precio);
        if (!formData.precio || isNaN(precio) || precio <= 0) {
            showFieldError('precio', 'El precio debe ser un número positivo');
            hasErrors = true;
        }
        const stock = parseInt(formData.stock);
        if (formData.stock === '' || isNaN(stock) || stock < 0) {
            showFieldError('stock', 'El stock debe ser un número entero no negativo');
            hasErrors = true;
        }
        const stockMinimo = parseInt(formData.stockMinimo);
        if (formData.stockMinimo === '' || isNaN(stockMinimo) || stockMinimo < 0) {
            showFieldError('stockMinimo', 'El stock mínimo debe ser un número entero no negativo');
            hasErrors = true;
        } else if (stockMinimo > stock) {
            showFieldError('stockMinimo', 'El stock mínimo no puede ser mayor que el stock actual');
            hasErrors = true;
        }
        const imagenFile = document.getElementById('imagenFile').files;
        if ($('#id').val() === '' && imagenFile.length === 0) {
            showFieldError('imagenFile', 'Debe seleccionar una imagen para el nuevo producto');
            hasErrors = true;
        }
        if (imagenFile.length > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(imagenFile[0].type)) {
                showFieldError('imagenFile', 'Formato de imagen no válido. Use JPG, PNG o GIF.');
                hasErrors = true;
            }
        }
        return !hasErrors;
    }

    function showFieldError(fieldName, message) {
        const field = $(`#${fieldName}`);
        const errorDiv = $(`#${fieldName}-error`);
        field.addClass('is-invalid');
        errorDiv.text(message);
    }

    function clearFieldErrors() {
        $('.invalid-feedback').text('');
        $('#formProducto .form-control').removeClass('is-invalid');
    }

    function showNotification(message, type = 'success') {
        let toastClass;
        let btnCloseClass = 'btn-close-white';

        switch (type) {
            case 'success':
                toastClass = 'text-bg-success';
                break;
            case 'danger':
                toastClass = 'text-bg-danger';
                break;
            case 'warning':
                toastClass = 'text-bg-warning';
                btnCloseClass = ''; // Botón oscuro para fondo claro
                break;
            default:
                toastClass = 'text-bg-secondary';
        }

        const notification = $(`
            <div class="toast align-items-center ${toastClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close ${btnCloseClass} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `);

        $('#notification-container').append(notification);

        const toast = new bootstrap.Toast(notification, {
            delay: 7000 // Mayor tiempo para alertas
        });
        toast.show();
    }

    function showLoading(show) {
        const overlayId = 'loading-overlay';
        let $overlay = $(`#${overlayId}`);
        if (show) {
            if ($overlay.length === 0) {
                const spinner = $('<div>', { class: 'spinner-border text-primary', role: 'status' }).append($('<span>', { class: 'visually-hidden' }).text('Cargando...'));
                $overlay = $('<div>', { id: overlayId, class: 'loading-overlay' }).append(spinner);
                $('body').append($overlay);
            }
        } else {
            $overlay.remove();
        }
    }
});

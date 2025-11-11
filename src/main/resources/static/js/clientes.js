$(document).ready(function() {
    let dataTable;
    let clienteModal;

    const API_BASE = '/clientes/api';
    const ENDPOINTS = {
        list: `${API_BASE}/listar`,
        save: `${API_BASE}/guardar`,
        get: (id) => `${API_BASE}/${id}`,
        delete: (id) => `${API_BASE}/eliminar/${id}`,
        toggleStatus: (id) => `${API_BASE}/cambiar-estado/${id}`,
        // Usamos el endpoint buscar-o-crear del ClienteController
        buscarDoc: (tipo, numero) => `${API_BASE}/buscar-o-crear?tipo=${tipo}&numero=${numero}`
    };

    // Inicializar el overlay de carga una sola vez al cargar la página
    let loadingOverlay = $('<div id="loading-overlay"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>');
    $('body').append(loadingOverlay);

    initializeDataTable();
    clienteModal = new bootstrap.Modal(document.getElementById('clienteModal'));
    setupEventListeners();

    function initializeDataTable(filterType = null) {
        if (dataTable) {
            dataTable.destroy();
        }

        let ajaxUrl = ENDPOINTS.list;
        if (filterType) {
            ajaxUrl += `?tipoDocumento=${filterType}`;
        }

        dataTable = $('#tablaClientes').DataTable({
            responsive: true,
            processing: true,
            ajax: { url: ajaxUrl, dataSrc: 'data' },
            columns: [
                { data: 'id' },
                { data: 'nombre' },
                { data: 'tipoDocumento' },
                { data: 'numeroDocumento' },
                { data: 'direccion' },
                { data: 'telefono' },
                { data: 'email' },
                {
                    data: 'estado',
                    render: (data) => data === 1 ? '<span class="badge text-bg-success">Activo</span>' : '<span class="badge text-bg-danger">Inactivo</span>'
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: (data, type, row) => createActionButtons(row)
                }
            ],
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
        });
    }

    function createActionButtons(row) {
        const statusIcon = row.estado === 1 ? '<i class="bi bi-eye-slash-fill"></i>' : '<i class="bi bi-eye-fill"></i>';
        const statusTitle = row.estado === 1 ? 'Desactivar' : 'Activar';
        return `
            <div class="d-flex gap-1">
                <button data-id="${row.id}" class="btn btn-sm btn-info action-edit" title="Editar"><i class="bi bi-pencil-square"></i></button>
                <button data-id="${row.id}" class="btn btn-sm btn-warning action-status" title="${statusTitle}">${statusIcon}</button>
                <button data-id="${row.id}" class="btn btn-sm btn-danger action-delete" title="Eliminar"><i class="bi bi-trash3-fill"></i></button>
            </div>
        `;
    }

    function setupEventListeners() {
        $('#btnNuevoRegistro').on('click', openModalForNew);
        $('#formCliente').on('submit', saveCliente);
        $('#tablaClientes tbody').on('click', '.action-edit', handleEdit);
        $('#tablaClientes tbody').on('click', '.action-status', handleToggleStatus);
        $('#tablaClientes tbody').on('click', '.action-delete', handleDelete);
        $('#btnBuscarDoc').on('click', handleBuscarDoc);

        $('#btnFiltroTodos').on('click', () => filterClients(null, $('#btnFiltroTodos')));
        $('#btnFiltroDNI').on('click', () => filterClients('DNI', $('#btnFiltroDNI')));
        $('#btnFiltroRUC').on('click', () => filterClients('RUC', $('#btnFiltroRUC')));
    }

    function filterClients(filterType, clickedButton) {
        currentFilter = filterType;
        $('.btn-group button').removeClass('active');
        clickedButton.addClass('active');
        initializeDataTable(currentFilter);
    }

    function openModalForNew() {
        clearForm();
        $('#modalTitle').text('Agregar Cliente');
        clienteModal.show();
    }

    async function handleEdit(e) {
        const id = $(this).data('id');
        try {
            const response = await fetch(ENDPOINTS.get(id));
            const result = await response.json();
            if (result.success) {
                fillForm(result.data);
                $('#modalTitle').text('Editar Cliente');
                clienteModal.show();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Error al cargar los datos del cliente.', 'error');
        }
    }

    async function saveCliente(e) {
        e.preventDefault();
        const clienteData = {
            id: $('#id').val() || null,
            tipoDocumento: $('#tipoDocumento').val(),
            numeroDocumento: $('#numeroDocumento').val(),
            nombre: $('#nombre').val(),
            direccion: $('#direccion').val(),
            telefono: $('#telefono').val(),
            email: $('#email').val(),
        };

        try {
            const response = await fetch(ENDPOINTS.save, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clienteData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error del servidor al guardar cliente:", response.status, errorText);
                showNotification(`Error del servidor (${response.status}): ${errorText.substring(0, 100)}...`, 'error');
                return;
            }

            const result = await response.json();
            if (result.success) {
                clienteModal.hide();
                showNotification(result.message, 'success');
                dataTable.ajax.reload();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Error al guardar el cliente.', 'error');
        }
    }

    async function handleToggleStatus(e) {
        const id = $(this).data('id');
        try {
            const response = await fetch(ENDPOINTS.toggleStatus(id), { method: 'POST' });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error del servidor al cambiar estado cliente:", response.status, errorText);
                showNotification(`Error del servidor (${response.status}): ${errorText.substring(0, 100)}...`, 'error');
                return;
            }

            const result = await response.json();
            if (result.success) {
                showNotification(result.message, 'success');
                dataTable.ajax.reload();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Error al cambiar el estado.', 'error');
        }
    }

    function handleDelete(e) {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "El cliente será marcado como eliminado lógicamente y dejará de mostrarse en la gestión de clientes.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(ENDPOINTS.delete(id), { method: 'DELETE' });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("Error del servidor al eliminar cliente:", response.status, errorText);
                        showNotification(`Error del servidor (${response.status}): ${errorText.substring(0, 100)}...`, 'error');
                        return;
                    }

                    const result = await response.json();
                    if (result.success) {
                        showNotification(result.message, 'success');
                        dataTable.ajax.reload();
                    } else {
                        showNotification(result.message, 'error');
                    }
                } catch (error) {
                    showNotification('Error al eliminar el cliente.', 'error');
                }
            }
        });
    }

    async function handleBuscarDoc() {
        const tipo = $('#tipoDocumento').val();
        const numero = $('#numeroDocumento').val();
        if (!numero) {
            showNotification('Por favor, ingrese un número de documento.', 'error');
            return;
        }

        showLoading(true);
        try {
            const url = ENDPOINTS.buscarDoc(tipo, numero);
            console.log("DEBUG (clientes.js): Solicitando a URL:", url);
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error del servidor al buscar cliente:", response.status, errorText);
                showNotification(`Error del servidor (${response.status}): ${errorText.substring(0, 100)}...`, 'error');
                return;
            }

            const result = await response.json();
            console.log("Respuesta del backend para buscarDoc (Gestión Clientes):", result); // Para depuración

            if (result.success) {
                // El backend ahora siempre devuelve un objeto 'cliente' si lo encuentra o lo crea
                const cliente = result.cliente;
                $('#nombre').val(cliente.nombre);
                $('#direccion').val(cliente.direccion || '');
                $('#telefono').val(cliente.telefono || '');
                $('#email').val(cliente.email || '');
                $('#id').val(cliente.id); // Si ya existe, rellenar el ID para edición
                $('#tipoDocumento').val(cliente.tipoDocumento.toLowerCase());
                $('#numeroDocumento').val(cliente.numeroDocumento);

                showNotification('Datos encontrados y cargados.', 'success');
            } else {
                showNotification(result.message || 'No se encontraron datos para ese documento.', 'error');
                clearForm();
                $('#tipoDocumento').val(tipo); // Mantener el tipo de documento seleccionado
                $('#numeroDocumento').val(numero); // Mantener el número de documento ingresado
            }
        } catch (error) {
            console.error("DEBUG (clientes.js): Error en handleBuscarDoc (frontend Gestión Clientes):", error);
            showNotification('Error al conectar con la API de búsqueda (ver consola para detalles).', 'error');
        } finally {
            showLoading(false);
        }
    }

    function fillForm(data) {
        $('#id').val(data.id);
        $('#tipoDocumento').val(data.tipoDocumento.toLowerCase()); // Asegurar minúsculas para el select
        $('#numeroDocumento').val(data.numeroDocumento);
        $('#nombre').val(data.nombre);
        $('#direccion').val(data.direccion);
        $('#telefono').val(data.telefono);
        $('#email').val(data.email);
    }

    function clearForm() {
        $('#formCliente')[0].reset();
        $('#id').val('');
    }

    function showNotification(message, type = 'success') {
        const toastContainer = $('#notification-container');
        if (!toastContainer.length) return;
        const toastClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
        const toastHTML = `<div class="toast align-items-center ${toastClass} border-0" role="alert" aria-live="assertive" aria-atomic="true"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>`;
        toastContainer.append(toastHTML);
        const toast = new bootstrap.Toast(toastContainer.children().last(), { delay: 5000 });
        toast.show();
    }

    function showLoading(show) {
        if (show) {
            loadingOverlay.css('display', 'flex'); // Asegura que el display sea flex
            // Pequeño retardo para asegurar que display:flex se aplique antes de la transición
            setTimeout(() => {
                loadingOverlay.addClass('loading-overlay-visible');
            }, 10);
        } else {
            loadingOverlay.removeClass('loading-overlay-visible');
            // Espera a que la transición de opacidad termine antes de ocultar completamente
            loadingOverlay.one('transitionend', function() {
                // Solo oculta si no se ha vuelto a mostrar durante la transición
                if (!loadingOverlay.hasClass('loading-overlay-visible')) {
                    loadingOverlay.css('display', 'none');
                }
            });
        }
    }
});

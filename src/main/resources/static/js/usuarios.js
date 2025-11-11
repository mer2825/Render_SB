$(document).ready(function() {
    let dataTable;
    let usuarioModal;

    const API_BASE = '/usuarios/api';
    const ENDPOINTS = {
        list: `${API_BASE}/listar`,
        save: `${API_BASE}/guardar`,
        get: (id) => `${API_BASE}/${id}`,
        delete: (id) => `${API_BASE}/eliminar/${id}`,
        toggleStatus: (id) => `${API_BASE}/cambiar-estado/${id}`,
        perfiles: `${API_BASE}/perfiles`
    };

    initializeDataTable();
    usuarioModal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    setupEventListeners();

    function initializeDataTable() {
        dataTable = $('#tablaUsuarios').DataTable({
            responsive: true,
            processing: true,
            ajax: { url: ENDPOINTS.list, dataSrc: 'data' },
            columns: [
                { data: 'id' },
                { data: 'nombre' },
                { data: 'usuario' },
                { data: 'perfil.nombre' },
                { data: 'correo' },
                {
                    data: 'estado',
                    render: function(data) {
                        if (data === 1) {
                            return '<span class="badge text-bg-success">Activo</span>';
                        } else if (data === 0) {
                            return '<span class="badge text-bg-warning">Inactivo</span>';
                        } else if (data === 2) {
                            return '<span class="badge text-bg-danger">Eliminado</span>';
                        }
                        return ''; // En caso de un estado desconocido
                    }
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: (data, type, row) => createActionButtons(row)
                }
            ],
            language: { url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" } // URL corregida a https
        });
    }

    function createActionButtons(row) {
        let buttons = `
            <div class="d-flex gap-1">
        `;

        // Botón de Detalles (siempre visible)
        buttons += `<button data-id="${row.id}" class="btn btn-sm btn-secondary btn-detalles" title="Detalles de Auditoría" data-bs-toggle="modal" data-bs-target="#auditModal"><i class="bi bi-info-circle-fill"></i></button>`;

        if (row.estado !== 2) { // Si el usuario no está eliminado lógicamente
            buttons += `<button data-id="${row.id}" class="btn btn-sm btn-info action-edit" title="Editar"><i class="bi bi-pencil-square"></i></button>`;

            if (row.estado === 1) { // Si está activo, mostrar botón para desactivar
                buttons += `<button data-id="${row.id}" class="btn btn-sm btn-warning action-status" title="Desactivar"><i class="bi bi-eye-slash-fill"></i></button>`;
            } else if (row.estado === 0) { // Si está inactivo, mostrar botón para activar
                buttons += `<button data-id="${row.id}" class="btn btn-sm btn-success action-status" title="Activar"><i class="bi bi-eye-fill"></i></button>`;
            }
            buttons += `<button data-id="${row.id}" class="btn btn-sm btn-danger action-delete" title="Eliminar"><i class="bi bi-trash3-fill"></i></button>`;
        } else {
            buttons += `<button class="btn btn-sm btn-secondary" disabled title="Usuario Eliminado"><i class="bi bi-person-x-fill"></i></button>`;
        }

        buttons += `</div>`;
        return buttons;
    }

    function setupEventListeners() {
        $('#btnNuevoRegistro').on('click', openModalForNew);
        $('#formUsuario').on('submit', saveUsuario);
        $('#tablaUsuarios tbody').on('click', '.action-edit', handleEdit);
        $('#tablaUsuarios tbody').on('click', '.action-status', handleToggleStatus);
        $('#tablaUsuarios tbody').on('click', '.action-delete', handleDelete);
    }

    async function cargarPerfiles(selectedProfileId = null) {
        const select = $('#id_perfil');
        select.empty().append('<option value="">Cargando...</option>');
        try {
            const response = await fetch(ENDPOINTS.perfiles);
            const result = await response.json();
            if (result.success && result.data) {
                select.empty().append('<option value="">Seleccione un perfil</option>');
                result.data.forEach(perfil => {
                    select.append(`<option value="${perfil.id}">${perfil.nombre}</option>`);
                });
                if (selectedProfileId) {
                    select.val(selectedProfileId);
                }
            }
        } catch (error) {
            select.empty().append('<option value="">Error al cargar perfiles</option>');
        }
    }

    function openModalForNew() {
        clearForm();
        $('#modalTitle').text('Agregar Usuario');
        cargarPerfiles();
        usuarioModal.show();
    }

    async function handleEdit(e) {
        const id = $(this).data('id');
        try {
            const response = await fetch(ENDPOINTS.get(id));
            const result = await response.json();
            if (result.success) {
                fillForm(result.data);
                $('#modalTitle').text('Editar Usuario');
                await cargarPerfiles(result.data.perfil.id);
                usuarioModal.show();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Error al cargar los datos del usuario.', 'error');
        }
    }

    async function saveUsuario(e) {
        e.preventDefault();
        const usuarioData = {
            id: $('#id').val() || null,
            nombre: $('#nombre').val(),
            usuario: $('#usuario').val(),
            clave: $('#clave').val(),
            correo: $('#correo').val(),
            perfil: { id: $('#id_perfil').val() }
        };

        try {
            const response = await fetch(ENDPOINTS.save, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(usuarioData) });
            const result = await response.json();
            if (result.success) {
                usuarioModal.hide();
                showNotification(result.message, 'success');
                dataTable.ajax.reload();
            } else {
                showNotification(result.message, 'error');
            }
        } catch (error) {
            showNotification('Error al guardar el usuario.', 'error');
        }
    }

    function handleDelete(e) {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "El usuario pasará a estado 'Eliminado' (no se borrará permanentemente).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c754d', // Changed to a more neutral color
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(ENDPOINTS.delete(id), { method: 'DELETE' });
                    const result = await response.json();
                    if (result.success) {
                        showNotification(result.message, 'success');
                        dataTable.ajax.reload();
                    } else {
                        showNotification(result.message, 'error');
                    }
                } catch (error) {
                    showNotification('Error al eliminar el usuario.', 'error');
                }
            }
        });
    }

    async function handleToggleStatus(e) {
        const id = $(this).data('id');
        try {
            const response = await fetch(ENDPOINTS.toggleStatus(id), { method: 'POST' });
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

    function fillForm(data) {
        $('#id').val(data.id);
        $('#nombre').val(data.nombre);
        $('#usuario').val(data.usuario);
        $('#correo').val(data.correo);
        // No rellenamos la clave por seguridad
    }

    function clearForm() {
        $('#formUsuario')[0].reset();
        $('#id').val('');
    }

    function showNotification(message, type = 'success') {
        const toastContainer = $('#notification-container');
        const toastClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
        const toastHTML = `<div class="toast align-items-center ${toastClass} border-0" role="alert" aria-live="assertive" aria-atomic="true"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>`;
        toastContainer.append(toastHTML);
        const toast = new bootstrap.Toast(toastContainer.children().last(), { delay: 3000 });
        toast.show();
    }
});

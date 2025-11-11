$(document).ready(function() {
    let dataTable;

    const API_BASE = '/ventas/api';
    const ENDPOINTS = {
        list: `${API_BASE}/web`,
        process: (id) => `${API_BASE}/web/procesar/${id}`,
    };

    initializeDataTable();
    setupEventListeners();

    function initializeDataTable() {
        if (dataTable) dataTable.destroy();
        dataTable = $('#tablaVentasWeb').DataTable({
            responsive: true,
            processing: true,
            ajax: { url: ENDPOINTS.list, dataSrc: 'data' },
            columns: [
                { data: 'id' },
                { data: 'nombreCliente' },
                { data: 'numeroDocumentoCliente' },
                { data: 'fechaPedido', render: data => new Date(data).toLocaleString('es-PE') },
                { data: 'total', render: data => `S/ ${parseFloat(data).toFixed(2)}` },
                {
                    data: null, orderable: false, searchable: false,
                    render: (data, type, row) => `
                        <button class="btn btn-sm btn-success action-process" data-id="${row.id}" title="Procesar Venta"><i class="bi bi-check-lg"></i></button>
                    `
                }
            ],
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
            order: [[0, 'desc']]
        });
    }

    function setupEventListeners() {
        $('#tablaVentasWeb tbody').on('click', '.action-process', handleProcesar);
    }

    function handleProcesar() {
        const ventaId = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "La venta será procesada y el stock de los productos será actualizado. Esta acción no se puede revertir.",
            icon: 'info',
            showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, procesar', cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    url: ENDPOINTS.process(ventaId), type: 'POST',
                    success: function(response) {
                        showNotification(response.message, response.success ? 'success' : 'error');
                        if (response.success) dataTable.ajax.reload();
                    },
                    error: (xhr) => showNotification(xhr.responseJSON?.message || 'Error al procesar la venta.', 'error')
                });
            }
        });
    }

    function showNotification(message, type = 'success') {
        const toastContainer = $('#notification-container');
        const toastClass = type === 'success' ? 'text-bg-success' : (type === 'error' ? 'text-bg-danger' : 'text-bg-info');
        const toastHTML = `
            <div class="toast align-items-center ${toastClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>`;
        toastContainer.append(toastHTML);
        const toast = new bootstrap.Toast(toastContainer.children().last(), { delay: 3000 });
        toast.show();
    }
});

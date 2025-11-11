$(document).ready(function() {

    // Función para mostrar notificaciones (toast)
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

    // Inicializar DataTable
    var tablaInventario = $('#tablaInventario').on('init.dt', function() {
        // Este evento se dispara una vez que la tabla está completamente inicializada.
        // Es el lugar ideal para recorrer todos los datos y mostrar las alertas una sola vez.
        var api = new $.fn.dataTable.Api(this);
        api.rows().every(function() {
            var rowNode = this.node();
            var nombreProducto = $(rowNode).find('td').eq(1).text();
            var stock = parseInt($(rowNode).find('td').eq(3).text().trim(), 10);
            var stockMinimo = parseInt($(rowNode).find('td').eq(4).text().trim(), 10);

            if (!isNaN(stock) && !isNaN(stockMinimo) && stock <= stockMinimo) {
                showNotification(`Alerta de Stock: "${nombreProducto}" tiene ${stock} unidades (mínimo ${stockMinimo}).`, 'warning');
            }
        });
    }).DataTable({
        "responsive": true,
        "autoWidth": false,
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
        },
        "columnDefs": [
            { "orderable": false, "targets": [0, 5] } // Deshabilitar ordenación
        ],
        "createdRow": function(row, data, dataIndex) {
            // Este callback es ideal para modificar la fila (TR) después de ser creada.
            // 'data' es un array con el contenido de las celdas de la fila.
            const stock = parseInt(data[3], 10);
            const stockMinimo = parseInt(data[4], 10);
            const stockCell = $('td', row).eq(3);

            if (!isNaN(stock) && !isNaN(stockMinimo)) {
                let colorClass = stock <= stockMinimo ? 'text-bg-danger' : 'text-bg-success';
                stockCell.html(`<span class="badge ${colorClass}">${stock}</span>`);
            }
        }
    });

    // Manejar el clic en el botón 'Movimientos'
    $('#tablaInventario tbody').on('click', '.btn-movimientos', function() {
        var productId = $(this).data('id');
        var productName = $(this).data('nombre');

        $('#modalProductoNombre').text(productName);
        $('#tablaMovimientos tbody').empty();

        $.ajax({
            url: '/inventario/api/movimientos/' + productId,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var movimientos = response.data;
                    if (movimientos.length > 0) {
                        movimientos.forEach(function(movimiento) {
                            $('#tablaMovimientos tbody').append(
                                '<tr>' +
                                    '<td>' + movimiento.numeroVenta + '</td>' +
                                    '<td>' + (movimiento.fechaVenta ? new Date(movimiento.fechaVenta).toLocaleDateString() : '') + '</td>' +
                                    '<td>' + movimiento.precioVenta.toFixed(2) + '</td>' +
                                    '<td>' + movimiento.cantidad + '</td>' +
                                    '<td>' + movimiento.subtotal.toFixed(2) + '</td>' +
                                '</tr>'
                            );
                        });
                    } else {
                        $('#tablaMovimientos tbody').append('<tr><td colspan="5" class="text-center">No hay movimientos para este producto.</td></tr>');
                    }
                } else {
                    console.error('Error al cargar movimientos:', response.message);
                    $('#tablaMovimientos tbody').append('<tr><td colspan="5" class="text-center">Error al cargar movimientos.</td></tr>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en la petición AJAX para movimientos:', error);
                $('#tablaMovimientos tbody').append('<tr><td colspan="5" class="text-center">Error de conexión al cargar movimientos.</td></tr>');
            }
        });

        var movimientosModal = new bootstrap.Modal(document.getElementById('movimientosModal'));
        movimientosModal.show();
    });

    // Exportar a PDF
    $('#btnExportarPdf').on('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const nombreProducto = $('#modalProductoNombre').text();

        doc.autoTable({
            html: '#tablaMovimientos',
            startY: 20,
            didDrawPage: function (data) {
                doc.text(`Movimientos de Inventario para: ${nombreProducto}`, 14, 15);
            }
        });

        doc.save(`movimientos_${nombreProducto.replace(/ /g, '_')}.pdf`);
    });

    // Exportar a Excel
    $('#btnExportarExcel').on('click', function() {
        const nombreProducto = $('#modalProductoNombre').text();
        const tabla = document.getElementById('tablaMovimientos');
        const wb = XLSX.utils.table_to_book(tabla, { sheet: "Movimientos" });
        XLSX.writeFile(wb, `movimientos_${nombreProducto.replace(/ /g, '_')}.xlsx`);
    });
});

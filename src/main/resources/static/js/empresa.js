
$(document).ready(function() {

    // Función para formatear los resultados del Select2 (con imagen)
    function formatProductResult(product) {
        if (!product.id) {
            return product.text; // Texto por defecto para el placeholder
        }
        
        // Obtener la URL de la imagen del atributo data-image-url
        const imageUrl = $(product.element).data('image-url');
        const defaultImage = '/images/placeholder.png'; // Imagen por defecto si no hay foto

        if (imageUrl) {
            return $(
                `<span class="d-flex align-items-center"><img src="${imageUrl}" class="me-2" style="width: 30px; height: 30px; object-fit: cover; border-radius: 3px;" /><span>${product.text}</span></span>`
            );
        } else {
            return $(
                `<span class="d-flex align-items-center"><img src="${defaultImage}" class="me-2" style="width: 30px; height: 30px; object-fit: cover; border-radius: 3px;" /><span>${product.text}</span></span>`
            );
        }
    }

    // Función para formatear las selecciones del Select2 (con imagen)
    function formatProductSelection(product) {
        if (!product.id) {
            return product.text; // Texto por defecto para el placeholder
        }

        const imageUrl = $(product.element).data('image-url');
        const defaultImage = '/images/placeholder.png';

        if (imageUrl) {
            return $(
                `<span class="d-flex align-items-center"><img src="${imageUrl}" class="me-2" style="width: 24px; height: 24px; object-fit: cover; border-radius: 3px;" /><span>${product.text}</span></span>`
            );
        } else {
            return $(
                `<span class="d-flex align-items-center"><img src="${defaultImage}" class="me-2" style="width: 24px; height: 24px; object-fit: cover; border-radius: 3px;" /><span>${product.text}</span></span>`
            );
        }
    }

    // Inicializar el selector múltiple de Select2
    $('#productosDestacados').select2({
        theme: "bootstrap-5",
        placeholder: "Selecciona los productos a destacar",
        closeOnSelect: false, // Mantener abierto para selección múltiple
        templateResult: formatProductResult, // Usar la función de formato para los resultados
        templateSelection: formatProductSelection, // Usar la función de formato para las selecciones
        escapeMarkup: function (markup) { return markup; } // Permitir HTML en los resultados
    });

    // Intercepta el envío del formulario para manejarlo con AJAX
    $('#formEmpresa').on('submit', function(e) {
        e.preventDefault(); // Previene la recarga de la página
        saveEmpresa();
    });

    // Función para guardar los datos de la empresa vía AJAX
    function saveEmpresa() {
        // Obtener los IDs de los productos seleccionados
        const productosIds = $('#productosDestacados').val();
        // Convertir el array de IDs en el formato que espera el backend: [{id: 1}, {id: 2}, ...]
        const productosDestacados = productosIds ? productosIds.map(id => ({ id: parseInt(id) })) : [];

        const empresaData = {
            id: $('#id').val(),
            nombre: $('#nombre').val(),
            direccion: $('#direccion').val(),
            telefono: $('#telefono').val(),
            email: $('#email').val(),
            logoUrl: $('#logoUrl').val(),
            nosotros: $('#nosotros').val(),
            productosDestacados: productosDestacados // Se añade la lista de productos
        };

        fetch('/empresa/api/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empresaData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
            } else {
                showNotification(data.message || 'Error al guardar.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error de conexión al guardar los cambios.', 'error');
        });
    }

    // Lógica para la subida asíncrona del logo
    $('#logoFile').on('change', async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logoFile', file);

        try {
            const response = await fetch('/empresa/api/subir-logo', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                $('#logoUrl').val(result.imageUrl);
                $('#currentLogoPreview').attr('src', result.imageUrl);
                showNotification('Logo listo. Haz clic en "Guardar Cambios" para confirmar.', 'info');
            } else {
                showNotification('Error al subir el logo: ' + result.message, 'error');
            }
        } catch (error) {
            showNotification('Error de conexión al subir el logo.', 'error');
        }
    });

    // Función para mostrar notificaciones (Toast)
    function showNotification(message, type = 'success') {
        const toastContainer = $('#notification-container');
        if (!toastContainer.length) return;

        const toastClass = (type === 'success') ? 'text-bg-success' : (type === 'error' ? 'text-bg-danger' : 'text-bg-info');
        
        const toastHTML = `
            <div class="toast align-items-center ${toastClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>`;
        
        const toastElement = $(toastHTML);
        toastContainer.append(toastElement);

        const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
        toast.show();
    }
});

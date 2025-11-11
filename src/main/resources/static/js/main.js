document.addEventListener('DOMContentLoaded', function() {
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainContent = document.getElementById('main-content');

    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
});

/**
 * Muestra notificaciones toast globales.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de notificación: 'success', 'danger', o 'warning'.
 */
function showNotification(message, type = 'success') {
    let toastClass = 'text-bg-success'; // Default a success
    if (type === 'danger') {
        toastClass = 'text-bg-danger';
    } else if (type === 'warning') {
        toastClass = 'text-bg-warning';
    }

    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        console.error('El contenedor de notificaciones #notification-container no se encontró en la página.');
        return;
    }

    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center ${toastClass} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    notificationContainer.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement, {
        delay: 5000
    });
    toast.show();

    // Eliminar el elemento del DOM después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
}

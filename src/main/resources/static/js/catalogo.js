document.addEventListener('DOMContentLoaded', function() {

    // --- Lógica para el Botón de Pedido ---
    const btnRealizarPedido = document.getElementById('btnRealizarPedido');
    if (btnRealizarPedido) {
        btnRealizarPedido.addEventListener('click', function() {
            window.location.href = "/login";
        });
    }

    // --- Lógica para el Carrusel Compacto ---
    const track = document.querySelector('.cover-flow-carousel-track');
    if (track) {
        const items = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-nav-btn.next');
        const prevButton = document.querySelector('.carousel-nav-btn.prev');

        const nombreEl = document.getElementById('producto-nombre');
        const descripcionEl = document.getElementById('producto-descripcion');
        const precioEl = document.getElementById('producto-precio');

        if (items.length === 0) return;

        let currentIndex = 0;
        let autoSlideInterval;

        const updateCarousel = () => {
            items.forEach((item, index) => {
                item.classList.remove('active', 'prev', 'next');

                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                const nextIndex = (currentIndex + 1) % items.length;

                if (index === currentIndex) {
                    item.classList.add('active');
                    if (nombreEl && descripcionEl && precioEl) {
                        nombreEl.textContent = item.dataset.nombre;
                        descripcionEl.textContent = item.dataset.descripcion;
                        precioEl.textContent = 'S/ ' + item.dataset.precio;
                    }
                } else if (index === prevIndex) {
                    item.classList.add('prev');
                } else if (index === nextIndex) {
                    item.classList.add('next');
                } 
            });
        };

        const moveToIndex = (index) => {
            currentIndex = index;
            updateCarousel();
        };

        const moveToNext = () => {
            const newIndex = (currentIndex + 1) % items.length;
            moveToIndex(newIndex);
        };

        const moveToPrev = () => {
            const newIndex = (currentIndex - 1 + items.length) % items.length;
            moveToIndex(newIndex);
        };

        const startAutoSlide = () => {
            autoSlideInterval = setInterval(moveToNext, 3000);
        };

        const stopAutoSlide = () => {
            clearInterval(autoSlideInterval);
        };

        const resetAutoSlide = () => {
            stopAutoSlide();
            startAutoSlide();
        };

        nextButton.addEventListener('click', () => {
            moveToNext();
            resetAutoSlide();
        });

        prevButton.addEventListener('click', () => {
            moveToPrev();
            resetAutoSlide();
        });
        
        const carouselWrapper = document.querySelector('.cover-flow-carousel-wrapper');
        carouselWrapper.addEventListener('mouseenter', stopAutoSlide);
        carouselWrapper.addEventListener('mouseleave', startAutoSlide);

        // Inicializar
        moveToIndex(0);
        startAutoSlide();
    }
    
    // --- Lógica de Filtros y Categorías --- 
    const applyFiltersBtn = document.getElementById('applyFilters');
    const categoryFilterButtonsContainer = document.getElementById('categoryFilterButtons');
    const allProductsDisplay = document.getElementById('allProductsDisplay');
    const productItems = allProductsDisplay ? allProductsDisplay.querySelectorAll('.product-item') : [];

    function filterAndDisplayProducts() {
        const nombreFilter = document.getElementById('filterNombre').value.toLowerCase();
        const precioMinFilter = parseFloat(document.getElementById('filterPrecioMin').value) || 0;
        const precioMaxFilter = parseFloat(document.getElementById('filterPrecioMax').value) || Infinity;
        
        const activeCategoryButton = categoryFilterButtonsContainer.querySelector('.active');
        const activeCategoryId = activeCategoryButton ? activeCategoryButton.getAttribute('data-category-id') : 'all';

        productItems.forEach(product => {
            const productName = product.getAttribute('data-product-name').toLowerCase();
            const productPrice = parseFloat(product.getAttribute('data-product-price'));
            const productCategoryId = product.getAttribute('data-category-id');

            const matchesName = productName.includes(nombreFilter);
            const matchesPrice = productPrice >= precioMinFilter && productPrice <= precioMaxFilter;
            const matchesCategory = (activeCategoryId === 'all' || productCategoryId === activeCategoryId);

            if (matchesName && matchesPrice && matchesCategory) {
                product.style.display = ''; // Show product
            } else {
                product.style.display = 'none'; // Hide product
            }
        });
    }

    // Evento para los botones de categoría
    if (categoryFilterButtonsContainer) {
        categoryFilterButtonsContainer.addEventListener('click', function(e) {
            if (e.target.matches('.btn-outline-primary')) {
                const currentActive = categoryFilterButtonsContainer.querySelector('.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                e.target.classList.add('active');
                
                document.getElementById('filterNombre').value = '';
                document.getElementById('filterPrecioMin').value = '';
                document.getElementById('filterPrecioMax').value = '';

                filterAndDisplayProducts();
            }
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', filterAndDisplayProducts);
    }

    if (productItems.length > 0) {
        filterAndDisplayProducts();
    }

    // --- Lógica del Carrito de Compras ---
    const cartToggleButton = document.getElementById('cart-toggle-btn');
    const cartCloseButton = document.getElementById('cart-close-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    const mainContainer = document.querySelector('.main-container');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');

    let cart = [];

    const toggleCart = () => {
        cartSidebar.classList.toggle('open');
        mainContainer.classList.toggle('cart-open');
    };

    const removeFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        updateCartUI();
    };

    const updateQuantity = (productId, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);
        const item = cart.find(item => item.id === productId);

        if (item) {
            if (isNaN(quantity) || quantity < 1) {
                removeFromCart(productId);
            } else {
                item.quantity = quantity;
                updateCartUI();
            }
        }
    };

    const updateCartUI = () => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center my-4">Tu carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                totalItems += item.quantity;

                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item', 'mb-3', 'p-2', 'border', 'rounded');
                cartItemElement.dataset.productId = item.id;
                cartItemElement.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-truncate" style="max-width: 150px;">${item.name}</span>
                        <button class="btn btn-sm btn-outline-danger remove-from-cart">&times;</button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="input-group input-group-sm" style="width: 120px;">
                            <button class="btn btn-outline-secondary change-quantity" type="button" data-change="-1">-</button>
                            <input type="number" class="form-control text-center quantity-input" value="${item.quantity}" min="1" aria-label="Cantidad">
                            <button class="btn btn-outline-secondary change-quantity" type="button" data-change="1">+</button>
                        </div>
                        <span class="fw-bold">S/ ${itemTotal.toFixed(2)}</span>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
        }

        cartTotal.textContent = total.toFixed(2);
        cartCount.textContent = totalItems;
    };

    const addToCart = (productId) => {
        const productElement = document.querySelector(`.add-to-cart-btn[data-product-id='${productId}']`).closest('.product-item');
        const name = productElement.dataset.productName;
        const price = parseFloat(productElement.dataset.productPrice);

        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: productId, name, price, quantity: 1 });
        }

        updateCartUI();
    };

    if (cartToggleButton) {
        cartToggleButton.addEventListener('click', toggleCart);
    }

    if (cartCloseButton) {
        cartCloseButton.addEventListener('click', toggleCart);
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            addToCart(productId);
        });
    });

    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const cartItem = target.closest('.cart-item');
        if (!cartItem) return;

        const productId = cartItem.dataset.productId;

        if (target.classList.contains('remove-from-cart')) {
            removeFromCart(productId);
        }

        if (target.classList.contains('change-quantity')) {
            const change = parseInt(target.dataset.change, 10);
            const item = cart.find(i => i.id === productId);
            if (item) {
                updateQuantity(productId, item.quantity + change);
            }
        }
    });

    cartItemsContainer.addEventListener('change', (e) => {
        const target = e.target;
        const cartItem = target.closest('.cart-item');
        if (!cartItem || !target.classList.contains('quantity-input')) return;
        
        const productId = cartItem.dataset.productId;
        updateQuantity(productId, target.value);
    });

    if (btnFinalizarCompra) {
        btnFinalizarCompra.addEventListener('click', () => {
            const customerName = document.getElementById('customer-name').value.trim();
            const customerDni = document.getElementById('customer-dni').value.trim();
            const total = parseFloat(cartTotal.textContent);

            if (cart.length === 0) {
                alert('Tu carrito está vacío. Agrega productos antes de enviar el pedido.');
                return;
            }

            if (!customerName || !customerDni) {
                alert('Por favor, ingresa tu nombre y DNI para continuar.');
                return;
            }

            const ventaWebData = {
                nombreCliente: customerName,
                numeroDocumentoCliente: customerDni,
                detalles: cart.map(item => ({
                    producto: { id: parseInt(item.id, 10) }, // Asegurarse de que el ID es un número
                    cantidad: item.quantity,
                    precioUnitario: item.price
                })),
                total: total
            };

            fetch('/ventas/api/web/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ventaWebData),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    let message = `*¡Nuevo Pedido!* 🛍\n\n`;
                    message += `*N° de Pedido:* ${data.ventaWebId}\n`;
                    message += `*Datos del Cliente:*\n`;
                    message += `*- Nombre:* ${customerName}\n`;
                    message += `*- DNI:* ${customerDni}\n\n`;
                    message += `*Detalle del Pedido:*\n`;
                    message += `-----------------------------------\n`;

                    cart.forEach(item => {
                        const itemTotal = (item.price * item.quantity).toFixed(2);
                        message += `- ${item.quantity} x ${item.name} - *S/ ${itemTotal}*\n`;
                    });

                    message += `-----------------------------------\n`;
                    message += `*Total del Pedido: S/ ${total.toFixed(2)}*`;

                    const telefonoAttr = btnFinalizarCompra.getAttribute('data-telefono');
                    if (telefonoAttr) {
                        const telefonoLimpio = telefonoAttr.replace(/\D/g, '');
                        const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                    }

                    cart = [];
                    updateCartUI();
                } else {
                    alert('Error al guardar el pedido: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ocurrió un error al procesar el pedido.');
            });
        });
    }

    updateCartUI();
});

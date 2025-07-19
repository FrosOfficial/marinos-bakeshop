// Global variables
const cartIcon = document.getElementById('cart-btn');
const cartQuantity = document.getElementById('cart-quantity');
const cartModal = document.getElementById('cartModal');
let currentQuantity = 1;
let currentProductName = '';
let currentItemPrice = 0;
let currentUnitPrice = 480; // Keep for compatibility

// Product images mapping
const productImages = {
    "Yema Cake Special": "img/product-1.jpg",
    "Yema Cake Tub": "img/product-2.jpg",
    "Caramel Bar Box": "img/product-3.jpg",
    "Chiffon Cake": "img/product-4.jpg",
    "Custard Cake": "img/product-5.jpg",
    "Crinkles In Boxed": "img/product-6.jpg",
    "Crinkles In Plastic": "img/product-7.jpg",
    "Choco Chips Cookies In Boxed": "img/product-8.jpg",
    "Choco Chips Cookies In Plastic": "img/product-9.jpg",
    "Egg Pie": "img/product-10.jpg"
};

// Show modal (updated for improved modal)
function showModal(productName = 'Yema Cake Special', unitPrice = 480) {
    currentProductName = productName;
    currentUnitPrice = unitPrice;
    currentItemPrice = unitPrice; // Keep compatibility
    currentQuantity = 1;
    
    // Update modal content
    document.getElementById('productName').textContent = productName;
    document.getElementById('unitPrice').textContent = unitPrice;
    document.getElementById('quantityDisplay').textContent = currentQuantity;
    document.getElementById('totalCost').textContent = unitPrice;
    
    // Show modal with overlay
    document.getElementById('modalOverlay').style.display = 'block';
    document.getElementById('cartModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Hide success message
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// Show cart modal (legacy function - kept for compatibility)
function showCartModal(productName, price) {
    showModal(productName, price);
}

// Hide modal (updated for improved modal)
function hideModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const cartModal = document.getElementById('cartModal');
    
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (cartModal) cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Hide cart modal (legacy function - kept for compatibility)
function hideCartModal() {
    hideModal();
}

// Update quantity display (updated for improved modal)
function updateDisplay() {
    const quantityDisplay = document.getElementById('quantityDisplay');
    const totalCost = document.getElementById('totalCost');
    
    if (quantityDisplay) {
        quantityDisplay.textContent = currentQuantity;
    }
    
    if (totalCost) {
        totalCost.textContent = currentQuantity * currentItemPrice;
    }
    
    // Legacy support
    const legacyQuantity = document.getElementById('quantity');
    if (legacyQuantity) {
        legacyQuantity.innerText = currentQuantity;
    }
}

// Update quantity (legacy function - kept for compatibility)
function updateQuantity() {
    updateDisplay();
}

// Update total cost (legacy function - kept for compatibility)
function updateTotalCost() {
    updateDisplay();
}

// Increase quantity (updated for improved modal)
function increaseQuantity() {
    if (currentQuantity < 99) {
        currentQuantity++;
        updateDisplay();
    }
}

// Decrease quantity (updated for improved modal)
function decreaseQuantity() {
    if (currentQuantity > 1) {
        currentQuantity--;
        updateDisplay();
    }
}

// Add item to cart (updated with success animation)
function addToCart() {
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    
    // Check if product already exists in cart
    let existingProduct = cart.find(item => item.name === currentProductName);
    
    if (existingProduct) {
        // Update existing product
        existingProduct.quantity += currentQuantity;
        existingProduct.totalPrice = existingProduct.quantity * existingProduct.price;
    } else {
        // Add new product
        cart.push({
            name: currentProductName,
            price: currentItemPrice,
            quantity: currentQuantity,
            totalPrice: currentQuantity * currentItemPrice,
            image: productImages[currentProductName] || "img/default.jpg"
        });
    }
    
    // Save to sessionStorage
    sessionStorage.setItem('cart', JSON.stringify(cart));
    
    // Calculate total quantity and save
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    sessionStorage.setItem('cartQuantity', totalQuantity);
    
    // Update UI
    updateCartUI();
    
    // Show success animation
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'block';
        console.log(`Added ${currentQuantity} x ${currentProductName} to cart`);
        
        // Hide modal after 1.5 seconds
        setTimeout(() => {
            hideModal();
        }, 1500);
    } else {
        // Fallback if no success message element
        hideModal();
    }
}

// Update cart UI
function updateCartUI() {
    const cartQuantityElement = document.getElementById('cart-quantity');
    const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    
    if (cartQuantityElement) {
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartQuantityElement.innerText = totalQuantity;
    }
}

// Display cart items
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    let totalCartPrice = 0;

    cart.forEach(item => {
        totalCartPrice += item.totalPrice;

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <p class="cart-item-name">${item.name}</p>
                <p class="cart-item-quantity">Quantity: ${item.quantity}</p>
                <p class="cart-item-price">Total Price: ₱${item.totalPrice.toFixed(2)}</p>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    // Update total display
    if (cartTotalElement) {
        cartTotalElement.innerText = `₱${totalCartPrice.toFixed(2)}`;
    }
}

// Checkout function
function checkout() {
    const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const confirmPurchase = confirm("Do you want to buy these items?");
    if (confirmPurchase) {
        // Clear cart data from session storage
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('cartQuantity');

        // Clear cart items in the UI
        const cartItemsContainer = document.getElementById("cart-items");
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = "";
        }

        // Reset the cart total
        const cartTotalElement = document.getElementById("cart-total");
        if (cartTotalElement) {
            cartTotalElement.innerText = "₱0.00";
        }

        // Reset cart quantity display
        const cartQuantityElement = document.getElementById("cart-quantity");
        if (cartQuantityElement) {
            cartQuantityElement.innerText = "0";
        }

        alert("Purchase successful! Thank you for your order.");
    }
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
    displayCartItems();
    
    // Add event listeners for modal
    setupModalEventListeners();
});

// Setup modal event listeners
function setupModalEventListeners() {
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideModal();
        }
    });

    // Prevent modal from closing when clicking inside the modal
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
}

// Remove item from cart (optional enhancement)
function removeFromCart(productName) {
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    
    // Filter out the item to remove
    cart = cart.filter(item => item.name !== productName);
    
    // Save updated cart
    sessionStorage.setItem('cart', JSON.stringify(cart));
    
    // Update total quantity
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    sessionStorage.setItem('cartQuantity', totalQuantity);
    
    // Update UI
    updateCartUI();
    displayCartItems();
}

// Update item quantity in cart (optional enhancement)
function updateItemQuantity(productName, newQuantity) {
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    
    const item = cart.find(item => item.name === productName);
    if (item) {
        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            removeFromCart(productName);
        } else {
            item.quantity = newQuantity;
            item.totalPrice = item.quantity * item.price;
            
            // Save updated cart
            sessionStorage.setItem('cart', JSON.stringify(cart));
            
            // Update total quantity
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            sessionStorage.setItem('cartQuantity', totalQuantity);
            
            // Update UI
            updateCartUI();
            displayCartItems();
        }
    }
}
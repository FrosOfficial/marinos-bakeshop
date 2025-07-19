// Cart functionality with login validation
let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

// DOM elements
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartQuantityElement = document.getElementById('cart-quantity');
const checkoutBtn = document.getElementById('checkout-btn');

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    displayCartItems();
    updateCartTotal();
    updateCartQuantity();
});

// Check if user is logged in
function isUserLoggedIn() {
    const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    return userData !== null;
}

// Get logged in user data
function getLoggedInUser() {
    const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Display cart items
function displayCartItems() {
    if (!cartItemsContainer) return;
    
    // Refresh cart from sessionStorage
    cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p style="font-size: 15px;">Add some delicious items from our bakeshop!</p>
                <a href="Shop.html" class="continue-shopping-btn">Continue Shopping</a>
            </div>
        `;
        return;
    }
    
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="cart-item-price">₱${item.price}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn minus" onclick="updateQuantity(${index}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" onclick="updateQuantity(${index}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="cart-item-total">
                <span>₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div class="cart-item-remove">
                <button class="remove-btn" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
}

// Update item quantity
function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
        saveCart();
        displayCartItems();
        updateCartTotal();
        updateCartQuantity();
    }
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    displayCartItems();
    updateCartTotal();
    updateCartQuantity();
}

// Update cart total
function updateCartTotal() {
    // Refresh cart from sessionStorage first
    cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotalElement) {
        cartTotalElement.textContent = `₱${total.toFixed(2)}`;
    }
}

// Update cart quantity in header
function updateCartQuantity() {
    // Refresh cart from sessionStorage first
    cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartQuantityElement) {
        cartQuantityElement.textContent = totalQuantity;
    }
}

// Save cart to sessionStorage
function saveCart() {
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

// Show login required modal
function showLoginRequiredModal() {
    const modal = document.createElement('div');
    modal.className = 'login-required-modal';
    modal.innerHTML = `
        <div class="login-required-modal-content">
            <div class="login-required-header">
                <div class="login-required-icon">
                    <i class="fas fa-user-lock"></i>
                </div>
                <h2>Login Required</h2>
                <p>You need to be logged in to place an order</p>
            </div>
            
            <div class="login-required-body">
                <p>Please log in to your account to continue with your order. Don't have an account? You can create one quickly!</p>
                <div class="user-benefits">
                    <div class="benefit-item">
                        <i class="fas fa-truck"></i>
                        <span>Track your orders</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-heart"></i>
                        <span>Save favorite items</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-clock"></i>
                        <span>Faster checkout</span>
                    </div>
                </div>
            </div>
            
            <div class="login-required-actions">
                <button class="btn-secondary" onclick="closeLoginRequiredModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn-primary" onclick="redirectToLogin()">
                    <i class="fas fa-sign-in-alt"></i> Go to Login
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeLoginRequiredModal();
        }
    });
}

// Close login required modal
function closeLoginRequiredModal() {
    const modal = document.querySelector('.login-required-modal');
    if (modal) {
        modal.remove();
    }
}

// Redirect to login page
function redirectToLogin() {
    // Save current page URL to return after login
    sessionStorage.setItem('returnUrl', window.location.href);
    window.location.href = 'login.html';
}

// Check for return after login (call this when the cart page loads)
function checkReturnAfterLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('loginSuccess');
    
    if (loginSuccess === 'true' && isUserLoggedIn()) {
        // User just logged in successfully, show checkout form
        showNotification('Welcome back! You can now complete your order.', 'success');
        
        // Remove the URL parameter
        const url = new URL(window.location);
        url.searchParams.delete('loginSuccess');
        window.history.replaceState({}, document.title, url);
        
        // Automatically show checkout if cart has items
        if (cart.length > 0) {
            setTimeout(() => {
                showCheckoutForm();
            }, 1500);
        }
    }
}

// Enhanced checkout functionality with login validation
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            showLoginRequiredModal();
            return;
        }
        
        // User is logged in, proceed with checkout
        showCheckoutForm();
    });
}

// Show checkout form (now includes user info pre-fill)
function showCheckoutForm() {
    const user = getLoggedInUser();
    
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.innerHTML = `
        <div class="checkout-modal-content">
            <div class="checkout-header">
                <h2><i class="fas fa-shopping-bag"></i> Checkout</h2>
                <button class="close-modal" onclick="closeCheckoutModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="checkout-body">
                <div class="order-summary">
                    <h3>Order Summary</h3>
                    <div class="order-items">
                        ${cart.map(item => `
                            <div class="order-item">
                                <span>${item.name} x${item.quantity}</span>
                                <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-total">
                        <strong>Total: ₱${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</strong>
                    </div>
                </div>
                
                <form class="checkout-form" id="checkout-form">
                    <div class="form-section">
                        <h3><i class="fas fa-user"></i> Personal Information</h3>
                        <div class="form-group">
                            <label for="customer-name">Full Name *</label>
                            <input type="text" id="customer-name" name="customerName" value="${user ? user.fullname : ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="customer-phone">Contact Number *</label>
                            <input type="tel" id="customer-phone" name="customerPhone" required>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3><i class="fas fa-map-marker-alt"></i> Delivery Information</h3>
                        <div class="form-group">
                            <label for="customer-address">Complete Address *</label>
                            <textarea id="customer-address" name="customerAddress" rows="3" required placeholder="House No., Street, Barangay, City, Province"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3><i class="fas fa-credit-card"></i> Payment Method</h3>
                        <div class="payment-options">
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="Cash on Delivery" checked>
                                <div class="payment-card">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <span>Cash on Delivery</span>
                                </div>
                            </label>
                            
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="GCash">
                                <div class="payment-card">
                                    <i class="fab fa-google-pay"></i>
                                    <span>GCash</span>
                                </div>
                            </label>
                            
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="Maya">
                                <div class="payment-card">
                                    <i class="fas fa-mobile-alt"></i>
                                    <span>Maya</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <div class="form-group">
                            <label for="order-notes">Special Instructions (Optional)</label>
                            <textarea id="order-notes" name="orderNotes" rows="2" placeholder="Any special requests or delivery instructions..."></textarea>
                        </div>
                    </div>
                    
                    <div class="checkout-actions">
                        <button type="button" class="btn-secondary" onclick="closeCheckoutModal()">Cancel</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-check"></i> Place Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = document.getElementById('checkout-form');
    form.addEventListener('submit', handleCheckoutSubmit);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCheckoutModal();
        }
    });
}

// Close checkout modal
function closeCheckoutModal() {
    const modal = document.querySelector('.checkout-modal');
    if (modal) {
        modal.remove();
    }
}

// Handle checkout form submission (enhanced with user data)
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const user = getLoggedInUser();
    const formData = new FormData(e.target);
  const orderData = {
  customerName: formData.get('customerName'),
  userEmail: user ? user.email : null,        
  userFullname: user ? user.fullname : null, 
  customerPhone: formData.get('customerPhone'),
  customerAddress: formData.get('customerAddress'),
  paymentMethod: formData.get('paymentMethod'),
  orderNotes: formData.get('orderNotes') || '',
  items: cart,
  total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  orderDate: new Date().toISOString(),
  userId: user ? user.id : null
};
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear cart
            cart = [];
            saveCart();
            sessionStorage.removeItem('cartQuantity'); // Also clear the cartQuantity
            
            // Close modal
            closeCheckoutModal();
            
            // Show success message
            showOrderSuccessModal(result.orderId, orderData);
            
            // Update display
            displayCartItems();
            updateCartTotal();
            updateCartQuantity();
        } else {
            throw new Error(result.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Order submission error:', error);
        showNotification('Failed to place order. Please try again.', 'error');
        
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Show order success modal
function showOrderSuccessModal(orderId, orderData) {
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.innerHTML = `
        <div class="success-modal-content">
            <div class="success-header">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Order Placed Successfully!</h2>
                <p>Thank you for your order, ${orderData.customerName}!</p>
            </div>
            
            <div class="success-body">
                <div class="order-details">
                    <h3>Order Details</h3>
                    <div class="detail-row">
                        <span>Order ID:</span>
                        <span>#${orderId}</span>
                    </div>
                    <div class="detail-row">
                        <span>Payment Method:</span>
                        <span>${orderData.paymentMethod}</span>
                    </div>
                    <div class="detail-row">
                        <span>Total Amount:</span>
                        <span>₱${orderData.total.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Delivery Address:</span>
                        <span>${orderData.customerAddress}</span>
                    </div>
                </div>
                
                <div class="success-message">
                    <p>We'll contact you at <strong>${orderData.customerPhone}</strong> to confirm your order and provide delivery updates.</p>
                    <p>Expected delivery time: 1-2 hours</p>
                </div>
            </div>
            
            <div class="success-actions">
                <button class="btn-primary" onclick="closeSuccessModal()">Continue Shopping</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close success modal
function closeSuccessModal() {
    const modal = document.querySelector('.success-modal');
    if (modal) {
        modal.remove();
    }
    // Redirect to shop page
    window.location.href = 'Shop.html';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize return check when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkReturnAfterLogin();
});

// Add CSS styles dynamically with TRANSPARENCY + Login Modal Styles
const style = document.createElement('style');
style.textContent = `
/* TRANSPARENT CART ITEM STYLES */
.cart-item {
    display: flex;
    align-items: center;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    transition: transform 0.2s ease;
}

.cart-item:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
}

.cart-item-image {
    width: 80px;
    height: 80px;
    margin-right: 20px;
    border-radius: 8px;
    overflow: hidden;
}

.cart-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cart-item-details {
    flex: 1;
}

.cart-item-details h3 {
    color: #3B5F6F;
    margin: 0 0 5px 0;
    font-size: 18px;
}

.cart-item-price {
    color: #2E4A59;
    font-weight: bold;
    font-size: 16px;
    margin: 0;
}

.cart-item-quantity {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 20px;
}

.quantity-btn {
    width: 35px;
    height: 35px;
    border: none;
    border-radius: 50%;
    background: rgba(46, 74, 89, 1);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
}

.quantity-btn:hover {
    background: rgba(160, 82, 45, 0.95);
    transform: scale(1.1);
}

.quantity {
    font-weight: bold;
    font-size: 18px;
    min-width: 30px;
    text-align: center;
}

.cart-item-total {
    font-weight: bold;
    font-size: 18px;
    color: #000000;
    min-width: 80px;
    text-align: right;
}

.remove-btn {
    background: rgba(255, 71, 87, 0.9);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    margin-left: 15px;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
}

.remove-btn:hover {
    background: rgba(255, 56, 56, 0.95);
    transform: scale(1.1);
}

.empty-cart {
    text-align: center;
    padding: 60px 20px;
    color: #666;
}

.empty-cart i {
    font-size: 80px;
    color: #ddd;
    margin-bottom: 20px;
}

.empty-cart h3 {
    color: #000000;
    margin: 20px 0 10px 0;
    font-size: 24px;
}

.continue-shopping-btn {
    display: inline-block;
    background: rgba(0, 0, 0, 1);
    color: white;
    padding: 12px 30px;
    text-decoration: none;
    border-radius: 25px;
    margin-top: 20px;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
}

.continue-shopping-btn:hover {
    background: rgba(0, 0, 0, 1);
    transform: translateY(-2px);
}

/* LOGIN REQUIRED MODAL STYLES */
.login-required-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
}

.login-required-modal-content {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    width: 90%;
    max-width: 500px;
    animation: modalSlideIn 0.3s ease;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

.login-required-header {
    background: linear-gradient(135deg, rgba(59, 95, 111, 0.9), rgba(46, 74, 89, 0.9));
    color: white;
    padding: 30px;
    text-align: center;
    backdrop-filter: blur(10px);
}

.login-required-icon {
    font-size: 60px;
    margin-bottom: 20px;
    opacity: 0.9;
}

.login-required-header h2 {
    margin: 0 0 10px 0;
    font-size: 24px;
}

.login-required-header p {
    margin: 0;
    opacity: 0.9;
    font-size: 16px;
}

.login-required-body {
    padding: 30px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
}

.login-required-body p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 25px;
    text-align: center;
}

.user-benefits {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.benefit-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    background: rgba(248, 249, 250, 0.8);
    border-radius: 10px;
    backdrop-filter: blur(5px);
}

.benefit-item i {
    color: #3B5F6F;
    font-size: 18px;
    width: 20px;
}

.benefit-item span {
    color: #333;
    font-weight: 500;
}

.login-required-actions {
    padding: 20px 30px 30px;
    display: flex;
    gap: 15px;
    justify-content: center;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
}

/* TRANSPARENT MODAL STYLES */
.checkout-modal, .success-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
}

.checkout-modal-content, .success-modal-content {
    background: rgba(255, 255, 255, 0.85);
    border-radius: 20px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

@keyframes modalSlideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.checkout-header {
    background: linear-gradient(135deg, rgba(59, 95, 111, 0.9), rgba(46, 74, 89, 0.9));
    color: white;
    padding: 20px 30px;
    border-radius: 20px 20px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.checkout-header h2 {
    margin: 0;
    font-size: 24px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.close-modal {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: background 0.3s ease;
}

.close-modal:hover {
    background: rgba(255,255,255,0.2);
}

.checkout-body {
    padding: 30px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
}

.order-summary {
    background: rgba(248, 249, 250, 0.6);
    padding: 25px;
    border-radius: 15px;
    height: fit-content;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.order-summary h3 {
    color: #3B5F6F;
    margin: 0 0 20px 0;
    font-size: 20px;
}

.order-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid rgba(238, 238, 238, 0.6);
}

.order-total {
    padding: 15px 0;
    font-size: 18px;
    color: #3B5F6F;
    border-top: 2px solid rgba(59, 95, 111, 0.6);
    margin-top: 15px;
    font-weight: bold;
}

.checkout-form {
    max-height: 500px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.3);
    padding: 20px;
    border-radius: 15px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-section {
    margin-bottom: 30px;
}

.form-section h3 {
    color: #3B5F6F;
    margin: 0 0 20px 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    color: #555;
    font-weight: bold;
    margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid rgba(225, 229, 233, 0.3);
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: rgba(59, 95, 111, 0.8);
    box-shadow: 0 0 0 3px rgba(59, 95, 111, 0.1);
    background: rgba(255, 255, 255, 0.9); /* More opaque on focus */
}

.payment-options {
    display: grid;
    gap: 15px;
}

.payment-option {
    cursor: pointer;
}

.payment-option input[type="radio"] {
    display: none;
}

.payment-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 20px;
    border: 2px solid rgba(225, 229, 233, 0.3);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.5); /* More transparent */
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
}

.payment-option input[type="radio"]:checked + .payment-card {
    border-color: rgba(59, 95, 111, 0.8); /* Updated selection color */
    background: rgba(248, 250, 252, 0.8);
    box-shadow: 0 0 0 3px rgba(59, 95, 111, 0.1);
}

.payment-card i {
    font-size: 20px;
    color: #3B5F6F; /* Updated to match new theme */
}

.payment-card span {
    font-weight: bold;
    color: #333;
}

.checkout-actions {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid rgba(238, 238, 238, 0.6);
}

.btn-primary, .btn-secondary {
    padding: 12px 30px;
    border: none;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: linear-gradient(135deg, rgba(59, 95, 111, 0.9), rgba(46, 74, 89, 0.9)); /* Updated colors */
    color: white;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(59, 95, 111, 0.4);
    background: linear-gradient(135deg, rgba(59, 95, 111, 1), rgba(46, 74, 89, 1));
}

.btn-secondary {
    background: rgba(248, 249, 250, 0.7);
    color: #666;
    border: 2px solid rgba(225, 229, 233, 0.4);
    backdrop-filter: blur(5px);
}

.btn-secondary:hover {
    background: rgba(233, 236, 239, 0.8);
}

/* TRANSPARENT SUCCESS MODAL STYLES */
.success-header {
    text-align: center;
    padding: 40px 30px;
    background: linear-gradient(135deg, rgba(40,167,69,0.9), rgba(32,201,151,0.9));
    color: white;
    border-radius: 20px 20px 0 0;
    backdrop-filter: blur(10px);
}

.success-icon {
    font-size: 60px;
    margin-bottom: 20px;
}

.success-header h2 {
    margin: 0 0 10px 0;
    font-size: 28px;
}

.success-body {
    padding: 30px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
}

.order-details {
    background: rgba(248, 249, 250, 0.6);
    padding: 25px;
    border-radius: 15px;
    margin-bottom: 25px;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.4);
}

.order-details h3 {
    color: #3B5F6F; /* Updated to match new theme */
    margin: 0 0 20px 0;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(238, 238, 238, 0.6);
}

.detail-row:last-child {
    border-bottom: none;
    font-weight: bold;
    color: #3B5F6F; /* Updated to match new theme */
}

.success-message {
    text-align: center;
    color: #666;
    line-height: 1.6;
}

.success-actions {
    text-align: center;
    padding-top: 20px;
}

/* TRANSPARENT NOTIFICATION STYLES */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 10px;
    color: white;
    z-index: 1001;
    animation: slideIn 0.3s ease;
    backdrop-filter: blur(10px);
}

.notification.success {
    background: rgba(40, 167, 69, 0.9);
}

.notification.error {
    background: rgba(220, 53, 69, 0.9);
}

.notification.info {
    background: rgba(59, 95, 111, 0.9); /* Updated to match new theme */
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* GLASSMORPHISM EFFECT CLASS (Optional) */
.glassmorphism {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

/* RESPONSIVE DESIGN */
@media (max-width: 768px) {
    .checkout-body {
        grid-template-columns: 1fr;
        gap: 20px;
    }
    
    .cart-item {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .cart-item-image {
        margin-right: 0;
    }
    
    .checkout-modal-content {
        width: 95%;
        margin: 10px;
    }
    
    .checkout-actions {
        flex-direction: column;
    }
    
    .btn-primary, .btn-secondary {
        width: 100%;
        justify-content: center;
    }
}
`;

document.head.appendChild(style);
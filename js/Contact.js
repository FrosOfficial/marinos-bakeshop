// Function to check if user is logged in
function isUserLoggedIn() {
    const userData = localStorage.getItem('userData');
    return userData && userData !== 'null';
}

// Function to get logged in user data
function getLoggedInUser() {
    const userData = localStorage.getItem('userData');
    if (userData && userData !== 'null') {
        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
    return null;
}

// Function to show enhanced custom message popup
function showMessagePopup(message, type = 'success', duration = 3000) {
    // Remove existing popup and overlay if any
    const existingPopup = document.querySelector('.message-popup');
    const existingOverlay = document.querySelector('.popup-overlay');
    if (existingPopup) existingPopup.remove();
    if (existingOverlay) existingOverlay.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = `message-popup ${type}`;
    
    // Determine icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            icon = 'fas fa-exclamation-triangle';
            break;
        case 'info':
            icon = 'fas fa-info-circle';
            break;
        default:
            icon = 'fas fa-check-circle';
    }
    
    popup.innerHTML = `
        <button class="close-btn" onclick="this.parentElement.classList.add('fade-out')">&times;</button>
        <i class="${icon}"></i>
        <div class="message-text">${message}</div>
        <div class="progress-bar"></div>
    `;
    
    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // Trigger shine effect
    setTimeout(() => {
        popup.classList.add('show');
    }, 100);
    
    // Auto remove popup
    const timeout = setTimeout(() => {
        removePopup(popup, overlay);
    }, duration);
    
    // Handle manual close
    popup.querySelector('.close-btn').addEventListener('click', () => {
        clearTimeout(timeout);
        removePopup(popup, overlay);
    });
    
    // Handle overlay click
    overlay.addEventListener('click', () => {
        clearTimeout(timeout);
        removePopup(popup, overlay);
    });
}

// Function to remove popup with animation
function removePopup(popup, overlay) {
    popup.classList.add('fade-out');
    setTimeout(() => {
        if (popup && popup.parentNode) popup.remove();
        if (overlay && overlay.parentNode) overlay.remove();
    }, 300);
}

// Function to add field validation classes
function validateField(field, isValid) {
    field.classList.remove('error', 'success');
    if (isValid) {
        field.classList.add('success');
    } else {
        field.classList.add('error');
    }
}

// Function to create login status indicator
function createLoginStatusIndicator() {
    // Remove existing indicator
    const existingIndicator = document.querySelector('.login-status');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.className = 'login-status';
    
    if (isUserLoggedIn()) {
        const user = getLoggedInUser();
        indicator.classList.add('logged-in');
        indicator.innerHTML = `
            <i class="fas fa-user-check"></i>
            Welcome, ${user ? user.fullname : 'User'}!
        `;
    } else {
        indicator.classList.add('logged-out');
        indicator.innerHTML = `
            <i class="fas fa-user-times"></i>
            Please log in to send messages
        `;
    }
    
    document.body.appendChild(indicator);
}

// Contact form submission handler
document.getElementById("contactForm").addEventListener("submit", async function(event) {
    event.preventDefault(); 
    
    // Check if user is logged in first
    if (!isUserLoggedIn()) {
        showMessagePopup("Please log in to send a message. You will be redirected to the login page.", 'error');
        setTimeout(() => {
            window.location.href = "Login.html";
        }, 2000);
        return;
    }
    
    // Get form elements for validation
    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");
    const numberField = document.getElementById("number");
    const subjectField = document.getElementById("subject");
    const messageField = document.getElementById("message");
    const submitBtn = this.querySelector('.btn');
    
    // Get logged in user data
    const loggedInUser = getLoggedInUser();
    
    // Get form data
    const formData = {
        name: nameField.value.trim(),
        email: emailField.value.trim(),
        number: numberField.value.trim(),
        subject: subjectField.value.trim(),
        message: messageField.value.trim(),
        // Add user info from login
        userId: loggedInUser ? loggedInUser.id : null,
        userEmail: loggedInUser ? loggedInUser.email : null,
        userFullname: loggedInUser ? loggedInUser.fullname : null
    };
    
    // Form validation with visual feedback
    let isFormValid = true;
    
    if (!formData.name) {
        validateField(nameField, false);
        isFormValid = false;
    } else {
        validateField(nameField, true);
    }
    
    if (!formData.email) {
        validateField(emailField, false);
        isFormValid = false;
    } else {
        validateField(emailField, true);
    }
    
    if (!formData.number) {
        validateField(numberField, false);
        isFormValid = false;
    } else {
        validateField(numberField, true);
    }
    
    if (!formData.subject) {
        validateField(subjectField, false);
        isFormValid = false;
    } else {
        validateField(subjectField, true);
    }
    
    if (!formData.message) {
        validateField(messageField, false);
        isFormValid = false;
    } else {
        validateField(messageField, true);
    }
    
    if (!isFormValid) {
        showMessagePopup("Please fill in all required fields", 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        validateField(emailField, false);
        showMessagePopup("Please enter a valid email address", 'error');
        return;
    }
    
    // Phone validation (basic - adjust regex as needed)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.number)) {
        validateField(numberField, false);
        showMessagePopup("Please enter a valid phone number", 'error');
        return;
    }
    
    // Add loading state to button
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // Send data to server
        const response = await fetch('/.netlify/functions/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        // Remove loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        if (result.success) {
            showMessagePopup("Your message has been sent successfully! Thank you for contacting us.", 'success');
            this.reset(); // Clear the form
            
            // Remove validation classes
            document.querySelectorAll('.box').forEach(field => {
                field.classList.remove('error', 'success');
            });
        } else {
            showMessagePopup("Error sending message: " + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        showMessagePopup("Failed to send message. Please check your connection and try again.", 'error');
    }
});

// Auto-fill form fields if user is logged in (optional feature)
document.addEventListener('DOMContentLoaded', function() {
    // Create login status indicator
    createLoginStatusIndicator();
    
    if (isUserLoggedIn()) {
        const loggedInUser = getLoggedInUser();
        if (loggedInUser) {
            // Pre-fill name and email fields
            const nameField = document.getElementById("name");
            const emailField = document.getElementById("email");
            
            nameField.value = loggedInUser.fullname || '';
            emailField.value = loggedInUser.email || '';
            
            // Add success class to pre-filled fields
            if (nameField.value) validateField(nameField, true);
            if (emailField.value) validateField(emailField, true);
        }
    }
    
    // Add real-time validation
    const fields = ['name', 'email', 'number', 'subject', 'message'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                if (this.value.trim()) {
                    if (fieldId === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        validateField(this, emailRegex.test(this.value));
                    } else if (fieldId === 'number') {
                        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                        validateField(this, phoneRegex.test(this.value));
                    } else {
                        validateField(this, true);
                    }
                } else {
                    this.classList.remove('error', 'success');
                }
            });
        }
    });
});
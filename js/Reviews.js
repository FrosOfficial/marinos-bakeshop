// Reviews page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in on page load
    checkUserLoginStatus();
    
    // Load reviews when page loads
    loadReviews();
    
    // Initialize star rating functionality
    initializeStarRating();
    
    // Handle review form submission
    document.getElementById('reviewFormElement').addEventListener('submit', handleReviewSubmission);
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'currentUser') {
            checkUserLoginStatus();
        }
    });
    
    // Check login status when page becomes visible (user switches back to tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            checkUserLoginStatus();
        }
    });
    
    // Periodically check login status (every 30 seconds)
    setInterval(checkUserLoginStatus, 30000);
});

// Check if user is logged in
function checkUserLoginStatus() {
    const loginPrompt = document.getElementById('loginPrompt');
    const reviewForm = document.getElementById('reviewForm');
    
    if (!isUserLoggedIn()) {
        // User not logged in - show login prompt
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (reviewForm) reviewForm.style.display = 'none';
    } else {
        // User is logged in - show review form
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (reviewForm) reviewForm.style.display = 'block';
    }
}

// Initialize star rating functionality
function initializeStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            ratingInput.value = rating;
            updateStarDisplay(rating);
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating);
        });
    });
    
    // Reset stars on mouse leave
    const starRating = document.getElementById('starRating');
    if (starRating) {
        starRating.addEventListener('mouseleave', function() {
            const currentRating = parseInt(ratingInput.value);
            updateStarDisplay(currentRating);
        });
    }
}

// Update star display based on rating
function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Highlight stars on hover
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#f39c12';
        } else {
            star.style.color = '#ddd';
        }
    });
}

// Global flag to prevent multiple submissions
let isSubmittingReview = false;

// Handle review form submission - FIXED TO PREVENT DUPLICATES
async function handleReviewSubmission(event) {
    event.preventDefault();
    
    // Prevent multiple submissions with global flag
    if (isSubmittingReview) {
        console.log('Review submission already in progress');
        return;
    }
    
    // Check if user is logged in first
    if (!isUserLoggedIn()) {
        showLoginRequiredModal();
        return;
    }
    
    const currentUser = getLoggedInUser();
    
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value.trim();
    
    // Validation
    if (!rating || rating === '0') {
        showMessage('Please select a rating.', 'error');
        return;
    }
    
    if (!comment) {
        showMessage('Please write a review comment.', 'error');
        return;
    }
    
    if (comment.length > 500) {
        showMessage('Review comment must be 500 characters or less.', 'error');
        return;
    }
    
    // Set submission flag
    isSubmittingReview = true;
    
    // Get submit button and show loading state
    const submitButton = document.querySelector('.submit-btn');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitButton.disabled = true;
    
    // Prepare data
    const reviewData = {
        userId: currentUser.id,
        userEmail: currentUser.email,
        userFullname: currentUser.fullname,
        rating: parseInt(rating),
        comment: comment
    };
    
    console.log('Submitting review:', reviewData);
    
    try {
        const response = await fetch('https://marinosbakeshop.netlify.app/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData)
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            showMessage(data.message, 'success');
            // Reset form to allow for another review
            document.getElementById('reviewFormElement').reset();
            document.getElementById('rating').value = '0';
            updateStarDisplay(0);
            // Update character counter
            const charCountElement = document.getElementById('charCount');
            if (charCountElement) {
                charCountElement.textContent = '0';
                charCountElement.style.color = '#7f8c8d';
            }
            // Reload reviews immediately to show the new review
            loadReviews();
        } else {
            showMessage(data.message || 'Failed to submit review.', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Reset button and submission flag
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        isSubmittingReview = false;
    }
}

// Load all reviews from the server - ENHANCED WITH DEBUGGING
async function loadReviews() {
    console.log('Loading reviews...');
    
    const reviewsLoading = document.getElementById('reviewsLoading');
    const reviewsList = document.getElementById('reviewsList');
    const reviewsStats = document.getElementById('reviewsStats');
    
    // Show loading
    if (reviewsLoading) reviewsLoading.style.display = 'block';
    if (reviewsList) reviewsList.innerHTML = '';
    if (reviewsStats) reviewsStats.style.display = 'none';

    // Timeout controller (works in browser)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds

    try {
        console.log('Fetching from: https://marinosbakeshop.netlify.app/api/reviews');

        const response = await fetch('https://marinosbakeshop.netlify.app/api/reviews', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId); // Stop timeout if request succeeded

        console.log('Load reviews response status:', response.status);
        console.log('Load reviews response ok:', response.ok);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Load reviews response data:', data);

        if (data.success) {
            console.log('Reviews loaded successfully:', data.reviews.length, 'reviews');
            displayReviews(data.reviews);
            updateReviewsStats(data.reviews);
        } else {
            console.error('Server returned error:', data.message);
            if (reviewsList) {
                reviewsList.innerHTML = `<div class="no-reviews">Server Error: ${data.message || 'Failed to load reviews.'}</div>`;
            }
        }
    } catch (error) {
        clearTimeout(timeoutId);

        let errorMessage = 'Unable to load reviews.';
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('HTTP')) {
            errorMessage = `Server error: ${error.message}`;
        }

        console.error('Error loading reviews:', error);
        if (reviewsList) {
            reviewsList.innerHTML = `
                <div class="no-reviews" style="color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                    <p><strong>Error Loading Reviews</strong></p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">${errorMessage}</p>
                    <button onclick="loadReviews()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    } finally {
        if (reviewsLoading) reviewsLoading.style.display = 'none';
    }
}


// Display reviews in the UI
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="no-reviews">
                <i class="fas fa-comments" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                <p>No reviews yet. Be the first to share your experience!</p>
            </div>
        `;
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => {
        const date = new Date(review.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const initials = getInitials(review.fullname);
        const stars = generateStarsHTML(review.rating);
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${initials}</div>
                        <div class="reviewer-details">
                            <h4>${escapeHtml(review.fullname)}</h4>
                            <div class="review-date">${formattedDate}</div>
                        </div>
                    </div>
                    <div class="review-rating">${stars}</div>
                </div>
                <div class="review-comment">${escapeHtml(review.comment)}</div>
            </div>
        `;
    }).join('');
}

// Update reviews statistics
function updateReviewsStats(reviews) {
    const reviewsStats = document.getElementById('reviewsStats');
    
    if (!reviews || reviews.length === 0) {
        if (reviewsStats) reviewsStats.style.display = 'none';
        return;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    // Update stats display
    const avgRating = document.getElementById('avgRating');
    const avgStars = document.getElementById('avgStars');
    const totalReviews = document.getElementById('totalReviews');
    
    if (avgRating) avgRating.textContent = averageRating;
    if (avgStars) avgStars.innerHTML = generateStarsHTML(Math.round(averageRating));
    if (totalReviews) totalReviews.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;
    
    if (reviewsStats) reviewsStats.style.display = 'flex';
}

// Generate HTML for star rating display
function generateStarsHTML(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    return starsHTML;
}

// Get initials from full name
function getInitials(fullName) {
    if (!fullName) return '?';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show success or error messages
function showMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        formMessage.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        // Auto-hide message after 5 seconds
        setTimeout(() => {
            formMessage.innerHTML = '';
        }, 5000);
    }
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Character counter for textarea
document.addEventListener('DOMContentLoaded', function() {
    const commentTextarea = document.getElementById('comment');
    if (commentTextarea) {
        // Create character counter element
        const counterElement = document.createElement('div');
        counterElement.style.cssText = 'text-align: right; font-size: 1.2rem; color: #000000; margin-top: 0.5rem;';
        counterElement.innerHTML = '<span id="charCount">0</span>/500 characters';
        commentTextarea.parentNode.appendChild(counterElement);
        
        // Update counter on input
        commentTextarea.addEventListener('input', function() {
            const charCount = this.value.length;
            const charCountElement = document.getElementById('charCount');
            if (charCountElement) {
                charCountElement.textContent = charCount;
                
                // Change color when approaching limit
                if (charCount > 450) {
                    charCountElement.style.color = '#e74c3c';
                } else if (charCount > 400) {
                    charCountElement.style.color = '#f39c12';
                } else {
                    charCountElement.style.color = '#7f8c8d';
                }
            }
        });
    }
});

// Helper function to manually refresh login status (can be called from other scripts)
function refreshLoginStatus() {
    checkUserLoginStatus();
}

// ===========================================
// LOGIN MODAL FUNCTIONS - INTEGRATED
// ===========================================

// Show login required modal
function showLoginRequiredModal() {
    const modal = document.createElement('div');
    modal.className = 'login-required-modal';
    modal.innerHTML = `
        <div class="login-required-modal-overlay" onclick="closeLoginRequiredModal()"></div>
        <div class="login-required-modal-content">
            <div class="login-required-header">
                <div class="login-required-icon">
                    <i class="fas fa-user-lock"></i>
                </div>
                <h2>Login Required</h2>
                <p>You need to be logged in to submit a review</p>
            </div>
            
            <div class="login-required-body">
                <p>Please log in to your account to share your experience. Don't have an account? You can create one quickly!</p>
                <div class="user-benefits">
                    <div class="benefit-item">
                        <i class="fas fa-star"></i>
                        <span>Write and manage reviews</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-heart"></i>
                        <span>Save favorite items</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-clock"></i>
                        <span>Track your orders</span>
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
                <button class="btn-outline" onclick="redirectToRegister()">
                    <i class="fas fa-user-plus"></i> Create Account
                </button>
            </div>
        </div>
    `;

    // Add styles for the modal (only if not already present)
    if (!document.getElementById('login-modal-styles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'login-modal-styles';
        modalStyles.textContent = `
            .login-required-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: modalFadeIn 0.3s ease-out;
            }

            .login-required-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
            }

            .login-required-modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: modalSlideIn 0.3s ease-out;
            }

            .login-required-header {
                text-align: center;
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid #f0f0f0;
            }

            .login-required-icon {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #3498db, #2980b9);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                font-size: 1.5rem;
                color: white;
            }

            .login-required-header h2 {
                margin: 0 0 0.5rem;
                color: #2c3e50;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .login-required-header p {
                margin: 0;
                color: #7f8c8d;
                font-size: 0.95rem;
            }

            .login-required-body {
                padding: 1.5rem 2rem;
            }

            .login-required-body > p {
                color: #5d6d7e;
                line-height: 1.6;
                margin: 0 0 1.5rem;
            }

            .user-benefits {
                display: grid;
                gap: 1rem;
            }

            .benefit-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 3px solid #3498db;
            }

            .benefit-item i {
                color: #3498db;
                font-size: 1.1rem;
                width: 20px;
            }

            .benefit-item span {
                color: #2c3e50;
                font-weight: 500;
            }

            .login-required-actions {
                padding: 1rem 2rem 2rem;
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
            }

            .login-required-actions button {
                flex: 1;
                min-width: 120px;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }

            .btn-primary {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
            }

            .btn-secondary {
                background: #95a5a6;
                color: white;
            }

            .btn-secondary:hover {
                background: #7f8c8d;
            }

            .btn-outline {
                background: transparent;
                color: #3498db;
                border: 2px solid #3498db;
            }

            .btn-outline:hover {
                background: #3498db;
                color: white;
            }

            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes modalSlideIn {
                from { 
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to { 
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @keyframes modalFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            @keyframes modalSlideOut {
                from { 
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                to { 
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
            }

            @media (max-width: 600px) {
                .login-required-modal-content {
                    margin: 1rem;
                    width: calc(100% - 2rem);
                }
                
                .login-required-actions {
                    flex-direction: column;
                }
                
                .login-required-actions button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(modalStyles);
    }

    // Add modal to page
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Add escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeLoginRequiredModal();
        }
    };
    document.addEventListener('keydown', escapeHandler);
    modal.setAttribute('data-escape-handler', 'true');
}

// Close login required modal
function closeLoginRequiredModal() {
    const modal = document.querySelector('.login-required-modal');
    if (modal) {
        // Smooth fade out
        modal.style.animation = 'modalFadeOut 0.2s ease-in';
        modal.querySelector('.login-required-modal-content').style.animation = 'modalSlideOut 0.2s ease-in';
        
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = ''; // Restore scrolling
            
            // Remove escape key listener
            document.removeEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeLoginRequiredModal();
                }
            });
        }, 200);
    }
}

// Redirect to login page
function redirectToLogin() {
    // Store current page for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = 'Login.html';
}

// Redirect to register page
function redirectToRegister() {
    // Store current page for redirect after registration
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = 'Register.html'; // Adjust path as needed
}

// Check if user is logged in (Updated to match Reviews.js)
function isUserLoggedIn() {
    // Check both currentUser (from Reviews.js) and userData for compatibility
    const currentUser = localStorage.getItem('currentUser');
    const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            return user && user.id;
        } catch (e) {
            return false;
        }
    }
    
    return userData !== null;
}

// Get logged in user data (Updated to match Reviews.js)
function getLoggedInUser() {
    // First check for currentUser (from Reviews.js)
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            return JSON.parse(currentUser);
        } catch (e) {
            // Fall back to userData if currentUser is corrupted
        }
    }
    
    // Fallback to userData
    const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Utility function to handle login required actions
function requireLogin(callback, options = {}) {
    if (isUserLoggedIn()) {
        // User is logged in, execute callback
        if (typeof callback === 'function') {
            callback();
        }
        return true;
    } else {
        // User not logged in, show modal
        showLoginRequiredModal();
        
        // Optional: Show custom message
        if (options.message) {
            setTimeout(() => {
                const modal = document.querySelector('.login-required-modal');
                const messageElement = modal?.querySelector('.login-required-header p');
                if (messageElement) {
                    messageElement.textContent = options.message;
                }
            }, 100);
        }
        
        return false;
    }
}
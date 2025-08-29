// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (userData && userData.email) {
    showUserProfile(userData);
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = document.querySelector('button[type="submit"]');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }

  try {
    setLoading(true);

    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      const userData = {
        ...data.user,
        password: password
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      showSuccess('Login successful!');
      showUserProfile(userData);
    } else {
      showError(data.message || 'Invalid email or password');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Network error. Please try again later.');
  } finally {
    setLoading(false);
  }
});

function showUserProfile(user) {
  const formBox = document.querySelector('.form-box');
  if (!formBox) {
    console.error('Form box element not found');
    return;
  }

  const gender = (user.gender || '').toLowerCase();

  formBox.classList.add('profile-active');

  formBox.innerHTML = `
    <div class="profile-container">
      <h2>My Profile</h2>
      <p class="profile-subtitle">Manage and protect your account</p>

      <div class="profile-field">
        <label>Name</label>
        <input type="text" id="profileName" value="${user.fullname || ''}" readonly>
      </div>

      <div class="profile-field">
        <label>Email</label>
        <input type="email" id="profileEmail" value="${user.email || ''}" readonly>
      </div>

      <div class="profile-field">
        <label>Password</label>
        <div class="password-field">
          <input type="password" id="profilePassword" value="${user.password || ''}" readonly>
          <button type="button" class="toggle-password">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>

      <div class="profile-field">
        <label>Gender</label>
        <div class="gender-options">
          <label>
            <input type="radio" name="gender" value="male" ${gender === 'male' ? 'checked' : ''} disabled> Male
          </label>
          <label>
            <input type="radio" name="gender" value="female" ${gender === 'female' ? 'checked' : ''} disabled> Female
          </label>
          <label>
            <input type="radio" name="gender" value="other" ${gender === 'other' ? 'checked' : ''} disabled> Other
          </label>
          <label style="display: none;">
            <input type="radio" name="gender" value="" ${gender === '' ? 'checked' : ''} disabled> Not specified
          </label>
        </div>
      </div>

      <div class="button-group">
        <button type="button" class="edit-btn" id="editBtn">Edit Profile</button>
        <button type="button" class="save-btn" id="saveBtn" style="display: none;">Save</button>
        <button type="button" class="logout-btn" id="logoutBtn">Logout</button>
      </div>
    </div>
  `;

  setupProfileEventListeners(formBox, user);
}

function setupProfileEventListeners(formBox, currentUser) {
  const togglePassword = formBox.querySelector('.toggle-password');
  const passwordInput = formBox.querySelector('#profilePassword');
  const editBtn = formBox.querySelector('#editBtn');
  const saveBtn = formBox.querySelector('#saveBtn');
  const logoutBtn = formBox.querySelector('#logoutBtn');
  const inputs = formBox.querySelectorAll('input:not([type="radio"])');
  const radioInputs = formBox.querySelectorAll('input[type="radio"]');
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type');
      passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
      togglePassword.innerHTML = type === 'password' ? 
        '<i class="fas fa-eye-slash"></i>' : 
        '<i class="fas fa-eye"></i>';
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', function() {
      inputs.forEach(input => input.readOnly = false);
      radioInputs.forEach(radio => radio.disabled = false);
      editBtn.style.display = 'none';
      saveBtn.style.display = 'block';
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async function() {
      await saveProfileChanges(formBox, currentUser);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

async function saveProfileChanges(formBox, currentUser) {
  try {
    const nameInput = formBox.querySelector('#profileName');
    const emailInput = formBox.querySelector('#profileEmail');
    const passwordInput = formBox.querySelector('#profilePassword');
    const genderInput = formBox.querySelector('input[name="gender"]:checked');

    if (!nameInput || !emailInput || !passwordInput) {
      throw new Error('Form elements not found');
    }

    const currentValues = {
      fullname: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      gender: genderInput ? genderInput.value.toLowerCase() : ''
    };

    console.log('Current form values:', currentValues);
    console.log('Current user data:', currentUser);

    // Validate required fields
    if (!currentValues.fullname || !currentValues.email || !currentValues.password) {
      throw new Error('Please fill in all required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentValues.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Normalize current user data for comparison
    const normalizedCurrentUser = {
      fullname: currentUser.fullname || '',
      email: currentUser.email || '',
      password: currentUser.password || '',
      gender: (currentUser.gender || '').toLowerCase()
    };

    // Build update data - include ALL fields that have changed
    const updateData = {
      originalEmail: currentUser.email // Always include for identification
    };
    
    let hasChanges = false;
    let changedFields = [];

    // Check each field for changes
    if (currentValues.fullname !== normalizedCurrentUser.fullname) {
      updateData.fullname = currentValues.fullname;
      hasChanges = true;
      changedFields.push('fullname');
      console.log('Fullname changed:', normalizedCurrentUser.fullname, '->', currentValues.fullname);
    }

    if (currentValues.email !== normalizedCurrentUser.email) {
      updateData.email = currentValues.email;
      hasChanges = true;
      changedFields.push('email');
      console.log('Email changed:', normalizedCurrentUser.email, '->', currentValues.email);
    }

    if (currentValues.password !== normalizedCurrentUser.password) {
      updateData.password = currentValues.password;
      hasChanges = true;
      changedFields.push('password');
      console.log('Password changed');
    }

    if (currentValues.gender !== normalizedCurrentUser.gender) {
      updateData.gender = currentValues.gender;
      hasChanges = true;
      changedFields.push('gender');
      console.log('Gender changed:', normalizedCurrentUser.gender, '->', currentValues.gender);
    }

    // If no changes, just switch back to read-only mode
    if (!hasChanges) {
      switchToReadOnlyMode(formBox);
      showSuccess('No changes detected');
      return;
    }

    console.log('Fields being updated:', changedFields);
    console.log('Update payload:', updateData);

    // Send update request with all changed fields
    const response = await fetch('/.netlify/functions/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Server response:', data);

    if (data.success) {
      // Update localStorage with new values
      const updatedUser = {
        ...currentUser,
        ...currentValues
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      // Switch back to read-only mode
      switchToReadOnlyMode(formBox);
      
      // Show success message with updated fields
      const fieldNames = {
        fullname: 'Name',
        email: 'Email',
        password: 'Password',
        gender: 'Gender'
      };
      
      const updatedFieldNames = changedFields.map(field => fieldNames[field]);
      const message = `Profile updated successfully! Updated: ${updatedFieldNames.join(', ')}`;
      showSuccess(message);
      
      // If email was changed, refresh the profile display
      if (updateData.email) {
        setTimeout(() => {
          showUserProfile(updatedUser);
        }, 1000);
      }
    } else {
      showError(data.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Update error:', error);
    showError(error.message || 'Network error. Please try again later.');
  }
}

function switchToReadOnlyMode(formBox) {
  const inputs = formBox.querySelectorAll('input:not([type="radio"])');
  const radioInputs = formBox.querySelectorAll('input[type="radio"]');
  const editBtn = formBox.querySelector('#editBtn');
  const saveBtn = formBox.querySelector('#saveBtn');

  inputs.forEach(input => input.readOnly = true);
  radioInputs.forEach(radio => radio.disabled = true);

  if (editBtn && saveBtn) {
    saveBtn.style.display = 'none';
    editBtn.style.display = 'block';
  }
}

function logout() {
  localStorage.removeItem('userData');
  window.location.href = 'Login.html';
}

function setLoading(isLoading) {
  const submitButton = document.querySelector('button[type="submit"]');
  const inputs = document.querySelectorAll('input');

  if (submitButton) {
    submitButton.disabled = isLoading;
    submitButton.innerHTML = isLoading ? 
      '<span class="spinner"></span> Logging in...' : 
      'Log in';
  }

  inputs.forEach(input => input.disabled = isLoading);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;

  const existingError = document.querySelector('.error-message');
  if (existingError) existingError.remove();

  const form = document.querySelector('.profile-container') || document.getElementById('loginForm');
  if (form) {
    form.insertBefore(errorDiv, form.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;

  const existingSuccess = document.querySelector('.success-message');
  if (existingSuccess) existingSuccess.remove();

  const form = document.querySelector('.profile-container') || document.getElementById('loginForm');
  if (form) {
    form.insertBefore(successDiv, form.firstChild);
    setTimeout(() => successDiv.remove(), 3000);
  }
}
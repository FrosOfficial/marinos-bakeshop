document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fullnameInput = document.getElementById('fullname');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = document.querySelector('#registerForm button[type="submit"]');

  const fullname = fullnameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!fullname || !email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  // Show loading
  setLoading(true);

  try {
    const res = await fetch('https://marinos-bakeshop-production.up.railway.app/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password })
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    alert('Registration failed. Please try again.');
    console.error(err);
  } finally {
    // Hide loading
    setLoading(false);
  }

  function setLoading(isLoading) {
    const spinner = `<span class="spinner"></span> Registering...`;
    submitButton.disabled = isLoading;
    fullnameInput.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;

    submitButton.innerHTML = isLoading ? spinner : 'Register';
  }
});

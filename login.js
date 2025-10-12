const loginForm = document.getElementById('loginForm');
const credentialsStep = document.getElementById('credentialsStep');
const otpStep = document.getElementById('otpStep');
const verifyOtpButton = document.getElementById('verifyOtp');

let tempToken = ''; // temporary token from backend for OTP verification

// ==============================
// Step 1: Validate credentials
// ==============================
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!identifier || !password) {
        alert('Please enter both identifier and password.');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        const data = await response.json();

        if (data.success) {
            // Show OTP step
            tempToken = data.tempToken; // backend returns temporary token for OTP
            credentialsStep.style.display = 'none';
            otpStep.style.display = 'block';
        } else {
            alert(data.message || 'Invalid credentials.');
        }

    } catch (err) {
        console.error(err);
        alert('Server error. Please try again later.');
    }
});

// ==============================
// Step 2: Verify OTP
// ==============================
verifyOtpButton.addEventListener('click', async () => {
    const otp = document.getElementById('otp').value.trim();
    if (!otp) {
        alert('Please enter the OTP.');
        return;
    }

    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, otp })
        });

        const data = await response.json();

        if (data.success) {
            // Role-based redirect
            if (data.role === 'voter') {
                window.location.href = '/voter-dashboard.html';
            } else if (data.role === 'candidate') {
                window.location.href = '/candidate-dashboard.html';
            } else if (data.role === 'admin') {
                window.location.href = '/admin-dashboard.html';
            }
        } else {
            alert(data.message || 'Invalid OTP. Try again.');
        }

    } catch (err) {
        console.error(err);
        alert('Server error. Please try again later.');
    }
});

// ==============================
// Dark Mode Toggle
// ==============================
const toggleButton = document.getElementById('darkModeToggle');
toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    toggleButton.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Auto-detect system dark mode
if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
    document.body.classList.add('dark-mode');
    toggleButton.textContent = '☀️ Light Mode';
}

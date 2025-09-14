document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    const logBody = document.getElementById('logBody');
    const loader = document.getElementById('loader');
    const noRecordsMessage = document.getElementById('no-records');

    const API_BASE_URL = 'http://localhost:8080/api';

    // --- Core Functions ---

    // Checks if a token exists in localStorage to decide which view to show
    const checkAuth = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            fetchLogs();
        } else {
            loginContainer.style.display = 'block';
            dashboardContainer.style.display = 'none';
        }
    };

    // Handles the login form submission
    const handleLogin = async (event) => {
        event.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;
        loginError.textContent = '';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('authToken', data.token);
            checkAuth(); // Switch to dashboard view

        } catch (error) {
            loginError.textContent = error.message;
        }
    };

    // Fetches logs from the protected endpoint, including the token in the header
    const fetchLogs = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            checkAuth(); // If no token, show login screen
            return;
        }

        logBody.innerHTML = '';
        loader.style.display = 'block';
        noRecordsMessage.classList.add('hidden');

        try {
            const response = await fetch(`${API_BASE_URL}/records`, {
                headers: { 'x-auth-token': token }
            });

            if (response.status === 401) { // Unauthorized (bad token)
                localStorage.removeItem('authToken');
                checkAuth();
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch logs');

            const data = await response.json();

            if (data && data.length > 0) {
                data.forEach(item => {
                    const record = item.Record;
                    const row = `<tr>
                        <td>${item.Key}</td>
                        <td>${new Date(record.timestamp).toLocaleString()}</td>
                        <td>${record.location}</td>
                        <td>${record.eventType}</td>
                        <td>${record.mediaHash}</td>
                        <td>${record.anonymizedDeviceId}</td>
                    </tr>`;
                    logBody.innerHTML += row;
                });
            } else {
                noRecordsMessage.classList.remove('hidden');
            }

        } catch (error) {
            console.error("Failed to fetch logs:", error);
            logBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${error.message}</td></tr>`;
        } finally {
            loader.style.display = 'none';
        }
    };

    // Handles logout
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        checkAuth();
    };

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    refreshButton.addEventListener('click', fetchLogs);

    // --- Initial Load ---
    checkAuth();
});
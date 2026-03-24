/* ═══════════════════════════════════════════════════════════
   Lumin — Admin Dashboard JavaScript
   With authentication, search, and CSV export
   ═══════════════════════════════════════════════════════════ */

const API_URL = '/api';
let authToken = null;
let allSchools = []; // Cache for search/filter

/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */

// Check for existing session
document.addEventListener('DOMContentLoaded', () => {
    authToken = sessionStorage.getItem('lumin_admin_token');
    if (authToken) {
        showDashboard();
        loadData();
    } else {
        showLoginOverlay();
    }
});

function showLoginOverlay() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('dashboard-content').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            sessionStorage.setItem('lumin_admin_token', authToken);
            errorEl.textContent = '';
            showDashboard();
            loadData();
        } else {
            errorEl.textContent = 'Incorrect password. Please try again.';
            document.getElementById('admin-password').value = '';
        }
    } catch (error) {
        errorEl.textContent = 'Connection error. Make sure the server is running.';
    }
}

function logout() {
    authToken = null;
    sessionStorage.removeItem('lumin_admin_token');
    showLoginOverlay();
}

// Authenticated fetch wrapper
async function authFetch(url, options = {}) {
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
    };
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }
    return response;
}

/* ═══════════════════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════════════════ */

async function loadData() {
    try {
        // Load statistics
        const statsResponse = await authFetch(`${API_URL}/stats`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            updateStats(statsData.stats);
        }

        // Load waitlist entries
        const waitlistResponse = await authFetch(`${API_URL}/waitlist`);
        const waitlistData = await waitlistResponse.json();
        
        if (waitlistData.success) {
            allSchools = waitlistData.schools;
            renderTable(allSchools);
        }
    } catch (error) {
        if (error.message === 'Session expired') return;
        console.error('Error loading data:', error);
        document.getElementById('table-content').innerHTML = `
            <div class="empty-state">
                <p style="color: #D33D3D; font-weight: 600;">Error loading data</p>
                <p>Make sure the server is running on port 3000</p>
                <p style="font-size: 0.875rem; margin-top: 12px;">Run: <code>npm start</code></p>
            </div>
        `;
    }
}

function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-contacted').textContent = stats.contacted;
    document.getElementById('stat-onboarded').textContent = stats.onboarded;
    document.getElementById('stat-students').textContent = formatNumber(stats.totalStudents);
    document.getElementById('stat-cities').textContent = stats.cities;
}

/* ═══════════════════════════════════════════════════════════
   SEARCH / FILTER
   ═══════════════════════════════════════════════════════════ */

function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const statusFilter = document.getElementById('status-filter').value;

    let filtered = allSchools;

    if (query) {
        filtered = filtered.filter(s =>
            s.schoolName.toLowerCase().includes(query) ||
            s.contactEmail.toLowerCase().includes(query) ||
            s.city.toLowerCase().includes(query)
        );
    }

    if (statusFilter) {
        filtered = filtered.filter(s => s.status === statusFilter);
    }

    renderTable(filtered);
}

/* ═══════════════════════════════════════════════════════════
   CSV EXPORT
   ═══════════════════════════════════════════════════════════ */

function exportCSV() {
    if (allSchools.length === 0) {
        alert('No data to export.');
        return;
    }

    const headers = ['School Name', 'Students', 'City', 'Contact Email', 'Submitted', 'Status'];
    const rows = allSchools.map(s => [
        `"${s.schoolName}"`,
        s.studentCount,
        `"${s.city}"`,
        s.contactEmail,
        new Date(s.submittedAt).toLocaleDateString(),
        s.status
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lumin-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

/* ═══════════════════════════════════════════════════════════
   TABLE RENDERING
   ═══════════════════════════════════════════════════════════ */

function renderTable(schools) {
    const tableContent = document.getElementById('table-content');
    
    if (schools.length === 0) {
        tableContent.innerHTML = `
            <div class="empty-state">
                <p style="font-weight: 600;">No schools found</p>
                <p>Entries will appear here when schools join the waitlist</p>
            </div>
        `;
        return;
    }

    // Sort by submission date (newest first)
    schools.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>School Name</th>
                    <th>Students</th>
                    <th>City</th>
                    <th>Contact Email</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${schools.map(school => {
                    const id = school._id || school.id;
                    return `
                    <tr>
                        <td style="font-weight: 600;">${escapeHtml(school.schoolName)}</td>
                        <td>${formatNumber(school.studentCount)}</td>
                        <td>${escapeHtml(school.city)}</td>
                        <td>${escapeHtml(school.contactEmail)}</td>
                        <td>${formatDate(school.submittedAt)}</td>
                        <td>
                            <span class="status-badge status-${school.status}">
                                ${school.status}
                            </span>
                        </td>
                        <td>
                            <button class="action-btn btn-update" onclick="updateStatus('${id}', '${school.status}')">
                                Update
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteSchool('${id}', '${escapeHtml(school.schoolName)}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;}).join('')}
            </tbody>
        </table>
    `;

    tableContent.innerHTML = tableHTML;
}

/* ═══════════════════════════════════════════════════════════
   ACTIONS
   ═══════════════════════════════════════════════════════════ */

async function updateStatus(id, currentStatus) {
    const statuses = ['pending', 'contacted', 'onboarded'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    const confirmed = confirm(`Change status to "${nextStatus}"?`);
    if (!confirmed) return;

    try {
        const response = await authFetch(`${API_URL}/waitlist/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });

        const data = await response.json();
        if (data.success) {
            loadData();
        } else {
            alert('Error updating status: ' + data.message);
        }
    } catch (error) {
        if (error.message !== 'Session expired') {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    }
}

async function deleteSchool(id, schoolName) {
    const confirmed = confirm(`Are you sure you want to remove "${schoolName}" from the waitlist?`);
    if (!confirmed) return;

    try {
        const response = await authFetch(`${API_URL}/waitlist/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            loadData();
        } else {
            alert('Error deleting school: ' + data.message);
        }
    } catch (error) {
        if (error.message !== 'Session expired') {
            console.error('Error deleting school:', error);
            alert('Error deleting school');
        }
    }
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

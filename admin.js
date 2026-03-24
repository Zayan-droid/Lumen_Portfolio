/* ═══════════════════════════════════════════════════════════
   Lumin — Admin Dashboard JavaScript
   ═══════════════════════════════════════════════════════════ */

const API_URL = 'http://localhost:3000/api';

// Load all data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

// Load waitlist data and statistics
async function loadData() {
    try {
        // Load statistics
        const statsResponse = await fetch(`${API_URL}/stats`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            updateStats(statsData.stats);
        }

        // Load waitlist entries
        const waitlistResponse = await fetch(`${API_URL}/waitlist`);
        const waitlistData = await waitlistResponse.json();
        
        if (waitlistData.success) {
            renderTable(waitlistData.schools);
        }
    } catch (error) {
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

// Update statistics cards
function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-contacted').textContent = stats.contacted;
    document.getElementById('stat-onboarded').textContent = stats.onboarded;
    document.getElementById('stat-students').textContent = formatNumber(stats.totalStudents);
    document.getElementById('stat-cities').textContent = stats.cities;
}

// Render table with waitlist entries
function renderTable(schools) {
    const tableContent = document.getElementById('table-content');
    
    if (schools.length === 0) {
        tableContent.innerHTML = `
            <div class="empty-state">
                <p style="font-weight: 600;">No schools on the waitlist yet</p>
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
                ${schools.map(school => `
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
                            <button class="action-btn btn-update" onclick="updateStatus('${school.id}', '${school.status}')">
                                Update
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteSchool('${school.id}', '${escapeHtml(school.schoolName)}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    tableContent.innerHTML = tableHTML;
}

// Update school status
async function updateStatus(id, currentStatus) {
    const statuses = ['pending', 'contacted', 'onboarded'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    const confirmed = confirm(`Change status to "${nextStatus}"?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/waitlist/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: nextStatus })
        });

        const data = await response.json();

        if (data.success) {
            loadData(); // Reload data
        } else {
            alert('Error updating status: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status');
    }
}

// Delete school from waitlist
async function deleteSchool(id, schoolName) {
    const confirmed = confirm(`Are you sure you want to remove "${schoolName}" from the waitlist?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/waitlist/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadData(); // Reload data
        } else {
            alert('Error deleting school: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting school:', error);
        alert('Error deleting school');
    }
}

// Helper functions
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

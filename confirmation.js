/* ═══════════════════════════════════════════════════════════
   Lumin — Confirmation Page Handler
   ═══════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // Retrieve waitlist data from localStorage
    const waitlistDataStr = localStorage.getItem('Lumin_waitlist_data');
    
    if (!waitlistDataStr) {
        // If no data found, redirect to waitlist page
        window.location.href = 'waitlist.html';
        return;
    }

    try {
        const waitlistData = JSON.parse(waitlistDataStr);
        
        // Populate confirmation details
        const detailsContainer = document.getElementById('confirmation-details');
        
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">School Name</span>
                    <span class="detail-value">${escapeHtml(waitlistData.schoolName)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Number of Students</span>
                    <span class="detail-value">${formatNumber(waitlistData.studentCount)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Contact Email</span>
                    <span class="detail-value">${escapeHtml(waitlistData.contactEmail)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">City</span>
                    <span class="detail-value">${escapeHtml(waitlistData.city)}</span>
                </div>
            `;
        }

        // Clear the stored data after displaying (optional - prevents back button issues)
        // Uncomment the line below if you want to clear data after confirmation
        // localStorage.removeItem('Lumin_waitlist_data');

    } catch (error) {
        console.error('Error parsing waitlist data:', error);
        window.location.href = 'waitlist.html';
    }

    // Helper function to escape HTML and prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to format numbers with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
})();

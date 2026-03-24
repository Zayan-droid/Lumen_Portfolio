/* ═══════════════════════════════════════════════════════════
   Lumin — Waitlist Form Handler
   ═══════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    const form = document.getElementById('waitlist-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Form validation rules
    const validators = {
        schoolName: {
            validate: (value) => value.trim().length >= 2,
            message: 'Please enter a valid school name (at least 2 characters)'
        },
        studentCount: {
            validate: (value) => {
                const num = parseInt(value, 10);
                return !isNaN(num) && num > 0 && num <= 1000000;
            },
            message: 'Please enter a valid number of students (1-1,000,000)'
        },
        contactEmail: {
            validate: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value.trim());
            },
            message: 'Please enter a valid email address'
        },
        city: {
            validate: (value) => value.trim().length >= 2,
            message: 'Please enter a valid city name (at least 2 characters)'
        }
    };

    // Show error message
    function showError(fieldName, message) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`error-${fieldName.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
        
        input.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    // Clear error message
    function clearError(fieldName) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`error-${fieldName.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
        
        input.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    // Validate single field
    function validateField(fieldName, value) {
        const validator = validators[fieldName];
        if (!validator) return true;

        if (validator.validate(value)) {
            clearError(fieldName);
            return true;
        } else {
            showError(fieldName, validator.message);
            return false;
        }
    }

    // Validate all fields
    function validateForm(formData) {
        let isValid = true;
        
        for (const [fieldName, value] of formData.entries()) {
            if (!validateField(fieldName, value)) {
                isValid = false;
            }
        }
        
        return isValid;
    }

    // Add real-time validation on blur
    form.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this.name, this.value);
        });

        // Clear error on input
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                clearError(this.name);
            }
        });
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        
        // Validate form
        if (!validateForm(formData)) {
            // Focus on first error field
            const firstError = form.querySelector('.form-input.error');
            if (firstError) {
                firstError.focus();
            }
            return;
        }

        // Show loading state
        submitBtn.classList.add('btn--loading');

        // Collect form data
        const waitlistData = {
            schoolName: formData.get('schoolName').trim(),
            studentCount: parseInt(formData.get('studentCount'), 10),
            contactEmail: formData.get('contactEmail').trim(),
            city: formData.get('city').trim()
        };

        // Send to backend API
        fetch('/api/waitlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(waitlistData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store in localStorage for confirmation page
                localStorage.setItem('Lumin_waitlist_data', JSON.stringify(data.data));
                
                // Redirect to confirmation page
                window.location.href = 'confirmation.html';
            } else {
                // Handle error
                alert(data.message || 'There was an error submitting your information. Please try again.');
                submitBtn.classList.remove('btn--loading');
            }
        })
        .catch(error => {
            console.error('Error submitting waitlist:', error);
            alert('There was an error connecting to the server. Please try again later.');
            submitBtn.classList.remove('btn--loading');
        });
    });

    // Prevent form resubmission on page refresh
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
})();

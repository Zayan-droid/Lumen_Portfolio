// Ensure smooth page transitions
(function() {
    'use strict';
    
    // 1. Fade in the page on load
    function fadeInPage() {
        if (!document.body.classList.contains('loaded')) {
            document.body.classList.add('loaded');
        }
    }
    
    // 2. Handle outgoing navigation
    function setupPageTransitions() {
        const links = document.querySelectorAll('a');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href && 
                    (href.endsWith('.html') || href === '/' || (!href.includes('.') && !href.startsWith('#'))) && 
                    !href.startsWith('#') && 
                    !this.hasAttribute('target') &&
                    !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) {
                    
                    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
                    const targetFile = href.split('/').pop() || 'index.html';
                    
                    if (href === currentFile || targetFile === currentFile) return;

                    e.preventDefault();
                    
                    // Fade out
                    document.body.classList.remove('loaded');
                    
                    setTimeout(function() {
                        window.location.href = href;
                    }, 600);
                }
            });
        });
    }
    
    // 4. Handle mobile menu toggle
    function setupMobileMenu() {
        const toggle = document.querySelector('.nav__toggle');
        const links = document.querySelector('.nav__links');
        
        if (toggle && links) {
            toggle.addEventListener('click', function() {
                this.classList.toggle('active');
                links.classList.toggle('nav__links--open');
            });

            // Close menu when a link is clicked
            const navItems = links.querySelectorAll('a');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    toggle.classList.remove('active');
                    links.classList.remove('nav__links--open');
                });
            });
        }
    }
    
    // 5. Handle browser back/forward buttons
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            document.body.classList.add('loaded');
            // reset menu state if coming from bfcache
            const toggle = document.querySelector('.nav__toggle');
            const links = document.querySelector('.nav__links');
            if (toggle && links) {
                toggle.classList.remove('active');
                links.classList.remove('nav__links--open');
            }
        }
    });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(fadeInPage, 50);
            setupPageTransitions();
            setupMobileMenu();
        });
    } else {
        setTimeout(fadeInPage, 50);
        setupPageTransitions();
        setupMobileMenu();
    }
})();

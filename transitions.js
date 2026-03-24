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
    
    // 3. Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(fadeInPage, 50);
            setupPageTransitions();
        });
    } else {
        setTimeout(fadeInPage, 50);
        setupPageTransitions();
    }
    
    // 4. Handle browser back/forward buttons
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            document.body.classList.add('loaded');
        }
    });
})();

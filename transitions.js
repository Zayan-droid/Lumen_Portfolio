document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Transition Overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #FFFFFF;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.4s ease;
    `;
    document.body.appendChild(overlay);

    // 2. Outgoing Animation
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            
            if (href && 
                href.endsWith('.html') && 
                !href.startsWith('#') && 
                !link.hasAttribute('target') &&
                !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) {
                
                const currentFile = window.location.pathname.split('/').pop() || 'index.html';
                if (href === currentFile) return;

                e.preventDefault();
                overlay.style.opacity = '1';
                
                setTimeout(() => {
                    window.location.href = href;
                }, 400);
            }
        });
    });
});

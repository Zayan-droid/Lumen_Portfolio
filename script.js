/* ═══════════════════════════════════════════════════════════
   LUMEN — Scrollytelling Engine
   GSAP ScrollTrigger + Canvas Frame Sequencing
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Configuration ──────────────────────────────────── */
    const FRAME_COUNT  = 240;
    const FRAME_PATH   = (i) => `ezgif-frame-${String(i).padStart(3, '0')}.webp`;

    // Scroll-percentage ranges for each section (0–1 of total scroll progress)
    const SECTIONS = [
        { id: 'section-hero',       start: 0.00, end: 0.15 },
        { id: 'section-unified',    start: 0.15, end: 0.40 },
        { id: 'section-ai',         start: 0.40, end: 0.65 },
        { id: 'section-visibility', start: 0.65, end: 0.85 },
        { id: 'section-cta',        start: 0.85, end: 1.00 },
    ];

    /* ── DOM refs ───────────────────────────────────────── */
    const canvas  = document.getElementById('hero-canvas');
    const ctx     = canvas.getContext('2d');
    const nav     = document.getElementById('main-nav');

    /* ── State ──────────────────────────────────────────── */
    const images       = [];
    let   currentFrame = 0;
    let   canvasW, canvasH;

    // Track active section for overlay management
    const sectionEls   = {};
    const sectionState = {};

    /* ═══════════════════════════════════════════════════════
       1. BUILD LOADER UI
       ═══════════════════════════════════════════════════════ */
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="loader__logo">LUMEN</div>
        <div class="loader__bar-track">
            <div class="loader__bar-fill" id="loader-fill"></div>
        </div>
        <div class="loader__percent" id="loader-pct">0 %</div>
    `;
    document.body.appendChild(loader);

    const loaderFill = document.getElementById('loader-fill');
    const loaderPct  = document.getElementById('loader-pct');

    /* ═══════════════════════════════════════════════════════
       2. PRELOAD IMAGES
       ═══════════════════════════════════════════════════════ */
    function preloadImages() {
        return new Promise((resolve) => {
            let loaded = 0;

            for (let i = 1; i <= FRAME_COUNT; i++) {
                const img = new Image();
                img.src = FRAME_PATH(i);

                img.onload = img.onerror = () => {
                    loaded++;
                    const pct = Math.round((loaded / FRAME_COUNT) * 100);
                    loaderFill.style.width = pct + '%';
                    loaderPct.textContent  = pct + ' %';

                    if (loaded === FRAME_COUNT) {
                        resolve();
                    }
                };

                images.push(img);
            }
        });
    }

    /* ═══════════════════════════════════════════════════════
       3. CANVAS RENDERER
       ═══════════════════════════════════════════════════════ */
    function sizeCanvas() {
        canvasW = window.innerWidth;
        canvasH = window.innerHeight;
        canvas.width  = canvasW;
        canvas.height = canvasH;
        canvas.style.width  = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawFrame(currentFrame);
    }

    function drawFrame(index) {
        const img = images[index];
        if (!img || !img.complete) return;

        ctx.clearRect(0, 0, canvasW, canvasH);

        // Cover-fit the image into the viewport
        const imgRatio    = img.naturalWidth / img.naturalHeight;
        const canvasRatio = canvasW / canvasH;

        let drawW, drawH, drawX, drawY;

        if (canvasRatio > imgRatio) {
            drawW = canvasW;
            drawH = canvasW / imgRatio;
            drawX = 0;
            drawY = (canvasH - drawH) / 2;
        } else {
            drawH = canvasH;
            drawW = canvasH * imgRatio;
            drawX = (canvasW - drawW) / 2;
            drawY = 0;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        currentFrame = index;
    }

    /* ═══════════════════════════════════════════════════════
       4. OVERLAY VISIBILITY HELPERS
       ═══════════════════════════════════════════════════════ */

    function showSection(id) {
        const el = sectionEls[id];
        if (!el || sectionState[id] === 'visible') return;
        sectionState[id] = 'visible';

        el.style.visibility = 'visible';
        const content  = el.querySelector('.overlay__content');
        const children = content ? Array.from(content.children) : [];

        gsap.killTweensOf(el);
        children.forEach(c => gsap.killTweensOf(c));

        gsap.to(el, { opacity: 1, duration: 0.6, ease: 'power3.out' });

        children.forEach((child, ci) => {
            gsap.fromTo(child,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.08 * ci }
            );
        });
    }

    function hideSection(id, direction) {
        const el = sectionEls[id];
        if (!el || sectionState[id] === 'hidden') return;
        sectionState[id] = 'hidden';

        const content  = el.querySelector('.overlay__content');
        const children = content ? Array.from(content.children) : [];

        gsap.killTweensOf(el);
        children.forEach(c => gsap.killTweensOf(c));

        const yShift = direction === 'up' ? -20 : 20;

        children.forEach((child) => {
            gsap.to(child, { y: yShift, duration: 0.4, ease: 'power2.in' });
        });

        gsap.to(el, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => { el.style.visibility = 'hidden'; }
        });
    }

    /* ═══════════════════════════════════════════════════════
       5. GSAP SCROLL TRIGGERS
       ═══════════════════════════════════════════════════════ */
    function initScrollAnimation() {
        gsap.registerPlugin(ScrollTrigger);

        // Cache section elements
        SECTIONS.forEach(s => {
            sectionEls[s.id] = document.getElementById(s.id);
            sectionState[s.id] = 'hidden';
        });

        // Mark hero as visible initially to prevent re-animation blink
        sectionState['section-hero'] = 'visible';

        // ── Master ScrollTrigger for frames + overlays ─────
        const frameObj = { frame: 0 };
        let lastActiveSection = 'section-hero';

        ScrollTrigger.create({
            trigger: '#scroll-spacer',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            onUpdate: (self) => {
                const progress = self.progress; // 0 to 1

                // ─── Update canvas frame ───
                const targetFrame = Math.round(progress * (FRAME_COUNT - 1));
                if (targetFrame !== currentFrame) {
                    drawFrame(targetFrame);
                }

                // ─── Update section overlays ───
                let activeId = null;
                for (let i = 0; i < SECTIONS.length; i++) {
                    const s = SECTIONS[i];
                    if (progress >= s.start && progress <= s.end) {
                        activeId = s.id;
                        break;
                    }
                }

                // Handle edge case: at 100% progress, ensure CTA is active
                if (progress >= 0.99) {
                    activeId = 'section-cta';
                }

                if (activeId !== lastActiveSection) {
                    // Hide the previous section
                    if (lastActiveSection) {
                        const direction = activeId &&
                            SECTIONS.findIndex(s => s.id === activeId) > SECTIONS.findIndex(s => s.id === lastActiveSection)
                            ? 'up' : 'down';
                        hideSection(lastActiveSection, direction);
                    }
                    // Show the new section
                    if (activeId) {
                        showSection(activeId);
                    }
                    lastActiveSection = activeId;
                }
            },
        });

        // ── Nav fade-in ────────────────────────────────────
        ScrollTrigger.create({
            trigger: '#scroll-spacer',
            start: '50px top',
            onToggle: (self) => {
                nav.classList.toggle('nav--visible', self.isActive);
            },
        });
    }

    /* ═══════════════════════════════════════════════════════
       6. INIT
       ═══════════════════════════════════════════════════════ */
    async function init() {
        sizeCanvas();
        window.addEventListener('resize', () => {
            sizeCanvas();
            ScrollTrigger.refresh();
        });

        await preloadImages();

        // Hide loader
        loader.classList.add('loader--hidden');
        setTimeout(() => loader.remove(), 800);

        // Draw first frame
        drawFrame(0);

        // Show hero immediately
        const heroEl = document.getElementById('section-hero');
        if (heroEl) {
            heroEl.style.visibility = 'visible';
            heroEl.style.opacity = '1';
            const heroChildren = heroEl.querySelectorAll('.overlay__content > *');
            heroChildren.forEach(child => {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
            });
        }

        // Kick off GSAP
        initScrollAnimation();
    }

    // Go
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* ═══════════════════════════════════════════════════════════
   Lumin — Scrollytelling Engine
   GSAP ScrollTrigger + Canvas Frame Sequencing (Optimized)
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Configuration ──────────────────────────────────── */
    // Detect mobile for optimization
    const IS_MOBILE = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Use fewer frames on mobile for better performance
    const FRAME_STEP = IS_MOBILE ? 4 : 2; // Every 4th frame on mobile, every 2nd on desktop
    const TOTAL_FRAMES = 240;
    const FRAME_COUNT = Math.floor(TOTAL_FRAMES / FRAME_STEP);
    const FRAME_PATH = (i) => `ezgif-frame-${String(i * FRAME_STEP + 1).padStart(3, '0')}.webp`;

    // Scroll-percentage ranges for each section (0–1 of total scroll progress)
    const SECTIONS = [
        { id: 'section-hero',     start: 0.00, end: 0.15 },
        { id: 'section-students', start: 0.15, end: 0.40 },
        { id: 'section-teachers', start: 0.40, end: 0.65 },
        { id: 'section-parents',  start: 0.65, end: 0.85 },
        { id: 'section-cta',      start: 0.85, end: 1.00 },
    ];

    /* ── DOM refs ───────────────────────────────────────── */
    const canvas  = document.getElementById('hero-canvas');
    const ctx     = canvas.getContext('2d', { alpha: false });
    const nav     = document.getElementById('main-nav');

    /* ── State ──────────────────────────────────────────── */
    const images       = [];
    const loadedFrames = new Set();
    let   currentFrame = 0;
    let   canvasW, canvasH;
    let   isLoading = false;

    // Track active section for overlay management
    const sectionEls   = {};
    const sectionState = {};

    /* ═══════════════════════════════════════════════════════
       1. BUILD LOADER UI
       ═══════════════════════════════════════════════════════ */
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="loader__logo">Lumin</div>
        <div class="loader__bar-track">
            <div class="loader__bar-fill" id="loader-fill"></div>
        </div>
        <div class="loader__percent" id="loader-pct">0 %</div>
    `;
    document.body.appendChild(loader);

    const loaderFill = document.getElementById('loader-fill');
    const loaderPct  = document.getElementById('loader-pct');

    /* ═══════════════════════════════════════════════════════
       2. OPTIMIZED IMAGE LOADING
       ═══════════════════════════════════════════════════════ */
    
    // Load a single frame
    function loadFrame(index) {
        return new Promise((resolve) => {
            if (loadedFrames.has(index)) {
                resolve(images[index]);
                return;
            }

            const img = new Image();
            img.onload = () => {
                loadedFrames.add(index);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load frame ${index}`);
                resolve(null);
            };
            img.src = FRAME_PATH(index);
            images[index] = img;
        });
    }

    // Preload critical frames (first 10% for smooth start)
    async function preloadCriticalFrames() {
        const criticalCount = Math.ceil(FRAME_COUNT * 0.1); // First 10%
        const promises = [];
        
        for (let i = 0; i < criticalCount; i++) {
            promises.push(loadFrame(i));
        }

        let loaded = 0;
        for (const promise of promises) {
            await promise;
            loaded++;
            const pct = Math.round((loaded / criticalCount) * 100);
            loaderFill.style.width = pct + '%';
            loaderPct.textContent = pct + ' %';
        }
    }

    // Lazy load remaining frames in background
    function lazyLoadRemainingFrames() {
        const criticalCount = Math.ceil(FRAME_COUNT * 0.1);
        
        // Load remaining frames in chunks
        const chunkSize = 5;
        let currentIndex = criticalCount;

        function loadNextChunk() {
            if (currentIndex >= FRAME_COUNT) return;

            const promises = [];
            for (let i = 0; i < chunkSize && currentIndex < FRAME_COUNT; i++, currentIndex++) {
                promises.push(loadFrame(currentIndex));
            }

            Promise.all(promises).then(() => {
                // Use requestIdleCallback if available, otherwise setTimeout
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(loadNextChunk);
                } else {
                    setTimeout(loadNextChunk, 50);
                }
            });
        }

        loadNextChunk();
    }

    // Preload frames around current position for smooth scrolling
    function preloadNearbyFrames(centerFrame) {
        const range = IS_MOBILE ? 3 : 5;
        const start = Math.max(0, centerFrame - range);
        const end = Math.min(FRAME_COUNT - 1, centerFrame + range);

        for (let i = start; i <= end; i++) {
            if (!loadedFrames.has(i)) {
                loadFrame(i);
            }
        }
    }

    /* ═══════════════════════════════════════════════════════
       3. CANVAS RENDERER
       ═══════════════════════════════════════════════════════ */
    function sizeCanvas() {
        const dpr = IS_MOBILE ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        canvasW = window.innerWidth;
        canvasH = window.innerHeight;
        
        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = IS_MOBILE ? 'medium' : 'high';
        
        drawFrame(currentFrame);
    }

    function drawFrame(index) {
        const img = images[index];
        if (!img || !img.complete) {
            // If frame not loaded yet, load it
            if (!loadedFrames.has(index) && !isLoading) {
                isLoading = true;
                loadFrame(index).then(() => {
                    isLoading = false;
                    drawFrame(index);
                });
            }
            return;
        }

        ctx.clearRect(0, 0, canvasW, canvasH);

        // Cover-fit the image into the viewport
        const imgRatio = img.naturalWidth / img.naturalHeight;
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
        
        // Preload nearby frames for smooth scrolling
        preloadNearbyFrames(index);
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
        let lastActiveSection = 'section-hero';

        ScrollTrigger.create({
            trigger: '#scroll-spacer',
            start: 'top top',
            end: 'bottom bottom',
            scrub: IS_MOBILE ? 0.3 : 0.5,
            onUpdate: (self) => {
                const progress = self.progress; // 0 to 1

                // ─── Update canvas frame ───
                const targetFrame = Math.round(progress * (FRAME_COUNT - 1));
                if (targetFrame !== currentFrame) {
                    requestAnimationFrame(() => drawFrame(targetFrame));
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
        
        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                sizeCanvas();
                ScrollTrigger.refresh();
            }, 150);
        });

        // Load critical frames first
        await preloadCriticalFrames();

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
        
        // Load remaining frames in background
        lazyLoadRemainingFrames();
    }

    // Go
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

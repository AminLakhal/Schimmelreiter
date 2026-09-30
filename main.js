// Der Schimmelreiter – gemeinsames Script für alle Seiten

// Mobiles Menü
const topbar = document.querySelector('.topbar');
const toggle = document.querySelector('.menu-toggle');
if (toggle) {
    toggle.addEventListener('click', () => {
        const open = topbar.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
        toggle.innerHTML = open ? '&#10005;' : '&#9776;';
        document.querySelector('.site-header')?.classList.toggle('menu-open', open);
    });
}

// Kopfzeile der Unterseiten bekommt beim Scrollen einen Hintergrund
const header = document.querySelector('.site-header');
if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

// Teaser auf der Startseite: Ton und Vollbild
const video = document.querySelector('.front video');
if (video) {
    const front = document.querySelector('.front');
    const sound = document.querySelector('.sound');
    video.muted = true;
    video.play().catch(() => {});

    sound.addEventListener('click', () => {
        video.muted = !video.muted;
        if (!video.muted) video.play();
        sound.textContent = video.muted ? '🔇 Ton an' : '🔊 Ton aus';
        sound.setAttribute('aria-pressed', !video.muted);
    });

    // Ton aus, sobald man die Front page verlässt
    new IntersectionObserver(([e]) => {
        if (!e.isIntersecting && !video.muted) sound.click();
    }, { threshold: .2 }).observe(video);

    // Vollbild: Rahmen weg, nur der Teaser; Esc bringt alles zurück
    document.querySelector('.fs').addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (front.requestFullscreen) front.requestFullscreen().catch(() => front.classList.toggle('clean'));
        else front.classList.toggle('clean');
    });
    document.addEventListener('fullscreenchange', () => {
        front.classList.toggle('clean', document.fullscreenElement === front);
    });
}

// Galerie-Lightbox
const lb = document.querySelector('.lightbox');
if (lb) {
    const items = [...document.querySelectorAll('.g-item img')];
    const lbImg = lb.querySelector('img');
    let cur = 0;
    const show = i => {
        cur = (i + items.length) % items.length;
        lbImg.src = items[cur].src;
        lbImg.alt = items[cur].alt;
        lb.hidden = false;
    };
    document.querySelectorAll('.g-item').forEach((b, i) => b.addEventListener('click', () => show(i)));
    lb.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); show(cur - 1); });
    lb.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); show(cur + 1); });
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-close')) lb.hidden = true; });
    document.addEventListener('keydown', e => {
        if (lb.hidden) return;
        if (e.key === 'Escape') lb.hidden = true;
        if (e.key === 'ArrowLeft') show(cur - 1);
        if (e.key === 'ArrowRight') show(cur + 1);
    });
    // Wischen auf dem Handy
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
        x0 = null;
    });
}

// Kontaktformular: wird über FormSubmit an kurzfilm.schimmelreiter@web.de geschickt
const form = document.querySelector('#kontakt-form');
if (form) {
    const status = form.querySelector('.form-status');
    const btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        status.className = 'form-status';
        status.textContent = 'Wird gesendet …';
        btn.disabled = true;
        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(form)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || res.status);
            form.reset();
            status.classList.add('ok');
            status.textContent = 'Danke! Ihre Nachricht ist bei uns angekommen.';
        } catch (err) {
            status.classList.add('err');
            status.textContent = 'Das hat leider nicht geklappt. Bitte schreiben Sie uns direkt an kurzfilm.schimmelreiter@web.de.';
        } finally {
            btn.disabled = false;
        }
    });
}

// ---------- Fließende Animationen ----------
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Elemente beim Scrollen weich einblenden, Geschwister nacheinander
if ('IntersectionObserver' in window) {
    const groups = ['.block > .eyebrow, .block > h2, .block > p, .block > .row, .block > .video-wrap, .block > .team-list, .block > form, .block > .donate, .block > .caption',
        '.cards > *', '.teasers > *', '.gallery > *', '.ig-grid > *', '.sponsor-grid > *', '.sponsors > .eyebrow, .sponsors > h2'];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    groups.forEach(sel => {
        const seen = new Map();
        document.querySelectorAll(sel).forEach(el => {
            const i = seen.get(el.parentElement) || 0;
            seen.set(el.parentElement, i + 1);
            el.classList.add('reveal');
            el.style.setProperty('--d', Math.min(i, 8) * 0.07 + 's');
            io.observe(el);
        });
    });

    // Parallaxe im Hero der Unterseiten
    const hero = document.querySelector('.page-hero');
    if (hero && !reduce) {
        let ticking = false;
        addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                hero.style.setProperty('--py', Math.min(scrollY, innerHeight) * 0.25 + 'px');
                ticking = false;
            });
        }, { passive: true });
    }

    // Weicher Übergang zwischen den Seiten
    document.querySelectorAll('a[href$=".html"]').forEach(a => {
        a.addEventListener('click', e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
            e.preventDefault();
            document.body.classList.add('leaving');
            setTimeout(() => { location.href = a.href; }, 320);
        });
    });
    // Beim Zurück-Navigieren aus dem Cache wieder einblenden
    addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving'); });
}

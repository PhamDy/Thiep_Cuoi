(function () {
  const cfg = window.WEDDING_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const resolve = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), cfg);
  const el = (cls, txt, tag = 'p') => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  // Gán src cho <img> sau khi ảnh đã giải mã ngoài main thread → không khựng khi hiện ảnh lớn.
  const swapDecoded = (imgEl, src, after) => {
    const set = () => { imgEl.src = src; if (after) after(); };
    const tmp = new Image(); tmp.src = src;
    if (tmp.decode) tmp.decode().then(set).catch(set); else set();
  };

  const monthNames = ['Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Mười Hai'];
  const weddingDate = new Date(cfg.weddingDate);

  function bindText() {
    $$('[data-bind]').forEach((e) => { const v = resolve(e.getAttribute('data-bind')); if (v != null) e.textContent = v; });
  }
  function bindPhotos() {
    const map = { introPhoto: 'intro', coverPhoto: 'cover', invitePhoto: 'invite', countdownPhoto: 'countdown', footerPhoto: 'footer', lovePhoto: 'love', youPhoto: 'you' };
    const lqip = cfg.photosLqip || {};
    // Ảnh trên màn hình (intro + cover) nạp ngay; phần còn lại nạp khi section sắp lọt viewport.
    const eager = new Set(['introPhoto', 'coverPhoto']);
    // Gán ảnh full: GIẢI MÃ ngoài main thread trước, gán xong mới bỏ nền mờ → không khựng frame.
    const applyFull = (n, url) => {
      const done = () => { n.style.backgroundImage = `url('${url}')`; n.classList.remove('bg-lqip'); n.classList.add('bg-ready'); };
      const pre = new Image(); pre.src = url;
      if (pre.decode) pre.decode().then(done).catch(done); else { pre.onload = done; pre.onerror = done; }
    };
    const byTarget = new Map();
    Object.entries(map).forEach(([id, key]) => {
      const n = document.getElementById(id);
      if (!n || !cfg.photos[key]) return;
      // Nền mờ tí hon hiện tức thì (nếu có) → không có ô trống, không "pop" khi ảnh full tới.
      if (lqip[key]) { n.style.backgroundImage = `url('${lqip[key]}')`; n.classList.add('bg-lqip'); }
      if (eager.has(id)) { applyFull(n, cfg.photos[key]); return; }
      const t = n.closest('.sec') || n;               // quan sát cả section (love+you chung 1 section)
      if (!byTarget.has(t)) byTarget.set(t, []);
      byTarget.get(t).push([n, cfg.photos[key]]);
    });
    if (byTarget.size && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          (en.target.__bgs || []).forEach(([n, url]) => applyFull(n, url));
          obs.unobserve(en.target);
        });
      }, { rootMargin: '600px 0px' });               // tải+giải mã sớm 600px để kịp sẵn sàng trước khi thấy
      byTarget.forEach((pairs, t) => { t.__bgs = pairs; io.observe(t); });
    } else {
      byTarget.forEach((pairs) => pairs.forEach(([n, url]) => applyFull(n, url)));
    }
    // const fab = document.getElementById('fabAvatar');
    // if (fab && cfg.photos.avatar) fab.style.backgroundImage = `url('${cfg.photos.avatar}')`;
  }

  function introDate() {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get('guest') || '';

    // guest bắt đầu bằng "nt" → ngày 26
    const day = guest.toLowerCase().startsWith('nt')
      ? 26
      : weddingDate.getDate();

    $('#introDate').textContent =
      `${String(day).padStart(2, '0')} · ${String(weddingDate.getMonth() + 1).padStart(2, '0')} · ${weddingDate.getFullYear()}`;
  }

async function loadGuestName() {
    const guestEl = $('#introGuest');

    const params = new URLSearchParams(window.location.search);
    const key = params.get('guest');

    // Không có ?guest=...
    // → hiện website bình thường ngay
    if (!key) {
        guestEl.textContent = '';
        guestEl.classList.remove('show');

        document.documentElement.classList.remove('guest-loading');
        return;
    }

    try {
        // Đọc file JSON
        const response = await fetch('./guest.json');

        if (!response.ok) {
            throw new Error('Không đọc được guest.json');
        }

        const guests = await response.json();

        // Tìm tên theo key
        const name = guests[key];

        if (name) {
            guestEl.textContent = name;
            guestEl.classList.add('show');
        } else {
            // Không tồn tại key
            guestEl.textContent = '';
            guestEl.classList.remove('show');
        }

    } catch (error) {
        console.error('Lỗi đọc guest.json:', error);

        // Có lỗi → coi như không có guest
        guestEl.textContent = '';
        guestEl.classList.remove('show');

    } finally {
        // Đọc JSON xong → cho website hiện ra
        document.documentElement.classList.remove('guest-loading');
    }
}

function renderParty(id, ev) {
    const n = document.getElementById(id); n.innerHTML = '';
    const a = document.createElement('a'); a.href = ev.mapUrl; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Xem chỉ đường →';
    n.append(
      el('', ev.title, 'h3'),
      el('pb-when', `${ev.weekday} · ${ev.time}`),
      el('pb-date', ev.date),
      el('pb-lunar', ev.lunar),
      el('pb-place', ev.place),
      el('pb-addr', ev.address),
      a
    );
  }

  function renderCere(id, c) {
    const n = document.getElementById(id); n.innerHTML = '';
    const date = el('cere-date', null, 'div');
    date.append(el('cd-m', c.month, 'span'), el('cd-d', c.day, 'span'), el('cd-y', c.year, 'span'));
    const a = document.createElement('a'); a.href = c.mapUrl; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Chỉ đường';
    n.append(el('', c.title, 'h3'), el('c-when', c.when), date, el('c-lunar', c.lunar), el('c-place', c.place), a);
  }

  function renderCoverInfo() {
    const box = document.getElementById('coverInfoBlock'); if (!box) return;
    const g = cfg.events.groom, t = cfg.ceremonies.thanhhon;
    box.innerHTML = '';
    const row = (title, when, date) => { const d = el('cib-row', null, 'div'); d.append(el('cib-title', title), el('cib-when', when), el('cib-date', date)); return d; };
    const tWhen = (t.when || '').replace(/^VÀO\s*/i, '').replace(/\s*-\s*/, ' · ');
    const tDate = `${t.day} . ${(t.month || '').replace(/THÁNG\s*/i, '')} . ${(t.year || '').replace(/NĂM\s*/i, '')}`;
    box.append(row('THƯ MỜI TIỆC CƯỚI', `${g.weekday} · ${g.time}`, g.date), row('LỄ THÀNH HÔN', tWhen, tDate));
  }

  function tickCountdown() {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get('guest') || '';

    // guest bắt đầu bằng "nt" → countdown tới ngày 26
    const targetDate = new Date(weddingDate);

    if (guest.toLowerCase().startsWith('nt')) {
      targetDate.setDate(26);
    }

    let diff = Math.floor((targetDate - new Date()) / 1000);

    if (diff <= 0) {
      $('#countdown').hidden = true;
      $('#countdownDone').hidden = false;
      return false;
    }

    const d = Math.floor(diff / 86400);
    diff -= d * 86400;

    const h = Math.floor(diff / 3600);
    diff -= h * 3600;

    const m = Math.floor(diff / 60);
    const s = diff - m * 60;

    $('#cdDays').textContent = d;
    $('#cdHours').textContent = String(h).padStart(2, '0');
    $('#cdMins').textContent = String(m).padStart(2, '0');
    $('#cdSecs').textContent = String(s).padStart(2, '0');

    return true;
  }

  function startCountdown() { if (tickCountdown()) { const id = setInterval(() => { if (!tickCountdown()) clearInterval(id); }, 1000); } }

  function weddingDaysInMonth(m) {
    const set = new Set([weddingDate.getDate()]);
    [cfg.events && cfg.events.groom, cfg.events && cfg.events.bride].forEach((ev) => {
      if (!ev || !ev.date) return;
      const parts = ev.date.split('.').map((s) => parseInt(s.trim(), 10));
      if (parts.length === 3 && parts[1] - 1 === m) set.add(parts[0]);
    });
    return set;
  }
  function renderCalendar() {
    const y = weddingDate.getFullYear(), m = weddingDate.getMonth();
    const wed = weddingDaysInMonth(m);
    // $('#calMonth').textContent = `Tháng ${monthNames[m]}, ${y}`;
    $('#calMonth').textContent = `Tháng ${m + 1}`;
    const grid = $('#calGrid'); grid.innerHTML = '';
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(el('cal-empty', '', 'span'));
    for (let dd = 1; dd <= days; dd++) grid.appendChild(el('cal-day' + (wed.has(dd) ? ' is-wedding' : ''), dd, 'span'));
  }

  /* ---- Nhạc: đĩa fixed xoay liên tục, bấm = mute/unmute ---- */
  let audio;
  function setupMusic() {
    audio = $('#bgm'); audio.src = cfg.music;
    const btn = $('#musicToggle');
    btn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      btn.classList.toggle('muted', audio.muted);
      if (!audio.muted && audio.paused) audio.play().catch(() => {});
    });
  }

  /* ---- Mở thiệp: phong bì + rèm + nhạc + auto-scroll ---- */
  function setupIntro() {
    const intro = $('#intro'), btn = $('#introOpen'), env = $('#envelope');
    btn.addEventListener('click', () => {
      if (intro.classList.contains('opening')) return;
      intro.classList.add('opening');
      btn.disabled = true;
      if (audio) audio.play().catch(() => {});
      env.classList.add('open');

      setTimeout(() => intro.classList.add('reveal-curtain'), 220);

      setTimeout(() => {
        intro.classList.add('gone');
        document.body.classList.remove('pre-open');

        const fallingLayer = $('#petals');
        fallingLayer.classList.add('hearts');
        $$('.petal', fallingLayer).forEach((petal) => {
          petal.textContent = '♥';
        });

        setupAOS();
      }, 350);

      // Bắt đầu cuộn sớm hơn, không chờ intro biến mất hoàn toàn
      setTimeout(() => {
        startAutoScroll();
      }, 3000);

      setTimeout(() => {
        intro.style.display = 'none';
      }, 1400);

    });
  }

  function startAutoScroll() {

    const isMobile =
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const secs = cfg.autoScrollSeconds || 60;
    const mobileSpeed = 85; 

    const delay = Math.max(0, (cfg.autoScrollDelaySeconds != null ? cfg.autoScrollDelaySeconds : 0.2) * 1000);

    let stopped = false, lastTs = null, armed = false;
    setTimeout(() => { armed = true; }, 600);
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    // Tạm tắt content-visibility để scrollHeight = chiều cao thật (xem body.autoscrolling trong CSS)
    const endCv = () => document.body.classList.remove('autoscrolling');
    const stop = () => { if (!armed) return; stopped = true; endCv(); remove(); };
    const remove = () => ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.removeEventListener(ev, stop));
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
    function frame(ts) {
      if (stopped) return;
      if (lastTs == null) lastTs = ts;
      const dt = ts - lastTs; lastTs = ts;

    const target = maxScroll();

    const speed = isMobile
      ? mobileSpeed / 1000
      : target / (secs * 1000);

    const y = Math.min(window.scrollY + speed * dt, target);
      
      // instant từng frame (KHÔNG để scroll-behavior:smooth của CSS xen vào, tránh giật/kẹt)
      window.scrollTo({ top: y, behavior: 'auto' });
      if (y < target - 1) requestAnimationFrame(frame); else { endCv(); remove(); }
    }
    // dừng lại cho khách kịp nhìn ảnh cover rồi mới cuộn
    setTimeout(() => {
      if (stopped) return;
      document.body.classList.add('autoscrolling'); // ép mọi section render ở chiều cao thật trước khi cuộn
      requestAnimationFrame(frame);
    }, delay);
  }

  function setupGift() {
    $('#qrGroom').src = cfg.gift.groom.qrImage;
    $('#qrBride').src = cfg.gift.bride.qrImage;
    const modal = $('#giftModal');
    const open = () => {
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('is-open'));
    };
    const close = () => {
      modal.classList.remove('is-open');
      setTimeout(() => (modal.hidden = true), 280);
    };
    $('#giftOpen').addEventListener('click', open);
    $('#giftOpen').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    $('#giftClose').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

['qrGroom', 'qrBride'].forEach((id) => {
  const qr = document.getElementById(id);

  const enlarge = () => {
    $('#lbImg').src = qr.src;

    // QR chỉ xem ảnh, không cho chuyển ảnh
    isQrLightbox = true;
    $('#lbPrev').style.display = 'none';
    $('#lbNext').style.display = 'none';

    // Không hiện thumbnail khi xem QR
    const lbThumbs = $('#lbThumbs');
    if (lbThumbs) {
      lbThumbs.style.display = 'none';
    }

    $('#lightbox').hidden = false;
  };

  qr.addEventListener('click', enlarge);

  qr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      enlarge();
    }
  });
});

    $$('.copy-btn').forEach((b) => b.addEventListener('click', () => {
      const acc = cfg.gift[b.getAttribute('data-copy')].account;
      const done = () => { const t = b.textContent; b.textContent = 'Đã sao chép ✓'; setTimeout(() => (b.textContent = t), 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(acc).then(done).catch(done); else done();
    }));
  }

  let carIndex = 0;
  function setupAlbum() {
    const img = $('#carImg'), thumbs = $('#thumbs');
    let autoTimer = null, fadeTimer = null;
    const markThumbs = () => $$('#thumbs img').forEach((t, k) => t.classList.toggle('active', k === carIndex));
    const show = (i, instant) => {
      carIndex = (i + cfg.gallery.length) % cfg.gallery.length;
      markThumbs();
      if (instant) { swapDecoded(img, cfg.gallery[carIndex]); return; }
      img.classList.add('fading');
      clearTimeout(fadeTimer);
      // Giải mã ảnh lớn ngoài main thread trước khi hiện → không giật lúc chuyển ảnh
      fadeTimer = setTimeout(
        () => swapDecoded(
          img,
          cfg.gallery[carIndex],
          () => img.classList.remove('fading')
        ),
        700
      );
    };
    const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
    const startAuto = () => { stopAuto(); autoTimer = setInterval(() => { if (!document.hidden) show(carIndex + 1); }, 4000); };
    const manual = (fn) => () => { stopAuto(); fn(); };
    const thumbSrc = (i) => (cfg.galleryThumbs && cfg.galleryThumbs[i]) || cfg.gallery[i];
    cfg.gallery.forEach((src, i) => { const t = document.createElement('img'); t.src = thumbSrc(i); t.alt = `Ảnh ${i + 1}`; t.loading = 'lazy'; t.decoding = 'async'; t.addEventListener('click', manual(() => show(i))); thumbs.appendChild(t); });
    $('#carPrev').addEventListener('click', manual(() => show(carIndex - 1)));
    $('#carNext').addEventListener('click', manual(() => show(carIndex + 1)));
    $('#carFull').addEventListener('click', manual(() => openLightbox(carIndex)));
    img.addEventListener('click', manual(() => openLightbox(carIndex)));
    show(0, true);
    startAuto();
  }

let isQrLightbox = false;
let lbIndex = 0;

function updateLbThumbs() {
  const lbThumbs = $('#lbThumbs');
  if (!lbThumbs) return;

  Array.from(lbThumbs.children).forEach((thumb, i) => {
    thumb.classList.toggle('active', i === lbIndex);
  });
}

// ===== LIGHTBOX ZOOM =====
let lbZoom = 1;
let lbPanX = 0;
let lbPanY = 0;

const lbPointers = new Map();

let lbPinchStartDistance = 0;
let lbPinchStartZoom = 1;

let lbPointerStartX = 0;
let lbPointerStartY = 0;
let lbPointerStartPanX = 0;
let lbPointerStartPanY = 0;

let lbSuppressClickUntil = 0;


// Khoảng cách giữa 2 ngón tay
function getPinchDistance() {
  const pts = [...lbPointers.values()];

  if (pts.length < 2) return 0;

  return Math.hypot(
    pts[0].x - pts[1].x,
    pts[0].y - pts[1].y
  );
}


// Cập nhật zoom
function updateLightboxZoom() {
  lbZoom = Math.max(1, Math.min(4, lbZoom));

  // Zoom về 100% thì đưa ảnh về giữa
  if (lbZoom === 1) {
    lbPanX = 0;
    lbPanY = 0;
  }

  const img = $('#lbImg');

  img.style.transform =
    `translate3d(${lbPanX}px, ${lbPanY}px, 0) scale(${lbZoom})`;

  img.style.cursor = lbZoom > 1 ? 'grab' : 'zoom-in';

  if (lbZoom > 1) {
    img.classList.add('is-zoomed');
  } else {
    img.classList.remove('is-zoomed');
  }

    // Cập nhật % zoom trên nút giữa
  const zoomReset = $('#lbZoomReset');
  if (zoomReset) {
    zoomReset.textContent = `${Math.round(lbZoom * 100)}%`;
  }
}


// Reset zoom
function resetLightboxZoom() {
  lbZoom = 1;
  lbPanX = 0;
  lbPanY = 0;

  const img = $('#lbImg');

  img.style.transform = 'translate3d(0,0,0) scale(1)';
  img.style.cursor = 'zoom-in';
  img.classList.remove('is-zoomed');
  img.classList.remove('is-dragging');

  // Reset số %
  const zoomReset = $('#lbZoomReset');
  if (zoomReset) {
    zoomReset.textContent = '100%';
  }

}


// Zoom + / -
function zoomLightbox(step) {
  const oldZoom = lbZoom;

  lbZoom = Math.max(
    1,
    Math.min(4, lbZoom + step)
  );

  if (lbZoom !== oldZoom) {
    updateLightboxZoom();
  }
}


// Mở lightbox ảnh album
function openLightbox(i) {
  lbIndex = i;

  isQrLightbox = false;

  $('#lbPrev').style.display = '';
  $('#lbNext').style.display = '';

  // Album → hiện danh sách ảnh
  const lbThumbs = $('#lbThumbs');
  if (lbThumbs) {
    lbThumbs.style.display = 'flex';
  }

  resetLightboxZoom();

  switchLightboxImage(cfg.gallery[lbIndex]);

  updateLbThumbs();

  $('#lightbox').hidden = false;
}

function switchLightboxImage(src) {
  const img = $('#lbImg');

  img.classList.add('lb-switching');

  swapDecoded(
    img,
    src,
    () => {
      requestAnimationFrame(() => {
        img.classList.remove('lb-switching');
      });
    }
  );
}


function switchLightboxImage(src) {
  const img = $('#lbImg');

  img.classList.add('lb-switching');

  swapDecoded(
    img,
    src,
    () => {
      requestAnimationFrame(() => {
        img.classList.remove('lb-switching');
      });
    }
  );
}


// Chuyển ảnh trong album
function moveLightbox(step) {
  lbIndex =
    (lbIndex + step + cfg.gallery.length)
    % cfg.gallery.length;

  resetLightboxZoom();

  switchLightboxImage(cfg.gallery[lbIndex]);

  updateLbThumbs();
}


// ===== SETUP LIGHTBOX =====
function setupLightbox() {

  const lightbox = $('#lightbox');
  const img = $('#lbImg');

    // ========================================
  // THUMBNAIL ẢNH TRONG LIGHTBOX
  // ========================================
  const lbThumbs = $('#lbThumbs');

  if (lbThumbs) {
    lbThumbs.innerHTML = '';

    cfg.gallery.forEach((src, i) => {
      const thumb = document.createElement('img');

      // Nếu có ảnh thumbnail riêng thì dùng thumbnail
      thumb.src =
        (cfg.galleryThumbs && cfg.galleryThumbs[i])
        || src;

      thumb.alt = `Ảnh ${i + 1}`;
      thumb.loading = 'lazy';
      thumb.decoding = 'async';

      thumb.addEventListener('click', (e) => {
        e.stopPropagation();

        if (isQrLightbox) return;

        lbIndex = i;
        resetLightboxZoom();

        switchLightboxImage(cfg.gallery[lbIndex]);

        updateLbThumbs();
      });

      lbThumbs.appendChild(thumb);
    });
  }


  // ========================================
  // ẢNH CÔ DÂU / CHÚ RỂ
  // ========================================
  $$('.zoomable-photo').forEach((photo) => {

    photo.addEventListener('click', () => {

      isQrLightbox = true;

      $('#lbPrev').style.display = 'none';
      $('#lbNext').style.display = 'none';

      // Không hiện thumbnail khi xem ảnh cô dâu / chú rể
      const lbThumbs = $('#lbThumbs');
      if (lbThumbs) {
        lbThumbs.style.display = 'none';
      }

      resetLightboxZoom();

      // Chuẩn bị ảnh
      img.classList.remove('lb-show');
      img.classList.add('lb-switching');

      img.src = photo.src;
      img.alt = photo.alt;

      lightbox.hidden = false;

      // Cho trình duyệt render lightbox trước
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          img.classList.remove('lb-switching');
          img.classList.add('lb-show');
        });
      });

    });

  });


  // ========================================
  // CLICK + / - BẰNG CHUỘT
  // ========================================

  // Click ảnh -> zoom
  img.addEventListener('click', (e) => {

    e.stopPropagation();

    // Không zoom lại sau khi vừa pinch / drag / swipe
    if (performance.now() < lbSuppressClickUntil) {
      return;
    }

    if (lbZoom >= 4) {
      resetLightboxZoom();
    } else {
      zoomLightbox(0.5);
    }

  });


  // ========================================
  // CHUỘT LĂN -> ZOOM
  // ========================================
  img.addEventListener(
    'wheel',
    (e) => {

      if (lightbox.hidden) return;

      e.preventDefault();

      if (e.deltaY < 0) {
        zoomLightbox(0.25);
      } else {
        zoomLightbox(-0.25);
      }

    },
    { passive: false }
  );


  // ========================================
  // POINTER DOWN
  // Hỗ trợ:
  // - 1 ngón tay
  // - 2 ngón tay
  // - chuột
  // ========================================
  img.addEventListener('pointerdown', (e) => {

    if (lightbox.hidden) return;

    lbPointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });

    img.setPointerCapture(e.pointerId);


    // Có 2 ngón tay -> bắt đầu pinch zoom
    if (lbPointers.size === 2) {

      lbPinchStartDistance =
        getPinchDistance();

      lbPinchStartZoom =
        lbZoom;

      lbSuppressClickUntil =
        performance.now() + 500;

      img.classList.remove('is-dragging');

      return;
    }


    // Bắt đầu kéo / swipe
    lbPointerStartX = e.clientX;
    lbPointerStartY = e.clientY;

    lbPointerStartPanX = lbPanX;
    lbPointerStartPanY = lbPanY;

  });


  // ========================================
  // POINTER MOVE
  // ========================================
  img.addEventListener('pointermove', (e) => {

    if (!lbPointers.has(e.pointerId)) {
      return;
    }

    lbPointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });


    // ======================================
    // PINCH ZOOM 2 NGÓN
    // ======================================
    if (lbPointers.size === 2) {

      const distance =
        getPinchDistance();

      if (!lbPinchStartDistance) {
        return;
      }

      lbZoom =
        lbPinchStartZoom *
        (distance / lbPinchStartDistance);

      lbZoom =
        Math.max(
          1,
          Math.min(4, lbZoom)
        );

      updateLightboxZoom();

      lbSuppressClickUntil =
        performance.now() + 500;

      return;
    }


    // ======================================
    // 1 NGÓN / CHUỘT
    // ======================================
    const dx =
      e.clientX - lbPointerStartX;

    const dy =
      e.clientY - lbPointerStartY;


    // Nếu đang zoom -> kéo ảnh
    if (lbZoom > 1) {

      lbPanX =
        lbPointerStartPanX + dx;

      lbPanY =
        lbPointerStartPanY + dy;

      img.style.transform =
        `translate3d(${lbPanX}px, ${lbPanY}px, 0) scale(${lbZoom})`;

      img.classList.add('is-dragging');

      if (
        Math.abs(dx) > 5 ||
        Math.abs(dy) > 5
      ) {
        lbSuppressClickUntil =
          performance.now() + 500;
      }

      return;
    }


    // Chưa zoom -> chỉ swipe để đổi ảnh
    if (
      Math.abs(dx) > 10 ||
      Math.abs(dy) > 10
    ) {

      lbSuppressClickUntil =
        performance.now() + 500;

    }

  });


  // ========================================
  // POINTER UP
  // ========================================
  img.addEventListener('pointerup', (e) => {

    if (!lbPointers.has(e.pointerId)) {
      return;
    }

    const dx =
      e.clientX - lbPointerStartX;

    const dy =
      e.clientY - lbPointerStartY;

    const wasSingle =
      lbPointers.size === 1;


    lbPointers.delete(e.pointerId);


    if (lbPointers.size < 2) {
      lbPinchStartDistance = 0;
    }


    img.classList.remove('is-dragging');


    // ======================================
    // SWIPE TRÁI / PHẢI
    // Chỉ khi chưa zoom
    // ======================================
    if (
      wasSingle &&
      lbZoom === 1 &&
      Math.abs(dx) > 50 &&
      Math.abs(dx) > Math.abs(dy)
    ) {

      if (!isQrLightbox) {

        if (dx < 0) {
          moveLightbox(1);
        } else {
          moveLightbox(-1);
        }

      }

      lbSuppressClickUntil =
        performance.now() + 500;
    }

  });


  // ========================================
  // POINTER CANCEL
  // ========================================
  img.addEventListener('pointercancel', (e) => {

    lbPointers.delete(e.pointerId);

    if (lbPointers.size < 2) {
      lbPinchStartDistance = 0;
    }

    img.classList.remove('is-dragging');

  });


  // ========================================
  // ĐÓNG
  // ========================================
  const closeLightbox = () => {

    lightbox.hidden = true;

    resetLightboxZoom();

    $('#lbPrev').style.display = '';
    $('#lbNext').style.display = '';

    lbPointers.clear();

  };


  $('#lbClose').addEventListener(
    'click',
    closeLightbox
  );


  // Click nền đen trong vùng ảnh -> đóng lightbox
  const lbView = $('#lightbox .lb-view');

  lbView.addEventListener('click', (e) => {
      if (e.target === lbView) {
          closeLightbox();
      }
  });


  // ========================================
  // NÚT TRÁI / PHẢI
  // ========================================
  $('#lbPrev').addEventListener(
    'click',
    () => {

      if (!isQrLightbox) {
        moveLightbox(-1);
      }

    }
  );


  $('#lbNext').addEventListener(
    'click',
    () => {

      if (!isQrLightbox) {
        moveLightbox(1);
      }

    }
  );


  // ========================================
  // PHÍM BÀN PHÍM
  // ========================================
  document.addEventListener('keydown', (e) => {

    if (lightbox.hidden) return;


    // ESC
    if (e.key === 'Escape') {
      closeLightbox();
      return;
    }


    if (isQrLightbox) return;


    // Mũi tên trái / phải
    if (e.key === 'ArrowLeft') {
      moveLightbox(-1);
    }

    if (e.key === 'ArrowRight') {
      moveLightbox(1);
    }


    // + / =
    if (e.key === '+' || e.key === '=') {
      zoomLightbox(0.5);
    }


    // -
    if (e.key === '-') {
      zoomLightbox(-0.5);
    }


    // 0 -> reset
    if (e.key === '0') {
      resetLightboxZoom();
    }

  });


  // ========================================
  // NÚT ZOOM NẾU HTML CÓ
  // ========================================
  const zoomIn = $('#lbZoomIn');
  const zoomOut = $('#lbZoomOut');
  const zoomReset = $('#lbZoomReset');


  if (zoomIn) {
    zoomIn.addEventListener(
      'click',
      () => zoomLightbox(0.5)
    );
  }


  if (zoomOut) {
    zoomOut.addEventListener(
      'click',
      () => zoomLightbox(-0.5)
    );
  }


  if (zoomReset) {
    zoomReset.addEventListener(
      'click',
      resetLightboxZoom
    );
  }


  // ========================================
  // Cho phép touch gesture trên ảnh
  // Không cần sửa CSS
  // ========================================
  img.style.touchAction = 'none';
  img.style.userSelect = 'none';
  img.style.webkitUserSelect = 'none';
  img.style.webkitUserDrag = 'none';
}

function setupRsvp() {
  const form = $('#rsvpForm');

  const attendRadios = form.querySelectorAll('input[name="attend"]');
  const guestsSelect = form.guests;

  // Khóa / mở số lượng người tham dự
  const updateGuestsState = () => {
    const notAttend = form.querySelector('input[name="attend"][value="no"]').checked;

    guestsSelect.disabled = notAttend;

    // Nếu không tham dự thì mặc định về 0
    if (notAttend) {
      guestsSelect.value = '1';
    }
  };

  attendRadios.forEach((radio) => {
    radio.addEventListener('change', updateGuestsState);
  });

  // Trạng thái ban đầu
  updateGuestsState();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.guestname.value.trim();
    const attend = form.attend.value;

    // Không tham dự → Number = 0
    const number = attend === 'no' ? '0' : form.guests.value;

    const side = form.side.value;

    if (!name) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const oldText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    try {
      const body = new URLSearchParams({
        action: 'rsvp',
        name: name,
        number: number,
        attend: attend,
        groomFamily: side === 'groom' ? 'Nhà trai' : '',
        brideFamily: side === 'bride' ? 'Nhà gái' : ''
      });

      const response = await fetch(cfg.apiUrl, {
        method: 'POST',
        body: body
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || 'Gửi xác nhận thất bại');
      }

      $('#rsvpThanks').hidden = false;

      form.reset();

      // Sau khi reset, mở lại dropdown
      updateGuestsState();

    } catch (error) {
      console.error('Lỗi gửi RSVP:', error);
      alert('Không thể gửi xác nhận. Vui lòng thử lại nhé ❤️');

    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText;
    }
  });
}

  const WISH_KEY = 'thiepcuoi_wishes';
  const HEART_KEY = 'thiepcuoi_hearts';
  const SEED_WISHES = [
    { author: 'Linh', text: 'Chúc hai bạn trăm năm hòa hợp, hạnh phúc!' },
    { author: 'Việt Anh', text: 'Chúc cho tình yêu của hai bạn mỗi ngày một lớn mạnh!' },
    { author: 'Hoàng', text: 'Mong rằng tình yêu của hai bạn mãi đẹp như ngày hôm nay!' },
    { author: 'Tuấn Anh', text: 'Chúc hai bạn trăm năm hạnh phúc bên nhau!' },
    { author: 'Thu Hà', text: 'Mãi mãi hạnh phúc, đầu bạc răng long nhé!' },
  ];
  // function getWishes() {
  //   const list = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
  //   return list.length ? list : SEED_WISHES;
  // }
  async function getWishes() {
  try {
    const response = await fetch(`${cfg.apiUrl}?action=wishes`);

    if (!response.ok) {
      throw new Error('Không thể lấy danh sách lời chúc');
    }

    const result = await response.json();

    if (!result.ok || !Array.isArray(result.wishes)) {
      throw new Error(result.message || 'Dữ liệu lời chúc không hợp lệ');
    }

    return result.wishes.map(item => ({
      author: item.name,
      text: item.message,
      time: item.time
    }));

  } catch (error) {
    console.error('Lỗi lấy lời chúc:', error);

    // Nếu API lỗi thì vẫn hiện lời chúc mẫu
    return SEED_WISHES;
  }
}

function formatWishTime(time) {
  if (!time) return '';

  const date = new Date(time);

  if (isNaN(date.getTime())) {
    return time;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}


async function renderStream() {
  const list = await getWishes();

  if (!list.length) return;

  const wrap = $('#gbStream');
  if (!wrap) return;

  // Xóa nội dung cũ
  wrap.innerHTML = '';

  // Track chứa 2 bản giống nhau để tạo vòng lặp liên tục
  const track = document.createElement('div');
  track.className = 'gb-track';

  const createList = () => {
    const listEl = document.createElement('div');
    listEl.className = 'gb-list';

    list.forEach((w) => {
      const li = el('gb-bubble', null, 'div');

      // Tên
      li.append(
        el('', (w.author || 'Khách') + ':', 'b')
      );

      // Nội dung
      li.append(
        document.createTextNode(' ' + (w.text || ''))
      );

      // Thời gian
      if (w.time) {
        const timeSpan = el(
          'gb-time',
          formatWishTime(w.time),
          'span'
        );

        li.append(timeSpan);
      }

      listEl.appendChild(li);
    });

    return listEl;
  };

  // Bản 1
  track.appendChild(createList());

  // Bản 2 giống hệt bản 1
  // để khi chạy hết bản 1 có thể nối tiếp bản 2
  track.appendChild(createList());

  wrap.appendChild(track);

  /*
   * Tốc độ cuộn:
   * - ít lời chúc → chạy chậm
   * - nhiều lời chúc → tự động lâu hơn
   */
  // const duration = Math.max(15, list.length * 2.5);

    const duration = 10;

    track.style.setProperty(
      '--gb-duration',
      `${duration}s`
    );


}

  let heartTotal = parseInt(localStorage.getItem(HEART_KEY) || '158', 10);
  function renderHeartCount() { const n = $('#heartCount'); if (n) n.textContent = heartTotal; }
  function shootHearts(n) {
    heartTotal += n; localStorage.setItem(HEART_KEY, String(heartTotal)); renderHeartCount();
    for (let i = 0; i < n; i++) {
      const h = el('float-heart', '♥', 'span');
      h.style.left = 24 + Math.floor((i / Math.max(n - 1, 1)) * 50) + 'vw';
      h.style.fontSize = 16 + (i % 3) * 10 + 'px';
      h.style.animationDelay = (i % 4) * 0.12 + 's';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 2600);
    }
  }

  function setupGuestbook() {
  renderHeartCount();
  renderStream();

    // ===== ẨN / HIỆN LỜI CHÚC =====
  const gbStream = $('#gbStream');
  const gbToggle = $('#gbToggle');

  if (gbStream && gbToggle) {
    gbToggle.addEventListener('click', () => {
      const hidden = gbStream.classList.toggle('is-hidden');

      gbToggle.classList.toggle('is-hidden', hidden);

      gbToggle.setAttribute('aria-pressed', String(hidden));

      if (hidden) {
        gbToggle.setAttribute('aria-label', 'Hiện lời chúc');
        gbToggle.setAttribute('title', 'Hiện lời chúc');
      } else {
        gbToggle.setAttribute('aria-label', 'Ẩn lời chúc');
        gbToggle.setAttribute('title', 'Ẩn lời chúc');
      }
    });
  }

  // setInterval(renderStream, 3800);

  // ===== POPUP LỜI CHÚC =====
  const wishModal = $('#wishModal');
  const openWishModal = $('#openWishModal');
  const wishModalClose = $('#wishModalClose');
  const form = $('#wishForm');

  // Mở popup
  openWishModal.addEventListener('click', () => {
    wishModal.hidden = false;

    requestAnimationFrame(() => {
      wishModal.classList.add('is-open');
    });
  });

  // Đóng popup
  const closeWishModal = () => {
    wishModal.classList.remove('is-open');

    setTimeout(() => {
      wishModal.hidden = true;
    }, 280);
  };

  wishModalClose.addEventListener('click', closeWishModal);

  // Click ra ngoài popup để đóng
  wishModal.addEventListener('click', (e) => {
    if (e.target === wishModal) {
      closeWishModal();
    }
  });

  // Nhấn ESC để đóng
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !wishModal.hidden) {
      closeWishModal();
    }
  });

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const author = form.author.value.trim();
  const text = form.text.value.trim();

  if (!author || !text) return;

  // Lấy API URL từ config.js
  const apiUrl = cfg.apiUrl;

  // Hiện trạng thái đang gửi
  const submitBtn = form.querySelector('.wish-submit');
  const oldText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang gửi...';

  try {
    const body = new URLSearchParams({
      action: 'wishes',
      name: author,
      message: text
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: body
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.message || 'Gửi lời chúc thất bại');
    }

// Reset form
form.reset();

// Đóng popup
closeWishModal();

// Gọi lại API GET và hiển thị ngay lời chúc mới
// Giữ lời chúc mới ở đầu 4 giây để người dùng kịp nhìn
await renderStream();

// Hiệu ứng tim
shootHearts(4);

  } catch (error) {
    console.error('Lỗi gửi lời chúc:', error);
    alert('Không thể gửi lời chúc. Vui lòng thử lại nhé ❤️');

  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = oldText;
  }
});



  // ===== BẮN TIM =====
  $('#shootHeart').addEventListener('click', () => {
    shootHearts(6);
  });

  // ===== VỀ ĐẦU TRANG =====
  const fab = $('#fabAvatar');

  if (fab) {
    fab.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

function setupAOS() {
  const skip = [
    'cover-photo',
    'cover-scrim',
    'cover-inborder',
    'cd-photo',
    'cd-scrim',
    'footer-photo',
    'footer-scrim'
  ];

  const dirs = [
    'aos-up',
    'aos-left',
    'aos-right',
    'aos-up',
    'aos-zoom'
  ];

  const isSkip = (c) => skip.some((s) => c.classList.contains(s));

  const io = new IntersectionObserver((es) => {
    es.forEach((en) => {
      if (!en.isIntersecting) return;

      const sec = en.target;

      Array.from(sec.children)
        .filter((c) => !isSkip(c) && c.classList.contains('aos'))
        .forEach((c, i) => {
          setTimeout(() => {
            c.style.willChange = 'opacity, transform';
            c.classList.add('aos-in');

            const done = () => {
              c.style.willChange = 'auto';
              c.removeEventListener('transitionend', done);
            };

            c.addEventListener('transitionend', done);
          }, i * 320);
        });

      io.unobserve(sec);
    });
  }, {
    threshold: 0.20
  });

  $$('.card .sec').forEach((sec) => {
    Array.from(sec.children).forEach((c, i) => {
      if (!isSkip(c)) {
        c.classList.add(
          'aos',
          c.getAttribute('data-aos') || dirs[i % dirs.length]
        );
      }
    });

    io.observe(sec);
  });
}

  function fillHearts(wrap, n) {
    for (let i = 0; i < n; i++) {
      const p = el('petal', '♥', 'span');
      p.style.left = Math.floor((i / n) * 100) + 'vw';
      p.style.fontSize = 14 + (i % 4) * 7 + 'px';
      p.style.animationDuration = 6 + (i % 5) * 3 + 's';
      p.style.animationDelay = (i % 6) * 1.2 + 's';
      wrap.appendChild(p);
    }
  }
  function setupPetals() {
    const n = window.innerWidth < 480 ? 12 : 20;
    fillHearts($('#petals'), n);
    fillHearts($('#introPetals'), Math.round(n * 0.7));
  }

function init() {
    bindText();
    bindPhotos();
    introDate();
    loadGuestName();

    renderParty('partyGroom', cfg.events.groom);
    renderParty('partyBride', cfg.events.bride);
    renderCere('cereVuquy', cfg.ceremonies.vuquy);
    renderCere('cereThanhhon', cfg.ceremonies.thanhhon);
    renderCoverInfo();
    startCountdown();
    renderCalendar();

    setupMusic();
    setupIntro();
    setupGift();
    setupAlbum();
    setupLightbox();
    setupRsvp();
    setupGuestbook();
    setupPetals();

    document.addEventListener('visibilitychange', () =>
      document.body.classList.toggle('tab-hidden', document.hidden)
    );
}

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

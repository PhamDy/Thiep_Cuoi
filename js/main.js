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
    const d = weddingDate;
    $('#introDate').textContent = `${String(d.getDate()).padStart(2, '0')} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${d.getFullYear()}`;
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
    let diff = Math.floor((weddingDate - new Date()) / 1000);
    if (diff <= 0) { $('#countdown').hidden = true; $('#countdownDone').hidden = false; return false; }
    const d = Math.floor(diff / 86400); diff -= d * 86400;
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60); const s = diff - m * 60;
    $('#cdDays').textContent = d; $('#cdHours').textContent = String(h).padStart(2, '0');
    $('#cdMins').textContent = String(m).padStart(2, '0'); $('#cdSecs').textContent = String(s).padStart(2, '0');
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
    $('#calMonth').textContent = `Tháng ${monthNames[m]}, ${y}`;
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
      setTimeout(() => intro.classList.add('reveal-curtain'), 550);
      setTimeout(() => {
        intro.classList.add('gone');
        document.body.classList.remove('pre-open');
        const fallingLayer = $('#petals');
        fallingLayer.classList.add('hearts');
        $$('.petal', fallingLayer).forEach((petal) => { petal.textContent = '♥'; });
        startAutoScroll();
      }, 1300);
      setTimeout(() => { intro.style.display = 'none'; }, 2100);
    });
  }

  function startAutoScroll() {
    const secs = cfg.autoScrollSeconds || 60;
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
      const speed = target / (secs * 1000);             // px mỗi ms để cuộn hết trang trong ~secs giây
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
      const enlarge = () => { $('#lbImg').src = qr.src; $('#lightbox').hidden = false; };
      qr.addEventListener('click', enlarge);
      qr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enlarge(); } });
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
      fadeTimer = setTimeout(() => swapDecoded(img, cfg.gallery[carIndex], () => img.classList.remove('fading')), 300);
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

  let lbIndex = 0;
  function openLightbox(i) { lbIndex = i; swapDecoded($('#lbImg'), cfg.gallery[i]); $('#lightbox').hidden = false; }
  function moveLightbox(step) { lbIndex = (lbIndex + step + cfg.gallery.length) % cfg.gallery.length; swapDecoded($('#lbImg'), cfg.gallery[lbIndex]); }
  function setupLightbox() {
    $('#lbClose').addEventListener('click', () => ($('#lightbox').hidden = true));
    $('#lbPrev').addEventListener('click', () => moveLightbox(-1));
    $('#lbNext').addEventListener('click', () => moveLightbox(1));
    $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') $('#lightbox').hidden = true; });
    document.addEventListener('keydown', (e) => {
      if ($('#lightbox').hidden) return;
      if (e.key === 'Escape') $('#lightbox').hidden = true;
      if (e.key === 'ArrowLeft') moveLightbox(-1);
      if (e.key === 'ArrowRight') moveLightbox(1);
    });
  }

  function setupRsvp() {
    const form = $('#rsvpForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = { name: form.guestname.value.trim(), attend: form.attend.value, guests: form.guests.value, side: form.side.value, at: new Date().toISOString() };
      if (!data.name) return;
      const list = JSON.parse(localStorage.getItem('thiepcuoi_rsvp') || '[]');
      list.push(data); localStorage.setItem('thiepcuoi_rsvp', JSON.stringify(list));
      // REPLACE: cắm API thật ở đây, ví dụ:
      //   fetch('https://your-api/rsvp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
      $('#rsvpThanks').hidden = false; form.reset();
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
  function getWishes() {
    const list = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
    return list.length ? list : SEED_WISHES;
  }
  let streamPos = 0;
  function renderStream() {
    const list = getWishes(); if (!list.length) return;
    const wrap = $('#gbStream'); wrap.innerHTML = '';
    const show = Math.min(4, list.length);
    for (let i = 0; i < show; i++) {
      const w = list[(streamPos + i) % list.length];
      const li = el('gb-bubble', null, 'div');
      li.append(el('', (w.author || 'Khách') + ':', 'b'));
      li.append(document.createTextNode(' ' + w.text));
      wrap.appendChild(li);
    }
    streamPos = (streamPos + 1) % list.length;
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
    renderHeartCount(); renderStream();
    setInterval(renderStream, 3800);
    const form = $('#wishForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = form.text.value.trim(); if (!text) return;
      const list = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
      list.push({ author: 'Bạn', text });
      localStorage.setItem(WISH_KEY, JSON.stringify(list));
      // REPLACE: cắm API thật ở đây nếu muốn lưu lời chúc lên server
      form.reset(); streamPos = Math.max(0, list.length - 4); renderStream(); shootHearts(4);
    });
    $('#shootHeart').addEventListener('click', () => shootHearts(6));
    const fab = $('#fabAvatar');
    if (fab) fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function setupAOS() {
    const skip = ['cover-photo', 'cover-scrim', 'cover-inborder', 'cd-photo', 'cd-scrim', 'footer-photo', 'footer-scrim'];
    const dirs = ['aos-up', 'aos-left', 'aos-right', 'aos-up', 'aos-zoom'];
    const isSkip = (c) => skip.some((s) => c.classList.contains(s));
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        Array.from(en.target.children).filter((c) => !isSkip(c) && c.classList.contains('aos'))
          .forEach((c, i) => setTimeout(() => {
            c.style.willChange = 'opacity, transform';           // chỉ bật GPU layer ngay trước khi chạy
            c.classList.add('aos-in');
            const done = () => { c.style.willChange = 'auto'; c.removeEventListener('transitionend', done); };
            c.addEventListener('transitionend', done);           // ...rồi tắt để không giữ layer vĩnh viễn
          }, i * 140));
        io.unobserve(en.target);
      });
    }, { threshold: 0.14 });
    $$('.card .sec').forEach((sec) => {
      Array.from(sec.children).forEach((c, i) => { if (!isSkip(c)) c.classList.add('aos', c.getAttribute('data-aos') || dirs[i % dirs.length]); });
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
    bindText(); bindPhotos(); introDate();
    renderParty('partyGroom', cfg.events.groom);
    renderParty('partyBride', cfg.events.bride);
    renderCere('cereVuquy', cfg.ceremonies.vuquy);
    renderCere('cereThanhhon', cfg.ceremonies.thanhhon);
    renderCoverInfo();
    startCountdown(); renderCalendar();
    setupMusic(); setupIntro();
    setupGift(); setupAlbum(); setupLightbox(); setupRsvp(); setupGuestbook();
    setupAOS(); setupPetals();
    // Tạm dừng hiệu ứng cánh hoa khi tab bị ẩn → đỡ tốn CPU/pin
    document.addEventListener('visibilitychange', () => document.body.classList.toggle('tab-hidden', document.hidden));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

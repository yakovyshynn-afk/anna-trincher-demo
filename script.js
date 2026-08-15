/* =====================================================================
   АННА ТРІНЧЕР — офіційний сайт (демо)
   Vanilla JS, без залежностей. Поважає prefers-reduced-motion і Save-Data.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  /* ===== БЛОК: ІНТРО ===== */
  var intro = document.getElementById("intro");
  var introSkip = document.getElementById("introSkip");

  function finishIntro() {
    if (!intro) return;
    intro.classList.add("is-leaving");
    document.body.classList.remove("intro-lock");
    if (window.__stopIntroParticles) window.__stopIntroParticles();
    window.setTimeout(function () {
      intro.setAttribute("hidden", "");
      intro.setAttribute("aria-hidden", "true");
      startHero();
    }, reduceMotion ? 0 : 650);
  }

  function startIntro() {
    /* Власник: інтро має програватись ЩОРАЗУ при завантаженні сторінки,
       не лише раз за сесію — sessionStorage-логіка "introSeen" повністю
       прибрана. Єдині легітимні причини пропустити повне інтро лишаються
       доступність (prefers-reduced-motion) і слабке з'єднання
       (navigator.connection.saveData), а не факт повторного візиту. */
    if (!intro) {
      startHero();
      return;
    }
    if (reduceMotion || saveData) {
      intro.setAttribute("hidden", "");
      intro.setAttribute("aria-hidden", "true");
      startHero();
      return;
    }
    document.body.classList.add("intro-lock");
    /* Власник: інтро забирає забагато часу. Скорочено ~50% на обох
       брейкпоінтах (1300мс→650мс мобільний, 4400мс→2200мс десктоп) —
       wordmark-wipe (480/900мс, styles.css) і надалі встигає дограти
       з запасом до кінця вікна, орбітальне кільце-прогрес просто рухається
       швидше (читає той самий --intro-duration нижче), skip-кнопка
       лишається без змін. */
    var introDuration = window.innerWidth < 640 ? 650 : 2200;
    /* Орбітальне кільце-прогрес (.intro__orbit-progress) читає цю
       CSS-змінну для своєї transition-duration (stroke-dashoffset) —
       воно заповнюється синхронно з реальним таймером інтро, а не за
       окремою декоративною анімацією. */
    intro.style.setProperty("--intro-duration", introDuration + "ms");
    intro.classList.add("is-playing");
    var timer = window.setTimeout(finishIntro, introDuration);

    if (introSkip) {
      introSkip.addEventListener("click", function () {
        window.clearTimeout(timer);
        finishIntro();
      });
    }
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape" && !intro.hasAttribute("hidden")) {
        window.clearTimeout(timer);
        finishIntro();
        document.removeEventListener("keydown", onKey);
      }
    });
  }

  function startHero() {
    var hero = document.getElementById("hero");
    if (hero) hero.classList.add("is-in");
  }

  /* ===== БЛОК: ІНТРО — ORBITAL PARTICLES (canvas) =====
     Шостий раунд, доповнення власника: "максимально багато частинок",
     які відображають творчість Анни (зірки/іскри в палітрі сайту) —
     перше враження має бути максимально "вау" для фанатів з рілсу.
     Той самий рецепт, що й .hero__stars (vanilla Canvas API, без
     бібліотек), але густіше й у трьох фірмових кольорах (chrome-silver/
     signal-red/ember), бо інтро коротке (кілька секунд) і не мусить
     тримати такий бюджет продуктивності, як постійний фон hero. Статичний
     кадр (без rAF-циклу) при prefers-reduced-motion/Save-Data — інтро й
     так одразу пропускається для цих випадків (startIntro вище), але
     функція лишається безпечною сама по собі. Зупиняється явно у
     finishIntro() (window.__stopIntroParticles), щоб rAF-цикл не тривав
     вічно у фоні після того, як інтро вже прибрано з DOM. */
  (function initIntroParticles() {
    var canvas = document.getElementById("introParticles");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var particles = [];
    var animate = !reduceMotion && !saveData;
    var active = true;

    /* Палітра сайту: chrome-300, signal-red, ember-500 — ваги визначають
       приблизну частку кожного кольору серед усіх частинок. */
    var palette = [
      { rgb: "200, 203, 208", weight: 0.55 },
      { rgb: "250, 59, 53", weight: 0.3 },
      { rgb: "255, 116, 38", weight: 0.15 }
    ];

    function pickColor() {
      var r = Math.random();
      var acc = 0;
      for (var i = 0; i < palette.length; i++) {
        acc += palette[i].weight;
        if (r <= acc) return palette[i].rgb;
      }
      return palette[0].rgb;
    }

    function buildParticles() {
      var area = width * height;
      var count = Math.max(90, Math.min(320, Math.round(area / 2600)));
      particles = [];
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var drift = 0.15 + Math.random() * 0.5;
        particles.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.5 + Math.random() * 2.1,
          baseAlpha: 0.22 + Math.random() * 0.68,
          rgb: pickColor(),
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.5,
          driftX: Math.cos(angle) * drift,
          driftY: Math.sin(angle) * drift
        });
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
      draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(t * 0.0013 * p.speed + p.phase));
        if (animate) {
          p.x += p.driftX * 0.0022;
          p.y += p.driftY * 0.0022;
          if (p.x < -0.05) p.x = 1.05;
          if (p.x > 1.05) p.x = -0.05;
          if (p.y < -0.05) p.y = 1.05;
          if (p.y > 1.05) p.y = -0.05;
        }
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.rgb + ", " + alpha.toFixed(3) + ")";
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(t) {
      if (!active) return;
      draw(t);
      window.requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);
    if (animate) {
      window.requestAnimationFrame(loop);
    }

    window.__stopIntroParticles = function () {
      active = false;
    };
  })();

  startIntro();

  /* ===== БЛОК: HERO STARFIELD (canvas) =====
     За прямим запитом власника: перший екран виглядав "порожнім" у чорних
     зонах навколо фото/тексту. Процедурний розсип зірок (розмір/яскравість
     випадкові, легке мерехтіння) поверх уже наявного .hero__field
     (небула-градієнти). Vanilla Canvas API, без бібліотек — портовано з
     ідеї "starfield background" (21st.dev). Статичний кадр (без rAF-циклу)
     при prefers-reduced-motion або Save-Data, щоб не гріти слабкі/лімітовані
     пристрої. */
  (function initStarfield() {
    var canvas = document.getElementById("heroStars");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var animate = !reduceMotion && !saveData;

    function buildStars() {
      var area = width * height;
      var count = Math.max(60, Math.min(220, Math.round(area / 6500)));
      stars = [];
      for (var i = 0; i < count; i++) {
        var twinkle = Math.random() < 0.35;
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.5 + Math.random() * 1.4,
          baseAlpha: 0.18 + Math.random() * 0.62,
          twinkle: twinkle,
          speed: 0.6 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          warm: Math.random() < 0.12
        });
      }
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = s.baseAlpha;
        if (animate && s.twinkle) {
          alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase));
        }
        ctx.beginPath();
        ctx.fillStyle = s.warm
          ? "rgba(255, 116, 38, " + alpha.toFixed(3) + ")"
          : "rgba(200, 203, 208, " + alpha.toFixed(3) + ")";
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(t) {
      draw(t);
      window.requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);
    if (animate) {
      window.requestAnimationFrame(loop);
    }
  })();

  /* ===== БЛОК: ХЕДЕР — сховати/показати при скролі ===== */
  var header = document.getElementById("siteHeader");
  var lastScroll = window.scrollY;

  function onScroll() {
    var current = window.scrollY;
    if (!header) return;
    header.classList.toggle("is-scrolled", current > 12);
    if (Math.abs(current - lastScroll) < 8) return;
    if (current > lastScroll && current > 120) {
      header.classList.add("is-hidden");
    } else {
      header.classList.remove("is-hidden");
    }
    lastScroll = current;
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  /* ===== БЛОК: BACK TO TOP =====
     Floating-кнопка "нагору" (за прямою вимогою власника). Видимість —
     IntersectionObserver на #hero: щойно hero повністю виходить з
     viewport (не видно жодного пікселя), кнопка отримує .is-visible;
     щойно hero знову хоч частково видно (скрол назад нагору), клас
     знімається. Дешевше й надійніше за scroll-listener з обчисленням
     offsetHeight на кожен кадр. Fallback на простий scroll-listener,
     якщо IntersectionObserver недоступний. */
  var backToTop = document.getElementById("backToTop");
  var heroSection = document.getElementById("hero");
  if (backToTop && heroSection) {
    if ("IntersectionObserver" in window) {
      var backToTopObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            backToTop.classList.toggle("is-visible", !entry.isIntersecting);
          });
        },
        { threshold: 0 }
      );
      backToTopObserver.observe(heroSection);
    } else {
      window.addEventListener(
        "scroll",
        function () {
          backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight);
        },
        { passive: true }
      );
    }

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ===== БЛОК: МОБІЛЬНЕ МЕНЮ ===== */
  var menuToggle = document.getElementById("menuToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  var menuClose = document.getElementById("menuClose");

  function openMenu() {
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var firstLink = mobileMenu.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  function closeMenu(skipFocusReturn) {
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (!skipFocusReturn) menuToggle.focus();
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", openMenu);
    if (menuClose) menuClose.addEventListener("click", function () { closeMenu(); });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { closeMenu(); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMenu();
    });

    /* Баг-фікс QA: якщо мобільне меню лишається відкритим (is-open, з
       document.body.style.overflow = "hidden"), а viewport переходить у
       десктопний брейкпоінт (>=1024px, де .site-header__burger отримує
       display:none і немає видимої кнопки, що відкрила меню), сторінка
       лишається заблокованою для скролу без очевидного способу її
       закрити з клавіатури/миші (тільки Escape або сама кнопка "Закрити"
       всередині меню). Автоматично закриваємо меню при перетині
       брейкпоінта, щоб скрол ніколи не лишався заблокованим на десктопі. */
    var desktopBreakpoint = window.matchMedia("(min-width: 1024px)");
    function handleBreakpointChange(e) {
      if (e.matches && mobileMenu.classList.contains("is-open")) {
        closeMenu(true);
      }
    }
    if (desktopBreakpoint.addEventListener) {
      desktopBreakpoint.addEventListener("change", handleBreakpointChange);
    } else if (desktopBreakpoint.addListener) {
      desktopBreakpoint.addListener(handleBreakpointChange);
    }
  }

  /* ===== БЛОК: PLATFORM SHEET =====
     Одна модалка на весь сайт, але вміст рендериться під конкретний трек
     (data-track): Spotify + Apple Music + YouTube Music. Spotify — усі 10
     track ID підтверджені напряму координатором (gaps.md розділ 4, оновлено
     за фідбеком власника). Apple Music лишається на рівні артиста — брифом
     прямо заборонено вгадувати per-track deep link (§2.2). YouTube Music
     використовує ті самі YouTube video ID, що вже звірені вручну на
     youtube.com для VideoModal (gaps.md розділ 3) — публічні відео
     офіційного каналу автоматично індексуються на music.youtube.com під
     тим самим ID, окремо на music.youtube.com цієї сесії не перевірялось. */
  /* Власні монолінійні SVG-гліфи (той самий стиль, що social-rail —
     viewBox 24, stroke:currentColor), не офіційні лого платформ.
     Аудит-раунд полірування: раніше рядки StreamingSheet були чистим
     текстом без жодного візуального ідентифікатора платформи. */
  var PLATFORM_ICONS = {
    spotify:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">' +
      '<path d="M5 15c4-2 10-2 14 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M6.3 11.2c3.8-1.7 7.6-1.7 11.4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M7.8 7.6c2.7-1 5.7-1 8.4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    apple:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">' +
      '<circle cx="8.3" cy="16.2" r="2.1" fill="currentColor"/>' +
      '<circle cx="15.3" cy="14.6" r="2.1" fill="currentColor"/>' +
      '<path d="M10.4 16.2V6.9L17.4 5.1v9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    youtube:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">' +
      '<rect x="2.4" y="6" width="19.2" height="12" rx="4" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M10.4 9.3 15.5 12 10.4 14.7Z" fill="currentColor"/></svg>'
  };

  var APPLE_MUSIC_ARTIST_URL = "https://music.apple.com/ua/artist/анна-трінчер/1436704585";
  var TRACK_PLATFORMS = {
    "Маргарита": { youtubeId: "gAXU1Bvxngg", spotifyTrack: "4TlI6xqjE9pogjuJ2JlbZX" },
    "Твоя мама": { youtubeId: "ENBOo1323vo", spotifyTrack: "58XH7RaJKOPCvqDIHP3N9X" },
    "Колоски": { youtubeId: "yKmE2MHGjG8", spotifyTrack: "17QW3dioB9CIUh0oCnyXKz" },
    "Бар за баром": { youtubeId: "eazVVV0-YWk", spotifyTrack: "2EJZw3QSNQS1LSIQMTd2TQ" },
    "Треш": { youtubeId: "a8zgbf9cLEY", spotifyTrack: "3oFXd7mzOSYfcXsC4RAnvt" },
    "Півонії": { youtubeId: "kslh7pTCrQo", spotifyTrack: "6mkdNIS7OOMndjXVzgyA13" },
    "Зірочка палай": { youtubeId: "CgYRiz9MXUk", spotifyTrack: "4J7GqAqdOfYrcOKJIp4m8U" },
    "No cocaina": { youtubeId: "o6QtsXivJ9w", spotifyTrack: "6pJ0vytMPQ4qtEl6mJLegG" },
    "Вином текла": { youtubeId: "D1l6Wp2pP_8", spotifyTrack: "4fQoTnKle8pAHgRaKq6SUI" },
    "Очі": { youtubeId: "Dksj1wxC7rg", spotifyTrack: "6VkKjppsNMRmN0v68Xehwi" }
  };

  var sheetBackdrop = document.getElementById("platformSheet");
  var sheetOpeners = document.querySelectorAll("[data-open-sheet]");
  var sheetClose = document.getElementById("sheetClose");
  var sheetTitleEl = document.getElementById("sheetTitle");
  var sheetListEl = document.getElementById("sheetList");
  var sheetNoteEl = document.getElementById("sheetNote");
  var lastFocused = null;

  function openSheet(trackTitle) {
    if (!sheetBackdrop) return;
    var title = trackTitle || "Маргарита";
    if (sheetTitleEl) {
      sheetTitleEl.textContent = "Слухати «" + title + "»";
    }
    var info = TRACK_PLATFORMS[title] || {};
    var spotifyUrl = info.spotifyTrack ? "https://open.spotify.com/track/" + info.spotifyTrack : null;
    var youtubeMusicUrl = info.youtubeId ? "https://music.youtube.com/watch?v=" + info.youtubeId : "https://music.youtube.com/channel/annatrincher";
    if (sheetListEl) {
      var links = [];
      function platformRow(url, icon, label) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="sheet__list-left"><span class="sheet__list-icon">' + icon + '</span><span>' + label + '</span></span>' +
          '<small>Відкрити</small></a>';
      }
      if (spotifyUrl) {
        links.push(platformRow(spotifyUrl, PLATFORM_ICONS.spotify, "Spotify"));
      }
      links.push(platformRow(APPLE_MUSIC_ARTIST_URL, PLATFORM_ICONS.apple, "Apple Music"));
      links.push(platformRow(youtubeMusicUrl, PLATFORM_ICONS.youtube, "YouTube Music"));
      sheetListEl.innerHTML = links.join("");
    }
    if (sheetNoteEl) {
      sheetNoteEl.textContent = "Apple Music — сторінка артистки (per-track посилання поки недоступне).";
    }
    lastFocused = document.activeElement;
    sheetBackdrop.classList.add("is-open");
    sheetBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (sheetClose) sheetClose.focus();
  }

  function closeSheet() {
    if (!sheetBackdrop) return;
    sheetBackdrop.classList.remove("is-open");
    sheetBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  sheetOpeners.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openSheet(btn.getAttribute("data-track"));
    });
  });

  if (sheetClose) sheetClose.addEventListener("click", closeSheet);
  if (sheetBackdrop) {
    sheetBackdrop.addEventListener("click", function (e) {
      if (e.target === sheetBackdrop) closeSheet();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheetBackdrop.classList.contains("is-open")) closeSheet();
    });
  }

  /* ===== БЛОК: ГАЛЕРЕЯ — модалка з клавіатурною навігацією =====
     Підпис і лічильник — під фото (.gallery-modal__meta), не оверлей
     поверх зображення. Відкриття — легкий scale+fade (CSS,
     .is-open), своп-навігація на тач-екранах (touchstart/touchend). */
  var galleryTiles = Array.prototype.slice.call(document.querySelectorAll(".gallery__tile"));
  var galleryModal = document.getElementById("galleryModal");
  var galleryFrame = document.getElementById("galleryModalFrame");
  var galleryCaption = document.getElementById("galleryModalCaption");
  var galleryCount = document.getElementById("galleryModalCount");
  var galleryClose = document.getElementById("galleryModalClose");
  var galleryPrev = document.getElementById("galleryModalPrev");
  var galleryNext = document.getElementById("galleryModalNext");
  var galleryIndex = 0;
  var galleryLastFocused = null;

  function renderGallerySlide(index) {
    if (!galleryFrame) return;
    var tile = galleryTiles[index];
    var imageUrl = tile.getAttribute("data-image");
    var caption = tile.getAttribute("data-caption");
    galleryFrame.innerHTML = "";
    if (imageUrl) {
      var img = document.createElement("img");
      img.src = imageUrl;
      img.alt = caption || "";
      galleryFrame.appendChild(img);
    }
    if (galleryCaption) galleryCaption.textContent = caption || "";
    if (galleryCount) galleryCount.textContent = (index + 1) + " / " + galleryTiles.length;
  }

  function openGallery(index) {
    if (!galleryModal || !galleryTiles.length) return;
    galleryLastFocused = document.activeElement;
    galleryIndex = index;
    renderGallerySlide(galleryIndex);
    galleryModal.classList.add("is-open");
    galleryModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (galleryClose) galleryClose.focus();
  }

  function closeGallery() {
    if (!galleryModal) return;
    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (galleryLastFocused) galleryLastFocused.focus();
  }

  function stepGallery(delta) {
    galleryIndex = (galleryIndex + delta + galleryTiles.length) % galleryTiles.length;
    renderGallerySlide(galleryIndex);
  }

  galleryTiles.forEach(function (tile, i) {
    tile.addEventListener("click", function () {
      openGallery(i);
    });
  });

  if (galleryClose) galleryClose.addEventListener("click", closeGallery);
  if (galleryPrev) galleryPrev.addEventListener("click", function () { stepGallery(-1); });
  if (galleryNext) galleryNext.addEventListener("click", function () { stepGallery(1); });

  if (galleryModal) {
    document.addEventListener("keydown", function (e) {
      if (!galleryModal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowRight") stepGallery(1);
      if (e.key === "ArrowLeft") stepGallery(-1);
    });

    /* Свайп для мобільних — наступне/попереднє фото, той самий поріг
       (40px), що типовий для карусельних жестів, без сторонніх бібліотек. */
    var galleryTouchStartX = null;
    galleryModal.addEventListener("touchstart", function (e) {
      galleryTouchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    galleryModal.addEventListener("touchend", function (e) {
      if (galleryTouchStartX === null) return;
      var dx = e.changedTouches[0].clientX - galleryTouchStartX;
      if (Math.abs(dx) > 40) stepGallery(dx < 0 ? 1 : -1);
      galleryTouchStartX = null;
    }, { passive: true });
  }

  /* ===== БЛОК: VIDEO MODAL =====
     youtube-nocookie iframe створюється лише після кліку, video ID звірені вручну
     (gaps.md розділ 4). Fallback-лінк на YouTube показується, якщо iframe не завантажиться. */
  var videoModal = document.getElementById("videoModal");
  var videoModalFrame = document.getElementById("videoModalFrame");
  var videoModalClose = document.getElementById("videoModalClose");
  var videoModalFallback = document.getElementById("videoModalFallback");
  var videoOpeners = document.querySelectorAll("[data-open-video]");
  var videoLastFocused = null;

  function openVideoModal(videoId, title) {
    if (!videoModal || !videoModalFrame || !videoId) return;
    videoLastFocused = document.activeElement;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0";
    iframe.title = "Кліп «" + (title || "") + "» — Анна Трінчер";
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("frameborder", "0");
    videoModalFrame.innerHTML = "";
    videoModalFrame.appendChild(iframe);
    if (videoModalFallback) {
      videoModalFallback.href = "https://www.youtube.com/watch?v=" + videoId;
    }
    videoModal.classList.add("is-open");
    videoModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (videoModalClose) videoModalClose.focus();
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove("is-open");
    videoModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (videoModalFrame) videoModalFrame.innerHTML = "";
    if (videoLastFocused) videoLastFocused.focus();
  }

  videoOpeners.forEach(function (btn) {
    btn.addEventListener("click", function () {
      openVideoModal(btn.getAttribute("data-video-id"), btn.getAttribute("data-video-title"));
    });
  });

  if (videoModalClose) videoModalClose.addEventListener("click", closeVideoModal);
  if (videoModal) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && videoModal.classList.contains("is-open")) closeVideoModal();
    });
  }

  /* ===== БЛОК: TOAST (копіювання посилання) ===== */
  var toast = document.getElementById("toast");
  var toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  document.querySelectorAll("[data-copy-link]").forEach(function (btn) {
    var copiedTimer;
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-copy-link");
      if (navigator.clipboard && url) {
        navigator.clipboard
          .writeText(url)
          .then(function () {
            showToast("Посилання скопійовано.");
            /* Іконка ланцюжка морфиться в "check" на ту саму тривалість,
               що й toast (2.4с) — styles.css .is-copied. */
            btn.classList.add("is-copied");
            window.clearTimeout(copiedTimer);
            copiedTimer = window.setTimeout(function () {
              btn.classList.remove("is-copied");
            }, 2400);
          })
          .catch(function () {
            showToast("Не вдалося скопіювати посилання.");
          });
      }
    });
  });

  /* ===== БЛОК: REVEAL ON SCROLL ===== */
  var revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    revealItems.forEach(function (item) {
      io.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-in");
    });
  }

  /* ===== БЛОК: NEXT SHOW — з'являється навіть без intro-затримки ===== */
  var nextShowSection = document.getElementById("next-show");
  if (nextShowSection && "IntersectionObserver" in window) {
    var nsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            nsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    nsObserver.observe(nextShowSection);
  } else if (nextShowSection) {
    nextShowSection.classList.add("is-in");
  }

  /* ===== БЛОК: TOUR DATES — автоматично приховати минулі концерти =====
     Чиста client-side логіка, без бекенду/CMS: при кожному завантаженні
     сторінки порівнює `data-date` (ISO, YYYY-MM-DD) кожної дати туру з
     РЕАЛЬНОЮ поточною датою пристрою відвідувача (`new Date()`) — не
     захардкоджена дата, сайт "живе" сам собою з часом. Порівняння —
     по календарній даті в локальному часовому поясі відвідувача
     (навмисне спрощення: концерти в різних містах/країнах (Лондон),
     складна timezone-логіка не потрібна для цього масштабу). */
  (function initTourDates() {
    var todayISO = (function () {
      var d = new Date();
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + day;
    })();
    var tourList = document.getElementById("tourList");
    var tourListEmpty = document.getElementById("tourListEmpty");
    var nextShowHero = document.getElementById("nextShowHero");

    if (tourList) {
      var items = Array.prototype.slice.call(tourList.querySelectorAll("li[data-date]"));
      var upcoming = [];
      items.forEach(function (li) {
        var date = li.getAttribute("data-date");
        if (date < todayISO) {
          li.setAttribute("hidden", "");
        } else {
          upcoming.push({ el: li, date: date });
        }
      });
      upcoming.sort(function (a, b) {
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      });

      /* Порожній стан: усі дати зі списку минули. "Переглянути всі 12 дат"
         li не має data-date, тому не потрапляє в items/upcoming — не
         рахуємо його як подію, залишаємо як є (посилання на Karabas
         лишається коректним незалежно від того, скільки дат вже минуло). */
      if (tourListEmpty) {
        tourListEmpty.hidden = upcoming.length > 0;
      }

      /* Featured NextShow (Палац спорту) вже минув — підміняємо featured-
         блок на найближчу дату, що лишилась у списку. Ціна/hint —
         специфічні для Палацу спорту факти, тому НЕ переносяться на іншу
         залу (немає підтверджених даних) — замінюються на нейтральний,
         невигаданий текст. Дата/місто/посилання беруться напряму з того ж
         рядка .tour-list — це ті самі перевірені факти, що вже на сторінці. */
      if (nextShowHero) {
        var heroDate = nextShowHero.getAttribute("data-date");
        if (heroDate && heroDate < todayISO) {
          var statusEl = nextShowHero.querySelector(".next-show__status");
          var dateEl = nextShowHero.querySelector(".next-show__date span");
          var placeEl = nextShowHero.querySelector(".next-show__place");
          var priceEl = nextShowHero.querySelector(".next-show__price");
          var hintEl = nextShowHero.querySelector(".next-show__hint");
          var actionLink = nextShowHero.querySelector(".btn--ticket");
          var actionLabel = actionLink ? actionLink.querySelector(".btn__label") : null;

          if (upcoming.length > 0) {
            var next = upcoming[0];
            var linkEl = next.el.querySelector("a");
            var cityEl = next.el.querySelector(".tour-city");
            var dateText = next.el.querySelector(".tour-date")
              ? next.el.querySelector(".tour-date").textContent.trim()
              : next.date;
            var cityText = cityEl ? cityEl.textContent.trim() : "";

            if (statusEl) statusEl.textContent = "Найближча дата туру";
            if (dateEl) dateEl.textContent = dateText;
            if (placeEl) placeEl.innerHTML = "<strong>" + cityText + "</strong>";
            if (priceEl) priceEl.hidden = true;
            if (hintEl) hintEl.textContent = "Деталі та ціна квитків — на сторінці партнера.";
            if (actionLink && linkEl) actionLink.href = linkEl.href;
            if (actionLabel) actionLabel.textContent = "Придбати квитки";
          } else {
            /* Усі дати туру, включно з featured, уже минули — акуратний
               порожній стан замість показу минулої події як "найближчої". */
            if (statusEl) statusEl.textContent = "Дати туру оновлюються";
            if (dateEl) dateEl.textContent = "";
            if (placeEl) placeEl.textContent = "Нові дати туру скоро з'являться. Слідкуйте за оновленнями в Instagram.";
            if (priceEl) priceEl.hidden = true;
            if (hintEl) hintEl.hidden = true;
            if (actionLink) actionLink.setAttribute("hidden", "");
          }
        }
      }
    }
  })();

  /* Спільна перевірка pointer:fine + hover:hover для десктопних-only
     мікровзаємодій нижче (magnetic buttons, tilt+spotlight карток). */
  var supportsFineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ===== БЛОК: MAGNETIC BUTTONS (CTA по всьому сайту) =====
     Прямий запит власника: підняти hover/active стани кнопок до того ж
     рівня "вау", що й tilt-картки (референс — 21st.dev, портовано на
     vanilla JS). Важливо: transform ставиться на ВНУТРІШНІЙ .btn__label,
     не на сам .btn — hit-area кнопки лишається нерухомою (клікабельна зона
     не "втікає" з-під курсора), рухається лише візуальний текст усередині.
     Тільки desktop hover (pointer: fine), без prefers-reduced-motion. */
  if (supportsFineHover && !reduceMotion) {
    var magneticButtons = document.querySelectorAll(".btn");
    var magneticMax = 6; /* px — невеликий кап, суто візуальний нюанс. */
    magneticButtons.forEach(function (btn) {
      var label = btn.querySelector(".btn__label") || btn;
      btn.classList.add("btn--magnetic");
      var strength = 0.28;
      function onMagneticMove(e) {
        var rect = btn.getBoundingClientRect();
        var relX = e.clientX - (rect.left + rect.width / 2);
        var relY = e.clientY - (rect.top + rect.height / 2);
        var moveX = Math.max(-magneticMax, Math.min(magneticMax, relX * strength));
        var moveY = Math.max(-magneticMax, Math.min(magneticMax, relY * strength));
        label.style.transform = "translate(" + moveX.toFixed(1) + "px, " + moveY.toFixed(1) + "px)";
      }
      function onMagneticLeave() {
        label.style.transform = "";
      }
      btn.addEventListener("mousemove", onMagneticMove);
      btn.addEventListener("mouseleave", onMagneticLeave);
    });
  }

  /* ===== БЛОК: TILT + SPOTLIGHT (DiscographyRail + VideoRail) =====
     Тільки desktop hover (pointer: fine, hover: hover) і без
     prefers-reduced-motion — мобільний tap лишається статичним, як і решта
     сайту. Рецепт — прямий запит власника (патерн з 21st.dev, tilt +
     spotlight), портований на vanilla JS. Спершу — лише DiscographyRail;
     за другим запитом ("максимум вау для Галереї/Дискографії/Кліпів")
     той самий ефект поширено на VideoRail-картки (.video__card), той
     самий --x/--y контракт, що й .rail__spotlight/.video__card-spotlight
     (CSS). */
  if (supportsFineHover && !reduceMotion) {
    var tiltCards = document.querySelectorAll(".rail__card, .video__card");
    tiltCards.forEach(function (card) {
      function onMove(e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        var rotX = py * -8;
        var rotY = px * 8;
        card.style.transform = "perspective(1000px) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg) translateY(-6px)";
        card.style.setProperty("--x", (e.clientX - rect.left) + "px");
        card.style.setProperty("--y", (e.clientY - rect.top) + "px");
      }
      function onLeave() {
        card.style.transform = "";
      }
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });
  }

  /* ===== БЛОК: RAIL EDGE FADE (DiscographyRail) =====
     Правий край .rail плавно "обрізається" через mask-image (styles.css) —
     сигнал "прокрутіть далі". Але коли стрічку прокручено до самого кінця,
     фейд на останній картці мав би виглядати як помилка (ніби її обрізано
     назавжди) — тому тут вимикаємо маску класом .rail--end, щойно
     scrollLeft добігає до кінця scrollWidth (з невеликим запасом на
     похибку округлення subpixel). */
  var fadeRails = document.querySelectorAll(".rail");
  fadeRails.forEach(function (rail) {
    function updateFade() {
      var atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      rail.classList.toggle("rail--end", atEnd);
    }
    rail.addEventListener("scroll", updateFade, { passive: true });
    window.addEventListener("resize", updateFade);
    updateFade();
  });
})();

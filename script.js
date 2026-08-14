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
    window.setTimeout(function () {
      intro.setAttribute("hidden", "");
      intro.setAttribute("aria-hidden", "true");
      startHero();
    }, reduceMotion ? 0 : 650);
  }

  function startIntro() {
    var alreadySeen = sessionStorage.getItem("introSeen") === "true";
    if (!intro) {
      startHero();
      return;
    }
    if (alreadySeen || reduceMotion || saveData) {
      intro.setAttribute("hidden", "");
      intro.setAttribute("aria-hidden", "true");
      startHero();
      return;
    }
    document.body.classList.add("intro-lock");
    intro.classList.add("is-playing");
    sessionStorage.setItem("introSeen", "true");
    var introDuration = window.innerWidth < 640 ? 1300 : 4400;
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

  startIntro();

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
     Одна модалка на весь сайт (Apple Music + YouTube — єдині верифіковані
     лінки, brief §15). Клік по конкретному треку відкриває ту саму модалку,
     але з заголовком саме цього треку (data-track) — Spotify/Deezer/YouTube
     Music і per-трек deep links відсутні, поки їх не підтвердить менеджмент
     (gaps.md розділ 3). */
  var sheetBackdrop = document.getElementById("platformSheet");
  var sheetOpeners = document.querySelectorAll("[data-open-sheet]");
  var sheetClose = document.getElementById("sheetClose");
  var sheetTitleEl = document.getElementById("sheetTitle");
  var lastFocused = null;

  function openSheet(trackTitle) {
    if (!sheetBackdrop) return;
    if (sheetTitleEl) {
      sheetTitleEl.textContent = "Слухати «" + (trackTitle || "Маргарита") + "»";
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

  /* ===== БЛОК: ГАЛЕРЕЯ — модалка з клавіатурною навігацією ===== */
  var galleryTiles = Array.prototype.slice.call(document.querySelectorAll(".gallery__tile"));
  var galleryModal = document.getElementById("galleryModal");
  var galleryFrame = document.getElementById("galleryModalFrame");
  var galleryClose = document.getElementById("galleryModalClose");
  var galleryPrev = document.getElementById("galleryModalPrev");
  var galleryNext = document.getElementById("galleryModalNext");
  var galleryIndex = 0;
  var galleryLastFocused = null;

  function renderGallerySlide(index) {
    if (!galleryFrame) return;
    var tile = galleryTiles[index];
    var swatchClass = tile.getAttribute("data-swatch");
    var caption = tile.getAttribute("data-caption");
    galleryFrame.className = "gallery-modal__frame " + swatchClass;
    galleryFrame.innerHTML = '<span>' + caption + "</span>";
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
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-copy-link");
      if (navigator.clipboard && url) {
        navigator.clipboard
          .writeText(url)
          .then(function () {
            showToast("Посилання скопійовано.");
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
})();

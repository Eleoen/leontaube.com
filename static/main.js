/* leontaube.com – Header, Menü, Kacheln, Lightbox, Kontaktformular */
(function () {
  "use strict";

  // Header bekommt beim Scrollen einen Hintergrund
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("on-scroll", window.scrollY > 0);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Handy-Menü
  var burger = document.querySelector(".hamburger");
  var mobileNav = document.getElementById("mobile-nav");
  function setMenu(open) {
    if (!mobileNav) return;
    mobileNav.hidden = !open;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) mobileNav.querySelector("a").focus();
    else burger.focus();
  }
  if (burger && mobileNav) {
    burger.addEventListener("click", function () { setMenu(true); });
    mobileNav.querySelector(".close-nav").addEventListener("click", function () { setMenu(false); });
  }

  // Pfeil im Masthead scrollt zu den Projekten
  var arrow = document.querySelector(".masthead-arrow");
  if (arrow) {
    arrow.addEventListener("click", function () {
      var target = document.getElementById("work");
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
    });
  }
  var heroVideo = document.querySelector(".masthead-video");
  if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) heroVideo.pause();

  // Kacheln auf Touch-Geräten: erster Tipp zeigt den Titel, zweiter öffnet
  if (window.matchMedia("(hover: none)").matches) {
    document.querySelectorAll(".cover").forEach(function (cover) {
      cover.addEventListener("click", function (e) {
        if (!cover.classList.contains("touch-hover")) {
          e.preventDefault();
          document.querySelectorAll(".cover.touch-hover").forEach(function (c) { c.classList.remove("touch-hover"); });
          cover.classList.add("touch-hover");
        }
      });
    });
  }

  // Lightbox
  var box = document.querySelector(".lightbox");
  var boxImg = box && box.querySelector(".lb-img");
  var boxCap = box && box.querySelector(".lb-caption");
  var group = [];
  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + group.length) % group.length;
    var link = group[index];
    boxImg.src = link.getAttribute("href");
    var img = link.querySelector("img");
    boxImg.alt = img ? img.alt : "";
    boxCap.textContent = link.getAttribute("data-caption") || "";
    [index - 1, index + 1].forEach(function (n) {
      var l = group[(n + group.length) % group.length];
      if (l) { var pre = new Image(); pre.src = l.getAttribute("href"); }
    });
  }
  function openBox(link) {
    var name = link.getAttribute("data-lb");
    group = Array.prototype.slice.call(document.querySelectorAll('[data-lb="' + name + '"]'));
    box.classList.toggle("single", group.length < 2);
    lastFocus = document.activeElement;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    show(group.indexOf(link));
    box.querySelector(".lb-close").focus();
  }
  function closeBox() {
    box.hidden = true;
    boxImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (box) {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-lb]");
      if (link && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openBox(link);
      }
    });
    box.querySelector(".lb-close").addEventListener("click", closeBox);
    box.querySelector(".lb-prev").addEventListener("click", function () { show(index - 1); });
    box.querySelector(".lb-next").addEventListener("click", function () { show(index + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) closeBox(); });
    var startX = null;
    box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (startX === null || group.length < 2) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  document.addEventListener("keydown", function (e) {
    if (box && !box.hidden) {
      if (e.key === "Escape") closeBox();
      if (e.key === "ArrowLeft" && group.length > 1) show(index - 1);
      if (e.key === "ArrowRight" && group.length > 1) show(index + 1);
    } else if (mobileNav && !mobileNav.hidden && e.key === "Escape") {
      setMenu(false);
    }
  });

  // Kontaktformular: öffnet das Mailprogramm mit vorausgefüllter Nachricht
  document.querySelectorAll(".contact-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll(".field").forEach(function (field) {
        var input = field.querySelector("input, textarea");
        var old = field.querySelector(".field-error");
        if (old) old.remove();
        field.classList.remove("error");
        var value = input.value.trim();
        var msg = "";
        if (!value) msg = "Please fill in this field.";
        else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = "Please enter a valid email address.";
        if (msg) {
          ok = false;
          field.classList.add("error");
          var p = document.createElement("p");
          p.className = "field-error";
          p.textContent = msg;
          field.appendChild(p);
        }
      });
      if (!ok) return;
      var note = form.querySelector(".form-note");
      var mail = form.getAttribute("data-mail");
      var endpoint = form.getAttribute("action");

      // Mit Formspree: im Hintergrund senden
      if (endpoint) {
        var button = form.querySelector(".submit-button");
        button.disabled = true;
        fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            form.querySelectorAll(".field, .submit-button").forEach(function (el) { el.hidden = true; });
            note.textContent = "Thank you!";
            note.hidden = false;
          })
          .catch(function () {
            note.textContent = "Sorry, that didn't work. Please write to " + mail + " instead.";
            note.hidden = false;
            button.disabled = false;
          });
        return;
      }

      // Ohne Formspree: Mailprogramm mit fertiger Nachricht öffnen
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();
      var subject = "Message from " + name + " via leontaube.com";
      var body = message + "\n\n" + name + "\n" + email;
      window.location.href = "mailto:" + mail +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      note.textContent = "Thank you! Your email app should open now - just hit send there.";
      note.hidden = false;
    });
  });
})();

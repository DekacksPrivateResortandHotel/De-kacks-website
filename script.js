(function () {
  "use strict";

  const RESORT_MOODS = {
    "lagoon-morning": {
      title: "Lagoon Morning",
      text: "Soft light, calm water tones, and a serene first impression for guests planning a peaceful stay.",
    },
    "palm-breeze": {
      title: "Palm Breeze",
      text: "Fresh tropical energy that feels airy, welcoming, and perfect for family or barkada bookings.",
    },
    "monsoon-lounge": {
      title: "Monsoon Lounge",
      text: "Cool and refined, like a private resort retreat designed for cozy indoor luxury and restful stays.",
    },
    "golden-dusk": {
      title: "Golden Dusk",
      text: "Warm sunset tones inspired by elegant evening pool moments, private events, and premium resort nights.",
    },
  };

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function safeCall(name, ...args) {
    if (typeof window[name] === "function") {
      return window[name](...args);
    }
    return undefined;
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function getGuestName() {
    const input = getEl("guestName");
    return input ? (input.value || "").trim() : "";
  }

  function getContactValue() {
    const prefixWrap = document.querySelector(".phone-prefix");
    const input = getEl("contactNumber");
    if (!input) return "";
    const raw = (input.value || "").replace(/\D/g, "");
    if (!raw) return "";
    const prefix = prefixWrap ? (prefixWrap.textContent || "09").replace(/\D/g, "") : "09";
    return `${prefix}${raw}`.slice(0, 11);
  }

  function getGuestCount() {
    const input = getEl("guests");
    return input ? Math.max(0, parseInt(input.value, 10) || 0) : 0;
  }

  function getStayModeLabel() {
    const select = getEl("preferStay");
    return select ? (select.selectedOptions[0]?.text || "Day") : "Day";
  }

  function getDisplayedEstimate() {
    const estimateCard = Array.from(document.querySelectorAll(".booking-summary-item"))
      .find((item) => item.textContent && item.textContent.includes("Estimated Total"));
    if (!estimateCard) return "";
    return estimateCard.textContent.replace("Estimated Total", "").trim();
  }

  function injectUtilityStyles() {
    if (getEl("worldClassUtilityStyles")) return;

    const style = document.createElement("style");
    style.id = "worldClassUtilityStyles";
    style.textContent = `
      .launch-utility-stack {
        position: fixed;
        left: 18px;
        bottom: 18px;
        z-index: 45;
        display: grid;
        gap: 10px;
      }

      .launch-utility-btn {
        border: 1px solid rgba(182, 210, 201, 0.95);
        background: rgba(255, 255, 255, 0.94);
        color: #123f47;
        border-radius: 999px;
        padding: 11px 15px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.02em;
        box-shadow: 0 18px 30px rgba(7, 35, 44, 0.16);
        backdrop-filter: blur(12px);
        cursor: pointer;
        transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
      }

      .launch-utility-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 24px 36px rgba(7, 35, 44, 0.2);
      }

      .launch-utility-btn.hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
      }

      @media (max-width: 640px) {
        .launch-utility-stack {
          left: 12px;
          bottom: 90px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createWorldProgressBar() {
    if (getEl("worldProgressBar")) return;
    const bar = document.createElement("div");
    bar.id = "worldProgressBar";
    bar.className = "world-progress-bar";
    document.body.appendChild(bar);

    const sync = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    };

    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  }

  function createUtilityButtons() {
    if (getEl("launchUtilityStack")) return;

    const stack = document.createElement("div");
    stack.id = "launchUtilityStack";
    stack.className = "launch-utility-stack";
    stack.innerHTML = `
      <button type="button" id="utilityTodayBtn" class="launch-utility-btn">Today</button>
      <button type="button" id="utilityQuoteBtn" class="launch-utility-btn">Quotation</button>
      <button type="button" id="utilityTopBtn" class="launch-utility-btn hidden">Top</button>
    `;
    document.body.appendChild(stack);

    getEl("utilityTodayBtn")?.addEventListener("click", () => {
      safeCall("jumpToTodayMonth");
      safeCall("scrollToBookingSection", "availabilityStepPanel");
    });

    getEl("utilityQuoteBtn")?.addEventListener("click", () => {
      safeCall("scrollToBookingSection", "quotation");
    });

    getEl("utilityTopBtn")?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const syncTopButton = () => {
      const topBtn = getEl("utilityTopBtn");
      if (!topBtn) return;
      topBtn.classList.toggle("hidden", window.scrollY < 260);
    };

    window.addEventListener("scroll", syncTopButton, { passive: true });
    syncTopButton();
  }

  function updateHeroSpotlight() {
    const title = getEl("launchSpotlightTitle");
    const text = getEl("launchSpotlightText");
    if (!title || !text) return;

    const guestName = getGuestName();
    const totalGuests = getGuestCount();
    const hasDate = !!getEl("date")?.value;
    const quoteReady = !!document.querySelector("#quotation .quote-card");
    const estimate = getDisplayedEstimate();
    const stayLabel = getStayModeLabel();
    const activeMood = RESORT_MOODS[document.body.dataset.weather || ""] || null;

    if (quoteReady) {
      title.textContent = "Quotation ready for review";
      text.textContent = estimate
        ? `Everything is staged for a polished guest handoff. Current displayed estimate: ${estimate}.`
        : "Everything is staged for a polished guest handoff. Review the quotation and submit when ready.";
      return;
    }

    if (guestName && hasDate) {
      title.textContent = `${guestName.split(" ")[0]}'s stay is taking shape`;
      text.textContent = totalGuests > 0
        ? `${totalGuests} guest(s), ${stayLabel} stay, and a guided booking flow. Generate the quotation when the setup feels right.`
        : `Your guest profile and dates are in place. Continue refining the ${stayLabel.toLowerCase()} setup.`;
      return;
    }

    if (hasDate) {
      title.textContent = "Availability-first booking flow";
      text.textContent = "The selected date is now guiding room, pool, and stay decisions so guests can book with confidence.";
      return;
    }

    if (activeMood) {
      title.textContent = activeMood.title;
      text.textContent = activeMood.text;
      return;
    }

    title.textContent = "Smooth, guided, and guest-friendly";
    text.textContent = "Choose a date, select a stay style, and let the page guide the guest to the fastest complete booking.";
  }

  function pulseJourneyCards() {
    const cards = document.querySelectorAll(".launch-journey-card");
    cards.forEach((card, index) => {
      card.animate(
        [
          { transform: "translateY(0px)" },
          { transform: "translateY(-4px)" },
          { transform: "translateY(0px)" },
        ],
        {
          duration: 2600,
          delay: index * 180,
          iterations: Infinity,
          direction: "normal",
          easing: "ease-in-out",
        }
      );
    });
  }

  function rotateMarqueeMood() {
    const title = getEl("launchSpotlightTitle");
    const text = getEl("launchSpotlightText");
    if (!title || !text) return;

    const moods = [
      {
        title: "Private resort luxury, simplified",
        text: "Give guests a high-end first impression with a calmer tropical mood, clearer decisions, and stronger trust cues.",
      },
      {
        title: "Built for tropical hospitality",
        text: "From guest details to quotation, the experience now feels more like a private resort concierge flow than a plain form.",
      },
      {
        title: "Sunset-ready booking presentation",
        text: "Premium styling matters most when it makes guests feel relaxed, confident, and ready to complete the reservation.",
      },
    ];

    let index = 0;
    setInterval(() => {
      const quoteReady = !!document.querySelector("#quotation .quote-card");
      const hasDate = !!getEl("date")?.value;
      const guestName = getGuestName();
      if (quoteReady || hasDate || guestName) return;
      index = (index + 1) % moods.length;
      title.textContent = moods[index].title;
      text.textContent = moods[index].text;
    }, 5200);
  }

  function attachShortcutHelp() {
    document.addEventListener("keydown", (event) => {
      const tagName = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : "";
      if (tagName === "input" || tagName === "textarea" || tagName === "select") return;
      if (event.key !== "?") return;
      event.preventDefault();

      const message = "Shortcuts: Alt + 1 opens booking calendar, Ctrl + A opens admin, and the floating buttons help you jump around the page.";
      if (typeof window.showToast === "function") {
        window.showToast(message, "info");
      } else {
        alert(message);
      }
    });
  }

  function enhanceGuestNameField() {
    const input = getEl("guestName");
    if (!input) return;

    input.addEventListener("blur", () => {
      const value = (input.value || "").trim().replace(/\s+/g, " ");
      if (!value) return;
      input.value = value
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
      safeCall("updateLiveBookingSummary");
      updateHeroSpotlight();
    });
  }

  function createSectionObserver() {
    const sections = [
      { id: "preEntryPanel", pill: "stepPillGuest" },
      { id: "availabilityStepPanel", pill: "stepPillCalendar" },
      { id: "bookingFormPanel", pill: "stepPillForm" },
      { id: "quotation", pill: "stepPillQuote" },
    ];

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sections.forEach((section) => {
          const pill = getEl(section.pill);
          if (!pill) return;
          pill.classList.toggle("active", section.id === entry.target.id || (section.id === "quotation" && entry.target.id === "quotation"));
        });
      });
    }, { threshold: 0.45 });

    sections.forEach((section) => {
      const element = getEl(section.id);
      if (element) observer.observe(element);
    });
  }

  function watchBookingState() {
    const targets = [
      "guestName",
      "contactNumber",
      "date",
      "checkOutDatePicker",
      "guests",
      "preferStay",
      "pool-select",
      "specialEventSelect",
    ];

    const update = () => {
      updateHeroSpotlight();
      safeCall("updateActionDock");
      safeCall("updateStepFlowState");
    };

    targets.forEach((id) => {
      const el = getEl(id);
      if (!el) return;
      el.addEventListener("input", update);
      el.addEventListener("change", update);
    });

    document.querySelectorAll(".room-select").forEach((select) => {
      select.addEventListener("change", update);
    });

    const quote = getEl("quotation");
    if (quote && "MutationObserver" in window) {
      const observer = new MutationObserver(() => {
        const quoteBtn = getEl("utilityQuoteBtn");
        if (quoteBtn) {
          quoteBtn.textContent = quote.querySelector(".quote-card") ? "View Quote" : "Quotation";
        }
        updateHeroSpotlight();
      });
      observer.observe(quote, { childList: true, subtree: true });
    }
  }

  function addAmbientMotion() {
    const hero = document.querySelector(".launch-hero");
    if (!hero) return;

    let frame = 0;
    window.addEventListener("mousemove", (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) - 0.5;
        const y = ((event.clientY - rect.top) / rect.height) - 0.5;
        hero.style.transform = `perspective(1400px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.6).toFixed(2)}deg)`;
      });
    });

    hero.addEventListener("mouseleave", () => {
      hero.style.transform = "";
    });
  }

  function upgradeFeatureCards() {
    document.querySelectorAll(".launch-feature-card").forEach((card, index) => {
      card.style.transitionDelay = `${index * 70}ms`;
      card.classList.add("reveal-target");
      requestAnimationFrame(() => card.classList.add("is-visible"));
    });
  }

  function syncRoomShowcaseSelection() {
    const selectedTypes = new Set(
      Array.from(document.querySelectorAll(".room-select"))
        .map((select) => select.selectedOptions[0]?.dataset?.type || "none")
        .filter((type) => type && type !== "none")
    );

    document.querySelectorAll("[data-room-type-card]").forEach((card) => {
      const type = card.getAttribute("data-room-type-card");
      card.classList.toggle("selected", selectedTypes.has(type));
    });
  }

  onReady(() => {
    injectUtilityStyles();
    createWorldProgressBar();
    createUtilityButtons();
    attachShortcutHelp();
    enhanceGuestNameField();
    createSectionObserver();
    watchBookingState();
    addAmbientMotion();
    upgradeFeatureCards();
    pulseJourneyCards();
    rotateMarqueeMood();
    syncRoomShowcaseSelection();
    updateHeroSpotlight();

    document.querySelectorAll(".room-select").forEach((select) => {
      select.addEventListener("change", syncRoomShowcaseSelection);
    });
  });
})();

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

  function getFirstName() {
    const guestName = getGuestName();
    return guestName ? guestName.split(/\s+/)[0] : "";
  }

  function hasRoomOrPoolSelection() {
    const hasRoom = Array.from(document.querySelectorAll(".room-select"))
      .some((select) => (select.value || "").trim() !== "");
    const poolSelect = getEl("pool-select");
    const hasPool = !!(poolSelect && (poolSelect.value || "").trim());
    const specialEventSelect = getEl("specialEventSelect");
    const hasEvent = !!(specialEventSelect && (specialEventSelect.value || "").trim());
    return hasRoom || hasPool || hasEvent;
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
          display: none;
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
      <button type="button" id="utilityQuoteBtn" class="launch-utility-btn">Summary</button>
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
      title.textContent = "Booking summary ready for review";
      text.textContent = estimate
        ? `Your booking details are ready. Current estimated total: ${estimate}.`
        : "Your booking details are ready. Review the summary and submit your request when ready.";
      return;
    }

    if (guestName && hasDate) {
      title.textContent = `${guestName.split(" ")[0]}'s stay is taking shape`;
      text.textContent = totalGuests > 0
        ? `${totalGuests} guest(s), ${stayLabel} stay, and a guided booking flow. Review the booking summary when the setup feels right.`
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

    title.textContent = "Simple, clear, and guest-friendly";
    text.textContent = "Choose a date, select your stay, and let the page guide you through a complete booking request.";
  }

  function getReadinessState() {
    const guestName = getGuestName();
    const contactNumber = getContactValue();
    const hasDate = !!getEl("date")?.value;
    const guests = getGuestCount();
    const stayLabel = getStayModeLabel();
    const configuredStay = !!getEl("preferStay")?.value;
    const serviceConfigured = hasRoomOrPoolSelection();
    const quoteReady = !!document.querySelector("#quotation .quote-card");

    let score = 12;
    if (guestName) score += 18;
    if (contactNumber.length >= 11) score += 10;
    if (hasDate) score += 20;
    if (configuredStay) score += 10;
    if (guests > 0) score += 10;
    if (serviceConfigured) score += 20;
    if (quoteReady) score += 20;
    score = Math.max(0, Math.min(100, score));

    let label = "Getting started";
    let stage = "Stage 1";
    let next = "Complete your details and select a date to start building your booking request.";

    if (quoteReady) {
      label = "Ready to review";
      stage = "Stage 4";
      next = "Review your booking summary, confirm the details, and submit your reservation request when everything looks correct.";
    } else if (serviceConfigured && hasDate && guestName) {
      label = "Configuration in progress";
      stage = "Stage 3";
      next = "Your core booking setup is in place. Generate the summary next so you can review everything before submitting.";
    } else if (hasDate && guestName) {
      label = "Planning locked in";
      stage = "Stage 2";
      next = "Choose the rooms, pool, or event setup so the estimate and summary become more accurate.";
    }

    return { score, label, stage, next, stayLabel, guestName, guests, hasDate, configuredStay, serviceConfigured, quoteReady, hasContact: contactNumber.length >= 11 };
  }

  function setChipState(id, ready, readyText, pendingText) {
    const chip = getEl(id);
    if (!chip) return;
    chip.classList.toggle("is-ready", ready);
    chip.textContent = ready ? readyText : pendingText;
  }

  function updateBookingIntelligence() {
    const state = getReadinessState();
    const greeting = getEl("commandCenterGreeting");
    const narrative = getEl("commandCenterNarrative");
    const confidence = getEl("commandCenterConfidence");
    const support = getEl("commandCenterSupport");
    const readiness = getEl("commandCenterReadiness");
    const nextStep = getEl("commandCenterNextStep");
    const metricScore = getEl("commandCenterMetricScore");
    const metricStage = getEl("commandCenterMetricStage");
    const metricMode = getEl("commandCenterMetricMode");
    const label = getEl("bookingReadinessLabel");
    const score = getEl("bookingReadinessScore");
    const meter = getEl("bookingReadinessMeter");
    const readinessNext = getEl("bookingReadinessNext");

    if (greeting) {
      greeting.textContent = state.guestName
        ? `${getFirstName()}'s booking experience is taking shape.`
        : "A calmer booking journey starts here.";
    }

    if (narrative) {
      if (state.quoteReady) {
        narrative.textContent = "Your booking is now packaged into a clear review summary before you submit your reservation request.";
      } else if (state.serviceConfigured && state.hasDate) {
        narrative.textContent = "Your guest details, travel date, and stay setup are already aligned. The next move is generating the booking summary for review.";
      } else if (state.hasDate) {
        narrative.textContent = "The selected date is now guiding the experience. Keep refining the stay so the guest sees a cleaner, more complete reservation setup.";
      } else {
        narrative.textContent = "Guests move through a guided booking flow with clearer decisions, simpler steps, and a more confident first impression from the first click.";
      }
    }

    if (confidence) {
      confidence.textContent = state.quoteReady
        ? "Ready for confident guest review"
        : state.score >= 60
          ? "Booking structure is in place"
          : "Guest booking experience";
    }

    if (support) {
      support.textContent = state.quoteReady
        ? "The form, estimate, and booking summary are aligned for a smoother reservation request."
        : state.serviceConfigured
          ? "The page already feels guided, organized, and easier for guests to review."
          : "Clean structure, visible guidance, and a booking flow that feels easier to trust.";
    }

    if (readiness) readiness.textContent = state.label;
    if (nextStep) nextStep.textContent = state.next;
    if (metricScore) metricScore.textContent = `${state.score}%`;
    if (metricStage) metricStage.textContent = state.stage;
    if (metricMode) metricMode.textContent = state.stayLabel;
    if (label) label.textContent = state.label;
    if (score) score.textContent = `${state.score}%`;
    if (meter) meter.style.width = `${state.score}%`;
    if (readinessNext) readinessNext.textContent = state.next;

    setChipState("readinessChipGuest", !!state.guestName && state.hasContact, "Guest details ready", "Guest details");
    setChipState("readinessChipDate", state.hasDate, "Date locked in", "Date selected");
    setChipState("readinessChipStay", state.configuredStay, `Stay mode: ${state.stayLabel}`, "Stay mode");
    setChipState("readinessChipRooms", state.serviceConfigured, "Service setup chosen", "Room or pool setup");
    setChipState("readinessChipQuote", state.quoteReady, "Booking summary ready", "Booking summary");
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
        text: "From guest details to booking summary, the experience now feels more like a private resort booking flow than a plain form.",
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

      const message = "Shortcut: Alt + 1 opens the booking calendar.";
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
      updateBookingIntelligence();
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
          quoteBtn.textContent = quote.querySelector(".quote-card") ? "View Summary" : "Summary";
        }
        updateHeroSpotlight();
        updateBookingIntelligence();
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
    createWorldProgressBar();
    const syncMobileChrome = () => {
      safeCall("updateMobileBookingBar");
    };
    window.addEventListener("scroll", syncMobileChrome, { passive: true });
    window.addEventListener("resize", syncMobileChrome);
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
    updateBookingIntelligence();
    syncMobileChrome();

    document.querySelectorAll(".room-select").forEach((select) => {
      select.addEventListener("change", syncRoomShowcaseSelection);
    });
  });
})();

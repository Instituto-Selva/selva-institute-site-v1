document.documentElement.classList.add("js");

const DEFAULT_LANGUAGE = "pt-BR";
const LANGUAGE_STORAGE_KEY = "selva-language";
const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const menuLabel = document.querySelector("[data-menu-label]");
const nav = document.querySelector("[data-nav]");
const languageButtons = document.querySelectorAll("[data-language]");
const copyEmailButton = document.querySelector("[data-copy-email]");
const copyEmailLabel = document.querySelector("[data-copy-label]");
let currentLanguage = DEFAULT_LANGUAGE;
let copyEmailResetTimer;

function getStoredLanguage() {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return TRANSLATIONS[storedLanguage] ? storedLanguage : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function storeLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The page still works when browser storage is unavailable.
  }
}

function copyEmailWithFallback(email) {
  const textarea = document.createElement("textarea");
  textarea.value = email;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, email.length);

  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyEmailAddress(email) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(email);
    return true;
  }

  return copyEmailWithFallback(email);
}

function updateMenuLabel() {
  if (!menuLabel || !menuButton) return;
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuLabel.textContent = TRANSLATIONS[currentLanguage][isOpen ? "menuClose" : "menuOpen"];
}

function updateMetadata(dictionary) {
  document.title = dictionary.documentTitle;

  const description = document.querySelector('meta[name="description"]');
  const openGraphTitle = document.querySelector('meta[property="og:title"]');
  const openGraphDescription = document.querySelector('meta[property="og:description"]');

  if (description) description.content = dictionary.metaDescription;
  if (openGraphTitle) openGraphTitle.content = dictionary.ogTitle;
  if (openGraphDescription) openGraphDescription.content = dictionary.ogDescription;
}

function applyLanguage(language, persist = true) {
  const nextLanguage = TRANSLATIONS[language] ? language : DEFAULT_LANGUAGE;
  const dictionary = TRANSLATIONS[nextLanguage];
  currentLanguage = nextLanguage;
  document.documentElement.lang = nextLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const translation = dictionary[element.dataset.i18n];
    if (translation !== undefined) element.textContent = translation;
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const translation = dictionary[element.dataset.i18nHtml];
    if (translation !== undefined) element.innerHTML = translation;
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const translation = dictionary[element.dataset.i18nAriaLabel];
    if (translation !== undefined) element.setAttribute("aria-label", translation);
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === nextLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  updateMetadata(dictionary);
  updateMenuLabel();
  if (persist) storeLanguage(nextLanguage);
}

function closeMenu() {
  menuButton?.setAttribute("aria-expanded", "false");
  nav?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  updateMenuLabel();
}

menuButton?.addEventListener("click", () => {
  const nextOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(nextOpen));
  nav?.classList.toggle("is-open", nextOpen);
  document.body.classList.toggle("menu-open", nextOpen);
  updateMenuLabel();
});

nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.language);
    closeMenu();
  });
});

copyEmailButton?.addEventListener("click", async () => {
  const dictionary = TRANSLATIONS[currentLanguage];
  const email = copyEmailButton.dataset.copyEmail;
  let copied = false;

  window.clearTimeout(copyEmailResetTimer);

  try {
    copied = await copyEmailAddress(email);
  } catch {
    copied = false;
  }

  if (copyEmailLabel) {
    copyEmailLabel.textContent = dictionary[copied ? "copyEmailCopied" : "copyEmailError"];
  }

  copyEmailButton.classList.toggle("is-copied", copied);
  copyEmailButton.setAttribute(
    "aria-label",
    dictionary[copied ? "copyEmailCopied" : "copyEmailError"]
  );

  copyEmailResetTimer = window.setTimeout(() => {
    if (copyEmailLabel) copyEmailLabel.textContent = TRANSLATIONS[currentLanguage].copyEmail;
    copyEmailButton.classList.remove("is-copied");
    copyEmailButton.setAttribute("aria-label", TRANSLATIONS[currentLanguage].copyEmailAria);
  }, 2600);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
}

applyLanguage(getStoredLanguage(), false);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const programs = document.querySelectorAll(".program");
programs.forEach((program) => {
  program.addEventListener("toggle", () => {
    if (!program.open) return;
    programs.forEach((other) => {
      if (other !== program) other.removeAttribute("open");
    });
  });
});

const revealElements = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -7%" }
  );

  revealElements.forEach((element) => observer.observe(element));
}

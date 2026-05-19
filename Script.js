// ══════════════════════════════════════════════════
//  BMW SHOWCASE — script.js
//  All frontend logic: fetch, filter, render, panel
// ══════════════════════════════════════════════════

const API_BASE = "http://localhost:3000/api";

// ── STATE ────────────────────────────────────────
let allCars = [];
let activeFilter = "all";

// ── DOM REFS ─────────────────────────────────────
const carGrid = document.getElementById("carGrid");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const filterTabs = document.getElementById("filterTabs");
const panelOverlay = document.getElementById("panelOverlay");
const detailPanel = document.getElementById("detailPanel");
const panelContent = document.getElementById("panelContent");
const panelClose = document.getElementById("panelClose");
const loader = document.getElementById("loader");

// ── INIT ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
    // Hide page loader after a short delay
    setTimeout(() => loader.classList.add("hidden"), 1800);
    fetchCars();
    bindFilterTabs();
    bindPanelClose();
    bindKeyboard();
});

// ── API: FETCH ALL CARS ───────────────────────────
async function fetchCars() {
    showLoading(true);
    try {
        const res = await fetch(`${API_BASE}/cars`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        allCars = json.data || [];
        renderGrid(allCars);
        showLoading(false);
    } catch (err) {
        console.error("Failed to fetch cars:", err);
        showError(true);
        showLoading(false);
    }
}

// ── API: FETCH SINGLE CAR ─────────────────────────
async function fetchCarById(id) {
    try {
        const res = await fetch(`${API_BASE}/cars/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data;
    } catch (err) {
        console.error("Failed to fetch car:", err);
        return null;
    }
}

// ── RENDER: GRID ─────────────────────────────────
function renderGrid(cars) {
    carGrid.innerHTML = "";

    if (!cars.length) {
        carGrid.innerHTML = `
      <div class="loading-state" style="color:var(--muted);text-align:center;padding:4rem;grid-column:1/-1">
        No models found for this category.
      </div>`;
        return;
    }

    cars.forEach((car, i) => {
        const card = buildCard(car, i);
        carGrid.appendChild(card);
    });
}

function buildCard(car, index) {
    const el = document.createElement("article");
    el.className = "car-card";
    el.style.animationDelay = `${index * 0.08}s`;
    el.setAttribute("data-id", car.id);
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `View ${car.name} details`);

    el.innerHTML = `
    <div class="card-img-wrap">
      <img src="${car.image}" alt="${car.name}" loading="lazy" />
      <span class="card-badge">${car.badge}</span>
      <div class="card-hover-overlay">
        <span class="card-cta">VIEW DETAILS</span>
      </div>
    </div>
    <div class="card-body">
      <p class="card-category">${car.category} · ${car.year}</p>
      <h2 class="card-name">${car.name}</h2>
      <p class="card-tagline">${car.tagline}</p>
      <div class="card-quick-specs">
        <div class="qs-item">
          <span class="qs-label">Power</span>
          <span class="qs-val">${car.specs.power}</span>
        </div>
        <div class="qs-item">
          <span class="qs-label">0–60 mph</span>
          <span class="qs-val">${car.specs.acceleration.split(" ")[0]}</span>
        </div>
        <div class="qs-item">
          <span class="qs-label">Engine</span>
          <span class="qs-val" style="font-size:0.75rem">${car.specs.engine}</span>
        </div>
        <div class="qs-item">
          <span class="qs-label">Drive</span>
          <span class="qs-val" style="font-size:0.75rem">${car.specs.drivetrain}</span>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-price">
          <small>STARTING AT</small>
          ${car.price}
        </div>
        <div class="card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>`;

    el.addEventListener("click", () => openPanel(car.id));
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPanel(car.id);
        }
    });

    return el;
}

// ── RENDER: DETAIL PANEL ─────────────────────────
async function openPanel(id) {
    // Show panel with loading state first
    panelContent.innerHTML = `
    <div style="padding:4rem 2rem;text-align:center;color:var(--muted)">
      <div class="spin"></div>
      <p style="font-family:var(--font-mono);font-size:0.7rem;letter-spacing:0.2em">LOADING…</p>
    </div>`;

    panelOverlay.classList.add("open");
    detailPanel.classList.add("open");
    document.body.style.overflow = "hidden";

    const car = await fetchCarById(id);

    if (!car) {
        panelContent.innerHTML = `<p style="padding:2rem;color:var(--accent)">Failed to load vehicle data.</p>`;
        return;
    }

    const specEntries = Object.entries(car.specs);

    panelContent.innerHTML = `
    <div class="panel-img-wrap">
      <img src="${car.image}" alt="${car.name}" />
      <span class="panel-badge">${car.badge}</span>
    </div>

    <p class="panel-category">${car.category} · ${car.year}</p>
    <h2 class="panel-name">${car.name}</h2>
    <p class="panel-tagline">${car.tagline}</p>
    <p class="panel-desc">${car.description}</p>

    <p class="specs-label">// SPECIFICATIONS</p>
    <div class="specs-grid">
      ${specEntries.map(([k, v]) => `
        <div class="spec-item">
          <p class="spec-key">${formatKey(k)}</p>
          <p class="spec-val">${v}</p>
        </div>`).join("")}
    </div>

    <p class="highlights-label">// HIGHLIGHTS</p>
    <ul class="highlights-list">
      ${car.highlights.map(h => `<li>${h}</li>`).join("")}
    </ul>

    <div class="panel-price-bar">
      <div>
        <div class="price-tag">${car.price}</div>
        <div class="price-sub">STARTING MSRP (USD)</div>
      </div>
      <button class="btn-primary" onclick="handleConfigure(${car.id})">CONFIGURE</button>
    </div>`;

    // Scroll panel to top
    detailPanel.scrollTop = 0;
}

function closePanel() {
    panelOverlay.classList.remove("open");
    detailPanel.classList.remove("open");
    document.body.style.overflow = "";
}

function handleConfigure(id) {
    alert(`BMW Configurator would open for vehicle ID: ${id}\n(Connect to a real BMW API in production)`);
}

// ── FILTER ───────────────────────────────────────
function bindFilterTabs() {
    filterTabs.addEventListener("click", (e) => {
        const tab = e.target.closest(".filter-tab");
        if (!tab) return;

        document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        activeFilter = tab.dataset.filter;
        const filtered = activeFilter === "all"
            ? allCars
            : allCars.filter(c => c.category === activeFilter);

        renderGrid(filtered);
    });
}

// ── CLOSE PANEL ──────────────────────────────────
function bindPanelClose() {
    panelClose.addEventListener("click", closePanel);
    panelOverlay.addEventListener("click", closePanel);
}

function bindKeyboard() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closePanel();
    });
}

// ── HELPERS ──────────────────────────────────────
function showLoading(state) {
    loadingState.classList.toggle("hidden", !state);
}

function showError(state) {
    errorState.classList.toggle("hidden", !state);
}

function formatKey(camel) {
    return camel
        .replace(/([A-Z])/g, " $1")
        .toUpperCase()
        .trim();
}
const STORAGE_KEY = "local-companion-state-v1";
const APP_VERSION = "0.3.9";
const RELEASE_API_URL = "https://api.github.com/repos/rookepoole/LittleBird/releases/latest";

const defaultState = {
  profile: {
    name: "Owner",
    email: "owner@example.com",
    darkMode: false,
    notifications: true
  },
  business: {
    appName: "Little Bird",
    businessName: "My Business",
    businessType: "Product Business",
    primaryProduct: "Signature Product"
  },
  api: {
    baseUrl: ""
  },
  integrationSettings: {
    shopifyStoreDomain: "",
    metaAdAccountId: "",
    tiktokAdvertiserId: ""
  },
  ai: {
    provider: "ollama",
    model: "qwen2.5:3b",
    available: false,
    message: "Checking local LLM"
  },
  updates: {
    currentVersion: APP_VERSION,
    latestVersion: APP_VERSION,
    available: false,
    downloadUrl: "",
    releaseNotes: "",
    message: "Check for updates after the release feed is configured.",
    checkedAt: ""
  },
  dataMode: "connected",
  lastSync: "Connect to sync",
  store: {
    lastUpdated: "",
    primarySource: "",
    sources: {},
    catalog: {
      recentProducts: [],
      newProducts: [],
      topProducts: []
    },
    ads: {}
  },
  metrics: {
    revenueToday: 286,
    visitorsToday: 1248,
    orders24h: 7,
    conversionRate: 2.6,
    metaSpend: 68,
    tiktokSpend: 35,
    roas: 3.4,
    profit: 158,
    tiktokFollowers: 1240,
    instagramFollowers: 860,
    followsGained: 24,
    postsUploaded: 1,
    adSets: 3,
    productsAdded: 2,
    bestProduct: "Signature Product",
    trafficSource: "TikTok Organic",
    visitors7d: 8290,
    visitors30d: 27180,
    sales7d: 1835,
    sales30d: 7160,
    ctr: 1.9,
    tiktokViews: 18400
  },
  revenueTrend: [220, 260, 188, 310, 405, 330, 286],
  tasks: [
    { id: uid(), day: "Mon", name: "Video post + metrics update", category: "Content", completed: false },
    { id: uid(), day: "Tue", name: "Add or update product", category: "Project", completed: false },
    { id: uid(), day: "Wed", name: "Video + engage", category: "Content", completed: false },
    { id: uid(), day: "Thu", name: "Promo story", category: "Content", completed: false },
    { id: uid(), day: "Fri", name: "Analytics review", category: "Metrics", completed: false },
    { id: uid(), day: "Sat", name: "Creative work", category: "Project", completed: false },
    { id: uid(), day: "Sun", name: "Rest and idea capture", category: "Ideas", completed: false }
  ],
  goals: [
    {
      id: uid(),
      title: "Operating Reserve",
      description: "Build the cash reserve for tools, launches, and workspace upgrades.",
      target: 3500,
      current: 1050,
      status: "On Track",
      due: "2026-07-31",
      tasks: [
        { id: uid(), name: "List 5 new products", completed: true },
        { id: uid(), name: "Run jewelry close-up creative", completed: false }
      ]
    },
    {
      id: uid(),
      title: "Sales Channel Launch",
      description: "Move from setup and review into live selling.",
      target: 100,
      current: 70,
      status: "In Review",
      due: "2026-06-30",
      tasks: [
        { id: uid(), name: "Upload remaining verification files", completed: true },
        { id: uid(), name: "Prepare creator sample list", completed: false }
      ]
    },
    {
      id: uid(),
      title: "Catalog Expansion",
      description: "Grow the offer without losing the brand's core feel.",
      target: 24,
      current: 9,
      status: "Building",
      due: "2026-08-15",
      tasks: [
        { id: uid(), name: "Add two vendors", completed: false },
        { id: uid(), name: "Shoot new product photos", completed: false }
      ]
    }
  ],
  posts: [
    { id: uid(), platform: "TikTok", idea: "Close-up demo with founder note", due: "2026-06-15", status: "Planned" },
    { id: uid(), platform: "Instagram", idea: "Story promo for best seller", due: "2026-06-18", status: "Planned" }
  ],
  contentIdeas: "Behind the scenes: one minute process\nBefore and after product detail\nCustomer question: how to choose the right option",
  experiments: [
    {
      id: uid(),
      title: "Try new ad creative",
      start: "2026-06-14",
      end: "2026-06-21",
      status: "Running",
      notes: "Test warm product close-ups against a clean dark background.",
      result: ""
    },
    {
      id: uid(),
      title: "Post 1 TikTok per day",
      start: "2026-06-10",
      end: "2026-06-17",
      status: "Running",
      notes: "Focus on short maker-process clips.",
      result: ""
    }
  ],
  birdNotes: [
    {
      id: uid(),
      from: "bird",
      text: "Here is your top insight today: your traffic source is carrying the funnel, so keep the content rhythm steady and watch conversion.",
      createdAt: new Date().toISOString()
    },
    {
      id: uid(),
      from: "bird",
      text: "Shiny opportunity spotted: your ROAS is healthy enough to test one more small creative variation.",
      createdAt: new Date().toISOString()
    }
  ],
  integrations: {
    Shopify: "Not configured",
    "TikTok Shop": "Not configured",
    "Meta Ads": "Not configured"
  }
};

let state = normalizeState(loadState());
let route = "home";
let toastTimer;
let birdDraft = "";

const screen = document.querySelector("#screen");
const viewTitle = document.querySelector("#viewTitle");
const wordmark = document.querySelector("#wordmark");
const modalRoot = document.querySelector("#modalRoot");
const toast = document.querySelector("#toast");
const fabButton = document.querySelector("#fabButton");

const titles = {
  home: "Dashboard",
  goals: "Goals",
  metrics: "Metrics",
  experiments: "Tests",
  bird: "Little Bird"
};

const fabKinds = {
  home: "settings",
  goals: "task",
  metrics: "birdNote",
  experiments: "experiment",
  bird: "birdNote"
};

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  render();
  wireGlobalEvents();
  handleOAuthReturn();
  refreshIntegrationStatus();
  refreshBirdStatus();
  refreshUpdateStatus(false);
  registerServiceWorker();
});

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredCloneSafe(defaultState);
    return mergeDeep(structuredCloneSafe(defaultState), saved);
  } catch {
    return structuredCloneSafe(defaultState);
  }
}

function normalizeState(nextState) {
  nextState.business = { ...defaultState.business, ...(nextState.business || {}) };
  nextState.api = nextState.api || { baseUrl: "" };
  nextState.ai = { ...defaultState.ai, ...(nextState.ai || {}) };
  nextState.updates = { ...defaultState.updates, ...(nextState.updates || {}), currentVersion: APP_VERSION };
  nextState.dataMode = nextState.dataMode || defaultState.dataMode;
  if (nextState.lastSync === "Manual MVP") nextState.lastSync = defaultState.lastSync;
  nextState.store = mergeDeep(structuredCloneSafe(defaultState.store), nextState.store || {});
  nextState.integrationSettings = nextState.integrationSettings || {};
  nextState.integrationSettings.shopifyStoreDomain = nextState.integrationSettings.shopifyStoreDomain || "";
  nextState.integrationSettings.metaAdAccountId = nextState.integrationSettings.metaAdAccountId || "";
  nextState.integrationSettings.tiktokAdvertiserId = nextState.integrationSettings.tiktokAdvertiserId || "";
  for (const key of ["Shopify", "TikTok Shop", "Meta Ads"]) {
    if (nextState.integrations?.[key] === "Connect") {
      nextState.integrations[key] = "Not configured";
    }
    if (nextState.integrations?.[key] === "Needs env") {
      nextState.integrations[key] = "Needs app setup";
    }
  }
  return nextState;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDeep(base, saved) {
  for (const [key, value] of Object.entries(saved)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key]) {
      base[key] = mergeDeep(base[key], value);
    } else {
      base[key] = value;
    }
  }
  return base;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyTheme() {
  document.body.dataset.theme = state.profile.darkMode ? "dark" : "light";
}

function makeWordmark(value) {
  const words = String(value || "Little Bird")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "BIRD";
  if (words.length === 1) return words[0].slice(0, 8).toUpperCase();
  return words.map((word) => word[0]).join("").slice(0, 8).toUpperCase();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  if (isDesktopShell()) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {
        // Desktop runs live from the bundled local server and does not need offline caching.
      });
    return;
  }
  navigator.serviceWorker.register("service-worker.js").catch(() => {
    // The app remains fully usable without offline caching.
  });
}

function isDesktopShell() {
  return new URLSearchParams(location.search).get("desktop") === "1" || /\bElectron\b/i.test(navigator.userAgent);
}

function wireGlobalEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route));
  });

  document.querySelector("#settingsButton").addEventListener("click", () => openModal("settings"));
  fabButton.addEventListener("click", () => openModal(fabKinds[route]));

  screen.addEventListener("click", handleScreenClick);
  screen.addEventListener("submit", handleScreenSubmit);
  screen.addEventListener("input", handleScreenInput);
  modalRoot.addEventListener("click", handleModalClick);
  modalRoot.addEventListener("submit", handleModalSubmit);
}

function setRoute(nextRoute) {
  if (!titles[nextRoute]) return;
  route = nextRoute;
  render();
  screen.scrollTop = 0;
}

function render() {
  const activeWasBirdInput = document.activeElement?.matches?.(".bird-compose input[name='message']");
  const existingBirdInput = screen.querySelector(".bird-compose input[name='message']");
  if (existingBirdInput) birdDraft = existingBirdInput.value;

  document.body.dataset.route = route;
  const appName = state.business?.appName || defaultState.business.appName;
  const businessName = state.business?.businessName || defaultState.business.businessName;
  document.title = `${appName} - ${titles[route]}`;
  wordmark.textContent = makeWordmark(appName || businessName);
  viewTitle.textContent = titles[route];
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.route === route);
  });

  const renderers = {
    home: renderHome,
    goals: renderGoals,
    metrics: renderMetrics,
    experiments: renderExperiments,
    bird: renderBird
  };

  screen.innerHTML = renderers[route]();
  requestAnimationFrame(() => {
    const birdInput = screen.querySelector(".bird-compose input[name='message']");
    if (birdInput) {
      birdInput.value = birdDraft;
      if (activeWasBirdInput) {
        birdInput.focus();
        birdInput.setSelectionRange(birdInput.value.length, birdInput.value.length);
      }
    }
    screen.querySelectorAll(".progress-fill").forEach((bar) => {
      bar.style.width = `${bar.dataset.progress}%`;
    });
  });
}

function renderHome() {
  const completedToday = state.tasks.filter((task) => task.completed).length;
  const totalToday = state.tasks.length;
  const topGoals = state.goals.slice(0, 2).map(renderProjectCard).join("");
  const todayTasks = state.tasks.slice(0, 4).map(renderTaskRow).join("");
  const businessName = state.business?.businessName || defaultState.business.businessName;

  return `
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="date-line">${escapeHTML(`${businessName} - ${formatToday()}`)}</p>
        <h2>${money(state.metrics.revenueToday)}</h2>
        <p>${escapeHTML(makeHomeInsight())}</p>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><span>Profit</span><strong>${money(state.metrics.profit)}</strong></div>
        <div class="hero-stat"><span>Tasks</span><strong>${completedToday}/${totalToday}</strong></div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Daily Dashboard</h2>
        <span class="tag blue">${escapeHTML(state.lastSync)}</span>
      </div>
      <div class="kpi-grid">
        ${renderKpi("Revenue", money(state.metrics.revenueToday), "icon-dollar")}
        ${renderKpi("Visitors", number(state.metrics.visitorsToday), "icon-users")}
        ${renderKpi("Conversion", `${state.metrics.conversionRate}%`, "icon-chart")}
        ${renderKpi("ROAS", `${state.metrics.roas}x`, "icon-sync")}
      </div>
    </section>

    <section class="section">
      <div class="quick-actions">
        <button class="button" type="button" data-action="open-modal" data-kind="settings"><svg><use href="#icon-bag"></use></svg><span>Connect Store</span></button>
        <button class="button secondary" type="button" data-route="experiments"><svg><use href="#icon-video"></use></svg><span>Post Content</span></button>
        <button class="button gold" type="button" data-action="sync" data-source="all"><svg><use href="#icon-sync"></use></svg><span>Sync Store</span></button>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Project Tracker</h2>
        <button class="small-action" type="button" data-route="goals">View</button>
      </div>
      <div class="project-list">${topGoals}</div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Today</h2>
        <button class="small-action" type="button" data-action="open-modal" data-kind="task"><svg><use href="#icon-plus"></use></svg>Add</button>
      </div>
      <div class="card">
        ${todayTasks || emptyState("No tasks yet.")}
      </div>
    </section>
  `;
}

function renderGoals() {
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Goals and Projects</h2>
          <p class="date-line">${state.goals.length} active tracks</p>
        </div>
        <button class="small-action" type="button" data-action="open-modal" data-kind="project"><svg><use href="#icon-plus"></use></svg>Project</button>
      </div>
      <div class="project-list">${state.goals.map(renderProjectCard).join("")}</div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Weekly Calendar</h2>
        <button class="small-action" type="button" data-action="open-modal" data-kind="task"><svg><use href="#icon-calendar"></use></svg>Task</button>
      </div>
      <div class="calendar-list">${state.tasks.map(renderCalendarRow).join("")}</div>
    </section>
  `;
}

function renderMetrics() {
  const recentProducts = state.store?.catalog?.recentProducts || [];
  const newProducts = state.store?.catalog?.newProducts || [];
  const topProducts = state.store?.catalog?.topProducts || [];
  const connectedSources = Object.values(state.integrations || {}).filter((status) => status === "Connected").length;
  const bars = state.revenueTrend.map((value, index, arr) => {
    const max = Math.max(...arr, 1);
    const height = Math.max(18, Math.round((value / max) * 100));
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    return `<div class="bar"><span style="height:${height}%"></span><small>${labels[index]}</small></div>`;
  }).join("");

  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Live Store Metrics</h2>
          <p class="date-line">${connectedSources ? `${connectedSources} connected source${connectedSources === 1 ? "" : "s"}` : "Connect a store to replace sample metrics"}</p>
        </div>
        <button class="small-action" type="button" data-action="open-modal" data-kind="metric"><svg><use href="#icon-pen"></use></svg>Override</button>
      </div>
      <div class="metric-list">
        ${renderMetricCard("Website Visitors", number(state.metrics.visitorsToday), "Today", "icon-users")}
        ${renderMetricCard("Conversion Rate", `${state.metrics.conversionRate}%`, "Storefront", "icon-chart")}
        ${renderMetricCard("Total Sales", money(state.metrics.sales30d), "Last 30 days", "icon-dollar")}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Revenue Trend</h2>
        <span class="tag green">7 day</span>
      </div>
      <div class="bar-chart">${bars}</div>
    </section>

    <section class="section">
      <div class="card stack">
        <div class="row-between"><span class="tiny-label">Best Product</span><strong>${escapeHTML(state.metrics.bestProduct)}</strong></div>
        <div class="row-between"><span class="tiny-label">Top Traffic Source</span><strong>${escapeHTML(state.metrics.trafficSource)}</strong></div>
        <div class="row-between"><span class="tiny-label">TikTok Followers</span><strong>${number(state.metrics.tiktokFollowers)}</strong></div>
        <div class="row-between"><span class="tiny-label">Instagram Followers</span><strong>${number(state.metrics.instagramFollowers)}</strong></div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Store Sync</h2>
        <span class="tag blue">${escapeHTML(state.lastSync)}</span>
      </div>
      <div class="sync-grid">
        <button class="chip" type="button" data-action="sync-source" data-source="shopify"><svg><use href="#icon-bag"></use></svg>Shopify</button>
        <button class="chip" type="button" data-action="sync-source" data-source="tiktok"><svg><use href="#icon-video"></use></svg>TikTok</button>
        <button class="chip" type="button" data-action="sync-source" data-source="meta"><svg><use href="#icon-chart"></use></svg>Meta</button>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <h2>Catalog Intelligence</h2>
          <p class="date-line">${recentProducts.length ? `${recentProducts.length} products available for Little Bird` : "Sync a store so Little Bird can reason from products"}</p>
        </div>
        <button class="small-action" type="button" data-route="bird"><svg><use href="#icon-bird"></use></svg>Ask</button>
      </div>
      <div class="card stack">
        <div class="row-between"><span class="tiny-label">New or Changed</span><strong>${newProducts.length ? escapeHTML(newProducts.slice(0, 2).map((item) => item.title).join(", ")) : "None synced"}</strong></div>
        <div class="row-between"><span class="tiny-label">Top Products</span><strong>${topProducts.length ? escapeHTML(topProducts.slice(0, 2).map((item) => item.title).join(", ")) : escapeHTML(state.metrics.bestProduct)}</strong></div>
        <div class="row-between"><span class="tiny-label">Recent Catalog</span><strong>${recentProducts.length ? escapeHTML(recentProducts.slice(0, 2).map((item) => item.title).join(", ")) : "Waiting for sync"}</strong></div>
      </div>
    </section>

    <section class="section">
      <div class="card stack">
        <div class="row-between"><span class="tiny-label">Visitors 7d</span><strong>${number(state.metrics.visitors7d)}</strong></div>
        <div class="row-between"><span class="tiny-label">Visitors 30d</span><strong>${number(state.metrics.visitors30d)}</strong></div>
        <div class="row-between"><span class="tiny-label">Orders Today</span><strong>${number(state.metrics.orders24h)}</strong></div>
        <div class="row-between"><span class="tiny-label">Meta Spend</span><strong>${money(state.metrics.metaSpend)}</strong></div>
        <div class="row-between"><span class="tiny-label">TikTok Views</span><strong>${number(state.metrics.tiktokViews)}</strong></div>
        <div class="row-between"><span class="tiny-label">CTR</span><strong>${state.metrics.ctr}%</strong></div>
      </div>
    </section>
  `;
}

function renderExperiments() {
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Experiment Builder</h2>
          <p class="date-line">${state.experiments.filter((item) => item.status === "Running").length} running</p>
        </div>
        <button class="small-action" type="button" data-action="open-modal" data-kind="experiment"><svg><use href="#icon-plus"></use></svg>Test</button>
      </div>
      <div class="experiment-list">${state.experiments.map(renderExperimentCard).join("")}</div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Content Planner</h2>
        <button class="small-action" type="button" data-action="open-modal" data-kind="post"><svg><use href="#icon-plus"></use></svg>Post</button>
      </div>
      <div class="post-list">
        ${state.posts.map(renderPostRow).join("") || emptyState("No planned posts yet.")}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Content Ideas</h2>
      </div>
      <div class="idea-box">
        <textarea id="contentIdeas" aria-label="Content ideas">${escapeHTML(state.contentIdeas)}</textarea>
      </div>
    </section>
  `;
}

function renderBird() {
  const ai = state.ai || defaultState.ai;
  const aiLabel = ai.available ? `Local ${ai.model || "LLM"}` : "Fallback";
  const aiClass = ai.available ? "green" : "blue";
  const productCount = state.store?.catalog?.recentProducts?.length || 0;
  const notes = state.birdNotes.map((message) => `
    <article class="message ${message.from === "bird" ? "from-bird" : "from-user"}">
      <small>${message.from === "bird" ? "Little Bird" : "You"} - ${escapeHTML(formatTime(message.createdAt))}</small>
      <p>${escapeHTML(message.text)}</p>
    </article>
  `).join("");

  return `
    <section class="section">
      <div class="card stack">
        <div class="row-between">
          <span class="icon-chip"><svg><use href="#icon-bird"></use></svg></span>
          <span class="tag ${aiClass}">${escapeHTML(aiLabel)}</span>
        </div>
        <h2>${escapeHTML(birdHeadline())}</h2>
        <p class="muted">${escapeHTML(makeBirdInsight())}</p>
        <p class="date-line">${escapeHTML(`${ai.message || "Local LLM status unavailable"} - ${productCount ? `${productCount} synced products` : "sync a store for product context"}`)}</p>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Priority Inbox</h2>
        <button class="small-action" type="button" data-action="generate-insight"><svg><use href="#icon-sync"></use></svg>Insight</button>
      </div>
      <div class="message-list">${notes || emptyState("No bird notes yet.")}</div>
    </section>

    <section class="section">
      <form class="bird-compose" data-form="bird-inline">
        <input name="message" type="text" autocomplete="off" value="${escapeHTML(birdDraft)}" placeholder="Ask for analysis, ideas, or reminders" aria-label="Bird message">
        <button class="send-button" type="button" data-action="send-bird-inline" aria-label="Send message"><svg><use href="#icon-send"></use></svg></button>
      </form>
    </section>
  `;
}

function renderKpi(label, value, icon) {
  return `
    <button class="kpi-card" type="button" data-route="metrics">
      <span class="kpi-icon"><svg><use href="#${icon}"></use></svg></span>
      <span>
        <span class="kpi-label">${escapeHTML(label)}</span>
        <strong class="kpi-value">${escapeHTML(value)}</strong>
      </span>
    </button>
  `;
}

function renderMetricCard(label, value, meta, icon) {
  return `
    <article class="metric-card">
      <span class="icon-chip"><svg><use href="#${icon}"></use></svg></span>
      <div>
        <strong>${escapeHTML(value)}</strong>
        <p>${escapeHTML(label)} - ${escapeHTML(meta)}</p>
      </div>
    </article>
  `;
}

function renderProjectCard(project) {
  const progress = progressPercent(project.current, project.target);
  const goalLabel = project.target === 100 ? `${project.current}% of ${project.target}%` : `${money(project.current)} of ${money(project.target)}`;
  const taskRows = project.tasks.slice(0, 2).map((task) => `
    <div class="task-row ${task.completed ? "is-done" : ""}">
      <button class="check-button" type="button" data-action="toggle-goal-task" data-project-id="${project.id}" data-task-id="${task.id}" aria-label="Toggle ${escapeHTML(task.name)}">
        <svg><use href="#icon-check"></use></svg>
      </button>
      <div class="task-copy">
        <p class="task-name">${escapeHTML(task.name)}</p>
      </div>
    </div>
  `).join("");

  return `
    <article class="project-card">
      <div class="project-title-row">
        <div>
          <h3>${escapeHTML(project.title)}</h3>
          <p class="date-line">${escapeHTML(project.description)}</p>
        </div>
        <span class="tag ${statusClass(project.status)}">${escapeHTML(project.status)}</span>
      </div>
      <div>
        <div class="progress-track"><div class="progress-fill" data-progress="${progress}"></div></div>
        <div class="project-meta"><span>${goalLabel}</span><span>${progress}%</span></div>
      </div>
      <div>${taskRows}</div>
    </article>
  `;
}

function renderTaskRow(task) {
  return `
    <div class="task-row ${task.completed ? "is-done" : ""}">
      <button class="check-button" type="button" data-action="toggle-task" data-id="${task.id}" aria-label="Toggle ${escapeHTML(task.name)}">
        <svg><use href="#icon-check"></use></svg>
      </button>
      <div class="task-copy">
        <p class="task-name">${escapeHTML(task.name)}</p>
        <p class="task-meta">${escapeHTML(task.day)} - ${escapeHTML(task.category)}</p>
      </div>
    </div>
  `;
}

function renderCalendarRow(task) {
  return `
    <article class="calendar-row">
      <span class="day-pill">${escapeHTML(task.day)}</span>
      <div class="task-copy">
        <p class="task-name">${escapeHTML(task.name)}</p>
        <p class="task-meta">${escapeHTML(task.category)} - ${task.completed ? "Complete" : "Pending"}</p>
      </div>
    </article>
  `;
}

function renderPostRow(post) {
  return `
    <article class="post-row">
      <span class="icon-chip"><svg><use href="#${post.platform === "TikTok" ? "icon-video" : "icon-pen"}"></use></svg></span>
      <div class="post-copy">
        <strong>${escapeHTML(post.idea)}</strong>
        <span>${escapeHTML(post.platform)} - due ${escapeHTML(shortDate(post.due))}</span>
      </div>
      <button class="small-action ${post.status === "Done" ? "is-complete" : ""}" type="button" data-action="toggle-post" data-id="${post.id}">
        ${post.status === "Done" ? "Done" : "Plan"}
      </button>
    </article>
  `;
}

function renderExperimentCard(experiment) {
  return `
    <article class="experiment-card">
      <div class="project-title-row">
        <div>
          <h3>${escapeHTML(experiment.title)}</h3>
          <p class="date-line">${escapeHTML(experiment.notes)}</p>
        </div>
        <span class="tag ${statusClass(experiment.status)}">${escapeHTML(experiment.status)}</span>
      </div>
      <div class="experiment-meta">
        <span>${escapeHTML(shortDate(experiment.start))}</span>
        <span>${escapeHTML(shortDate(experiment.end))}</span>
      </div>
      ${experiment.result ? `<p class="muted">${escapeHTML(experiment.result)}</p>` : ""}
      <button class="small-action" type="button" data-action="toggle-experiment" data-id="${experiment.id}">
        ${experiment.status === "Complete" ? "Reopen" : "Finish"}
      </button>
    </article>
  `;
}

function handleScreenClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.route) {
    setRoute(button.dataset.route);
    return;
  }

  const { action, kind, id, projectId, taskId, source } = button.dataset;

  if (action === "open-modal") openModal(kind);
  if (action === "sync") syncMetrics(source || "all");
  if (action === "sync-source") syncSource(source);
  if (action === "toggle-task") toggleTask(id);
  if (action === "toggle-goal-task") toggleGoalTask(projectId, taskId);
  if (action === "toggle-post") togglePost(id);
  if (action === "toggle-experiment") toggleExperiment(id);
  if (action === "generate-insight") generateBirdInsight();
  if (action === "send-bird-inline") submitBirdInline(button.closest("form"));
}

function handleScreenSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (form.dataset.form !== "bird-inline") return;
  submitBirdInline(form);
}

async function submitBirdInline(form) {
  if (!form) return;
  const input = form.elements.message;
  const text = input.value.trim();
  if (!text) return;
  birdDraft = "";
  input.value = "";
  await sendBirdMessage(text);
}

function handleScreenInput(event) {
  if (event.target.matches(".bird-compose input[name='message']")) {
    birdDraft = event.target.value;
    return;
  }
  if (event.target.id !== "contentIdeas") return;
  state.contentIdeas = event.target.value;
  saveState();
}

function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveState();
  render();
}

function toggleGoalTask(projectId, taskId) {
  const project = state.goals.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  saveState();
  render();
}

function togglePost(id) {
  const post = state.posts.find((item) => item.id === id);
  if (!post) return;
  post.status = post.status === "Done" ? "Planned" : "Done";
  saveState();
  render();
}

function toggleExperiment(id) {
  const experiment = state.experiments.find((item) => item.id === id);
  if (!experiment) return;
  experiment.status = experiment.status === "Complete" ? "Running" : "Complete";
  if (experiment.status === "Complete" && !experiment.result) {
    experiment.result = "Ready for results review.";
  }
  saveState();
  render();
}

async function syncMetrics(source = "all") {
  showToast("Syncing...");
  try {
    const payload = await fetchIntegrationSync(source);
    applyIntegrationPayload(payload);
    saveState();
    render();
    showToast(payload.warnings?.length ? "Synced with notes" : "Metrics synced");
  } catch (error) {
    showToast("Integration server offline");
    addBirdMessage("bird", `Live sync needs the local integration server. ${error.message}`);
    saveState();
    render();
  }
}

function syncSource(source) {
  syncMetrics(source);
}

async function fetchIntegrationSync(source) {
  const response = await fetch(`${getApiBase()}/api/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !payload.metrics) {
    throw new Error(payload.error || `Server returned ${response.status}`);
  }
  return payload;
}

function applyIntegrationPayload(payload) {
  if (payload.metrics) {
    Object.assign(state.metrics, payload.metrics);
    state.revenueTrend[state.revenueTrend.length - 1] = state.metrics.revenueToday;
  }
  if (payload.store) {
    state.store = mergeDeep(structuredCloneSafe(state.store || defaultState.store), payload.store);
    const bestProduct = state.store.catalog?.topProducts?.[0]?.title || state.store.catalog?.recentProducts?.[0]?.title;
    if (bestProduct) state.metrics.bestProduct = bestProduct;
  }
  if (payload.integrations) {
    Object.assign(state.integrations, payload.integrations);
  }
  state.lastSync = payload.lastSync ? `Synced ${formatTime(payload.lastSync)}` : "Synced now";
  if (payload.warnings?.length) {
    addBirdMessage("bird", `Sync note: ${payload.warnings.join(" ")}`);
  } else {
    addBirdMessage("bird", "Live metrics refreshed. Review the dashboard before changing budget or content rhythm.");
  }
}

function getApiBase() {
  const customBase = state.api?.baseUrl?.trim();
  if (customBase) return customBase.replace(/\/$/, "");
  if (location.protocol === "file:") return "http://127.0.0.1:4173";
  return "";
}

function handleOAuthReturn() {
  const params = new URLSearchParams(location.search);
  const connected = params.get("connected");
  const errorProvider = params.get("integrationError");
  const message = params.get("message");

  if (connected) {
    showToast(`${providerLabel(connected)} connected`);
    addBirdMessage("bird", `${providerLabel(connected)} is connected. You can sync live metrics now.`);
    saveState();
  }
  if (errorProvider) {
    showToast(`${providerLabel(errorProvider)} login needs attention`);
    addBirdMessage("bird", `${providerLabel(errorProvider)} login did not finish. ${message || "Check the integration setup and try again."}`);
    saveState();
  }
  if ((connected || errorProvider) && history.replaceState) {
    history.replaceState({}, "", location.pathname || "/");
  }
}

async function refreshIntegrationStatus() {
  try {
    const response = await fetch(`${getApiBase()}/api/integrations`);
    if (!response.ok) return;
    const payload = await response.json();
    if (payload.integrations) Object.assign(state.integrations, payload.integrations);
    if (payload.details?.shopify?.shop) state.integrationSettings.shopifyStoreDomain = payload.details.shopify.shop;
    if (payload.details?.meta?.adAccountId) state.integrationSettings.metaAdAccountId = payload.details.meta.adAccountId;
    if (payload.details?.tiktok?.advertiserId) state.integrationSettings.tiktokAdvertiserId = payload.details.tiktok.advertiserId;
    saveState();
    render();
  } catch {
    // The app still works manually when the local integration server is not running.
  }
}

async function refreshBirdStatus() {
  try {
    const response = await fetch(`${getApiBase()}/api/bird/status`);
    if (!response.ok) return;
    const payload = await response.json();
    state.ai = {
      provider: payload.provider || "ollama",
      model: payload.model || state.ai?.model || defaultState.ai.model,
      available: Boolean(payload.available),
      message: payload.message || "Local LLM status unavailable"
    };
    saveState();
    if (route === "bird") render();
  } catch {
    state.ai = {
      ...state.ai,
      available: false,
      message: "Open the app through the local server to use the Little Bird LLM."
    };
    saveState();
    if (route === "bird") render();
  }
}

async function refreshUpdateStatus(showResult = false) {
  try {
    const response = await fetch(`${getApiBase()}/api/update`);
    const payload = await response.json().catch(() => ({}));
    const updatePayload = response.status === 404 ? await fetchReleaseUpdateFallback() : payload;
    if (!response.ok && response.status !== 404 && !payload.message) throw new Error(`Server returned ${response.status}`);
    state.updates = {
      ...state.updates,
      currentVersion: updatePayload.currentVersion || APP_VERSION,
      latestVersion: updatePayload.latestVersion || state.updates.latestVersion || APP_VERSION,
      available: Boolean(updatePayload.updateAvailable),
      downloadUrl: updatePayload.downloadUrl || "",
      releaseNotes: updatePayload.releaseNotes || "",
      message: updatePayload.message || "Update status unavailable.",
      checkedAt: new Date().toISOString()
    };
    saveState();
    if (modalRoot.querySelector("form[data-form='settings']")) modalRoot.innerHTML = renderModal("settings");
    if (showResult) showToast(state.updates.available ? "Update available" : state.updates.message);
  } catch (error) {
    state.updates = {
      ...state.updates,
      available: false,
      message: `Update check failed. ${error.message}`,
      checkedAt: new Date().toISOString()
    };
    saveState();
    if (modalRoot.querySelector("form[data-form='settings']")) modalRoot.innerHTML = renderModal("settings");
    if (showResult) showToast("Update check failed");
  }
}

async function fetchReleaseUpdateFallback() {
  const response = await fetch(RELEASE_API_URL, { headers: { Accept: "application/json" } });
  const manifest = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub release feed returned ${response.status}`);
  const asset = Array.isArray(manifest.assets)
    ? manifest.assets.find((item) => String(item.name || "").toLowerCase().endsWith(".exe")) || manifest.assets[0]
    : null;
  const latestVersion = stripVersionPrefix(manifest.tag_name || manifest.version || APP_VERSION);
  const updateAvailable = compareVersions(latestVersion, APP_VERSION) > 0;
  return {
    currentVersion: APP_VERSION,
    latestVersion,
    updateAvailable,
    downloadUrl: asset?.browser_download_url || "",
    releaseNotes: manifest.body || "",
    message: updateAvailable
      ? "A newer Little Bird installer is available."
      : "Little Bird is up to date. The local server update endpoint was missing, so GitHub Releases was checked directly."
  };
}

function stripVersionPrefix(value) {
  return String(value || "").trim().replace(/^v/i, "");
}

function compareVersions(a, b) {
  const left = stripVersionPrefix(a).split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const right = stripVersionPrefix(b).split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] || 0) - (right[index] || 0);
    if (diff) return diff;
  }
  return 0;
}

function openUpdateDownload() {
  const url = state.updates?.downloadUrl || "";
  if (!/^https:\/\//i.test(url)) {
    showToast("No secure update link available");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function connectIntegration(provider) {
  const form = modalRoot.querySelector("form");
  if (form?.dataset.form === "settings") {
    captureSettingsForm(form);
    saveState();
  }

  const params = new URLSearchParams();
  if (provider === "shopify") {
    const shop = state.integrationSettings.shopifyStoreDomain;
    if (!shop) {
      showToast("Enter Shopify store domain");
      form?.elements.shopifyStoreDomain?.focus();
      return;
    }
    params.set("shop", shop);
  }
  if (provider === "meta" && state.integrationSettings.metaAdAccountId) {
    params.set("adAccountId", state.integrationSettings.metaAdAccountId);
  }
  if (provider === "tiktok" && state.integrationSettings.tiktokAdvertiserId) {
    params.set("advertiserId", state.integrationSettings.tiktokAdvertiserId);
  }

  const suffix = params.toString() ? `?${params}` : "";
  location.href = `${getApiBase()}/auth/${provider}/start${suffix}`;
}

function captureSettingsForm(form) {
  state.api.baseUrl = clean(form.elements.apiBaseUrl?.value);
  state.integrationSettings.shopifyStoreDomain = clean(form.elements.shopifyStoreDomain?.value);
  state.integrationSettings.metaAdAccountId = clean(form.elements.metaAdAccountId?.value);
  state.integrationSettings.tiktokAdvertiserId = clean(form.elements.tiktokAdvertiserId?.value);
}

async function disconnectIntegration(provider) {
  try {
    const response = await fetch(`${getApiBase()}/api/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Disconnect failed");
    if (payload.integrations) Object.assign(state.integrations, payload.integrations);
    saveState();
    modalRoot.innerHTML = renderModal("settings");
    showToast(`${providerLabel(provider)} disconnected`);
  } catch (error) {
    showToast(error.message);
  }
}

function providerLabel(provider = "") {
  const key = String(provider).toLowerCase();
  if (key === "shopify") return "Shopify";
  if (key === "meta") return "Meta Ads";
  if (key === "tiktok") return "TikTok Shop";
  return provider;
}

function generateBirdInsight() {
  addBirdMessage("bird", makeBirdInsight());
  saveState();
  render();
  showToast("Insight added");
}

function addBirdMessage(from, text) {
  state.birdNotes.push({
    id: uid(),
    from,
    text,
    createdAt: new Date().toISOString()
  });
}

async function sendBirdMessage(text) {
  const message = clean(text);
  if (!message) return false;

  addBirdMessage("user", message);
  saveState();
  render();
  showToast("Little Bird is thinking...");

  try {
    const reply = await fetchBirdReply(message);
    addBirdMessage("bird", reply.text);
    state.ai = reply.ai;
    showToast(reply.ai.available ? "Little Bird replied" : "Little Bird fallback used");
  } catch (error) {
    addBirdMessage("bird", generateBirdReply(message));
    state.ai = {
      ...state.ai,
      available: false,
      message: error.message || "Local LLM unavailable"
    };
    showToast("Little Bird fallback used");
  }

  saveState();
  render();
  return true;
}

async function fetchBirdReply(message) {
  const response = await fetch(`${getApiBase()}/api/bird/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      business: state.business,
      store: state.store,
      metrics: state.metrics,
      goals: state.goals,
      tasks: state.tasks,
      experiments: state.experiments
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !payload.text) {
    throw new Error(payload.error || `Server returned ${response.status}`);
  }

  const usedLocalModel = payload.ok && payload.provider === "ollama";
  return {
    text: payload.text || generateBirdReply(message),
    ai: {
      provider: payload.provider || "fallback",
      model: payload.model || state.ai?.model || defaultState.ai.model,
      available: usedLocalModel,
      message: usedLocalModel
        ? `Local LLM ready: ${payload.model || state.ai?.model || defaultState.ai.model}`
        : payload.error || "Using built-in fallback until Ollama is ready"
    }
  };
}

function openModal(kind) {
  fabButton.classList.add("is-open");
  modalRoot.classList.add("is-open");
  modalRoot.setAttribute("aria-hidden", "false");
  modalRoot.innerHTML = renderModal(kind);
  const firstInput = modalRoot.querySelector("input, textarea, select, button");
  firstInput?.focus();
}

function closeModal() {
  fabButton.classList.remove("is-open");
  modalRoot.classList.remove("is-open");
  modalRoot.setAttribute("aria-hidden", "true");
  modalRoot.innerHTML = "";
}

async function handleModalClick(event) {
  if (event.target === modalRoot || event.target.closest("[data-action='close-modal']")) {
    closeModal();
    return;
  }

  const updateButton = event.target.closest("[data-action='check-update'], [data-action='open-update']");
  if (updateButton) {
    const form = modalRoot.querySelector("form[data-form='settings']");
    if (form) {
      captureSettingsForm(form);
      saveState();
    }
    if (updateButton.dataset.action === "check-update") {
      await refreshUpdateStatus(true);
      return;
    }
    openUpdateDownload();
    return;
  }

  const integrationButton = event.target.closest("[data-action='connect-integration'], [data-action='disconnect-integration'], [data-action='sync-modal-source']");
  if (integrationButton) {
    const { action, provider } = integrationButton.dataset;
    if (action === "connect-integration") connectIntegration(provider);
    if (action === "disconnect-integration") await disconnectIntegration(provider);
    if (action === "sync-modal-source") syncMetrics(provider);
    return;
  }

  const toggle = event.target.closest("[data-action='toggle-setting']");
  if (!toggle) return;
  const field = toggle.dataset.field;
  state.profile[field] = !state.profile[field];
  toggle.setAttribute("aria-pressed", String(state.profile[field]));
  if (field === "darkMode") applyTheme();
  saveState();
}

async function handleModalSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const kind = form.dataset.form;

  if (kind === "metric") {
    updateMetricData(data);
    showToast("Metrics updated");
  }
  if (kind === "task") {
    state.tasks.push({
      id: uid(),
      day: data.get("day"),
      name: clean(data.get("name")),
      category: data.get("category"),
      completed: false
    });
    showToast("Task added");
  }
  if (kind === "project") {
    state.goals.unshift({
      id: uid(),
      title: clean(data.get("title")),
      description: clean(data.get("description")),
      target: toNumber(data.get("target"), 100),
      current: toNumber(data.get("current"), 0),
      status: data.get("status"),
      due: data.get("due"),
      tasks: []
    });
    showToast("Project created");
  }
  if (kind === "post") {
    state.posts.unshift({
      id: uid(),
      platform: data.get("platform"),
      idea: clean(data.get("idea")),
      due: data.get("due"),
      status: "Planned"
    });
    showToast("Post planned");
  }
  if (kind === "experiment") {
    state.experiments.unshift({
      id: uid(),
      title: clean(data.get("title")),
      start: data.get("start"),
      end: data.get("end"),
      status: "Running",
      notes: clean(data.get("notes")),
      result: ""
    });
    showToast("Experiment started");
  }
  if (kind === "birdNote") {
    const text = clean(data.get("message"));
    closeModal();
    await sendBirdMessage(text);
    return;
  }
  if (kind === "settings") {
    state.profile.name = clean(data.get("name"));
    state.profile.email = clean(data.get("email"));
    state.business.appName = clean(data.get("appName")) || defaultState.business.appName;
    state.business.businessName = clean(data.get("businessName")) || defaultState.business.businessName;
    state.business.businessType = clean(data.get("businessType")) || defaultState.business.businessType;
    state.business.primaryProduct = clean(data.get("primaryProduct")) || defaultState.business.primaryProduct;
    if (!state.metrics.bestProduct || state.metrics.bestProduct === defaultState.metrics.bestProduct) {
      state.metrics.bestProduct = state.business.primaryProduct;
    }
    state.api.baseUrl = clean(data.get("apiBaseUrl"));
    state.integrationSettings.shopifyStoreDomain = clean(data.get("shopifyStoreDomain"));
    state.integrationSettings.metaAdAccountId = clean(data.get("metaAdAccountId"));
    state.integrationSettings.tiktokAdvertiserId = clean(data.get("tiktokAdvertiserId"));
    showToast("Settings saved");
  }

  saveState();
  closeModal();
  render();
}

function renderModal(kind) {
  const modalMap = {
    metric: metricModal,
    task: taskModal,
    project: projectModal,
    post: postModal,
    experiment: experimentModal,
    birdNote: birdNoteModal,
    settings: settingsModal
  };
  return `
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      ${modalMap[kind]()}
    </section>
  `;
}

function modalHeader(title) {
  return `
    <div class="modal-header">
      <h2 id="modalTitle">${escapeHTML(title)}</h2>
      <button class="modal-close" type="button" data-action="close-modal" aria-label="Close">X</button>
    </div>
  `;
}

function metricModal() {
  const m = state.metrics;
  return `
    ${modalHeader("Manual Override")}
    <form class="form-grid" data-form="metric">
      ${numberField("revenueToday", "Revenue Today", m.revenueToday)}
      ${numberField("visitorsToday", "Visitors Today", m.visitorsToday)}
      ${numberField("orders24h", "Orders 24h", m.orders24h)}
      ${numberField("conversionRate", "Conversion Rate", m.conversionRate, "0.1")}
      ${numberField("metaSpend", "Meta Spend", m.metaSpend)}
      ${numberField("tiktokSpend", "TikTok Spend", m.tiktokSpend)}
      ${numberField("roas", "ROAS", m.roas, "0.1")}
      ${numberField("profit", "Profit Estimate", m.profit)}
      ${textField("bestProduct", "Best Product", m.bestProduct)}
      ${textField("trafficSource", "Top Traffic Source", m.trafficSource)}
      <div class="form-actions">
        <button class="button secondary" type="button" data-action="close-modal">Cancel</button>
        <button class="button" type="submit">Save</button>
      </div>
    </form>
  `;
}

function taskModal() {
  return `
    ${modalHeader("Add Task")}
    <form class="form-grid" data-form="task">
      ${textField("name", "Task Name", "", true)}
      <label class="form-field"><span>Day</span><select name="day">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<option>${day}</option>`).join("")}</select></label>
      <label class="form-field"><span>Category</span><select name="category">${["Content", "Metrics", "Project", "Ideas"].map((item) => `<option>${item}</option>`).join("")}</select></label>
      <div class="form-actions">
        <button class="button secondary" type="button" data-action="close-modal">Cancel</button>
        <button class="button" type="submit">Add Task</button>
      </div>
    </form>
  `;
}

function projectModal() {
  return `
    ${modalHeader("New Project")}
    <form class="form-grid" data-form="project">
      ${textField("title", "Project Name", "", true)}
      <label class="form-field"><span>Description</span><textarea name="description" required></textarea></label>
      ${numberField("target", "Goal Amount", 100)}
      ${numberField("current", "Current Amount", 0)}
      <label class="form-field"><span>Status</span><select name="status"><option>Building</option><option>In Review</option><option>On Track</option><option>Approved</option><option>Live</option></select></label>
      <label class="form-field"><span>Due Date</span><input name="due" type="date" value="2026-07-31" required></label>
      <div class="form-actions">
        <button class="button secondary" type="button" data-action="close-modal">Cancel</button>
        <button class="button" type="submit">Create</button>
      </div>
    </form>
  `;
}

function postModal() {
  return `
    ${modalHeader("Add Post")}
    <form class="form-grid" data-form="post">
      <label class="form-field"><span>Platform</span><select name="platform"><option>TikTok</option><option>Instagram</option></select></label>
      <label class="form-field"><span>Idea</span><textarea name="idea" required></textarea></label>
      <label class="form-field"><span>Due Date</span><input name="due" type="date" value="${todayInputValue()}" required></label>
      <div class="form-actions">
        <button class="button secondary" type="button" data-action="close-modal">Cancel</button>
        <button class="button" type="submit">Add Post</button>
      </div>
    </form>
  `;
}

function experimentModal() {
  return `
    ${modalHeader("New Experiment")}
    <form class="form-grid" data-form="experiment">
      ${textField("title", "Experiment Name", "", true)}
      <label class="form-field"><span>Start Date</span><input name="start" type="date" value="${todayInputValue()}" required></label>
      <label class="form-field"><span>End Date</span><input name="end" type="date" value="${futureInputValue(7)}" required></label>
      <label class="form-field"><span>Notes</span><textarea name="notes" required></textarea></label>
      <div class="form-actions">
        <button class="button secondary" type="button" data-action="close-modal">Cancel</button>
        <button class="button" type="submit">Start</button>
      </div>
    </form>
  `;
}

function birdNoteModal() {
  return `
    ${modalHeader("Send to Little Bird")}
    <form class="form-grid" data-form="birdNote">
      <label class="form-field"><span>Message</span><textarea name="message" required></textarea></label>
      <div class="form-actions">
        <button class="button secondary" type="button" data-action="close-modal">Cancel</button>
        <button class="button" type="submit">Send</button>
      </div>
    </form>
  `;
}

function settingsModal() {
  return `
    ${modalHeader("Settings")}
    <form class="form-grid" data-form="settings">
      <div class="card">
        <h3>Business Setup</h3>
        ${textField("appName", "App Name", state.business.appName, true)}
        ${textField("businessName", "Business Name", state.business.businessName, true)}
        ${textField("businessType", "Business Type", state.business.businessType, true)}
        ${textField("primaryProduct", "Primary Product or Offer", state.business.primaryProduct, true)}
      </div>
      <div class="card">
        <h3>Owner</h3>
        ${textField("name", "Name", state.profile.name, true)}
        ${textField("email", "Email", state.profile.email, true, "email")}
      </div>
      ${textField("apiBaseUrl", "Integration Server URL", state.api.baseUrl || getApiBase(), false, "url")}
      <div class="integration-list">
        <h3>Integrations</h3>
        ${integrationCard("shopify", "Shopify")}
        ${integrationCard("meta", "Meta Ads")}
        ${integrationCard("tiktok", "TikTok Shop")}
      </div>
      ${updateCard()}
      <div class="card">
        <h3>Preferences</h3>
        <div class="toggle-row">
          <span>Dark Mode</span>
          <button class="toggle" type="button" data-action="toggle-setting" data-field="darkMode" aria-pressed="${state.profile.darkMode}" aria-label="Toggle dark mode"></button>
        </div>
        <div class="toggle-row">
          <span>Notifications</span>
          <button class="toggle" type="button" data-action="toggle-setting" data-field="notifications" aria-pressed="${state.profile.notifications}" aria-label="Toggle notifications"></button>
        </div>
      </div>
      <div class="form-actions">
        <button class="button secondary" type="button" data-action="close-modal">Cancel</button>
        <button class="button" type="submit">Save</button>
      </div>
    </form>
  `;
}

function updateCard() {
  const update = state.updates || defaultState.updates;
  const checked = update.checkedAt ? `Checked ${formatTime(update.checkedAt)}` : "Not checked yet";
  const status = update.available ? "Update available" : "Installed";
  const canDownload = update.available && /^https:\/\//i.test(update.downloadUrl || "");
  return `
    <div class="card update-card">
      <div class="update-head">
        <div>
          <h3>Updates</h3>
          <p class="subtle">Version ${escapeHTML(update.currentVersion || APP_VERSION)}${update.latestVersion ? ` - latest ${escapeHTML(update.latestVersion)}` : ""}</p>
        </div>
        <span class="tag ${update.available ? "blue" : "green"}">${escapeHTML(status)}</span>
      </div>
      <p class="subtle">${escapeHTML(update.message || "Use Check after a release feed is configured.")}</p>
      ${update.releaseNotes ? `<p class="release-note">${escapeHTML(update.releaseNotes).slice(0, 180)}</p>` : ""}
      <div class="update-actions">
        <button class="button secondary" type="button" data-action="check-update">Check</button>
        <button class="button" type="button" data-action="open-update" ${canDownload ? "" : "disabled"}>Download</button>
      </div>
      <p class="subtle">${escapeHTML(checked)}</p>
    </div>
  `;
}

function integrationCard(provider, name) {
  const status = state.integrations[name] || "Not configured";
  const isConnected = status === "Connected";
  const field = integrationField(provider);
  return `
    <article class="integration-card">
      <div class="integration-head">
        <div>
          <h4>${escapeHTML(name)}</h4>
          ${field}
        </div>
        <span class="tag ${integrationStatusClass(status)}">${escapeHTML(status)}</span>
      </div>
      <div class="integration-actions">
        <button class="button" type="button" data-action="connect-integration" data-provider="${provider}">${isConnected ? "Reconnect" : "Connect"}</button>
        <button class="button secondary" type="button" data-action="sync-modal-source" data-provider="${provider}">Sync</button>
        <button class="small-action" type="button" data-action="disconnect-integration" data-provider="${provider}">Disconnect</button>
      </div>
    </article>
  `;
}

function integrationField(provider) {
  if (provider === "shopify") {
    return `<label class="form-field compact"><span>Store Domain</span><input name="shopifyStoreDomain" type="text" placeholder="your-store.myshopify.com" value="${escapeHTML(state.integrationSettings.shopifyStoreDomain)}"></label>`;
  }
  if (provider === "meta") {
    return `<label class="form-field compact"><span>Ad Account ID</span><input name="metaAdAccountId" type="text" placeholder="act_1234567890" value="${escapeHTML(state.integrationSettings.metaAdAccountId)}"></label>`;
  }
  return `<label class="form-field compact"><span>Advertiser ID</span><input name="tiktokAdvertiserId" type="text" placeholder="1234567890" value="${escapeHTML(state.integrationSettings.tiktokAdvertiserId)}"></label>`;
}

function integrationStatusClass(status) {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("connected")) return "green";
  if (normalized.includes("error")) return "red";
  if (normalized.includes("env") || normalized.includes("configured")) return "";
  return "blue";
}

function numberField(name, label, value, step = "1") {
  return `<label class="form-field"><span>${escapeHTML(label)}</span><input name="${name}" type="number" step="${step}" value="${escapeHTML(String(value))}" required></label>`;
}

function textField(name, label, value = "", required = false, type = "text") {
  return `<label class="form-field"><span>${escapeHTML(label)}</span><input name="${name}" type="${type}" value="${escapeHTML(String(value))}" ${required ? "required" : ""}></label>`;
}

function updateMetricData(data) {
  const numericFields = [
    "revenueToday",
    "visitorsToday",
    "orders24h",
    "conversionRate",
    "metaSpend",
    "tiktokSpend",
    "roas",
    "profit"
  ];
  numericFields.forEach((field) => {
    state.metrics[field] = toNumber(data.get(field), state.metrics[field]);
  });
  state.metrics.bestProduct = clean(data.get("bestProduct"));
  state.metrics.trafficSource = clean(data.get("trafficSource"));
  state.revenueTrend[state.revenueTrend.length - 1] = state.metrics.revenueToday;
}

function makeHomeInsight() {
  if (state.metrics.conversionRate < 2) return "Visitors need a stronger product path today.";
  if (state.metrics.roas >= 3) return "Ad performance is healthy. Test one creative before scaling.";
  return "Keep the dashboard tight: content, metrics, and one focused experiment.";
}

function makeBirdInsight() {
  const spend = state.metrics.metaSpend + state.metrics.tiktokSpend;
  const conversion = state.metrics.conversionRate;
  const newProduct = state.store?.catalog?.newProducts?.[0]?.title;
  const topProduct = state.store?.catalog?.topProducts?.[0]?.title;
  if (newProduct) {
    return `${newProduct} is newly synced. Ask for a content plan and I can use the product title, tags, type, and current ad signals.`;
  }
  if (topProduct) {
    return `${topProduct} is the current top synced product. Keep content tied to the product page and watch conversion after posting.`;
  }
  if (conversion < 2) {
    return `Your visitors dipped at the conversion step. Review product photos before adding spend. Current spend is ${money(spend)}.`;
  }
  if (state.metrics.roas >= 3) {
    return `ROAS is at ${state.metrics.roas}x. Keep the winning creative active and launch a small variation with a gold accent shot.`;
  }
  return `Revenue is ${money(state.metrics.revenueToday)} today. One content post plus one metrics review keeps the flywheel moving.`;
}

function generateBirdReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes("idea") || lower.includes("content")) {
    return "Try a short maker-process clip, a best-seller close-up, and a quick care tip. Keep each one tied to a product page.";
  }
  if (lower.includes("ad") || lower.includes("roas")) {
    return `Your ROAS is ${state.metrics.roas}x. I would test creative first, then increase budget only if conversion stays above ${state.metrics.conversionRate}%.`;
  }
  if (lower.includes("goal") || lower.includes("project")) {
    return "Pick the project with the nearest due date, finish one visible task, then update the progress bar before adding new work.";
  }
  return makeBirdInsight();
}

function birdHeadline() {
  if (state.metrics.roas >= 3) return "Shiny opportunity spotted";
  if (state.metrics.conversionRate < 2) return "Conversion needs attention";
  return "Here is your top insight today";
}

function emptyState(text) {
  return `<div class="empty-state">${escapeHTML(text)}</div>`;
}

function statusClass(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("track") || normalized.includes("live") || normalized.includes("approved") || normalized.includes("complete")) return "green";
  if (normalized.includes("review") || normalized.includes("running")) return "blue";
  if (normalized.includes("alert")) return "red";
  return "";
}

function progressPercent(current, target) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clean(value) {
  return String(value || "").trim();
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date());
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function shortDate(value) {
  if (!value) return "Open";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function futureInputValue(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

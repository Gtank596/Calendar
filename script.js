// ============================================================================
// My Digital Calendar
// Offline calendar + budget dashboard + weather + file sync
//
// Organization map (matches the numbered headers below):
//   01.  DOM references
//   02.  Settings + preferences
//   03.  History / undo-redo
//   04.  Utility constants
//     04a. IndexedDB offline storage layer
//     04b. Utility helpers
//     04c. Supabase cloud sync
//   05.  File sync (Google Drive JSON via File System Access API)
//   06.  Weather helpers
//   07.  Navigation / section switching
//   08.  Budget dashboard + categories
//     08b. Receipt OCR (privacy-first, no receipt photo storage)
//     08c. Budget dashboard (continued) - transactions, rendering, cashflow
//   09.  Smart Suggestions
//   10.  Drag & drop
//     10B. Drag ghost preview
//   11.  Storage normalization + save pipeline
//     11B. Recurrence engine
//     11C. Background spans / trip shading
//     11D. Calendar repeat dropdown
//     11E. Trip shading UI
//   12.  App state
//     12B. App state store + render scheduler
//     12C. Rendering entrypoints (month/week/day/event list)
//   13.  Event editor + CRUD
//   14.  Quick add
//   15.  Quick search
//   16.  Keyboard shortcuts
//     16B. Init
//
// Note: sections are grouped by feature/layer, but execution order within
// and across sections is kept intact on purpose - top-level statements here
// (DOM lookups, event listener registrations, init calls) run once as the
// script loads, in this exact order, and later code depends on earlier code
// having already run. Reordering them could silently break initialization,
// so only function declarations are ever safe to move; this pass instead
// added clearer sub-headers and fixed one mislabeled boundary (08b/08c)
// rather than physically relocating code.
// ============================================================================

// ============================================================================
// 01. DOM REFERENCES
// ============================================================================
// Budget page controls + panels
const budgetViewSwitcher = document.getElementById("budgetViewSwitcher");
const budgetSliderThumb = document.getElementById("budgetSliderThumb");
const budgetWeekBtn = document.getElementById("budgetWeekBtn");
const budgetMonthBtn = document.getElementById("budgetMonthBtn");
const budgetYearBtn = document.getElementById("budgetYearBtn");

const budgetSnapshotGrid = document.getElementById("budgetSnapshotGrid");
const budgetSnapshotMenuBtn = document.getElementById("budgetSnapshotMenuBtn");
const budgetInsightsGrid = document.getElementById("budgetInsightsGrid");
const budgetInsightsMenuBtn = document.getElementById("budgetInsightsMenuBtn");
const budgetTotal = document.getElementById("budgetTotal");
const budgetEventCount = document.getElementById("budgetEventCount");
const budgetAverage = document.getElementById("budgetAverage");
const budgetRangeTitle = document.getElementById("budgetRangeTitle");
const budgetRangeSub = document.getElementById("budgetRangeSub");
const budgetBars = document.getElementById("budgetBars");
const budgetIncomeTotal = document.getElementById("budgetIncomeTotal");
const budgetExpenseTotal = document.getElementById("budgetExpenseTotal");
const budgetNetTotal = document.getElementById("budgetNetTotal");
const budgetIncomeBar = document.getElementById("budgetIncomeBar");
const budgetExpenseBar = document.getElementById("budgetExpenseBar");
const budgetTransactionCount = document.getElementById("budgetTransactionCount");
const budgetTransactionList = document.getElementById("budgetTransactionList");
const budgetPrevBtn = document.getElementById("budgetPrevBtn");
const budgetTodayBtn = document.getElementById("budgetTodayBtn");
const budgetNextBtn = document.getElementById("budgetNextBtn");
const budgetTxTitle = document.getElementById("budgetTxTitle");
const budgetTxAmount = document.getElementById("budgetTxAmount");
const budgetTxDate = document.getElementById("budgetTxDate");
const budgetTxAddBtn = document.getElementById("budgetTxAddBtn");
const budgetManageCategoryBtn = document.getElementById("budgetManageCategoryBtn");
const budgetCategoryManager = document.getElementById("budgetCategoryManager");
const budgetCategoryManagerList = document.getElementById("budgetCategoryManagerList");
const budgetCategoryHubModal = document.getElementById("budgetCategoryHubModal");
const budgetCategoryHubCloseBtn = document.getElementById("budgetCategoryHubCloseBtn");
const budgetCategoryHubAddBtn = document.getElementById("budgetCategoryHubAddBtn");
const budgetCategoryHubList = document.getElementById("budgetCategoryHubList");
const budgetPlanCopyBtn = document.getElementById("budgetPlanCopyBtn");
const budgetCashflowTotalsBtn = document.getElementById("budgetCashflowTotalsBtn");
const budgetCashflowTrendBtn = document.getElementById("budgetCashflowTrendBtn");
const budgetCashflowTotalsView = document.getElementById("budgetCashflowTotalsView");
const budgetCashflowTrendView = document.getElementById("budgetCashflowTrendView");
const budgetCashflowTrend = document.getElementById("budgetCashflowTrend");
const budgetCashflowToggle = document.getElementById("budgetCashflowToggle");
const budgetCashflowToggleThumb = document.getElementById("budgetCashflowToggleThumb");

const budgetPlanUseForwardBtn =
  document.getElementById("budgetPlanUseForwardBtn");

const budgetCategoryModalColor =
  document.getElementById("budgetCategoryModalColor");

const budgetCategoryModalColorHint =
  document.getElementById("budgetCategoryModalColorHint");

const budgetCategoryModalBudgetWeek =
  document.getElementById("budgetCategoryModalBudgetWeek");

const budgetCategoryModalBudgetMonth =
  document.getElementById("budgetCategoryModalBudgetMonth");

const budgetCategoryModalBudgetYear =
  document.getElementById("budgetCategoryModalBudgetYear");

const budgetPlanManageCategoryBtn =
  document.getElementById("budgetPlanManageCategoryBtn");

const budgetPlanInput = document.getElementById("budgetPlanInput");
const budgetPlanSaveBtn = document.getElementById("budgetPlanSaveBtn");
const budgetPlanSub = document.getElementById("budgetPlanSub");
const budgetTxCategory = document.getElementById("budgetTxCategory");
const budgetAddCategoryBtn = document.getElementById("budgetAddCategoryBtn");
const budgetTxDrawer = document.getElementById("budgetTxDrawer");
const budgetTxDrawerOpenBtn = document.getElementById("budgetTxDrawerOpenBtn");
const budgetTxDrawerCloseBtn = document.getElementById("budgetTxDrawerCloseBtn");
const budgetReceiptScanBtn = document.getElementById("budgetReceiptScanBtn");
const budgetReceiptScanInput = document.getElementById("budgetReceiptScanInput");
const budgetReceiptScanStatus = document.getElementById("budgetReceiptScanStatus");
const budgetCatDD = document.getElementById("budgetCatDD");
const budgetCatDDButton = document.getElementById("budgetCatDDButton");
const budgetCatDDLabel = document.getElementById("budgetCatDDLabel");
const budgetCatDDMenu = document.getElementById("budgetCatDDMenu");

const budgetCategoryModal = document.getElementById("budgetCategoryModal");
const budgetCategoryModalKicker = document.getElementById("budgetCategoryModalKicker");
const budgetCategoryModalTitle = document.getElementById("budgetCategoryModalTitle");
const budgetCategoryModalText = document.getElementById("budgetCategoryModalText");
const budgetCategoryModalInput = document.getElementById("budgetCategoryModalInput");
const budgetCategoryModalCancel = document.getElementById("budgetCategoryModalCancel");
const budgetCategoryModalConfirm = document.getElementById("budgetCategoryModalConfirm");

const budgetCategoryChart = document.getElementById("budgetCategoryChart");
const budgetChartPercentages = document.getElementById("budgetChartPercentages");
const budgetChartBudgetDetails = document.getElementById("budgetChartBudgetDetails");
const budgetTxFilterToggleBtn = document.getElementById("budgetTxFilterToggleBtn");
const budgetTransactionFilters = document.querySelector(".budgetTransactionFilters");
const budgetTxType = document.getElementById("budgetTxType");
const budgetTypeSwitcher = document.getElementById("budgetTypeSwitcher");
const budgetTypeSliderThumb = document.getElementById("budgetTypeSliderThumb");
const budgetExpenseBtn = document.getElementById("budgetExpenseBtn");
const budgetIncomeBtn = document.getElementById("budgetIncomeBtn");

const budgetRepeatDD = document.getElementById("budgetRepeatDD");
const budgetRepeatDDButton = document.getElementById("budgetRepeatDDButton");
const budgetRepeatDDMenu = document.getElementById("budgetRepeatDDMenu");
const budgetRepeatDDLabel = document.getElementById("budgetRepeatDDLabel");
const budgetRepeat = document.getElementById("budgetRepeat");
const budgetWeeklyIntervalRow = document.getElementById("budgetWeeklyIntervalRow");
const budgetRepeatInterval = document.getElementById("budgetRepeatInterval");
const budgetWeeklyDaysRow = document.getElementById("budgetWeeklyDaysRow");
const budgetWeekdayBtns = budgetWeeklyDaysRow
  ? Array.from(budgetWeeklyDaysRow.querySelectorAll(".weekdayBtn"))
  : [];
const budgetRepeatUntilCol = document.getElementById("budgetRepeatUntilCol");
const budgetRepeatUntil = document.getElementById("budgetRepeatUntil");

// Settings menu
const settingsBtn = document.getElementById("settingsBtn");
const settingsMenu = document.getElementById("settingsMenu");
const accountBtn = document.getElementById("accountBtn");
const accountBtnLabel = document.getElementById("accountBtnLabel");
const accountBtnDot = document.getElementById("accountBtnDot");
const accountModal = document.getElementById("accountModal");
const accountModalCloseBtn = document.getElementById("accountModalCloseBtn");
const toggleSuggestions = document.getElementById("toggleSuggestions");
const dragStepSlider = document.getElementById("dragStepSlider");
const dragStepValue = document.getElementById("dragStepValue");
const dimPastEvents = document.getElementById("dimPastEvents");
const weatherEnabled = document.getElementById("weatherEnabled");
const weatherLocationSelect = document.getElementById("weatherLocationSelect");
const budgetCategorySortSelect = document.getElementById("budgetCategorySortSelect");
const mobileCalendarStyleSelect = document.getElementById("mobileCalendarStyleSelect");

// Sync UI
const connectSyncBtn = document.getElementById("connectSyncBtn");
const syncStatus = document.getElementById("syncStatus");
const manualSyncRow = document.getElementById("manualSyncRow");

// Supabase cloud sync UI
const cloudSyncBox = document.getElementById("cloudSyncBox");
const cloudEmailInput = document.getElementById("cloudEmailInput");
const cloudPasswordInput = document.getElementById("cloudPasswordInput");
const cloudSignupBtn = document.getElementById("cloudSignupBtn");
const cloudLoginBtn = document.getElementById("cloudLoginBtn");
const cloudLogoutBtn = document.getElementById("cloudLogoutBtn");
const cloudPushBtn = document.getElementById("cloudPushBtn");
const cloudPullBtn = document.getElementById("cloudPullBtn");
const cloudSyncStatus = document.getElementById("cloudSyncStatus");
const cloudUserBadge = document.getElementById("cloudUserBadge");

const syncGate = document.getElementById("syncGate");
const syncGateTitle = document.getElementById("syncGateTitle");
const syncGateText = document.getElementById("syncGateText");
const syncGateHint = document.getElementById("syncGateHint");
const syncGatePrimary = document.getElementById("syncGatePrimary");
const syncGateClose = document.getElementById("syncGateClose");

// Calendar navigation + editor
const deleteWholeSeries = document.getElementById("deleteWholeSeries");

const grid = document.getElementById("grid");
const monthLabel = document.getElementById("monthLabel");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const searchBtn = document.getElementById("searchBtn");
const monthViewBtn = document.getElementById("monthViewBtn");
const weekViewBtn = document.getElementById("weekViewBtn");
const dayViewBtn = document.getElementById("dayViewBtn");
const dow = document.querySelector(".dow");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const viewSliderThumb = document.getElementById("viewSliderThumb");
const viewSwitcher = document.getElementById("viewSwitcher");

// App sections
const calendarSubbar = document.getElementById("calendarSubbar");
const calendarMobileDateLabel = document.getElementById("calendarMobileDateLabel");
const calendarPage = document.getElementById("calendarPage");
const budgetPage = document.getElementById("budgetPage");
const weatherPage = document.getElementById("weatherPage");

const sectionSwitcher = document.getElementById("sectionSwitcher");
const sectionSliderThumb = document.getElementById("sectionSliderThumb");
const calendarSectionBtn = document.getElementById("calendarSectionBtn");
const budgetSectionBtn = document.getElementById("budgetSectionBtn");
const weatherSectionBtn = document.getElementById("weatherSectionBtn");

// Event editor fields
const panelTitle = document.getElementById("panelTitle");
const panelSub = document.getElementById("panelSub");
const eventTitle = document.getElementById("eventTitle");
const eventDetails = document.getElementById("eventDetails");
const eventPrice = document.getElementById("eventPrice");
const eventCategory = document.getElementById("eventCategory");
const eventCatDD = document.getElementById("eventCatDD");
const eventCatDDButton = document.getElementById("eventCatDDButton");
const eventCatDDLabel = document.getElementById("eventCatDDLabel");
const eventCatDDMenu = document.getElementById("eventCatDDMenu");

// Week-view connection/thread controls
// The old side-panel connection inputs have been removed from the editor;
// these refs intentionally resolve to null in current markup for legacy-safe code paths.
const eventConnectionGroup = document.getElementById("eventConnectionGroup");
const eventConnectionColor = document.getElementById("eventConnectionColor");
const eventConnectionLineStyle = document.getElementById("eventConnectionLineStyle");
const weekConnectionRail = document.getElementById("weekConnectionRail");

const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");
const startAmPm = document.getElementById("startAmPm");
const endAmPm = document.getElementById("endAmPm");

const eventColor = document.getElementById("eventColor");

// Trip / range shading (background across grid)
const spanToggle = document.getElementById("spanToggle");
const spanUntil = document.getElementById("spanUntil");

// Calendar repeat controls
const repeatDD = document.getElementById("repeatDD");
const repeatDDButton = document.getElementById("repeatDDButton");
const repeatDDMenu = document.getElementById("repeatDDMenu");
const repeatDDLabel = document.getElementById("repeatDDLabel");
const eventRepeat = document.getElementById("eventRepeat");
const repeatUntil = document.getElementById("repeatUntil");
const repeatUntilCol = document.getElementById("repeatUntilCol");
const tripUntilRow = document.getElementById("tripUntilRow");
const weeklyIntervalRow = document.getElementById("weeklyIntervalRow");
const repeatInterval = document.getElementById("repeatInterval");

// Weekly multi-day selector
const weeklyDaysRow = document.getElementById("weeklyDaysRow");
const weekdayBtns = weeklyDaysRow ? Array.from(weeklyDaysRow.querySelectorAll(".weekdayBtn")) : [];

// Editor action buttons
const addBtn = document.getElementById("addBtn");
const deleteBtn = document.getElementById("deleteBtn");

const eventsList = document.getElementById("eventsList");
const newEventBtn = document.getElementById("newEventBtn");
const editLabel = document.getElementById("editLabel");

// Collapsible editor (the form area under the divider)
const collapseEditorBtn = document.getElementById("collapseEditorBtn");
const editorSection = document.getElementById("editorSection");

const EDITOR_COLLAPSE_KEY = "myCalendar_editorCollapsed";

// ============================================================================
// 02. SETTINGS + PREFERENCES
// ============================================================================
const SETTINGS_KEY = "myCalendarSettings";

function loadSettings(){
  try{
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return {
      suggestions: saved.suggestions ?? true,
dimPastEvents: saved.dimPastEvents ?? true,
budgetChartPercentages: saved.budgetChartPercentages ?? true,
budgetChartBudgetDetails: saved.budgetChartBudgetDetails ?? true,
      dragStepMins: clamp(parseInt(saved.dragStepMins ?? 15, 10) || 15, 1, 30),
budgetCategorySort: saved.budgetCategorySort || "custom",
mobileCalendarStyle: saved.mobileCalendarStyle || "compact",
weather: saved.weather || {
    enabled: true,
    locationKey: "coloradoSprings"
  }
    };
  }catch{
    return {
      suggestions: true,
dimPastEvents: true,
budgetChartPercentages: true,
budgetChartBudgetDetails: true,
budgetCategorySort: "custom",
mobileCalendarStyle: "compact",
      dragStepMins: 15,
weather: {
    enabled: true,
    locationKey: "coloradoSprings"
  }

    };
  }
}

function isPastDayISO(iso){
  if(!iso) return false;

  const target = ymdToDate(iso);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target < today;
}

function shouldDimPastEvents(){
  return !!settings?.dimPastEvents;
}

function saveSettings(){
  setAppState({ settings }, { render:false });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  updateMobileCalendarStyleUI();
  setLocalPayload({ updatedAt: Date.now(), settings });
  cloudWriteDebounced(["settings"]);
}

function getSortedBudgetCategories(){
  const sortMode = settings?.budgetCategorySort || "custom";
  const list = [...budgetCategories];

  const isOther = cat => cat.id === "other";

  const keepOtherFirst = (a, b) => {
    if(isOther(a)) return -1;
    if(isOther(b)) return 1;
    return 0;
  };

  if(["az", "a-z", "alphaAsc", "nameAsc"].includes(sortMode)){
    return list.sort((a, b) => {
      const otherSort = keepOtherFirst(a, b);
      if(otherSort) return otherSort;
      return (a.name || "").localeCompare(b.name || "");
    });
  }

  if(["za", "z-a", "alphaDesc", "nameDesc"].includes(sortMode)){
    return list.sort((a, b) => {
      const otherSort = keepOtherFirst(a, b);
      if(otherSort) return otherSort;
      return (b.name || "").localeCompare(a.name || "");
    });
  }

  if(["newest", "newestFirst"].includes(sortMode)){
    return list.sort((a, b) => {
      const otherSort = keepOtherFirst(a, b);
      if(otherSort) return otherSort;
      return String(b.id).localeCompare(String(a.id));
    });
  }

  return list;
}

let settings = loadSettings();

function isMobileViewport(){
  return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
}

function getMobileCalendarStyle(){
  return settings?.mobileCalendarStyle || "compact";
}

function updateMobileCalendarStyleUI(){
  const style = getMobileCalendarStyle();
  document.body.dataset.mobileCalendarStyle = style;

  if(mobileCalendarStyleSelect){
    mobileCalendarStyleSelect.value = style;
  }
}

function openMobileEditor(){
  if(isMobileViewport()){
    document.body.classList.add("mobileEditorOpen");
    setTimeout(() => {
      editorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }
}

function closeMobileEditor(){
  document.body.classList.remove("mobileEditorOpen");
}

function getEventPreviewCountText(count){
  if(count <= 0) return "";
  if(count > 9) return "9+";
  return String(count);
}

function getDragStepMins(){
  return clamp(parseInt(settings?.dragStepMins ?? 15, 10) || 15, 1, 30);
}

function getBudgetCategoryTotals(items){
  const map = new Map();

  for(const item of items){
    const cat = getBudgetCategory(item.categoryId || "other");
    const existing = map.get(cat.id) || {
      id: cat.id,
      name: cat.name,
      color: cat.color || "#7a5aff",
      total: 0
    };

    existing.total += Number(item.price || 0);
    map.set(cat.id, existing);
  }

  return Array.from(map.values())
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total);
}

function renderBudgetCategoryChart(items, total){
  if(!budgetCategoryChart) return;

  const categories = getBudgetCategoryTotals(items);

  if(!categories.length || total <= 0){
    budgetCategoryChart.innerHTML = `
      <div class="budgetEmpty">No category spending yet.</div>
    `;
    return;
  }

  let cursor = 0;

  const gradient = categories.map(cat => {
    const start = cursor;
    const pct = (cat.total / total) * 100;
    cursor += pct;

    return `${cat.color} ${start}% ${cursor}%`;
  }).join(", ");

  budgetCategoryChart.innerHTML = `
    <div class="budgetDonutWrap">
      <div
        class="budgetDonut"
        style="background: conic-gradient(${gradient});"
      >
        <div class="budgetDonutCenter">
          <div class="budgetDonutTotal">${money(total)}</div>
          <div class="budgetDonutLabel">Total</div>
        </div>

${
  settings?.budgetChartPercentages
    ? (() => {
        let labelCursor = 0;

        return categories.map(cat => {
          const slicePct = (cat.total / total) * 100;
          const middlePct = labelCursor + (slicePct / 2);
          labelCursor += slicePct;

          const angle = (middlePct / 100) * 360;

          return `
            <span
              class="budgetDonutPct"
              style="--pct-angle:${angle}deg;"
            >
              ${pct(cat.total, total)}
            </span>
          `;
        }).join("");
      })()
    : ""
}
      </div>
    </div>

    <div class="budgetCategoryLegend">
      ${categories.map(cat => `
        <div class="budgetCategoryLegendRow">
          <span
            class="budgetCategoryDot"
            style="
              --cat-color:${safeHexColor(cat.color)};
              --cat-glow:${hexToRgba(cat.color, .35)};
            "
          ></span>

          <div class="budgetCategoryLegendMain">
  <span class="budgetCategoryLegendName">${escapeHtml(cat.name)}</span>

  <span class="budgetCategoryLegendAmount">
    ${
      settings?.budgetChartPercentages
        ? `${money(cat.total)} · ${pct(cat.total, total)}`
        : money(cat.total)
    }
  </span>
</div>

${(() => {
  if(!settings?.budgetChartBudgetDetails) return "";

  const categoryBudget = getCategoryBudget(getBudgetCategory(cat.id));
  const remaining = categoryBudget - cat.total;

  if(categoryBudget <= 0) return "";

  return `
    <div class="budgetCategoryLegendSub ${remaining < 0 ? "overBudget" : ""}">
      Budget ${money(categoryBudget)} · ${
        remaining >= 0
          ? `${money(remaining)} left`
          : `${money(Math.abs(remaining))} over`
      }
    </div>
  `;
})()}
        </div>
      `).join("")}
    </div>
  `;
}

function updateDragStepUI(){
  const step = getDragStepMins();

  if(dragStepSlider){
    dragStepSlider.value = String(step);
  }

  if(dragStepValue){
    dragStepValue.textContent = step === 1 ? "1 min" : `${step} min`;
  }
}

function roundToDragStep(mins){
  const step = getDragStepMins();
  return Math.round(mins / step) * step;
}

function snapDeltaFromAnchor(anchorMins, rawMins){
  const step = getDragStepMins();
  const delta = rawMins - anchorMins;
  return anchorMins + (Math.round(delta / step) * step);
}

toggleSuggestions && (toggleSuggestions.checked = !!settings.suggestions);
budgetChartBudgetDetails &&
  (budgetChartBudgetDetails.checked = !!settings.budgetChartBudgetDetails);
dimPastEvents && (dimPastEvents.checked = !!settings.dimPastEvents);
updateDragStepUI();
updateMobileCalendarStyleUI();

dimPastEvents?.addEventListener("change", () => {
  settings.dimPastEvents = !!dimPastEvents.checked;
  saveSettings();
  render();
  renderEventList();
});

budgetChartBudgetDetails?.addEventListener("change", () => {
  settings.budgetChartBudgetDetails = !!budgetChartBudgetDetails.checked;
  saveSettings();
  renderBudgetPage();
});

dragStepSlider?.addEventListener("input", () => {
  settings.dragStepMins = clamp(parseInt(dragStepSlider.value, 10) || 15, 1, 30);
  updateDragStepUI();
  saveSettings();
});

mobileCalendarStyleSelect?.addEventListener("change", () => {
  settings.mobileCalendarStyle = mobileCalendarStyleSelect.value || "compact";
  updateMobileCalendarStyleUI();
  saveSettings();
  render();
});

window.addEventListener("resize", () => {
  updateMobileCalendarStyleUI();
  if(!isMobileViewport()) closeMobileEditor();
});

// ============================================================================
// 03. HISTORY / UNDO-REDO
// ============================================================================
const UNDO_LIMIT = 40;
let undoStack = [];
let redoStack = [];
let isUndoing = false;
let isRedoing = false;

function cloneEventsMap(map){
  return JSON.parse(JSON.stringify(map || {}));
}

function updateHistoryUI(){
  if(undoBtn){
    undoBtn.disabled = undoStack.length === 0;
  }

  if(redoBtn){
    redoBtn.disabled = redoStack.length === 0;
  }
}

function undoLastChange(){
  if(!undoStack.length) return;

  const currentSnapshot = cloneEventsMap(events);
  const snapshot = undoStack.pop();

  isUndoing = true;

  redoStack.push({ events: currentSnapshot });
  if(redoStack.length > UNDO_LIMIT){
    redoStack.shift();
  }

  events = normalizeEventsMap(snapshot.events || {});
  syncStateFromLegacy();
  setLocalPayload({ updatedAt: Date.now(), events });
  syncWriteDebounced();
  cloudWriteDebounced(["events"]);

  selectedEventId = null;
  editBaseDateISO = null;
  syncStateFromLegacy();

  render();
  renderEventList();
  populateFormFromSelected?.();

  isUndoing = false;
  updateHistoryUI();
}

function redoLastChange(){
  if(!redoStack.length) return;

  const currentSnapshot = cloneEventsMap(events);
  const snapshot = redoStack.pop();

  isRedoing = true;

  undoStack.push({ events: currentSnapshot });
  if(undoStack.length > UNDO_LIMIT){
    undoStack.shift();
  }

  events = normalizeEventsMap(snapshot.events || {});
  syncStateFromLegacy();
  setLocalPayload({ updatedAt: Date.now(), events });
  syncWriteDebounced();
  cloudWriteDebounced(["events"]);

  selectedEventId = null;
  editBaseDateISO = null;
  syncStateFromLegacy();

  render();
  renderEventList();
  populateFormFromSelected?.();

  isRedoing = false;
  updateHistoryUI();
}

function snapshotBeforeChange(){
  return cloneEventsMap(events);
}

// ============================================================================
// 04. UTILITY CONSTANTS
// ============================================================================
const DEFAULT_COLOR = "#7a5aff";
const CONNECTION_LINE_STYLES = ["solid", "dashed", "dotted", "double"];
const STORAGE_KEY = "myCalendarData_v4";
const SPLIT_STORAGE_VERSION = 3;
const EVENTS_STORAGE_KEY = "myCalendarEvents_v1";
const APP_META_STORAGE_KEY = "myCalendarMeta_v1";
const PEOPLE_STORAGE_KEY = "myCalendarPeople_v1";
const HOUSEHOLDS_STORAGE_KEY = "myCalendarHouseholds_v1";
const MAX_EVENT_DURATION_MINS = 24 * 60;

// Split data slices keep the app from rewriting one giant JSON blob every time
// a tiny piece changes. This is especially important as household/guest data
// grows alongside calendar + budget history.
const DATA_SLICE_NAMES = [
  "events",
  "settings",
  "budgetPlans",
  "budgetCategories",
  "merchantAliases",
  "receiptItemCategoryMemory",
  "receiptTrainingRecords",
  "selectedBudgetPanes",
  "activeSection",
  "budgetViewMode",
  "people",
  "households"
];

const DATA_SLICE_LABELS = {
  events: "Events",
  settings: "Settings",
  budgetPlans: "Budget plans",
  budgetCategories: "Budget categories",
  merchantAliases: "Merchant aliases",
  receiptItemCategoryMemory: "Receipt memory",
  receiptTrainingRecords: "Receipt training",
  selectedBudgetPanes: "Budget panes",
  activeSection: "Active section",
  budgetViewMode: "Budget view",
  people: "People",
  households: "Households"
};


// ============================================================================
// 04a. INDEXEDDB OFFLINE STORAGE LAYER
// ============================================================================
// IndexedDB becomes the roomy offline landscape. localStorage stays as a tiny
// boot/cache + legacy safety net for this sweep so old data is not endangered.

// ---------------------------------------------------------------------------
// Database setup & connection
// ---------------------------------------------------------------------------

const CALENDAR_IDB_NAME = "myCalendarOfflineDB";
const CALENDAR_IDB_VERSION = 3;

const CALENDAR_IDB_STORES = [
  "slices",
  "events",
  "budgetTransactions",
  "budgetCategories",
  "budgetPlans",
  "receiptMemory",
  "receiptTraining",
  "merchantAliases",
  "people",
  "households",
  "meta",
  "syncQueue"
];

let calendarIndexedDbPromise = null;
let indexedDbSliceWriteTimer = null;
let indexedDbMetaWriteTimer = null;
const indexedDbSliceWriteQueue = new Map();
let indexedDbMetaWriteQueue = null;

function indexedDbSupported(){
  return typeof indexedDB !== "undefined";
}

function idbRequestToPromise(request){
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function idbTransactionDone(tx){
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

function openCalendarIndexedDb(){
  if(!indexedDbSupported()) return Promise.resolve(null);

  if(calendarIndexedDbPromise) return calendarIndexedDbPromise;

  calendarIndexedDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(CALENDAR_IDB_NAME, CALENDAR_IDB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      const upgradeTx = req.transaction;

      const ensureIndex = (store, name, keyPath, options = { unique:false }) => {
        if(store && !store.indexNames.contains(name)){
          store.createIndex(name, keyPath, options);
        }
      };

      if(!db.objectStoreNames.contains("slices")){
        db.createObjectStore("slices", { keyPath: "slice" });
      }

      let eventsStore;
      if(!db.objectStoreNames.contains("events")){
        eventsStore = db.createObjectStore("events", { keyPath: "id" });
      }else{
        eventsStore = upgradeTx.objectStore("events");
      }
      ensureIndex(eventsStore, "dateISO", "dateISO");
      ensureIndex(eventsStore, "updatedAt", "updatedAt");
      ensureIndex(eventsStore, "categoryId", "categoryId");
      ensureIndex(eventsStore, "source", "source");
      ensureIndex(eventsStore, "startDate", "startDate");
      ensureIndex(eventsStore, "dateCategory", "dateCategory");

      let budgetTransactionStore;
      if(!db.objectStoreNames.contains("budgetTransactions")){
        budgetTransactionStore = db.createObjectStore("budgetTransactions", { keyPath: "id" });
      }else{
        budgetTransactionStore = upgradeTx.objectStore("budgetTransactions");
      }
      ensureIndex(budgetTransactionStore, "dateISO", "dateISO");
      ensureIndex(budgetTransactionStore, "categoryId", "categoryId");
      ensureIndex(budgetTransactionStore, "updatedAt", "updatedAt");
      ensureIndex(budgetTransactionStore, "source", "source");
      ensureIndex(budgetTransactionStore, "type", "type");
      ensureIndex(budgetTransactionStore, "dateType", "dateType");

      if(!db.objectStoreNames.contains("budgetCategories")){
        db.createObjectStore("budgetCategories", { keyPath: "id" });
      }

      if(!db.objectStoreNames.contains("budgetPlans")){
        db.createObjectStore("budgetPlans", { keyPath: "id" });
      }

      if(!db.objectStoreNames.contains("receiptMemory")){
        db.createObjectStore("receiptMemory", { keyPath: "id" });
      }

      if(!db.objectStoreNames.contains("receiptTraining")){
        const store = db.createObjectStore("receiptTraining", { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique:false });
      }

      if(!db.objectStoreNames.contains("merchantAliases")){
        db.createObjectStore("merchantAliases", { keyPath: "id" });
      }

      if(!db.objectStoreNames.contains("people")){
        db.createObjectStore("people", { keyPath: "id" });
      }

      if(!db.objectStoreNames.contains("households")){
        db.createObjectStore("households", { keyPath: "id" });
      }

      if(!db.objectStoreNames.contains("meta")){
        db.createObjectStore("meta", { keyPath: "key" });
      }

      if(!db.objectStoreNames.contains("syncQueue")){
        const store = db.createObjectStore("syncQueue", { keyPath: "id" });
        store.createIndex("slice", "slice", { unique:false });
        store.createIndex("updatedAt", "updatedAt", { unique:false });
      }
    };

    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };

    req.onerror = () => reject(req.error || new Error("Could not open IndexedDB"));
  }).catch(err => {
    console.warn("IndexedDB unavailable; localStorage fallback remains active.", err);
    calendarIndexedDbPromise = null;
    return null;
  });

  return calendarIndexedDbPromise;
}

async function idbClearAndPutAll(db, storeName, records = []){
  if(!db || !db.objectStoreNames.contains(storeName)) return;

  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.clear();

  for(const record of records){
    if(record && record.id !== undefined && record.id !== null){
      store.put(record);
    }
  }

  await idbTransactionDone(tx);
}


// ---------------------------------------------------------------------------
// Event records: normalize + range cache
// ---------------------------------------------------------------------------

function normalizeIndexedDbRecordId(value, fallback){
  const raw = String(value ?? "").trim();
  return raw || fallback;
}

function eventsMapToIndexedDbRecords(eventsMap = {}, updatedAt = Date.now()){
  const records = [];
  const transactions = [];

  for(const [dateISO, list] of Object.entries(eventsMap || {})){
    if(!Array.isArray(list)) continue;

    list.forEach((event, index) => {
      if(!event || typeof event !== "object") return;
      const id = normalizeIndexedDbRecordId(event.id, `${dateISO}:${index}`);
      const record = {
        ...event,
        id,
        dateISO,
        startDate: event.startDate || dateISO,
        categoryId: event.categoryId || "other",
        source: event.source || "calendar",
        dateCategory: `${dateISO}::${event.categoryId || "other"}`,
        updatedAt
      };

      records.push(record);

      const transaction = budgetTransactionFromEventRecord(record);
      if(transaction){
        transactions.push(transaction);
      }
    });
  }

  return { events: records, budgetTransactions: transactions };
}

function budgetTransactionFromEventRecord(record = {}){
  const price = Number(record.price);
  const dateISO = String(record.dateISO || record.startDate || "").trim();

  if(!record?.id || !dateISO || !Number.isFinite(price) || price === 0){
    return null;
  }

  const type = price < 0 ? "income" : "expense";

  return {
    id: `event:${record.id}`,
    eventId: record.id,
    dateISO,
    date: dateISO,
    title: record.title || "Untitled",
    amount: price,
    price,
    type,
    categoryId: record.categoryId || "other",
    color: record.color || DEFAULT_COLOR,
    source: record.source || "calendar",
    recurrence: record.recurrence || null,
    startDate: record.startDate || dateISO,
    isOccurrence: false,
    occursOn: dateISO,
    dateType: `${dateISO}::${type}`,
    updatedAt: Number(record.updatedAt || Date.now())
  };
}

function normalizeEventRecordForIndexedDb(event = {}, dateISO = "", updatedAt = Date.now()){
  const safeDateISO = String(
    dateISO ||
    event?.dateISO ||
    event?.startDate ||
    selectedDateISO ||
    ""
  ).trim();

  const normalized = toEvent({
    ...(event || {}),
    id: normalizeIndexedDbRecordId(event?.id, `${safeDateISO}:${Date.now()}`),
    startDate: event?.startDate || safeDateISO
  });

  return {
    ...normalized,
    id: normalizeIndexedDbRecordId(normalized.id, `${safeDateISO}:${Date.now()}`),
    dateISO: safeDateISO,
    startDate: normalized.startDate || safeDateISO,
    categoryId: normalized.categoryId || "other",
    source: normalized.source || "calendar",
    dateCategory: `${safeDateISO}::${normalized.categoryId || "other"}`,
    updatedAt: Number(updatedAt || Date.now())
  };
}

function eventRecordToLegacyEvent(record = {}){
  const event = { ...(record || {}) };
  delete event.dateISO;
  delete event.dateCategory;
  delete event.updatedAt;
  return toEvent(event);
}

async function putIndexedDbEventRecordNow(event = {}, dateISO = "", updatedAt = Date.now()){
  const db = await openCalendarIndexedDb();
  if(!db) return null;

  const record = normalizeEventRecordForIndexedDb(event, dateISO, updatedAt);
  const tx = db.transaction(["events", "budgetTransactions"], "readwrite");
  const eventStore = tx.objectStore("events");
  const transactionStore = tx.objectStore("budgetTransactions");

  eventStore.put(record);

  const transaction = budgetTransactionFromEventRecord(record);
  if(transaction){
    transactionStore.put(transaction);
  }else{
    transactionStore.delete(`event:${record.id}`);
  }

  await idbTransactionDone(tx);
  clearIndexedDbBudgetTransactionRangeCache?.("targeted event record write");
  return record;
}

async function deleteIndexedDbEventRecordNow(eventId){
  const safeId = String(eventId || "").trim();
  if(!safeId) return;

  const db = await openCalendarIndexedDb();
  if(!db) return;

  const tx = db.transaction(["events", "budgetTransactions"], "readwrite");
  tx.objectStore("events").delete(safeId);
  tx.objectStore("budgetTransactions").delete(`event:${safeId}`);
  await idbTransactionDone(tx);
  clearIndexedDbBudgetTransactionRangeCache?.("targeted event record delete");
}

async function applyIndexedDbEventRecordOpsNow(ops = []){
  const safeOps = (Array.isArray(ops) ? ops : [ops])
    .filter(op => op && op.slice === "events" && op.store === "events");

  if(!safeOps.length || !indexedDbSupported()) return [];

  const db = await openCalendarIndexedDb();
  if(!db) return [];

  const tx = db.transaction(["events", "budgetTransactions"], "readwrite");
  const eventStore = tx.objectStore("events");
  const transactionStore = tx.objectStore("budgetTransactions");
  const applied = [];

  for(const op of safeOps){
    const recordId = String(op.recordId || op.data?.id || "").trim();

    if(op.deleted){
      if(recordId){
        eventStore.delete(recordId);
        transactionStore.delete(`event:${recordId}`);
        applied.push(op);
      }
      continue;
    }

    if(!op.data) continue;

    const record = normalizeEventRecordForIndexedDb(
      op.data,
      op.data.dateISO || op.data.startDate || selectedDateISO || "",
      op.updatedAt
    );

    eventStore.put(record);

    const transaction = budgetTransactionFromEventRecord(record);
    if(transaction){
      transactionStore.put(transaction);
    }else{
      transactionStore.delete(`event:${record.id}`);
    }

    applied.push({ ...op, recordId: record.id });
  }

  await idbTransactionDone(tx);
  if(applied.length){
    clearIndexedDbBudgetTransactionRangeCache?.("targeted event record ops");
  }
  return applied;
}

function applyIndexedDbEventRecordOpsDebounced(ops = []){
  const safeOps = (Array.isArray(ops) ? ops : [ops]).filter(Boolean);
  if(!safeOps.length || !indexedDbSupported()) return;

  applyIndexedDbEventRecordOpsNow(safeOps).catch(err => {
    console.warn("Could not apply targeted event records to IndexedDB; full slice fallback remains available.", err);
  });
}

async function getIndexedDbEventsForDay(dateISO = selectedDateISO){
  const dayISO = String(dateISO || "").trim();
  if(!dayISO) return [];

  const db = await openCalendarIndexedDb();
  if(!db) return [];

  const tx = db.transaction("events", "readonly");
  const rows = await idbRequestToPromise(
    tx.objectStore("events").index("dateISO").getAll(dayISO)
  );
  await idbTransactionDone(tx).catch(() => {});

  return (rows || [])
    .map(eventRecordToLegacyEvent)
    .sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
}

async function getIndexedDbEventsForRange(startISO, endISO){
  const start = String(startISO || "").trim();
  const end = String(endISO || start || "").trim();
  if(!start || !end || typeof IDBKeyRange === "undefined") return {};

  const db = await openCalendarIndexedDb();
  if(!db) return {};

  const tx = db.transaction("events", "readonly");
  const range = IDBKeyRange.bound(start, end);
  const rows = await idbRequestToPromise(
    tx.objectStore("events").index("dateISO").getAll(range)
  );
  await idbTransactionDone(tx).catch(() => {});

  const map = {};

  for(const row of rows || []){
    const dayISO = row?.dateISO || row?.startDate;
    if(!dayISO) continue;
    (map[dayISO] ||= []).push(eventRecordToLegacyEvent(row));
  }

  for(const dayISO of Object.keys(map)){
    map[dayISO].sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
  }

  return normalizeEventsMap(map);
}


function getIndexedDbEventRangeCacheSummary(){
  return {
    enabled: !!indexedDbEventRangeCache.eventsMap,
    startISO: indexedDbEventRangeCache.startISO,
    endISO: indexedDbEventRangeCache.endISO,
    version: indexedDbEventRangeCache.version,
    days: indexedDbEventRangeCache.eventsMap
      ? Object.keys(indexedDbEventRangeCache.eventsMap).length
      : 0,
    records: indexedDbEventRangeCache.recordsCount || 0,
    source: indexedDbEventRangeCache.source || ""
  };
}

const indexedDbEventRangeCache = {
  startISO: "",
  endISO: "",
  signature: "",
  source: "",
  version: 0,
  recordsCount: 0,
  eventsMap: null
};

const indexedDbEventHydrationRequests = new Map();
let indexedDbEventHydrationSerial = 0;

function isoIsBetween(dayISO = "", startISO = "", endISO = ""){
  return !!dayISO && !!startISO && !!endISO && dayISO >= startISO && dayISO <= endISO;
}

function indexedDbRangeCacheCoversDay(dayISO){
  return !!(
    indexedDbEventRangeCache.eventsMap &&
    isoIsBetween(dayISO, indexedDbEventRangeCache.startISO, indexedDbEventRangeCache.endISO)
  );
}

function indexedDbRangeCacheCoversRange(startISO, endISO){
  return !!(
    indexedDbEventRangeCache.eventsMap &&
    startISO >= indexedDbEventRangeCache.startISO &&
    endISO <= indexedDbEventRangeCache.endISO
  );
}

function clearIndexedDbEventRangeCache(reason = "events changed"){
  indexedDbEventHydrationRequests.clear();
  indexedDbEventHydrationSerial += 1;

  if(!indexedDbEventRangeCache.eventsMap && !indexedDbEventRangeCache.signature) return;

  indexedDbEventRangeCache.startISO = "";
  indexedDbEventRangeCache.endISO = "";
  indexedDbEventRangeCache.signature = "";
  indexedDbEventRangeCache.source = reason;
  indexedDbEventRangeCache.recordsCount = 0;
  indexedDbEventRangeCache.eventsMap = null;
  indexedDbEventRangeCache.version += 1;
}

function getIndexedDbCachedDirectEventsForDay(dayISO){
  if(!indexedDbRangeCacheCoversDay(dayISO)) return null;
  return indexedDbEventRangeCache.eventsMap?.[dayISO] || [];
}

function getDirectEventsForComputedDay(dayISO){
  const cached = getIndexedDbCachedDirectEventsForDay(dayISO);
  if(cached) return cached;
  return Array.isArray(events[dayISO]) ? events[dayISO] : [];
}

function collectLegacyAndCachedDirectEvents(){
  const byId = new Map();

  const addEvent = (event, dayISO = "") => {
    if(!event || typeof event !== "object") return;
    const id = String(event.id || `${dayISO}:${byId.size}`);
    if(!byId.has(id)) byId.set(id, event);
  };

  for(const [dayISO, list] of Object.entries(events || {})){
    if(!Array.isArray(list)) continue;
    for(const event of list) addEvent(event, dayISO);
  }

  if(indexedDbEventRangeCache.eventsMap){
    for(const [dayISO, list] of Object.entries(indexedDbEventRangeCache.eventsMap)){
      if(!Array.isArray(list)) continue;
      for(const event of list) addEvent(event, dayISO);
    }
  }

  return Array.from(byId.values());
}

function indexedDbConnectionSignature(record = {}){
  const connections = Array.isArray(record.connections)
    ? record.connections
    : [];

  const connectionParts = connections
    .map(conn => normalizeEventConnectionRecord(conn, record.color || DEFAULT_COLOR))
    .filter(Boolean)
    .map(conn => [
      conn.id || "",
      conn.name || "",
      safeHexColor(conn.color || DEFAULT_COLOR, DEFAULT_COLOR),
      normalizeConnectionLineStyle(conn.lineStyle)
    ].join("~"))
    .sort()
    .join(",");

  return [
    record.connectionGroupId || "",
    record.connectionGroupName || "",
    safeHexColor(record.connectionColor || record.color || DEFAULT_COLOR, DEFAULT_COLOR),
    normalizeConnectionLineStyle(record.connectionLineStyle),
    connectionParts
  ].join("|");
}

function indexedDbEventRecordSignature(records = []){
  return (records || [])
    .map(record => [
      record.id || "",
      record.dateISO || record.startDate || "",
      record.updatedAt || 0,
      record.title || "",
      record.startTime || "",
      record.endTime || "",
      record.price ?? "",
      record.categoryId || "",
      record.source || "",
      record.span?.end || "",
      record.recurrence?.freq || "none",
      record.recurrence?.until || "",
      indexedDbConnectionSignature(record)
    ].join("|"))
    .sort()
    .join("\n");
}

function indexedDbRecordsAreOlderThanLocalEvents(records = []){
  const localEventTime = getSliceUpdatedAt(getLocalPayload?.() || {}, "events");
  if(!localEventTime) return false;

  const newestRecordTime = Math.max(
    0,
    ...(records || []).map(record => Number(record?.updatedAt || 0))
  );

  return newestRecordTime < localEventTime;
}

async function getIndexedDbEventRecordsForRange(startISO, endISO){
  const start = String(startISO || "").trim();
  const end = String(endISO || start || "").trim();
  if(!start || !end || typeof IDBKeyRange === "undefined") return [];

  const db = await openCalendarIndexedDb();
  if(!db) return [];

  const tx = db.transaction("events", "readonly");
  const rows = await idbRequestToPromise(
    tx.objectStore("events").index("dateISO").getAll(IDBKeyRange.bound(start, end))
  );
  await idbTransactionDone(tx).catch(() => {});

  return Array.isArray(rows) ? rows : [];
}

function eventRecordsToLegacyMap(records = []){
  const map = {};

  for(const row of records || []){
    const dayISO = row?.dateISO || row?.startDate;
    if(!dayISO) continue;
    (map[dayISO] ||= []).push(eventRecordToLegacyEvent(row));
  }

  for(const dayISO of Object.keys(map)){
    map[dayISO].sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
  }

  return normalizeEventsMap(map);
}

function requestIndexedDbEventRangeHydration(startISO, endISO, opts = {}){
  const start = String(startISO || "").trim();
  const end = String(endISO || start || "").trim();

  if(!indexedDbSupported() || !start || !end) return;

  const sameVisibleRange = !!(
    indexedDbEventRangeCache.eventsMap &&
    indexedDbEventRangeCache.startISO === start &&
    indexedDbEventRangeCache.endISO === end &&
    (!opts.source || indexedDbEventRangeCache.source === opts.source)
  );

  // Do not let a broader month cache impersonate the active week/day view.
  // A covered-but-different range is useful as an immediate fallback during
  // render, but the active view should still hydrate its exact visible range.
  if(sameVisibleRange && !opts.force) return;

  const requestKey = `${start}__${end}`;
  if(indexedDbEventHydrationRequests.has(requestKey)) return;

  const serial = ++indexedDbEventHydrationSerial;
  indexedDbEventHydrationRequests.set(requestKey, serial);

  getIndexedDbEventRecordsForRange(start, end)
    .then(records => {
      if(indexedDbEventHydrationRequests.get(requestKey) !== serial) return;
      indexedDbEventHydrationRequests.delete(requestKey);

      if(indexedDbRecordsAreOlderThanLocalEvents(records) && !opts.allowStale){
        // A local edit can render before the debounced IndexedDB mirror finishes.
        // In that tiny window, IndexedDB still contains the previous line style,
        // so accepting the hydration would make the week rail look one click behind.
        return;
      }

      const signature = indexedDbEventRecordSignature(records);
      const sameRange =
        indexedDbEventRangeCache.startISO === start &&
        indexedDbEventRangeCache.endISO === end;

      if(sameRange && indexedDbEventRangeCache.signature === signature) return;

      indexedDbEventRangeCache.startISO = start;
      indexedDbEventRangeCache.endISO = end;
      indexedDbEventRangeCache.signature = signature;
      indexedDbEventRangeCache.source = opts.source || "IndexedDB range hydration";
      indexedDbEventRangeCache.recordsCount = records.length;
      indexedDbEventRangeCache.eventsMap = eventRecordsToLegacyMap(records);
      indexedDbEventRangeCache.version += 1;

      if(derivedCache?.budgetItems){
        derivedCache.budgetItems.clear();
        derivedCache.budgetItemsRangeVersion = indexedDbEventRangeCache.version;
    derivedCache.budgetItemsTxRangeVersion = indexedDbBudgetTransactionRangeCache.version;
      }

      if(opts.renderBudget){
        queueRender({ budget:true, sliders:true });
      }

      if(opts.renderCalendar){
        queueRender({ calendar:true, eventList: opts.renderEventList !== false, sliders:true });
      }
    })
    .catch(err => {
      indexedDbEventHydrationRequests.delete(requestKey);
      console.warn("Could not hydrate visible event range from IndexedDB; using in-memory events map.", err);
    });
}



// ---------------------------------------------------------------------------
// Budget transaction records: normalize + range cache
// ---------------------------------------------------------------------------

function normalizeBudgetTransactionRecord(record = {}){
  const price = Number(record.price ?? record.amount);
  const dateISO = String(record.dateISO || record.date || record.startDate || "").trim();

  if(!record?.id || !dateISO || !Number.isFinite(price) || price === 0){
    return null;
  }

  const type = price < 0 ? "income" : "expense";
  const eventId = String(record.eventId || record.masterId || record.id || "")
    .replace(/^event:/, "");

  return {
    ...record,
    id: normalizeIndexedDbRecordId(record.id, `tx:${dateISO}:${eventId || Date.now()}`),
    eventId,
    dateISO,
    date: dateISO,
    amount: price,
    price,
    type,
    categoryId: record.categoryId || "other",
    color: record.color || DEFAULT_COLOR,
    source: record.source || "calendar",
    isOccurrence: !!record.isOccurrence,
    occursOn: record.occursOn || dateISO,
    dateType: `${dateISO}::${type}`,
    updatedAt: Number(record.updatedAt || Date.now())
  };
}

function budgetTransactionRecordToBudgetItem(record = {}){
  const tx = normalizeBudgetTransactionRecord(record);
  if(!tx) return null;

  return {
    id: `${tx.eventId || tx.id}__${tx.dateISO}`,
    transactionId: tx.id,
    eventId: tx.eventId || String(tx.id).replace(/^event:/, ""),
    date: tx.dateISO,
    title: tx.title || "Untitled event",
    price: Number(tx.price),
    color: tx.color || DEFAULT_COLOR,
    source: tx.source || "calendar",
    categoryId: tx.categoryId || "other",
    isOccurrence: !!tx.isOccurrence,
    occursOn: tx.occursOn || tx.dateISO
  };
}

function indexedDbBudgetTransactionRecordSignature(records = []){
  return (records || [])
    .map(record => [
      record.id || "",
      record.eventId || "",
      record.dateISO || record.date || "",
      record.updatedAt || 0,
      record.title || "",
      record.price ?? record.amount ?? "",
      record.categoryId || "",
      record.source || "",
      record.type || ""
    ].join("|"))
    .sort()
    .join("\n");
}

async function getIndexedDbBudgetTransactionRecordsForRange(startISO, endISO){
  const start = String(startISO || "").trim();
  const end = String(endISO || start || "").trim();
  if(!start || !end || typeof IDBKeyRange === "undefined") return [];

  const db = await openCalendarIndexedDb();
  if(!db || !db.objectStoreNames.contains("budgetTransactions")) return [];

  const tx = db.transaction("budgetTransactions", "readonly");
  const rows = await idbRequestToPromise(
    tx.objectStore("budgetTransactions").index("dateISO").getAll(IDBKeyRange.bound(start, end))
  );
  await idbTransactionDone(tx).catch(() => {});

  return Array.isArray(rows)
    ? rows.map(normalizeBudgetTransactionRecord).filter(Boolean)
    : [];
}

async function getIndexedDbBudgetTransactionsForRange(startISO, endISO){
  const rows = await getIndexedDbBudgetTransactionRecordsForRange(startISO, endISO);
  return rows
    .map(budgetTransactionRecordToBudgetItem)
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.title || "").localeCompare(String(b.title || "")));
}

const indexedDbBudgetTransactionRangeCache = {
  startISO: "",
  endISO: "",
  signature: "",
  source: "",
  version: 0,
  recordsCount: 0,
  items: null
};

const indexedDbBudgetTransactionHydrationRequests = new Map();
let indexedDbBudgetTransactionHydrationSerial = 0;

function getIndexedDbBudgetTransactionRangeCacheSummary(){
  return {
    enabled: !!indexedDbBudgetTransactionRangeCache.items,
    startISO: indexedDbBudgetTransactionRangeCache.startISO,
    endISO: indexedDbBudgetTransactionRangeCache.endISO,
    version: indexedDbBudgetTransactionRangeCache.version,
    records: indexedDbBudgetTransactionRangeCache.recordsCount || 0,
    items: indexedDbBudgetTransactionRangeCache.items
      ? indexedDbBudgetTransactionRangeCache.items.length
      : 0,
    source: indexedDbBudgetTransactionRangeCache.source || ""
  };
}

function indexedDbBudgetTransactionRangeCacheCoversRange(startISO, endISO){
  return !!(
    indexedDbBudgetTransactionRangeCache.items &&
    startISO >= indexedDbBudgetTransactionRangeCache.startISO &&
    endISO <= indexedDbBudgetTransactionRangeCache.endISO
  );
}

function clearIndexedDbBudgetTransactionRangeCache(reason = "budget transactions changed"){
  indexedDbBudgetTransactionHydrationRequests.clear();
  indexedDbBudgetTransactionHydrationSerial += 1;

  if(!indexedDbBudgetTransactionRangeCache.items && !indexedDbBudgetTransactionRangeCache.signature) return;

  indexedDbBudgetTransactionRangeCache.startISO = "";
  indexedDbBudgetTransactionRangeCache.endISO = "";
  indexedDbBudgetTransactionRangeCache.signature = "";
  indexedDbBudgetTransactionRangeCache.source = reason;
  indexedDbBudgetTransactionRangeCache.recordsCount = 0;
  indexedDbBudgetTransactionRangeCache.items = null;
  indexedDbBudgetTransactionRangeCache.version += 1;
}

function getIndexedDbCachedBudgetTransactionItemsForRange(startISO, endISO){
  if(!indexedDbBudgetTransactionRangeCacheCoversRange(startISO, endISO)) return null;

  return (indexedDbBudgetTransactionRangeCache.items || [])
    .filter(item => item.date >= startISO && item.date <= endISO)
    .map(item => ({ ...item }));
}

function requestIndexedDbBudgetTransactionRangeHydration(startISO, endISO, opts = {}){
  const start = String(startISO || "").trim();
  const end = String(endISO || start || "").trim();

  if(!indexedDbSupported() || !start || !end) return;

  const sameVisibleRange = !!(
    indexedDbBudgetTransactionRangeCache.items &&
    indexedDbBudgetTransactionRangeCache.startISO === start &&
    indexedDbBudgetTransactionRangeCache.endISO === end &&
    (!opts.source || indexedDbBudgetTransactionRangeCache.source === opts.source)
  );

  if(sameVisibleRange && !opts.force) return;

  const requestKey = `${start}__${end}`;
  if(indexedDbBudgetTransactionHydrationRequests.has(requestKey)) return;

  const serial = ++indexedDbBudgetTransactionHydrationSerial;
  indexedDbBudgetTransactionHydrationRequests.set(requestKey, serial);

  getIndexedDbBudgetTransactionRecordsForRange(start, end)
    .then(records => {
      if(indexedDbBudgetTransactionHydrationRequests.get(requestKey) !== serial) return;
      indexedDbBudgetTransactionHydrationRequests.delete(requestKey);

      const signature = indexedDbBudgetTransactionRecordSignature(records);
      const sameRange =
        indexedDbBudgetTransactionRangeCache.startISO === start &&
        indexedDbBudgetTransactionRangeCache.endISO === end;

      if(sameRange && indexedDbBudgetTransactionRangeCache.signature === signature) return;

      const items = records
        .map(budgetTransactionRecordToBudgetItem)
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date) || String(a.title || "").localeCompare(String(b.title || "")));

      indexedDbBudgetTransactionRangeCache.startISO = start;
      indexedDbBudgetTransactionRangeCache.endISO = end;
      indexedDbBudgetTransactionRangeCache.signature = signature;
      indexedDbBudgetTransactionRangeCache.source = opts.source || "IndexedDB budget range hydration";
      indexedDbBudgetTransactionRangeCache.recordsCount = records.length;
      indexedDbBudgetTransactionRangeCache.items = items;
      indexedDbBudgetTransactionRangeCache.version += 1;

      if(derivedCache?.budgetItems){
        derivedCache.budgetItems.clear();
        derivedCache.budgetItemsTxRangeVersion = indexedDbBudgetTransactionRangeCache.version;
      }

      if(opts.renderBudget){
        queueRender({ budget:true, sliders:true });
      }
    })
    .catch(err => {
      indexedDbBudgetTransactionHydrationRequests.delete(requestKey);
      console.warn("Could not hydrate budget transactions from IndexedDB; using computed calendar events.", err);
    });
}

function mergeBudgetItemsByKey(...groups){
  const map = new Map();

  for(const group of groups){
    for(const item of group || []){
      if(!item || !item.date) continue;
      const key = item.id || `${item.eventId || item.transactionId || item.title}__${item.date}`;
      if(map.has(key)) continue;
      map.set(key, { ...item, id: key });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.title || "").localeCompare(String(b.title || "")));
}

function computeRecurringBudgetItemsUncached(startISO, endISO){
  const items = [];
  const seen = new Set();
  const masters = getAllRecurringMasters()
    .filter(ev => {
      const price = Number(ev?.price);
      return Number.isFinite(price) && price !== 0;
    });

  let cursor = ymdToDate(startISO);
  const end = ymdToDate(endISO);

  while(cursor <= end){
    const iso = dateToYmd(cursor);

    for(const master of masters){
      if(master.startDate === iso) continue;
      if(!recurrenceMatches(master, iso)) continue;

      const ex = master.recurrence?.exceptions;
      if(Array.isArray(ex) && ex.includes(iso)) continue;

      const price = Number(master.price);
      const key = `${master.id}__${iso}`;
      if(seen.has(key)) continue;
      seen.add(key);

      items.push({
        id: key,
        eventId: master.id,
        date: iso,
        title: master.title || "Untitled event",
        price,
        color: master.color || DEFAULT_COLOR,
        source: master.source || "calendar",
        categoryId: master.categoryId || "other",
        isOccurrence: true,
        occursOn: iso
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

async function countIndexedDbStoreRecords(){
  const db = await openCalendarIndexedDb();
  if(!db) return {};

  const counts = {};

  for(const storeName of CALENDAR_IDB_STORES){
    if(!db.objectStoreNames.contains(storeName)) continue;

    try{
      const tx = db.transaction(storeName, "readonly");
      counts[storeName] = await idbRequestToPromise(tx.objectStore(storeName).count());
      await idbTransactionDone(tx).catch(() => {});
    }catch{
      counts[storeName] = null;
    }
  }

  return counts;
}


// ---------------------------------------------------------------------------
// Generic slice/record conversion helpers
// ---------------------------------------------------------------------------

function budgetPlansToIndexedDbRecords(plans = {}, updatedAt = Date.now()){
  const records = [];

  for(const [period, periodPlans] of Object.entries(plans || {})){
    if(!periodPlans || typeof periodPlans !== "object") continue;

    for(const [rangeKey, plan] of Object.entries(periodPlans)){
      records.push({
        id: `${period}:${rangeKey}`,
        period,
        rangeKey,
        plan,
        updatedAt
      });
    }
  }

  return records;
}

function objectMapToIndexedDbRecords(map = {}, updatedAt = Date.now()){
  return Object.entries(map || {}).map(([id, value]) => ({
    id: normalizeIndexedDbRecordId(id, cryptoId?.() || String(Date.now())),
    value,
    updatedAt
  }));
}

function arrayToIndexedDbRecords(list = [], updatedAt = Date.now(), prefix = "record"){
  if(!Array.isArray(list)) return [];

  return list.map((item, index) => {
    const obj = item && typeof item === "object" ? item : { value: item };
    return {
      ...obj,
      id: normalizeIndexedDbRecordId(obj.id, `${prefix}:${index}`),
      updatedAt: Number(obj.updatedAt || obj.createdAt || updatedAt)
    };
  });
}

function selectedBudgetPanesToIndexedDbRecords(panes = {}, updatedAt = Date.now()){
  return Object.entries(panes || {}).map(([id, selected]) => ({
    id,
    selected: Array.isArray(selected) ? selected : [],
    updatedAt
  }));
}

async function mirrorSliceToIndexedDbStores(slice, value, updatedAt = Date.now(), db = null){
  const opened = db || await openCalendarIndexedDb();
  if(!opened) return;

  try{
    if(slice === "events"){
      const { events: eventRecords, budgetTransactions } = eventsMapToIndexedDbRecords(value, updatedAt);
      await idbClearAndPutAll(opened, "events", eventRecords);
      await idbClearAndPutAll(opened, "budgetTransactions", budgetTransactions);
      clearIndexedDbBudgetTransactionRangeCache?.("events slice mirrored");
      return;
    }

    if(slice === "budgetCategories"){
      await idbClearAndPutAll(opened, "budgetCategories", arrayToIndexedDbRecords(value, updatedAt, "category"));
      return;
    }

    if(slice === "budgetPlans"){
      await idbClearAndPutAll(opened, "budgetPlans", budgetPlansToIndexedDbRecords(value, updatedAt));
      return;
    }

    if(slice === "receiptItemCategoryMemory"){
      await idbClearAndPutAll(opened, "receiptMemory", objectMapToIndexedDbRecords(value, updatedAt));
      return;
    }

    if(slice === "receiptTrainingRecords"){
      await idbClearAndPutAll(opened, "receiptTraining", arrayToIndexedDbRecords(value, updatedAt, "training"));
      return;
    }

    if(slice === "merchantAliases"){
      await idbClearAndPutAll(opened, "merchantAliases", objectMapToIndexedDbRecords(value, updatedAt));
      return;
    }

    if(slice === "people"){
      await idbClearAndPutAll(opened, "people", arrayToIndexedDbRecords(value, updatedAt, "person"));
      return;
    }

    if(slice === "households"){
      await idbClearAndPutAll(opened, "households", arrayToIndexedDbRecords(value, updatedAt, "household"));
      return;
    }

    if(slice === "selectedBudgetPanes"){
      const tx = opened.transaction("meta", "readwrite");
      tx.objectStore("meta").put({
        key: "selectedBudgetPanes",
        value,
        updatedAt
      });
      await idbTransactionDone(tx);
      return;
    }

    if(slice === "settings" || slice === "activeSection" || slice === "budgetViewMode"){
      const tx = opened.transaction("meta", "readwrite");
      tx.objectStore("meta").put({
        key: slice,
        value,
        updatedAt
      });
      await idbTransactionDone(tx);
    }
  }catch(err){
    console.warn(`Could not mirror ${slice} into IndexedDB record stores.`, err);
  }
}

async function putIndexedDbSliceNow(slice, value, updatedAt = Date.now()){
  const safeSlice = normalizeSliceList(slice)[0];
  if(!safeSlice) return;

  const db = await openCalendarIndexedDb();
  if(!db) return;

  const tx = db.transaction(["slices", "meta"], "readwrite");
  tx.objectStore("slices").put({
    slice: safeSlice,
    value,
    updatedAt
  });
  tx.objectStore("meta").put({
    key: `sliceUpdatedAt:${safeSlice}`,
    value: updatedAt,
    updatedAt
  });
  await idbTransactionDone(tx);

  await mirrorSliceToIndexedDbStores(safeSlice, value, updatedAt, db);
}

function writeIndexedDbSliceDebounced(slice, value, updatedAt = Date.now()){
  const safeSlice = normalizeSliceList(slice)[0];
  if(!safeSlice || !indexedDbSupported()) return;

  indexedDbSliceWriteQueue.set(safeSlice, {
    value,
    updatedAt: Number(updatedAt || Date.now())
  });

  clearTimeout(indexedDbSliceWriteTimer);
  indexedDbSliceWriteTimer = setTimeout(() => {
    flushIndexedDbSliceWrites().catch(err => {
      console.warn("IndexedDB slice flush failed; localStorage fallback still has data.", err);
    });
  }, 120);
}

async function flushIndexedDbSliceWrites(){
  if(!indexedDbSliceWriteQueue.size) return;

  const entries = Array.from(indexedDbSliceWriteQueue.entries());
  indexedDbSliceWriteQueue.clear();

  for(const [slice, item] of entries){
    await putIndexedDbSliceNow(slice, item.value, item.updatedAt);
  }
}

async function writeIndexedDbMetaNow(meta){
  const db = await openCalendarIndexedDb();
  if(!db || !meta) return;

  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put({
    key: "appMeta",
    value: meta,
    updatedAt: Number(meta.updatedAt || Date.now())
  });
  await idbTransactionDone(tx);
}

function writeIndexedDbMetaDebounced(meta){
  if(!indexedDbSupported()) return;
  indexedDbMetaWriteQueue = meta;

  clearTimeout(indexedDbMetaWriteTimer);
  indexedDbMetaWriteTimer = setTimeout(() => {
    const queued = indexedDbMetaWriteQueue;
    indexedDbMetaWriteQueue = null;
    writeIndexedDbMetaNow(queued).catch(err => {
      console.warn("IndexedDB meta write failed; localStorage fallback still has meta.", err);
    });
  }, 120);
}

async function getIndexedDbSliceRecord(slice){
  const safeSlice = normalizeSliceList(slice)[0];
  if(!safeSlice) return null;

  const db = await openCalendarIndexedDb();
  if(!db) return null;

  const tx = db.transaction("slices", "readonly");
  const record = await idbRequestToPromise(tx.objectStore("slices").get(safeSlice));
  await idbTransactionDone(tx).catch(() => {});
  return record || null;
}

async function getIndexedDbPayload(){
  const db = await openCalendarIndexedDb();
  if(!db) return null;

  const tx = db.transaction("slices", "readonly");
  const rows = await idbRequestToPromise(tx.objectStore("slices").getAll());
  await idbTransactionDone(tx).catch(() => {});

  if(!Array.isArray(rows) || !rows.length) return null;

  const payload = {
    version: SPLIT_STORAGE_VERSION,
    updatedAt: 0,
    sliceUpdatedAt: {}
  };

  for(const row of rows){
    const slice = normalizeSliceList(row?.slice)[0];
    if(!slice) continue;

    payload[slice] = row.value;
    payload.sliceUpdatedAt[slice] = Number(row.updatedAt || 0);
    payload.updatedAt = Math.max(payload.updatedAt, payload.sliceUpdatedAt[slice]);
  }

  return payload;
}

async function restoreMissingOrNewerSlicesFromIndexedDb(){
  const idbPayload = await getIndexedDbPayload();
  if(!idbPayload) return [];

  const local = getLocalPayload();
  const patch = {
    version: SPLIT_STORAGE_VERSION,
    updatedAt: Number(idbPayload.updatedAt || Date.now()),
    sliceUpdatedAt: idbPayload.sliceUpdatedAt || {}
  };

  const restoredSlices = [];

  for(const slice of DATA_SLICE_NAMES){
    if(!hasOwn(idbPayload, slice)) continue;

    const idbValue = idbPayload[slice];
    const localValue = local[slice];
    const idbTime = getSliceUpdatedAt(idbPayload, slice);
    const localTime = getSliceUpdatedAt(local, slice);

    if(
      isMeaningfulSliceValue(slice, idbValue) &&
      (!isMeaningfulSliceValue(slice, localValue) || idbTime > localTime)
    ){
      patch[slice] = idbValue;
      restoredSlices.push(slice);
    }
  }

  if(restoredSlices.length){
    applyFullSavePayload(patch);
    console.info(
      "Calendar restored from IndexedDB:",
      restoredSlices.map(slice => DATA_SLICE_LABELS[slice] || slice).join(", ")
    );
  }

  return restoredSlices;
}

async function migrateCurrentLocalStorageToIndexedDb(){
  if(!indexedDbSupported()) return [];

  const local = getLocalPayload();
  const idbPayload = await getIndexedDbPayload();
  const migratedSlices = [];

  for(const slice of DATA_SLICE_NAMES){
    if(!hasOwn(local, slice) || !isMeaningfulSliceValue(slice, local[slice])) continue;

    const localTime = getSliceUpdatedAt(local, slice) || Number(local.updatedAt || Date.now());
    const idbTime = idbPayload ? getSliceUpdatedAt(idbPayload, slice) : 0;

    if(!idbPayload || localTime >= idbTime || !isMeaningfulSliceValue(slice, idbPayload[slice])){
      await putIndexedDbSliceNow(slice, local[slice], localTime);
      migratedSlices.push(slice);
    }
  }

  if(migratedSlices.length){
    await writeIndexedDbMetaNow(getLocalMeta());
    console.info(
      "Calendar moved into IndexedDB:",
      migratedSlices.map(slice => DATA_SLICE_LABELS[slice] || slice).join(", ")
    );
  }

  return migratedSlices;
}

async function bootstrapIndexedDbStorageAfterInitialLoad(){
  if(!indexedDbSupported()){
    console.info("IndexedDB is not available; localStorage fallback remains active.");
    return { restored: [], migrated: [] };
  }

  const restored = await restoreMissingOrNewerSlicesFromIndexedDb();
  const migrated = await migrateCurrentLocalStorageToIndexedDb();

  return { restored, migrated };
}

async function getCalendarStorageDebugSummary(){
  const localKeys = Object.fromEntries(
    Object.keys(localStorage)
      .filter(k => k.startsWith("myCalendar"))
      .sort()
      .map(k => [k, (localStorage.getItem(k) || "").length])
  );

  const idbPayload = await getIndexedDbPayload();

  return {
    mode: indexedDbSupported() ? "IndexedDB + localStorage safety cache" : "localStorage only",
    localKeys,
    indexedDbSlices: idbPayload
      ? Object.fromEntries(DATA_SLICE_NAMES.map(slice => [
          slice,
          hasOwn(idbPayload, slice)
            ? JSON.stringify(idbPayload[slice] ?? null).length
            : 0
        ]))
      : {},
    indexedDbRecordCounts: indexedDbSupported() ? await countIndexedDbStoreRecords() : {},
    indexedDbEventRangeCache: getIndexedDbEventRangeCacheSummary(),
    indexedDbBudgetTransactionRangeCache: getIndexedDbBudgetTransactionRangeCacheSummary(),
    indexedDbUpdatedAt: idbPayload?.updatedAt || 0,
    queuedCloudRows: await countQueuedCloudRecordOps(),
    cloudSync: getCloudSyncDebugSummary()
  };
}

if(typeof window !== "undefined"){
  window.calendarStorageDebug = getCalendarStorageDebugSummary;
  window.calendarIndexedDbEventsForDay = getIndexedDbEventsForDay;
  window.calendarIndexedDbEventsForRange = getIndexedDbEventsForRange;
  window.calendarIndexedDbRenderCache = getIndexedDbEventRangeCacheSummary;
  window.calendarIndexedDbBudgetTransactionsForRange = getIndexedDbBudgetTransactionsForRange;
  window.calendarIndexedDbBudgetCache = getIndexedDbBudgetTransactionRangeCacheSummary;
  window.calendarCloudSyncDebug = getCloudSyncDebugSummary;
}


// ---------------------------------------------------------------------------
// Local storage slices: read/write + legacy migration
// ---------------------------------------------------------------------------

function hasOwn(obj, key){
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function parseStoredJson(key, fallbackValue = null){
  try{
    const raw = localStorage.getItem(key);
    if(raw === null || raw === undefined || raw === "") return fallbackValue;
    return JSON.parse(raw);
  }catch{
    return fallbackValue;
  }
}

function normalizeSliceList(slices){
  const input = Array.isArray(slices)
    ? slices
    : typeof slices === "string"
      ? [slices]
      : [];

  return [...new Set(input.filter(slice => DATA_SLICE_NAMES.includes(slice)))];
}

function getSliceStorageKey(slice){
  switch(slice){
    case "events": return EVENTS_STORAGE_KEY;
    case "settings": return SETTINGS_KEY;
    case "budgetPlans": return BUDGET_PLANS_KEY;
    case "budgetCategories": return BUDGET_CATEGORIES_KEY;
    case "merchantAliases": return MERCHANT_ALIASES_KEY;
    case "receiptItemCategoryMemory": return RECEIPT_ITEM_MEMORY_KEY;
    case "receiptTrainingRecords": return RECEIPT_TRAINING_RECORDS_KEY;
    case "selectedBudgetPanes": return BUDGET_PANES_KEY;
    case "people": return PEOPLE_STORAGE_KEY;
    case "households": return HOUSEHOLDS_STORAGE_KEY;
    default: return "";
  }
}

function getLocalMeta(){
  const saved = parseStoredJson(APP_META_STORAGE_KEY, null);

  if(saved && typeof saved === "object"){
    return {
      version: Number(saved.version || SPLIT_STORAGE_VERSION),
      updatedAt: Number(saved.updatedAt || 0),
      sliceUpdatedAt: saved.sliceUpdatedAt && typeof saved.sliceUpdatedAt === "object"
        ? saved.sliceUpdatedAt
        : {}
    };
  }

  return {
    version: SPLIT_STORAGE_VERSION,
    updatedAt: 0,
    sliceUpdatedAt: {}
  };
}

function saveLocalMeta(updatedAt = Date.now(), slices = []){
  const safeUpdatedAt = Number(updatedAt || Date.now());
  const meta = getLocalMeta();

  meta.version = SPLIT_STORAGE_VERSION;
  meta.updatedAt = Math.max(Number(meta.updatedAt || 0), safeUpdatedAt);

  for(const slice of normalizeSliceList(slices)){
    meta.sliceUpdatedAt[slice] = safeUpdatedAt;
  }

  localStorage.setItem(APP_META_STORAGE_KEY, JSON.stringify(meta));

  // Keep the old monolith key as a tiny migration pointer instead of rewriting
  // megabytes on every save. Older backups/files can still be imported.
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: SPLIT_STORAGE_VERSION,
    splitStorage: true,
    updatedAt: meta.updatedAt,
    sliceUpdatedAt: meta.sliceUpdatedAt
  }));

  writeIndexedDbMetaDebounced(meta);

  return meta;
}

function getPayloadSliceNames(payload = {}){
  return DATA_SLICE_NAMES.filter(slice => hasOwn(payload, slice));
}

function readLocalDataSlice(slice, legacyPayload = {}){
  const key = getSliceStorageKey(slice);
  const stored = key ? parseStoredJson(key, undefined) : undefined;

  if(stored !== undefined) return stored;
  if(hasOwn(legacyPayload, slice)) return legacyPayload[slice];

  if(slice === "events") return {};
  if(slice === "settings") return null;
  if(slice === "budgetPlans") return null;
  if(slice === "budgetCategories") return null;
  if(slice === "merchantAliases") return null;
  if(slice === "receiptItemCategoryMemory") return null;
  if(slice === "receiptTrainingRecords") return null;
  if(slice === "selectedBudgetPanes") return null;
  if(slice === "activeSection") return localStorage.getItem("myCalendar_activeSection") || null;
  if(slice === "budgetViewMode") return localStorage.getItem("myCalendar_budgetViewMode") || null;
  if(slice === "people") return [];
  if(slice === "households") return [];

  return null;
}

function writeLocalDataSlice(slice, value, opts = {}){
  if(value === undefined) return;

  const updatedAt = Date.now();

  if(slice === "activeSection"){
    const safeValue = value || "calendar";
    localStorage.setItem("myCalendar_activeSection", safeValue);
    writeIndexedDbSliceDebounced(slice, safeValue, updatedAt);
    return;
  }

  if(slice === "budgetViewMode"){
    const safeValue = value || "month";
    localStorage.setItem("myCalendar_budgetViewMode", safeValue);
    writeIndexedDbSliceDebounced(slice, safeValue, updatedAt);
    return;
  }

  const key = getSliceStorageKey(slice);
  if(!key) return;

  localStorage.setItem(key, JSON.stringify(value));

  if(!(slice === "events" && opts.skipIndexedDbSliceWrite)){
    writeIndexedDbSliceDebounced(slice, value, updatedAt);
  }
}

function getSliceUpdatedAt(payload = {}, slice){
  const sliceTime = Number(payload?.sliceUpdatedAt?.[slice] || 0);
  return sliceTime || Number(payload?.updatedAt || 0);
}

function loadPeopleData(){
  const saved = parseStoredJson(PEOPLE_STORAGE_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

function loadHouseholdData(){
  const saved = parseStoredJson(HOUSEHOLDS_STORAGE_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

function savePeopleData(people = []){
  const safePeople = Array.isArray(people) ? people : [];
  setLocalPayload({ updatedAt: Date.now(), people: safePeople });
  cloudWriteDebounced(["people"]);
}

function saveHouseholdData(households = []){
  const safeHouseholds = Array.isArray(households) ? households : [];
  setLocalPayload({ updatedAt: Date.now(), households: safeHouseholds });
  cloudWriteDebounced(["households"]);
}


function isMeaningfulSliceValue(slice, value){
  if(value === undefined || value === null) return false;
  if(slice === "events") return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
  if(Array.isArray(value)) return value.length > 0;
  if(typeof value === "object") return Object.keys(value).length > 0;
  return String(value).trim() !== "";
}

function shouldCopyLegacySlice(slice, legacyValue){
  if(!isMeaningfulSliceValue(slice, legacyValue)) return false;

  if(slice === "activeSection"){
    return !localStorage.getItem("myCalendar_activeSection");
  }

  if(slice === "budgetViewMode"){
    return !localStorage.getItem("myCalendar_budgetViewMode");
  }

  const key = getSliceStorageKey(slice);
  if(!key) return false;

  const existing = parseStoredJson(key, undefined);
  return !isMeaningfulSliceValue(slice, existing);
}

function migrateLegacyStorageToSlices(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];

    const legacy = JSON.parse(raw);
    if(!legacy || typeof legacy !== "object" || legacy.splitStorage) return [];

    const migratedSlices = [];

    for(const slice of DATA_SLICE_NAMES){
      if(!hasOwn(legacy, slice)) continue;
      if(!shouldCopyLegacySlice(slice, legacy[slice])) continue;

      writeLocalDataSlice(slice, legacy[slice]);
      migratedSlices.push(slice);
    }

    if(migratedSlices.length){
      const updatedAt = Number(legacy.updatedAt || Date.now());
      saveLocalMeta(updatedAt, migratedSlices);
      console.info(
        "Calendar storage migrated:",
        migratedSlices.map(slice => DATA_SLICE_LABELS[slice] || slice).join(", ")
      );
    }

    return migratedSlices;
  }catch(err){
    console.warn("Calendar legacy storage migration skipped:", err);
    return [];
  }
}

// ============================================================================
// 04b. UTILITY HELPERS
// ============================================================================

function flashBudgetButtonError(btn){
  if(!btn) return;

  btn.classList.add("budgetBtnError");

  clearTimeout(btn._budgetErrorTimer);

  btn._budgetErrorTimer = setTimeout(() => {
    btn.classList.remove("budgetBtnError");
  }, 900);
}


// ============================================================================
// 04c. SUPABASE CLOUD SYNC
// ============================================================================
// Public anon keys are expected in frontend apps. Security comes from Supabase
// Auth + Row Level Security policies, not from hiding this value.

// ---------------------------------------------------------------------------
// Config & record-key helpers
// ---------------------------------------------------------------------------

const SUPABASE_URL = "https://ddxiumutfrimgjzzbhus.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Icp1pf88iW1t5TUnmVqb6Q_bXSRI9e_";
const CLOUD_ROW_ID = "main";
const CLOUD_TABLE = "calendar_cloud_state";
const CLOUD_PENDING_KEY = "myCalendarCloudPending_v1";
const CLOUD_LAST_SYNC_KEY = "myCalendarCloudLastSync_v1";
const CLOUD_DELTA_PULL_BUFFER_MS = 2 * 60 * 1000;

let supabaseClient = null;
let cloudUser = null;
let cloudWriteTimer = null;
let cloudBusy = false;
let cloudFlushInProgress = false;
let cloudSyncLastReadSummary = {
  mode: "none",
  rowsRead: 0,
  sinceAt: 0,
  readAt: 0,
  appliedSlices: []
};


// Row-based cloud sync rides on the existing Supabase table. Each app item gets
// its own cloud row, while the old slice rows stay readable as a safety bridge.
const CLOUD_RECORD_KIND = "calendar_record_v1";
const CLOUD_KNOWN_RECORDS_KEY = "myCalendarCloudKnownRecords_v1";

function cloudRecordKey(slice, store, recordId){
  return `${slice}::${store}::${String(recordId ?? "singleton")}`;
}

function splitCloudRecordKey(key){
  const parts = String(key || "").split("::");
  return {
    slice: parts[0] || "",
    store: parts[1] || "",
    recordId: parts.slice(2).join("::") || "singleton"
  };
}

function getCloudRecordRowId(store, recordId){
  const userPart = cloudUser?.id || "offline";
  const safeStore = encodeURIComponent(String(store || "record"));
  const safeRecord = encodeURIComponent(String(recordId || "singleton"));
  return `${userPart}:record:${safeStore}:${safeRecord}`;
}

function getKnownCloudRecordKeys(){
  try{
    const saved = JSON.parse(localStorage.getItem(CLOUD_KNOWN_RECORDS_KEY)) || {};
    return saved && typeof saved === "object" ? saved : {};
  }catch{
    return {};
  }
}

function saveKnownCloudRecordKeys(map){
  try{
    localStorage.setItem(CLOUD_KNOWN_RECORDS_KEY, JSON.stringify(map || {}));
  }catch(err){
    console.warn("Could not save cloud record index.", err);
  }
}

function getKnownCloudKeysForSlice(slice){
  const map = getKnownCloudRecordKeys();
  return Array.isArray(map[slice]) ? map[slice] : [];
}

function setKnownCloudKeysForSlice(slice, keys){
  const safeSlice = normalizeSliceList(slice)[0];
  if(!safeSlice) return;

  const map = getKnownCloudRecordKeys();
  map[safeSlice] = [...new Set((keys || []).map(String))];
  saveKnownCloudRecordKeys(map);
}

function updateKnownCloudKeysFromOps(ops = []){
  const map = getKnownCloudRecordKeys();

  for(const op of ops || []){
    const slice = normalizeSliceList(op?.slice)[0];
    if(!slice) continue;

    const key = op.key || cloudRecordKey(slice, op.store, op.recordId);
    const set = new Set(Array.isArray(map[slice]) ? map[slice] : []);

    if(op.deleted) set.delete(key);
    else set.add(key);

    map[slice] = Array.from(set);
  }

  saveKnownCloudRecordKeys(map);
}

function rowUpdatedAt(row){
  return row?.updated_at ? new Date(row.updated_at).getTime() : Number(row?.payload?.updatedAt || 0);
}

// ---------------------------------------------------------------------------
// Local data ownership guard (prevents cross-account contamination on shared
// devices). Local data written while user A was signed in must never be
// auto-pushed into user B's account, and B's cloud data must never silently
// merge into A's leftover local state. Manual Push/Pull remain intentional
// overrides and claim ownership for the current account.
// ---------------------------------------------------------------------------
const LOCAL_DATA_OWNER_KEY = "myCalendarLocalDataOwner_v1";

function getLocalDataOwner(){
  try{ return localStorage.getItem(LOCAL_DATA_OWNER_KEY) || ""; }catch{ return ""; }
}

function setLocalDataOwner(userId = ""){
  try{
    if(userId) localStorage.setItem(LOCAL_DATA_OWNER_KEY, String(userId));
    else localStorage.removeItem(LOCAL_DATA_OWNER_KEY);
  }catch{}
}

// True when this device's local data belongs to a *different* signed-in user.
// A blank owner means "unclaimed" (fresh device or pre-patch data) and is
// adopted by the current account on first successful sync.
function cloudIdentityMismatch(){
  if(!cloudUser) return false;
  const owner = getLocalDataOwner();
  return !!owner && owner !== cloudUser.id;
}

function warnCloudIdentityMismatch(){
  setCloudStatus(
    "Cloud: This device holds data from a different account. Auto-sync is paused. " +
    "Use Push to upload this device's data to the current account, or Pull to replace it with this account's cloud data."
  );
}

function getCloudLastSyncAt(){
  return Math.max(0, Number(localStorage.getItem(CLOUD_LAST_SYNC_KEY) || 0) || 0);
}

function setCloudLastSyncAt(time = Date.now()){
  localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(Math.max(0, Number(time || Date.now()))));
}

function stableCloudCompareString(value){
  try{
    const seen = new WeakSet();

    return JSON.stringify(value, (key, item) => {
      if(item && typeof item === "object"){
        if(seen.has(item)) return null;
        seen.add(item);

        if(Array.isArray(item)) return item;

        return Object.keys(item)
          .sort()
          .reduce((out, k) => {
            out[k] = item[k];
            return out;
          }, {});
      }

      return item;
    });
  }catch{
    return String(value ?? "");
  }
}

function normalizeSliceForCloudCompare(slice, value){
  if(slice === "events"){
    return normalizeEventsMap(value || {});
  }

  return value;
}

function cloudSliceDiffers(slice, cloudPayload = {}, localPayload = {}){
  if(!hasOwn(cloudPayload, slice)) return false;

  return stableCloudCompareString(
    normalizeSliceForCloudCompare(slice, cloudPayload[slice])
  ) !== stableCloudCompareString(
    normalizeSliceForCloudCompare(slice, localPayload[slice])
  );
}

function setCloudReadDebugSummary(summary = {}){
  cloudSyncLastReadSummary = {
    mode: summary.mode || "none",
    rowsRead: Number(summary.rowsRead || 0),
    sinceAt: Number(summary.sinceAt || 0),
    readAt: Number(summary.readAt || Date.now()),
    appliedSlices: Array.isArray(summary.appliedSlices) ? summary.appliedSlices : []
  };
}

function getCloudSyncDebugSummary(){
  const lastSyncAt = getCloudLastSyncAt();

  return {
    lastSyncAt,
    lastSyncISO: lastSyncAt ? new Date(lastSyncAt).toISOString() : "",
    deltaBufferMs: CLOUD_DELTA_PULL_BUFFER_MS,
    lastRead: {
      ...cloudSyncLastReadSummary,
      sinceISO: cloudSyncLastReadSummary.sinceAt
        ? new Date(cloudSyncLastReadSummary.sinceAt).toISOString()
        : "",
      readISO: cloudSyncLastReadSummary.readAt
        ? new Date(cloudSyncLastReadSummary.readAt).toISOString()
        : ""
    }
  };
}

function getCloudStoreForSlice(slice){
  switch(slice){
    case "receiptItemCategoryMemory": return "receiptMemory";
    case "receiptTrainingRecords": return "receiptTraining";
    case "selectedBudgetPanes":
    case "activeSection":
    case "budgetViewMode": return "meta";
    default: return slice;
  }
}


// ---------------------------------------------------------------------------
// Record ops: build, queue, dequeue
// ---------------------------------------------------------------------------

function makeCloudRecordOp(slice, store, recordId, data, updatedAt, deleted = false){
  const safeSlice = normalizeSliceList(slice)[0];
  if(!safeSlice) return null;

  const safeStore = String(store || getCloudStoreForSlice(safeSlice));
  const safeRecordId = String(recordId || "singleton");
  const safeUpdatedAt = Number(updatedAt || Date.now());

  return {
    id: cloudRecordKey(safeSlice, safeStore, safeRecordId),
    key: cloudRecordKey(safeSlice, safeStore, safeRecordId),
    slice: safeSlice,
    store: safeStore,
    recordId: safeRecordId,
    data: deleted ? null : data,
    deleted: !!deleted,
    updatedAt: safeUpdatedAt
  };
}

function cloudOpsFromSliceValue(slice, value, updatedAt = Date.now()){
  const safeSlice = normalizeSliceList(slice)[0];
  if(!safeSlice) return [];

  const safeUpdatedAt = Number(updatedAt || Date.now());
  const ops = [];

  if(safeSlice === "events"){
    const { events: eventRecords } = eventsMapToIndexedDbRecords(value || {}, safeUpdatedAt);
    for(const record of eventRecords){
      ops.push(makeCloudRecordOp(safeSlice, "events", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "budgetCategories"){
    for(const record of arrayToIndexedDbRecords(value || [], safeUpdatedAt, "category")){
      ops.push(makeCloudRecordOp(safeSlice, "budgetCategories", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "budgetPlans"){
    for(const record of budgetPlansToIndexedDbRecords(value || {}, safeUpdatedAt)){
      ops.push(makeCloudRecordOp(safeSlice, "budgetPlans", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "receiptItemCategoryMemory"){
    for(const record of objectMapToIndexedDbRecords(value || {}, safeUpdatedAt)){
      ops.push(makeCloudRecordOp(safeSlice, "receiptMemory", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "receiptTrainingRecords"){
    for(const record of arrayToIndexedDbRecords(value || [], safeUpdatedAt, "training")){
      ops.push(makeCloudRecordOp(safeSlice, "receiptTraining", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "merchantAliases"){
    for(const record of objectMapToIndexedDbRecords(value || {}, safeUpdatedAt)){
      ops.push(makeCloudRecordOp(safeSlice, "merchantAliases", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "people"){
    for(const record of arrayToIndexedDbRecords(value || [], safeUpdatedAt, "person")){
      ops.push(makeCloudRecordOp(safeSlice, "people", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "households"){
    for(const record of arrayToIndexedDbRecords(value || [], safeUpdatedAt, "household")){
      ops.push(makeCloudRecordOp(safeSlice, "households", record.id, record, record.updatedAt || safeUpdatedAt));
    }
    return ops.filter(Boolean);
  }

  if(safeSlice === "settings"){
    return [makeCloudRecordOp(safeSlice, "settings", "settings", value || {}, safeUpdatedAt)].filter(Boolean);
  }

  if(safeSlice === "selectedBudgetPanes"){
    return [makeCloudRecordOp(safeSlice, "meta", "selectedBudgetPanes", value || {}, safeUpdatedAt)].filter(Boolean);
  }

  if(safeSlice === "activeSection"){
    return [makeCloudRecordOp(safeSlice, "meta", "activeSection", value || "calendar", safeUpdatedAt)].filter(Boolean);
  }

  if(safeSlice === "budgetViewMode"){
    return [makeCloudRecordOp(safeSlice, "meta", "budgetViewMode", value || "month", safeUpdatedAt)].filter(Boolean);
  }

  return [makeCloudRecordOp(safeSlice, getCloudStoreForSlice(safeSlice), "singleton", value, safeUpdatedAt)].filter(Boolean);
}

function buildCloudRecordOpsForSlices(fullPayload, slices = DATA_SLICE_NAMES, includeDeletes = true){
  const safePayload = buildFullSavePayload(fullPayload || getLocalPayload());
  const safeSlices = normalizeSliceList(slices);
  const ops = [];

  for(const slice of safeSlices){
    const sliceUpdatedAt = getSliceUpdatedAt(safePayload, slice) || Number(safePayload.updatedAt || Date.now());
    const currentOps = cloudOpsFromSliceValue(slice, safePayload[slice], sliceUpdatedAt);
    const currentKeys = new Set(currentOps.map(op => op.key));

    ops.push(...currentOps);

    if(includeDeletes){
      for(const oldKey of getKnownCloudKeysForSlice(slice)){
        if(currentKeys.has(oldKey)) continue;
        const old = splitCloudRecordKey(oldKey);
        if(!old.slice || !old.store || !old.recordId) continue;
        ops.push(makeCloudRecordOp(old.slice, old.store, old.recordId, null, sliceUpdatedAt, true));
      }
    }
  }

  return ops.filter(Boolean);
}

function cloudOpsToSupabaseRows(ops = []){
  if(!cloudUser) return [];

  return (ops || []).map(op => ({
    id: getCloudRecordRowId(op.store, op.recordId),
    user_id: cloudUser.id,
    payload: {
      kind: CLOUD_RECORD_KIND,
      version: SPLIT_STORAGE_VERSION,
      slice: op.slice,
      store: op.store,
      recordId: op.recordId,
      updatedAt: Number(op.updatedAt || Date.now()),
      deleted: !!op.deleted,
      data: op.deleted ? null : op.data
    },
    updated_at: new Date(Number(op.updatedAt || Date.now())).toISOString()
  }));
}

function getCloudRecordOpFromRow(row){
  const payload = row?.payload;
  if(!payload || payload.kind !== CLOUD_RECORD_KIND) return null;

  const slice = normalizeSliceList(payload.slice)[0];
  if(!slice) return null;

  return makeCloudRecordOp(
    slice,
    payload.store || getCloudStoreForSlice(slice),
    payload.recordId || "singleton",
    payload.data,
    Number(payload.updatedAt || rowUpdatedAt(row) || Date.now()),
    !!payload.deleted
  );
}

async function enqueueCloudRecordOpsForSlices(slices = [], reason = "local change"){
  const safeSlices = normalizeSliceList(slices);
  if(!safeSlices.length || !indexedDbSupported()) return [];

  try{
    const db = await openCalendarIndexedDb();
    if(!db || !db.objectStoreNames.contains("syncQueue")) return [];

    const local = getLocalPayload();

    // Normal sync is a row merge, not a cloud replacement. Missing local rows
    // can mean “this device has not pulled them yet,” so do not invent delete
    // tombstones from absence here. Real deletes still travel as targeted ops.
    const ops = buildCloudRecordOpsForSlices(local, safeSlices, false);
    if(!ops.length) return [];

    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");

    for(const op of ops){
      store.put({
        id: op.id,
        slice: op.slice,
        store: op.store,
        recordId: op.recordId,
        op,
        reason,
        updatedAt: Number(op.updatedAt || Date.now()),
        queuedAt: Date.now()
      });
    }

    await idbTransactionDone(tx);
    return ops;
  }catch(err){
    console.warn("Could not enqueue row sync operations; slice pending flag remains.", err);
    return [];
  }
}


async function enqueueCloudRecordOps(ops = [], reason = "local change"){
  const safeOps = (Array.isArray(ops) ? ops : [ops]).filter(Boolean);
  if(!safeOps.length || !indexedDbSupported()) return [];

  try{
    const db = await openCalendarIndexedDb();
    if(!db || !db.objectStoreNames.contains("syncQueue")) return [];

    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");

    for(const op of safeOps){
      store.put({
        id: op.id,
        slice: op.slice,
        store: op.store,
        recordId: op.recordId,
        op,
        reason,
        updatedAt: Number(op.updatedAt || Date.now()),
        queuedAt: Date.now()
      });
    }

    await idbTransactionDone(tx);
    return safeOps;
  }catch(err){
    console.warn("Could not enqueue targeted row sync operations.", err);
    return [];
  }
}

function markCloudPendingOnly(reason = "local change", slices = []){
  const local = getLocalPayload?.() || {};
  const existing = getCloudPending();
  const requestedSlices = normalizeSliceList(slices);
  const mergedSlices = normalizeSliceList([
    ...(existing?.slices || []),
    ...requestedSlices
  ]);

  localStorage.setItem(CLOUD_PENDING_KEY, JSON.stringify({
    reason,
    updatedAt: Number(local.updatedAt || Date.now()),
    markedAt: Date.now(),
    slices: mergedSlices
  }));
}

function markCloudRecordOpsPending(reason = "record change", slices = [], ops = []){
  const safeOps = (Array.isArray(ops) ? ops : [ops]).filter(Boolean);
  const safeSlices = normalizeSliceList(slices.length ? slices : safeOps.map(op => op.slice));

  markCloudPendingOnly(reason, safeSlices);

  if(safeOps.length){
    enqueueCloudRecordOps(safeOps, reason).catch(err => {
      console.warn("Could not add targeted records to sync queue.", err);
    });
  }
}

function makeEventCloudOp(event, dateISO, updatedAt = Date.now(), deleted = false){
  const safeDateISO = dateISO || event?.dateISO || event?.startDate || selectedDateISO || "";
  const safeId = normalizeIndexedDbRecordId(event?.id || selectedEventId, `${safeDateISO}:${Date.now()}`);

  const record = deleted ? null : {
    ...(event || {}),
    id: safeId,
    dateISO: safeDateISO,
    updatedAt: Number(updatedAt || Date.now())
  };

  return makeCloudRecordOp(
    "events",
    "events",
    safeId,
    record,
    Number(updatedAt || Date.now()),
    deleted
  );
}

async function getQueuedCloudRecordOps(slices = []){
  if(!indexedDbSupported()) return [];

  try{
    const db = await openCalendarIndexedDb();
    if(!db || !db.objectStoreNames.contains("syncQueue")) return [];

    const safeSlices = normalizeSliceList(slices);
    const tx = db.transaction("syncQueue", "readonly");
    const rows = await idbRequestToPromise(tx.objectStore("syncQueue").getAll());
    await idbTransactionDone(tx).catch(() => {});

    return (rows || [])
      .filter(row => !safeSlices.length || safeSlices.includes(row.slice))
      .map(row => row.op)
      .filter(Boolean);
  }catch(err){
    console.warn("Could not read sync queue; falling back to current slices.", err);
    return [];
  }
}

async function clearQueuedCloudRecordOps(ops = []){
  if(!indexedDbSupported() || !ops?.length) return;

  try{
    const db = await openCalendarIndexedDb();
    if(!db || !db.objectStoreNames.contains("syncQueue")) return;

    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");

    for(const op of ops){
      store.delete(op.id);
    }

    await idbTransactionDone(tx);
  }catch(err){
    console.warn("Could not clear sync queue entries.", err);
  }
}

async function countQueuedCloudRecordOps(){
  if(!indexedDbSupported()) return 0;

  try{
    const db = await openCalendarIndexedDb();
    if(!db || !db.objectStoreNames.contains("syncQueue")) return 0;
    const tx = db.transaction("syncQueue", "readonly");
    const count = await idbRequestToPromise(tx.objectStore("syncQueue").count());
    await idbTransactionDone(tx).catch(() => {});
    return Number(count || 0);
  }catch{
    return 0;
  }
}


// ---------------------------------------------------------------------------
// Merging cloud rows into local payload
// ---------------------------------------------------------------------------

function mergeCloudRecordOpsIntoPayload(ops = [], base = {}){
  const latest = new Map();

  for(const op of ops || []){
    if(!op?.key) continue;
    const existing = latest.get(op.key);
    if(!existing || Number(op.updatedAt || 0) >= Number(existing.updatedAt || 0)){
      latest.set(op.key, op);
    }
  }

  const grouped = {};
  for(const op of latest.values()){
    const slice = normalizeSliceList(op.slice)[0];
    if(!slice) continue;
    if(op.deleted) continue;
    (grouped[slice] ||= []).push(op);
  }

  const merged = {
    version: SPLIT_STORAGE_VERSION,
    updatedAt: Number(base.updatedAt || 0),
    sliceUpdatedAt: { ...(base.sliceUpdatedAt || {}) }
  };

  for(const [slice, sliceOps] of Object.entries(grouped)){
    const maxTime = Math.max(...sliceOps.map(op => Number(op.updatedAt || 0)), 0);
    merged.sliceUpdatedAt[slice] = Math.max(Number(merged.sliceUpdatedAt[slice] || 0), maxTime);
    merged.updatedAt = Math.max(Number(merged.updatedAt || 0), merged.sliceUpdatedAt[slice]);

    if(slice === "events"){
      const map = {};
      for(const op of sliceOps){
        const event = { ...(op.data || {}) };
        const dateISO = event.dateISO || op.data?.date || "";
        if(!dateISO) continue;
        delete event.dateISO;
        (map[dateISO] ||= []).push(event);
      }
      for(const day of Object.keys(map)){
        map[day].sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
      }
      merged.events = normalizeEventsMap(map);
      continue;
    }

    if(slice === "budgetCategories"){
      merged.budgetCategories = sliceOps.map(op => op.data).filter(Boolean);
      continue;
    }

    if(slice === "budgetPlans"){
      const plans = {};
      for(const op of sliceOps){
        const rec = op.data || {};
        const period = rec.period || "month";
        const rangeKey = rec.rangeKey || String(op.recordId || "default");
        (plans[period] ||= {})[rangeKey] = rec.plan ?? {};
      }
      merged.budgetPlans = plans;
      continue;
    }

    if(slice === "receiptItemCategoryMemory"){
      merged.receiptItemCategoryMemory = Object.fromEntries(
        sliceOps.map(op => [op.recordId, op.data?.value ?? op.data]).filter(([id]) => id)
      );
      continue;
    }

    if(slice === "receiptTrainingRecords"){
      merged.receiptTrainingRecords = sliceOps
        .map(op => op.data)
        .filter(Boolean)
        .sort((a, b) => Number(a.createdAt || a.updatedAt || 0) - Number(b.createdAt || b.updatedAt || 0));
      continue;
    }

    if(slice === "merchantAliases"){
      merged.merchantAliases = Object.fromEntries(
        sliceOps.map(op => [op.recordId, op.data?.value ?? op.data]).filter(([id]) => id)
      );
      continue;
    }

    if(slice === "people"){
      merged.people = sliceOps.map(op => op.data).filter(Boolean);
      continue;
    }

    if(slice === "households"){
      merged.households = sliceOps.map(op => op.data).filter(Boolean);
      continue;
    }

    if(slice === "settings"){
      const latestSetting = sliceOps.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
      merged.settings = latestSetting?.data || null;
      continue;
    }

    if(slice === "selectedBudgetPanes"){
      const latestPane = sliceOps.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
      merged.selectedBudgetPanes = latestPane?.data || {};
      continue;
    }

    if(slice === "activeSection"){
      const latestSection = sliceOps.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
      merged.activeSection = latestSection?.data || "calendar";
      continue;
    }

    if(slice === "budgetViewMode"){
      const latestMode = sliceOps.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
      merged.budgetViewMode = latestMode?.data || "month";
    }
  }

  return merged;
}


function cloneCloudMergeBase(base = {}){
  try{
    return JSON.parse(JSON.stringify(buildFullSavePayload(base || getLocalPayload())));
  }catch{
    return buildFullSavePayload(base || getLocalPayload());
  }
}

function markCloudMergedSlice(payload, slice, updatedAt = Date.now()){
  const safeSlice = normalizeSliceList(slice)[0];
  if(!safeSlice) return;

  const safeUpdatedAt = Number(updatedAt || Date.now());
  payload.sliceUpdatedAt = payload.sliceUpdatedAt || {};
  payload.sliceUpdatedAt[safeSlice] = Math.max(
    Number(payload.sliceUpdatedAt[safeSlice] || 0),
    safeUpdatedAt
  );
  payload.updatedAt = Math.max(Number(payload.updatedAt || 0), payload.sliceUpdatedAt[safeSlice]);
}

function getEmptyCloudSliceValue(slice){
  if([
    "events",
    "budgetPlans",
    "receiptItemCategoryMemory",
    "merchantAliases",
    "selectedBudgetPanes",
    "settings"
  ].includes(slice)){
    return {};
  }

  if([
    "budgetCategories",
    "receiptTrainingRecords",
    "people",
    "households"
  ].includes(slice)){
    return [];
  }

  if(slice === "activeSection") return "calendar";
  if(slice === "budgetViewMode") return "month";

  return null;
}

function removeEventByIdFromMap(eventsMap = {}, eventId = ""){
  const safeId = String(eventId || "").trim();
  if(!safeId) return normalizeEventsMap(eventsMap || {});

  const next = normalizeEventsMap(eventsMap || {});

  for(const dayISO of Object.keys(next)){
    const list = Array.isArray(next[dayISO]) ? next[dayISO] : [];
    const filtered = list.filter(ev => String(ev?.id || "") !== safeId);

    if(filtered.length){
      next[dayISO] = filtered;
    }else{
      delete next[dayISO];
    }
  }

  return next;
}

function upsertArrayRecordById(list = [], record = {}){
  const safeRecord = record && typeof record === "object" ? record : null;
  const safeId = String(safeRecord?.id || "").trim();
  if(!safeRecord || !safeId) return Array.isArray(list) ? list : [];

  const next = Array.isArray(list) ? [...list] : [];
  const index = next.findIndex(item => String(item?.id || "") === safeId);

  if(index >= 0){
    next[index] = safeRecord;
  }else{
    next.push(safeRecord);
  }

  return next;
}

function deleteArrayRecordById(list = [], recordId = ""){
  const safeId = String(recordId || "").trim();
  if(!safeId) return Array.isArray(list) ? list : [];
  return (Array.isArray(list) ? list : []).filter(item => String(item?.id || "") !== safeId);
}

function applyCloudRecordOpsToPayload(ops = [], basePayload = {}){
  const merged = cloneCloudMergeBase(basePayload);
  const latest = new Map();

  for(const op of ops || []){
    if(!op?.key) continue;
    const existing = latest.get(op.key);

    if(!existing || Number(op.updatedAt || 0) >= Number(existing.updatedAt || 0)){
      latest.set(op.key, op);
    }
  }

  const sortedOps = Array.from(latest.values())
    .sort((a, b) => Number(a.updatedAt || 0) - Number(b.updatedAt || 0));

  for(const op of sortedOps){
    const slice = normalizeSliceList(op.slice)[0];
    if(!slice) continue;

    const updatedAt = Number(op.updatedAt || Date.now());
    markCloudMergedSlice(merged, slice, updatedAt);

    if(slice === "events"){
      const recordId = String(op.recordId || op.data?.id || "").trim();
      let map = removeEventByIdFromMap(merged.events || {}, recordId);

      if(!op.deleted && op.data){
        const row = { ...(op.data || {}) };
        const dateISO = String(row.dateISO || row.startDate || row.date || "").trim();

        if(dateISO){
          const legacyEvent = eventRecordToLegacyEvent({ ...row, dateISO });
          (map[dateISO] ||= []).push(legacyEvent);
          map[dateISO].sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
        }
      }

      merged.events = normalizeEventsMap(map);
      continue;
    }

    if(slice === "budgetCategories"){
      merged.budgetCategories = op.deleted
        ? deleteArrayRecordById(merged.budgetCategories || [], op.recordId)
        : upsertArrayRecordById(merged.budgetCategories || [], op.data);
      continue;
    }

    if(slice === "budgetPlans"){
      const recordId = String(op.recordId || "");
      const rec = op.data || {};
      const [idPeriod = "month", ...idRangeParts] = recordId.split(":");
      const period = rec.period || idPeriod || "month";
      const rangeKey = rec.rangeKey || idRangeParts.join(":") || "default";

      merged.budgetPlans = merged.budgetPlans || { week:{}, month:{}, year:{} };
      merged.budgetPlans[period] = merged.budgetPlans[period] || {};

      if(op.deleted){
        delete merged.budgetPlans[period][rangeKey];
      }else{
        merged.budgetPlans[period][rangeKey] = rec.plan ?? {};
      }
      continue;
    }

    if(slice === "receiptItemCategoryMemory"){
      merged.receiptItemCategoryMemory = merged.receiptItemCategoryMemory || {};
      if(op.deleted) delete merged.receiptItemCategoryMemory[op.recordId];
      else merged.receiptItemCategoryMemory[op.recordId] = op.data?.value ?? op.data;
      continue;
    }

    if(slice === "receiptTrainingRecords"){
      merged.receiptTrainingRecords = op.deleted
        ? deleteArrayRecordById(merged.receiptTrainingRecords || [], op.recordId)
        : upsertArrayRecordById(merged.receiptTrainingRecords || [], op.data);

      merged.receiptTrainingRecords.sort((a, b) =>
        Number(a.createdAt || a.updatedAt || 0) - Number(b.createdAt || b.updatedAt || 0)
      );
      continue;
    }

    if(slice === "merchantAliases"){
      merged.merchantAliases = merged.merchantAliases || {};
      if(!isSafeMapKey(op.recordId)) continue;
      if(op.deleted) delete merged.merchantAliases[op.recordId];
      else merged.merchantAliases[op.recordId] = op.data?.value ?? op.data;
      continue;
    }

    if(slice === "people"){
      merged.people = op.deleted
        ? deleteArrayRecordById(merged.people || [], op.recordId)
        : upsertArrayRecordById(merged.people || [], op.data);
      continue;
    }

    if(slice === "households"){
      merged.households = op.deleted
        ? deleteArrayRecordById(merged.households || [], op.recordId)
        : upsertArrayRecordById(merged.households || [], op.data);
      continue;
    }

    if(slice === "settings" && !op.deleted){
      merged.settings = op.data || {};
      continue;
    }

    if(slice === "selectedBudgetPanes"){
      merged.selectedBudgetPanes = op.deleted ? {} : (op.data || {});
      continue;
    }

    if(slice === "activeSection" && !op.deleted){
      merged.activeSection = op.data || "calendar";
      continue;
    }

    if(slice === "budgetViewMode" && !op.deleted){
      merged.budgetViewMode = op.data || "month";
    }
  }

  updateKnownCloudKeysFromOps(sortedOps);

  return buildFullSavePayload(merged);
}

function buildCloudStateFromRows(data = [], opts = {}){
  const rows = Array.isArray(data) ? data : [];
  if(!rows.length) return null;

  if(opts.delta){
    const merged = cloneCloudMergeBase(opts.base || getLocalPayload());
    let legacyPayload = null;
    const recordOps = [];
    const sliceRows = [];

    for(const row of rows){
      const op = getCloudRecordOpFromRow(row);
      if(op){
        recordOps.push(op);
        continue;
      }

      if(row?.id === CLOUD_ROW_ID && row?.payload && !row.payload.slice){
        legacyPayload = buildFullSavePayload(row.payload);
        continue;
      }

      const slice = getCloudSliceFromRow(row);
      if(slice){
        sliceRows.push(row);
      }
    }

    let patched = recordOps.length
      ? applyCloudRecordOpsToPayload(recordOps, merged)
      : merged;

    for(const row of sliceRows){
      const slice = getCloudSliceFromRow(row);
      if(!slice) continue;

      const sliceData = extractCloudSliceData(row);
      if(sliceData === undefined) continue;

      const rowTime = Number(row?.payload?.updatedAt || rowUpdatedAt(row) || Date.now());
      if(rowTime <= getSliceUpdatedAt(patched, slice)) continue;

      patched[slice] = sliceData;
      markCloudMergedSlice(patched, slice, rowTime);
    }

    if(legacyPayload){
      for(const slice of DATA_SLICE_NAMES){
        const cloudSliceTime = getSliceUpdatedAt(legacyPayload, slice);
        if(hasOwn(legacyPayload, slice) && cloudSliceTime > getSliceUpdatedAt(patched, slice)){
          patched[slice] = legacyPayload[slice];
          markCloudMergedSlice(patched, slice, cloudSliceTime);
        }
      }
    }

    return buildFullSavePayload(patched);
  }

  let legacyPayload = null;
  const merged = {
    version: SPLIT_STORAGE_VERSION,
    updatedAt: 0,
    sliceUpdatedAt: {}
  };

  const recordOps = [];
  const sliceRows = [];

  for(const row of rows){
    const op = getCloudRecordOpFromRow(row);
    if(op){
      recordOps.push(op);
      continue;
    }

    const rowTime = rowUpdatedAt(row);

    if(row?.id === CLOUD_ROW_ID && row?.payload && !row.payload.slice){
      legacyPayload = buildFullSavePayload(row.payload);
      merged.updatedAt = Math.max(merged.updatedAt, Number(legacyPayload.updatedAt || 0), rowTime);
      continue;
    }

    const slice = getCloudSliceFromRow(row);
    if(slice){
      sliceRows.push(row);
    }
  }

  const rowControlledSlices = new Set(recordOps.map(op => op.slice).filter(Boolean));

  if(recordOps.length){
    const rowPayload = mergeCloudRecordOpsIntoPayload(recordOps, merged);

    Object.assign(merged, rowPayload, {
      sliceUpdatedAt: {
        ...(merged.sliceUpdatedAt || {}),
        ...(rowPayload.sliceUpdatedAt || {})
      },
      updatedAt: Math.max(Number(merged.updatedAt || 0), Number(rowPayload.updatedAt || 0))
    });

    updateKnownCloudKeysFromOps(recordOps);

    // If the cloud has only tombstones for a row-controlled slice, the slice is
    // still meaningful: it means local should empty that slice instead of
    // falling back to stale legacy rows.
    for(const slice of rowControlledSlices){
      if(hasOwn(merged, slice)) continue;

      const sliceOps = recordOps.filter(op => op.slice === slice);
      const maxTime = Math.max(...sliceOps.map(op => Number(op.updatedAt || 0)), 0);
      merged[slice] = getEmptyCloudSliceValue(slice);
      markCloudMergedSlice(merged, slice, maxTime || Date.now());
    }
  }

  // Backward bridge: old slice rows and old monolith can still hydrate anything
  // not yet present as row records.
  for(const row of sliceRows){
    const slice = getCloudSliceFromRow(row);
    if(!slice || hasOwn(merged, slice) || rowControlledSlices.has(slice)) continue;

    const sliceData = extractCloudSliceData(row);
    if(sliceData === undefined) continue;

    const rowTime = rowUpdatedAt(row);
    merged[slice] = sliceData;
    merged.sliceUpdatedAt[slice] = Number(row?.payload?.updatedAt || rowTime || Date.now());
    merged.updatedAt = Math.max(merged.updatedAt, merged.sliceUpdatedAt[slice]);
  }

  if(legacyPayload){
    for(const slice of DATA_SLICE_NAMES){
      if(!rowControlledSlices.has(slice) && !hasOwn(merged, slice) && hasOwn(legacyPayload, slice)){
        merged[slice] = legacyPayload[slice];
        merged.sliceUpdatedAt[slice] = getSliceUpdatedAt(legacyPayload, slice);
      }
    }
  }

  const hasSlices = DATA_SLICE_NAMES.some(slice => hasOwn(merged, slice));
  if(!hasSlices && legacyPayload) return legacyPayload;
  if(!hasSlices) return null;

  return buildFullSavePayload(merged);
}

// ---------------------------------------------------------------------------
// Reading rows from Supabase
// ---------------------------------------------------------------------------

async function readAllCloudRowsForUser(){
  if(!supabaseClient || !cloudUser) return [];

  const allRows = [];
  const pageSize = 1000;
  let from = 0;

  while(true){
    const to = from + pageSize - 1;
    const { data, error } = await supabaseClient
      .from(CLOUD_TABLE)
      .select("id, payload, updated_at")
      .eq("user_id", cloudUser.id)
      .range(from, to);

    if(error) throw error;

    if(Array.isArray(data) && data.length){
      allRows.push(...data);
    }

    if(!Array.isArray(data) || data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function readCloudRowsForUserSince(sinceAt = 0){
  if(!supabaseClient || !cloudUser) return [];

  const allRows = [];
  const pageSize = 1000;
  const safeSinceAt = Math.max(0, Number(sinceAt || 0));
  const sinceISO = new Date(safeSinceAt).toISOString();
  let from = 0;

  while(true){
    const to = from + pageSize - 1;
    const { data, error } = await supabaseClient
      .from(CLOUD_TABLE)
      .select("id, payload, updated_at")
      .eq("user_id", cloudUser.id)
      .gt("updated_at", sinceISO)
      .order("updated_at", { ascending:true })
      .range(from, to);

    if(error) throw error;

    if(Array.isArray(data) && data.length){
      allRows.push(...data);
    }

    if(!Array.isArray(data) || data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

function getCloudSliceRowId(slice){
  const userPart = cloudUser?.id || "offline";
  return `${userPart}:${slice}`;
}

function getCloudSliceFromRow(row){
  const payloadSlice = row?.payload?.slice;
  if(DATA_SLICE_NAMES.includes(payloadSlice)) return payloadSlice;

  const id = String(row?.id || "");
  const lastPart = id.includes(":") ? id.split(":").pop() : id;
  return DATA_SLICE_NAMES.includes(lastPart) ? lastPart : "";
}

function buildCloudSlicePayload(fullPayload, slice){
  return {
    version: SPLIT_STORAGE_VERSION,
    slice,
    updatedAt: getSliceUpdatedAt(fullPayload, slice),
    data: fullPayload?.[slice]
  };
}

function extractCloudSliceData(row){
  if(!row?.payload || typeof row.payload !== "object") return undefined;

  if(hasOwn(row.payload, "data")) return row.payload.data;

  const slice = getCloudSliceFromRow(row);
  if(slice && hasOwn(row.payload, slice)) return row.payload[slice];

  return undefined;
}

function getPendingSliceList(pending = getCloudPending()){
  return normalizeSliceList(pending?.slices || pending?.slice || []);
}

function getCloudPending(){
  try{
    const pending = JSON.parse(localStorage.getItem(CLOUD_PENDING_KEY)) || null;
    if(!pending) return null;

    return {
      ...pending,
      slices: getPendingSliceList(pending)
    };
  }catch{
    return null;
  }
}

function isCloudPending(){
  return !!getCloudPending();
}

function markCloudPending(reason = "local change", slices = []){
  const local = getLocalPayload?.() || {};
  const existing = getCloudPending();
  const requestedSlices = normalizeSliceList(slices);
  const mergedSlices = normalizeSliceList([
    ...(existing?.slices || []),
    ...requestedSlices
  ]);

  localStorage.setItem(CLOUD_PENDING_KEY, JSON.stringify({
    reason,
    updatedAt: Number(local.updatedAt || Date.now()),
    markedAt: Date.now(),
    slices: mergedSlices
  }));

  if(requestedSlices.length){
    enqueueCloudRecordOpsForSlices(requestedSlices, reason).catch(err => {
      console.warn("Could not add changed records to sync queue.", err);
    });
  }
}

function clearCloudPending(){
  localStorage.removeItem(CLOUD_PENDING_KEY);
  setCloudLastSyncAt(Date.now());
}

function getCloudSyncLabel(){
  if(!cloudUser) return "Cloud: Not signed in";
  if(isCloudPending()) return "Cloud: Pending sync";
  return `Cloud: Signed in as ${cloudUser.email || "user"}`;
}


// ---------------------------------------------------------------------------
// Account modal UI
// ---------------------------------------------------------------------------

function openAccountModal(){
  accountModal?.classList.remove("hidden");
  setTimeout(() => {
    if(!cloudUser){
      cloudEmailInput?.focus({ preventScroll: true });
    }
  }, 0);
}

function closeAccountModal(){
  accountModal?.classList.add("hidden");
}

accountBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  openAccountModal();
});

accountModalCloseBtn?.addEventListener("click", closeAccountModal);

accountModal?.addEventListener("click", (e) => {
  if(e.target === accountModal){
    closeAccountModal();
  }
});

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && !accountModal?.classList.contains("hidden")){
    closeAccountModal();
  }
});

function cloudConfigured(){
  return (
    typeof window.supabase !== "undefined" &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("PASTE_") &&
    !SUPABASE_ANON_KEY.includes("PASTE_")
  );
}

function setCloudStatus(text){
  if(cloudSyncStatus) cloudSyncStatus.textContent = text;
}

function setCloudBusy(isBusy){
  cloudBusy = !!isBusy;
  updateCloudUI();
}

function updateCloudUI(){
  const configured = cloudConfigured();
  const signedIn = !!cloudUser;

  cloudSyncBox?.classList.toggle("isConnected", signedIn);
  accountBtn?.classList.toggle("isConnected", signedIn);
  accountBtn?.classList.toggle("needsSignIn", configured && !signedIn);

  if(accountBtnLabel){
    accountBtnLabel.textContent = signedIn ? "Profile" : "Sign In";
  }

  if(accountBtnDot){
    accountBtnDot.setAttribute("aria-label", signedIn ? "Signed in" : "Not signed in");
  }

  if(cloudUserBadge){
    cloudUserBadge.textContent = signedIn
      ? (cloudUser.email || "Online")
      : configured
        ? "Offline"
        : "Setup";
  }

  if(!configured){
    setCloudStatus("Cloud: Add Supabase URL + anon key");
    if(cloudSignupBtn) cloudSignupBtn.disabled = true;
    if(cloudLoginBtn) cloudLoginBtn.disabled = true;
    if(cloudLogoutBtn) cloudLogoutBtn.disabled = true;
    if(cloudPushBtn) cloudPushBtn.disabled = true;
    if(cloudPullBtn) cloudPullBtn.disabled = true;
    return;
  }

  if(cloudSignupBtn) cloudSignupBtn.disabled = cloudBusy || signedIn;
  if(cloudLoginBtn) cloudLoginBtn.disabled = cloudBusy || signedIn;
  if(cloudLogoutBtn) cloudLogoutBtn.disabled = cloudBusy || !signedIn;
  if(cloudPushBtn) cloudPushBtn.disabled = cloudBusy || !signedIn;
  if(cloudPullBtn) cloudPullBtn.disabled = cloudBusy || !signedIn;

  if(cloudBusy) return;

  setCloudStatus(getCloudSyncLabel());
}


// ---------------------------------------------------------------------------
// Auth + sync orchestration (login, push, pull)
// ---------------------------------------------------------------------------

async function initCloudSync(){
  if(!cloudConfigured()){
    updateCloudUI();
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data } = await supabaseClient.auth.getSession();
  cloudUser = data?.session?.user || null;

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    cloudUser = session?.user || null;
    updateCloudUI();

    if(cloudUser){
      tryFlushPendingCloudSync("auth change").catch(console.error);
    }
  });

  updateCloudUI();

  if(cloudUser){
    await tryFlushPendingCloudSync("startup");
  }
}

async function signupCloud(){
  if(!supabaseClient || cloudBusy) return;

  const email = cloudEmailInput?.value?.trim();
  const password = cloudPasswordInput?.value || "";

  if(!email || !password){
    setCloudStatus("Cloud: Enter email and password");
    return;
  }

  if(password.length < 6){
    setCloudStatus("Cloud: Password needs at least 6 characters");
    return;
  }

  setCloudBusy(true);
  setCloudStatus("Cloud: Creating account...");

  try{
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if(error){
      setCloudStatus("Cloud signup failed: " + error.message);
      return;
    }

    cloudUser = data?.user || data?.session?.user || null;

    setCloudStatus(
      cloudUser
        ? `Cloud: Account created as ${cloudUser.email || "user"}`
        : "Cloud: Account created. Now login."
    );
  }finally{
    setCloudBusy(false);
  }
}

async function loginCloud(){
  if(!supabaseClient || cloudBusy) return;

  const email = cloudEmailInput?.value?.trim();
  const password = cloudPasswordInput?.value || "";

  if(!email || !password){
    setCloudStatus("Cloud: Enter email and password");
    return;
  }

  setCloudBusy(true);
  setCloudStatus("Cloud: Logging in...");

  try{
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      setCloudStatus("Cloud login failed: " + error.message);
      return;
    }

    cloudUser = data?.user || null;

    if(cloudUser){
      await pullCloudIfNewer({ preferDelta:true });
    }
  }finally{
    setCloudBusy(false);
  }
}

async function logoutCloud(){
  if(!supabaseClient || cloudBusy) return;

  setCloudBusy(true);
  setCloudStatus("Cloud: Logging out...");

  try{
    await supabaseClient.auth.signOut();
    cloudUser = null;
    setCloudStatus("Cloud: Logged out");
  }finally{
    setCloudBusy(false);
  }
}

async function readCloudState(opts = {}){
  if(!supabaseClient || !cloudUser) return null;

  const forceFull = !!opts.forceFull;
  const preferDelta = !!opts.preferDelta && !forceFull;
  const basePayload = opts.base || getLocalPayload();
  const lastSyncAt = getCloudLastSyncAt();
  const deltaSinceAt = Math.max(0, lastSyncAt - CLOUD_DELTA_PULL_BUFFER_MS);
  const useDelta = preferDelta && lastSyncAt > 0;

  let data = [];

  try{
    data = useDelta
      ? await readCloudRowsForUserSince(deltaSinceAt)
      : await readAllCloudRowsForUser();
  }catch(error){
    setCloudStatus("Cloud read failed: " + error.message);
    return null;
  }

  setCloudReadDebugSummary({
    mode: useDelta ? "delta" : "full",
    rowsRead: Array.isArray(data) ? data.length : 0,
    sinceAt: useDelta ? deltaSinceAt : 0,
    readAt: Date.now()
  });

  if(!Array.isArray(data) || !data.length) return null;

  return buildCloudStateFromRows(data, {
    delta: useDelta,
    base: basePayload
  });
}

async function writeCloudStateNow(slices = null){
  const requestedSlices = normalizeSliceList(slices);
  const pendingSlices = getPendingSliceList();
  const dirtySlices = requestedSlices.length
    ? requestedSlices
    : pendingSlices.length
      ? pendingSlices
      : DATA_SLICE_NAMES;

  if(!supabaseClient || !cloudUser){
    markCloudPending("not signed in", dirtySlices);
    updateCloudUI();
    return false;
  }

  if(typeof navigator !== "undefined" && navigator.onLine === false){
    markCloudPending("offline", dirtySlices);
    setCloudStatus("Cloud: Offline, saved locally");
    return false;
  }

  const payload = buildFullSavePayload(getLocalPayload());
  let ops = await getQueuedCloudRecordOps(dirtySlices);

  if(!ops.length){
    // Full/device-wide writes should upsert what this device knows, not delete
    // rows it simply has not seen yet. Explicit event deletes already enqueue
    // their own tombstone ops through makeEventCloudOp(..., true).
    ops = buildCloudRecordOpsForSlices(payload, dirtySlices, false);
  }

  const rows = cloudOpsToSupabaseRows(ops);

  if(!rows.length){
    clearCloudPending();
    updateCloudUI();
    return true;
  }

  if(cloudIdentityMismatch()){
    warnCloudIdentityMismatch();
    return false;
  }

  const { error } = await supabaseClient
    .from(CLOUD_TABLE)
    .upsert(rows, { onConflict: "id" });

  if(error){
    markCloudPending("cloud row save failed", dirtySlices);
    setCloudStatus("Cloud row save failed, will retry: " + error.message);
    return false;
  }

  setLocalDataOwner(cloudUser.id);
  await clearQueuedCloudRecordOps(ops);
  updateKnownCloudKeysFromOps(ops);
  clearCloudPending();
  setCloudStatus(
    `Cloud: Synced ${rows.length} row${rows.length === 1 ? "" : "s"} across ${dirtySlices.length} slice${dirtySlices.length === 1 ? "" : "s"} • ${new Date(payload.updatedAt || Date.now()).toLocaleString()}`
  );
  updateCloudUI();
  return true;
}

function cloudWriteDebounced(slices = null){
  const requestedSlices = normalizeSliceList(slices);
  if(requestedSlices.length){
    markCloudPending("local change", requestedSlices);
  }

  updateCloudUI();

  if(!cloudUser) return;
  if(cloudIdentityMismatch()){
    warnCloudIdentityMismatch();
    return;
  }

  clearTimeout(cloudWriteTimer);
  cloudWriteTimer = setTimeout(() => {
    tryFlushPendingCloudSync("debounced write").catch(console.error);
  }, 900);
}

async function tryFlushPendingCloudSync(reason = "sync"){
  if(cloudFlushInProgress) return false;
  if(!supabaseClient || !cloudUser){
    updateCloudUI();
    return false;
  }

  // Never auto-sync another account's local data. Manual Push/Pull bypass
  // this by claiming ownership first (see pushLocalToCloud / Pull handler).
  if(cloudIdentityMismatch()){
    warnCloudIdentityMismatch();
    updateCloudUI();
    return false;
  }

  if(typeof navigator !== "undefined" && navigator.onLine === false){
    if(isCloudPending()) setCloudStatus("Cloud: Offline, sync pending");
    return false;
  }

  cloudFlushInProgress = true;

  try{
    const pending = getCloudPending();

    if(pending){
      const dirtySlices = getPendingSliceList(pending);
      const local = getLocalPayload();
      const cloud = await readCloudState({ preferDelta:true, base: local });

      const cloudHasNewerDirtySlice = dirtySlices.some(slice =>
        cloud && getSliceUpdatedAt(cloud, slice) > getSliceUpdatedAt(local, slice)
      );

      if(cloudHasNewerDirtySlice){
        setCloudStatus("Cloud: Sync paused, cloud has newer changes in the same slice. Use Push or Pull.");
        return false;
      }

      setCloudStatus(`Cloud: Syncing ${dirtySlices.length || "changed"} slice${dirtySlices.length === 1 ? "" : "s"}...`);
      return await writeCloudStateNow(dirtySlices);
    }

    await pullCloudIfNewer({ preferDelta:true });
    return true;
  }finally{
    cloudFlushInProgress = false;
    updateCloudUI();
  }
}

// ---------------------------------------------------------------------------
// Local snapshot backups (data-loss safety net for Push / forced Pull).
// Uses its OWN IndexedDB database so the app's main DB schema/version is
// untouched. Keeps the last 5 snapshots. Restore from DevTools console:
//   await listLocalSnapshots()          // see ids + reasons
//   await restoreLocalSnapshot()        // restore most recent
//   await restoreLocalSnapshot(<id>)    // restore a specific one
// ---------------------------------------------------------------------------
const SNAPSHOT_DB_NAME = "myCalendarBackups_v1";
const SNAPSHOT_STORE = "snapshots";
const SNAPSHOT_KEEP = 5;

function openSnapshotDb(){
  return new Promise((resolve, reject) => {
    if(typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(SNAPSHOT_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(SNAPSHOT_STORE)){
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveLocalSnapshot(reason = "manual"){
  try{
    const db = await openSnapshotDb();
    if(!db) return false;

    const snapshot = {
      id: Date.now(),
      reason: String(reason || "manual"),
      savedAt: new Date().toISOString(),
      payload: buildFullSavePayload(getLocalPayload())
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(SNAPSHOT_STORE, "readwrite");
      const store = tx.objectStore(SNAPSHOT_STORE);
      store.put(snapshot);

      // Prune oldest beyond SNAPSHOT_KEEP.
      const keysReq = store.getAllKeys();
      keysReq.onsuccess = () => {
        const keys = (keysReq.result || []).sort((a, b) => a - b);
        while(keys.length > SNAPSHOT_KEEP){
          store.delete(keys.shift());
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
    return true;
  }catch(err){
    console.warn("Could not save local snapshot; continuing without it.", err);
    return false;
  }
}

async function listLocalSnapshots(){
  try{
    const db = await openSnapshotDb();
    if(!db) return [];
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(SNAPSHOT_STORE, "readonly");
      const req = tx.objectStore(SNAPSHOT_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows
      .sort((a, b) => b.id - a.id)
      .map(r => ({ id: r.id, savedAt: r.savedAt, reason: r.reason }));
  }catch(err){
    console.warn("Could not list snapshots.", err);
    return [];
  }
}

async function restoreLocalSnapshot(id = null){
  const db = await openSnapshotDb();
  if(!db) throw new Error("IndexedDB unavailable");

  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, "readonly");
    const req = tx.objectStore(SNAPSHOT_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  db.close();

  const target = id
    ? rows.find(r => r.id === Number(id))
    : rows.sort((a, b) => b.id - a.id)[0];

  if(!target) throw new Error("No snapshot found");

  applyFullSavePayload(target.payload);
  setCloudStatus(`Restored local snapshot from ${target.savedAt} (${target.reason}). Review, then Push if you want the cloud to match.`);
  return { id: target.id, savedAt: target.savedAt, reason: target.reason };
}

// Expose for manual recovery from the browser console.
window.listLocalSnapshots = listLocalSnapshots;
window.restoreLocalSnapshot = restoreLocalSnapshot;

async function pullCloudIfNewer(opts = {}){
  const forceFull = !!opts.forceFull;

  // Automatic pulls must not merge another account's cloud data into a
  // different account's local state. A manual (forceFull) Pull is an
  // intentional "cloud wins" action and claims ownership below.
  if(!forceFull && cloudIdentityMismatch()){
    warnCloudIdentityMismatch();
    return;
  }

  const preferDelta = opts.preferDelta !== false && !forceFull;
  const local = getLocalPayload();
  const cloud = await readCloudState({
    preferDelta,
    forceFull,
    base: local
  });

  if(!cloud){
    setCloudLastSyncAt(Date.now());
    setCloudStatus(isCloudPending() ? "Cloud: Pending sync" : "Cloud: Local copy is current");
    return;
  }

  const pendingSlices = getPendingSliceList();

  const slicesToPull = DATA_SLICE_NAMES.filter(slice => {
    // Automatic/background pulls should not silently overwrite unsynced local
    // edits. A manual full Pull is an intentional cloud-wins action, so it can
    // recover a stale device even when a pending flag or equal timestamp is in
    // the way.
    if(!forceFull && pendingSlices.includes(slice)) return false;
    if(!hasOwn(cloud, slice)) return false;

    const cloudTime = getSliceUpdatedAt(cloud, slice);
    const localTime = getSliceUpdatedAt(local, slice);

    if(cloudTime > localTime) return true;

    // Row sync can produce equal slice timestamps while the row set is still
    // different. This is exactly what happens when one device has 3 events and
    // the cloud already has 7: the old timestamp gate says “current,” even
    // though the data is not current.
    if(forceFull && cloudSliceDiffers(slice, cloud, local)) return true;

    return false;
  });

  if(isCloudPending() && pendingSlices.length && !forceFull){
    const safeToWrite = pendingSlices.every(slice =>
      getSliceUpdatedAt(local, slice) >= getSliceUpdatedAt(cloud, slice)
    );

    if(safeToWrite){
      await writeCloudStateNow(pendingSlices);
      return;
    }
  }

  if(slicesToPull.length){
    const patch = {
      version: SPLIT_STORAGE_VERSION,
      updatedAt: Number(cloud.updatedAt || Date.now()),
      sliceUpdatedAt: cloud.sliceUpdatedAt || {}
    };

    for(const slice of slicesToPull){
      patch[slice] = cloud[slice];
    }

    applyFullSavePayload(patch);
    if(cloudUser) setLocalDataOwner(cloudUser.id);
    setCloudReadDebugSummary({
      ...cloudSyncLastReadSummary,
      appliedSlices: slicesToPull
    });
    setCloudLastSyncAt(Date.now());

    if(forceFull && pendingSlices.some(slice => slicesToPull.includes(slice))){
      localStorage.removeItem(CLOUD_PENDING_KEY);
    }

    setCloudStatus(
      `Cloud: Pulled ${slicesToPull.length} slice${slicesToPull.length === 1 ? "" : "s"} via ${preferDelta ? "delta" : "full"} sync • ${new Date(cloud.updatedAt || Date.now()).toLocaleString()}`
    );
  }else{
    setCloudLastSyncAt(Date.now());
    setCloudStatus(isCloudPending() ? "Cloud: Pending sync" : `Cloud: Local copy is current${preferDelta ? " • delta checked" : ""}`);
  }
}

async function pushLocalToCloud(){
  await saveLocalSnapshot("before manual push");
  if(cloudUser) setLocalDataOwner(cloudUser.id);
  markCloudPending("manual push", DATA_SLICE_NAMES);
  await writeCloudStateNow(DATA_SLICE_NAMES);
}

window.addEventListener("online", () => {
  if(isCloudPending()){
    setCloudStatus("Cloud: Back online, syncing...");
    tryFlushPendingCloudSync("online").catch(console.error);
  }
});

window.addEventListener("offline", () => {
  if(isCloudPending()){
    setCloudStatus("Cloud: Offline, sync pending");
  }
});

document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "visible" && isCloudPending()){
    tryFlushPendingCloudSync("visible").catch(console.error);
  }
});

cloudSignupBtn?.addEventListener("click", () => signupCloud().catch(console.error));
cloudLoginBtn?.addEventListener("click", () => loginCloud().catch(console.error));
cloudLogoutBtn?.addEventListener("click", () => logoutCloud().catch(console.error));
cloudPushBtn?.addEventListener("click", () => pushLocalToCloud().catch(console.error));
cloudPullBtn?.addEventListener("click", async () => {
  try{
    await saveLocalSnapshot("before manual pull");
    if(cloudUser) setLocalDataOwner(cloudUser.id);
    await pullCloudIfNewer({ forceFull:true });
  }catch(err){
    console.error(err);
  }
});

cloudPasswordInput?.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    loginCloud().catch(console.error);
  }
});

// ============================================================================
// 05. FILE SYNC (Google Drive JSON via File System Access API)
// ============================================================================
let syncHandle = null;
let syncConnected = false;
let syncWriteTimer = null;

function getLocalPayload(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const meta = getLocalMeta();

    let legacyPayload = {};

    // Back-compat: very old format was just the events map.
    if(parsed && typeof parsed === "object" && !("events" in parsed) && !parsed.splitStorage){
      legacyPayload = { version: 1, updatedAt: 0, events: parsed };
    }else if(parsed && typeof parsed === "object"){
      legacyPayload = parsed;
    }

    const payload = {
      version: SPLIT_STORAGE_VERSION,
      updatedAt: Math.max(
        Number(meta.updatedAt || 0),
        Number(legacyPayload.updatedAt || 0)
      ),
      sliceUpdatedAt: {
        ...(legacyPayload.sliceUpdatedAt || {}),
        ...(meta.sliceUpdatedAt || {})
      }
    };

    for(const slice of DATA_SLICE_NAMES){
      try{
        payload[slice] = readLocalDataSlice(slice, legacyPayload);
      }catch(err){
        console.warn(`Could not read ${slice} slice; using safe fallback.`, err);

        if(hasOwn(legacyPayload, slice)){
          payload[slice] = legacyPayload[slice];
        }else if(slice === "events"){
          payload[slice] = {};
        }else if(slice === "people" || slice === "households"){
          payload[slice] = [];
        }else{
          payload[slice] = null;
        }
      }
    }

    return payload;
  }catch{
    return {
      version: SPLIT_STORAGE_VERSION,
      updatedAt: 0,
      sliceUpdatedAt: {},
      events: {},
      people: [],
      households: []
    };
  }
}

function buildFullSavePayload(base = {}){
  const local = getLocalPayload?.() || {};
  const pick = (key, fallbackFn) => {
    if(hasOwn(base, key) && base[key] !== null && base[key] !== undefined) return base[key];
    if(hasOwn(local, key) && local[key] !== null && local[key] !== undefined) return local[key];
    return fallbackFn();
  };

  const updatedAt = Number(
    base.updatedAt ||
    local.updatedAt ||
    Date.now()
  );

  return {
    version: SPLIT_STORAGE_VERSION,
    updatedAt,
    sliceUpdatedAt: {
      ...(local.sliceUpdatedAt || {}),
      ...(base.sliceUpdatedAt || {})
    },
    events: pick("events", () => events || {}),
    settings: pick("settings", () => settings || loadSettings()),
    budgetPlans: pick("budgetPlans", () => budgetPlans || loadBudgetPlans()),
    budgetCategories: pick("budgetCategories", () => budgetCategories || loadBudgetCategories()),
    merchantAliases: pick("merchantAliases", () => merchantAliases || loadMerchantAliases()),
    receiptItemCategoryMemory: pick("receiptItemCategoryMemory", () => receiptItemCategoryMemory || loadReceiptItemCategoryMemory()),
    receiptTrainingRecords: pick("receiptTrainingRecords", () => receiptTrainingRecords || loadReceiptTrainingRecords()),
    selectedBudgetPanes: pick("selectedBudgetPanes", () => selectedBudgetPanes || loadBudgetPaneSelection()),
    activeSection: pick("activeSection", () => activeSection || "calendar"),
    budgetViewMode: pick("budgetViewMode", () => budgetViewMode || "month"),
    people: pick("people", () => loadPeopleData()),
    households: pick("households", () => loadHouseholdData())
  };
}

function applyFullSavePayload(payload, opts = {}){
  if(!payload) return;

  const incomingSlices = getPayloadSliceNames(payload);
  const safe = buildFullSavePayload({
    ...payload,
    updatedAt: Number(payload.updatedAt || Date.now()),
    events: hasOwn(payload, "events")
      ? normalizeEventsMap(payload.events || {})
      : undefined
  });

  const slicesToApply = incomingSlices.length ? incomingSlices : DATA_SLICE_NAMES;

  if(slicesToApply.includes("events")){
    events = normalizeEventsMap(safe.events || {});
    clearIndexedDbEventRangeCache("full payload applied");
  }

  if(slicesToApply.includes("settings")){
    settings = safe.settings || settings;
  }

  if(slicesToApply.includes("budgetPlans")){
    budgetPlans = safe.budgetPlans || budgetPlans;
  }

  if(slicesToApply.includes("budgetCategories")){
    budgetCategories = Array.isArray(safe.budgetCategories) && safe.budgetCategories.length
      ? safe.budgetCategories
      : budgetCategories;
  }

  if(slicesToApply.includes("merchantAliases")){
    merchantAliases = safe.merchantAliases && typeof safe.merchantAliases === "object"
      ? safe.merchantAliases
      : merchantAliases;
  }

  if(slicesToApply.includes("receiptItemCategoryMemory")){
    receiptItemCategoryMemory = safe.receiptItemCategoryMemory && typeof safe.receiptItemCategoryMemory === "object"
      ? safe.receiptItemCategoryMemory
      : receiptItemCategoryMemory;
  }

  if(slicesToApply.includes("receiptTrainingRecords")){
    receiptTrainingRecords = Array.isArray(safe.receiptTrainingRecords)
      ? safe.receiptTrainingRecords
      : receiptTrainingRecords;
  }

  if(slicesToApply.includes("selectedBudgetPanes")){
    selectedBudgetPanes = safe.selectedBudgetPanes || selectedBudgetPanes;
  }

  if(slicesToApply.includes("activeSection")){
    activeSection = safe.activeSection || activeSection;
  }

  if(slicesToApply.includes("budgetViewMode")){
    budgetViewMode = safe.budgetViewMode || budgetViewMode;
  }

  for(const slice of slicesToApply){
    writeLocalDataSlice(slice, safe[slice]);
  }

  saveLocalMeta(safe.updatedAt, slicesToApply);

  syncStateFromLegacy();

  if(slicesToApply.includes("events") || slicesToApply.includes("budgetCategories")){
    invalidateDerivedData("events");
  }

  if(!opts.skipRender){
    render();
    renderEventList();
    renderBudgetCategoryOptions();
    renderEventCategoryOptions();
    renderBudgetTransactionCategoryFilter();
    renderBudgetPage();
    setBudgetViewMode(budgetViewMode);
    setActiveSection(activeSection);
    updateHistoryUI();
  }
}

function setLocalPayload(payload, opts = {}){
  if(!payload || typeof payload !== "object") return;

  const safe = buildFullSavePayload(payload);
  const changedSlices = normalizeSliceList(opts.slices || getPayloadSliceNames(payload));
  const updatedAt = Number(payload.updatedAt || Date.now());

  for(const slice of changedSlices){
    writeLocalDataSlice(slice, safe[slice], opts);
  }

  saveLocalMeta(updatedAt, changedSlices);

  if(!opts.skipCloudPending && changedSlices.length){
    markCloudPending("local save", changedSlices);
  }
}

function timeToMinutes(t){
  if(!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function isEditorCollapsed(){
  return localStorage.getItem(EDITOR_COLLAPSE_KEY) === "1";
}

function setEditorCollapsed(collapsed){
  const on = !!collapsed;
  document.body.classList.toggle("editorCollapsed", on);

  // Re-align + re-render after layout width changes
  requestAnimationFrame(() => {
    alignDowToGrid();
    render();

    requestAnimationFrame(() => {
      alignDowToGrid();
      render();
    });

    setTimeout(() => {
      alignDowToGrid();
      render();
    }, 220); // after CSS transitions/reflow
  });

  if(collapseEditorBtn){
    collapseEditorBtn.setAttribute("aria-expanded", String(!on));
    collapseEditorBtn.textContent = on ? "❮" : "❯";
    collapseEditorBtn.setAttribute("aria-label", on ? "Expand panel" : "Collapse panel");
  }

  localStorage.setItem(EDITOR_COLLAPSE_KEY, on ? "1" : "0");
}

collapseEditorBtn?.addEventListener("click", () => {
  setEditorCollapsed(!isEditorCollapsed());
});

let syncGateMode = "enable"; // "enable" or "connect"

function openSyncGate(mode){
  syncGateMode = mode;

  if(mode === "connect"){
    syncGateTitle.textContent = "Connect sync file (one time)";
    syncGateText.textContent = "Choose your shared calendar-data.json in Google Drive so both computers stay synced.";
    syncGatePrimary.textContent = "Choose File";
    syncGateHint.textContent = "After this, syncing is automatic — you won’t have to browse again.";
  }else{
    syncGateTitle.textContent = "Sync needs permission";
    syncGateText.textContent = "Click Enable Sync so the calendar can read/write your shared JSON file.";
    syncGatePrimary.textContent = "Enable Sync";
    syncGateHint.textContent = "This won’t make you browse for the file again — it just re-enables permission.";
  }

  syncGate.classList.remove("hidden");
}

function closeSyncGate(){
  syncGate.classList.add("hidden");
}

syncGateClose?.addEventListener("click", closeSyncGate);

function setSyncUI(){
  if(syncConnected){
    if(syncStatus) syncStatus.textContent = `Sync: Connected • ${syncHandle?.name || ""}`;
    if(manualSyncRow) manualSyncRow.style.display = "none";
    if(connectSyncBtn) connectSyncBtn.style.display = "none"; // hide when connected
    return;
  }

  // not connected
  if(manualSyncRow) manualSyncRow.style.display = "flex";
  if(connectSyncBtn) connectSyncBtn.style.display = "inline-flex";

  // if we have a handle already, this is really "Enable", not "pick a file"
  if(connectSyncBtn){
    connectSyncBtn.textContent = syncHandle ? "Enable Sync" : "Connect Sync File";
  }
}

const SYNC_DB = "calendarSyncDB";
const SYNC_STORE = "handles";
const SYNC_KEY = "calendarFileHandle";

function idbOpen(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SYNC_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(SYNC_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, "readwrite");
    tx.objectStore(SYNC_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, "readonly");
    const req = tx.objectStore(SYNC_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function hasPermission(handle){
  if(!handle) return false;
  const opts = { mode: "readwrite" };
  return (await handle.queryPermission(opts)) === "granted";
}

async function requestPermissionInteractive(handle){
  if(!handle) return false;
  const opts = { mode: "readwrite" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  return (await handle.requestPermission(opts)) === "granted";
}

async function readSyncFile(){
  if(!syncHandle) return null;
  const ok = await hasPermission(syncHandle);
  if(!ok) return null;

  try{
    const file = await syncHandle.getFile();
    const text = await file.text();
    if(!text.trim()) return { version: 1, updatedAt: 0, events: {} };

    const parsed = JSON.parse(text);

    // Back-compat: file contains events map
    if(parsed && typeof parsed === "object" && !("events" in parsed)){
      return { version: 1, updatedAt: 0, events: parsed };
    }

    return buildFullSavePayload(parsed);
  }catch{
    return null;
  }
}

async function writeSyncFileNow(){
  if(!syncHandle) return;
  const ok = await hasPermission(syncHandle);
  if(!ok) return;

  const local = getLocalPayload();
  const payload = JSON.stringify(local, null, 2);

  const writable = await syncHandle.createWritable();
  await writable.write(payload);
  await writable.close();

  if(syncStatus){
    const d = new Date(local.updatedAt || Date.now());
    syncStatus.textContent = `Sync: Connected • Saved ${d.toLocaleString()}`;
  }
}

let remotePollTimer = null;

async function pollRemoteIfNewer(){
  if(!syncConnected || !syncHandle) return;

  const fileData = await readSyncFile();
  if(!fileData) return;

  const local = getLocalPayload();
  const fileUpdated = Number(fileData.updatedAt || 0);
  const localUpdated = Number(local.updatedAt || 0);

  if(fileUpdated > localUpdated){
    applyFullSavePayload(fileData, { skipRender: true });

    if(syncStatus){
      const d = new Date(fileUpdated);
      syncStatus.textContent = `Sync: Connected • Pulled ${d.toLocaleString()} • ${syncHandle?.name || ""}`;
    }

    render();
    renderEventList();
  }
}

function startRemotePolling(){
  if(remotePollTimer) clearInterval(remotePollTimer);
  remotePollTimer = setInterval(() => {
    pollRemoteIfNewer().catch(()=>{});
  }, 4000); // every 4s
}

// Reject object keys that could reassign an object's prototype when data
// arrives from cloud sync or OCR-derived text ("__proto__", etc).
const UNSAFE_MAP_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function isSafeMapKey(key){
  return typeof key === "string" && key.length > 0 && !UNSAFE_MAP_KEYS.has(key);
}

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

// Override your current no-op with a real debounced writer
function syncWriteDebounced(){
  if(!syncConnected) return;
  clearTimeout(syncWriteTimer);
  syncWriteTimer = setTimeout(() => {
    writeSyncFileNow().catch(() => {});
  }, 350);
}

async function connectSync(){
  // File System Access API requires Chromium + usually a secure context.
  if(!window.showSaveFilePicker){
    alert("Sync isn’t available in this context.\n\nFix: run the calendar from a local server (http://localhost) in Chrome/Edge.");
    return;
  }

  const handle = await window.showSaveFilePicker({
    suggestedName: "calendar-events.json",
    types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
  });

  syncHandle = handle;
  await idbSet(SYNC_KEY, syncHandle);

  syncConnected = await requestPermissionInteractive(syncHandle);
  setSyncUI();

  // Choose newest: file vs local
  const fileData = await readSyncFile();
  if (fileData) {
    applyFullSavePayload(fileData, { skipRender: true });
  } else {
    // only push if file is empty/unreadable
    await writeSyncFileNow();
  }

  startRemotePolling();
  render();
  renderEventList();
}

async function tryAutoReconnect(){
  try{
    const handle = await idbGet(SYNC_KEY);
    if(!handle) {
      syncConnected = false;
      setSyncUI();
      return;
    }

    syncHandle = handle;

    // ✅ silent check only
    syncConnected = await hasPermission(syncHandle);
    setSyncUI();

    if(!syncConnected){
  // If we have a remembered file handle, we just need permission
  if(syncHandle){
    openSyncGate("enable");   // shows “Enable Sync”
  }else{
    openSyncGate("connect");  // first-time: shows “Choose File”
  }
startRemotePolling();
  return;
}

    // ✅ On load: shared file is source of truth
const fileData = await readSyncFile();
if(fileData){
  applyFullSavePayload(fileData, { skipRender: true });

  if(syncStatus){
    const d = new Date(fileData.updatedAt || Date.now());
    syncStatus.textContent = `Sync: Connected • Loaded ${d.toLocaleString()} • ${syncHandle?.name || ""}`;
  }
}

render();
renderEventList();
  }catch(err){
    console.error(err);
    syncConnected = false;
    setSyncUI();
  }
}

connectSyncBtn?.addEventListener("click", async () => {
  try{
    // ✅ If we already have a handle saved, just re-enable permission (no picker)
    if(syncHandle){
      const ok = await requestPermissionInteractive(syncHandle);
      syncConnected = ok;
      setSyncUI();
	startRemotePolling();
      if(!ok) return;

      // Pull latest now that permission is granted
      const fileData = await readSyncFile();
      const local = getLocalPayload();

      if(fileData && (fileData.updatedAt || 0) > (local.updatedAt || 0)){
        applyFullSavePayload(fileData, { skipRender: true });
        if(syncStatus){
          const d = new Date(fileData.updatedAt || Date.now());
          syncStatus.textContent = `Sync: Connected • Loaded ${d.toLocaleString()}`;
        }
        render();
        renderEventList();
      } else {
        await writeSyncFileNow();
      }
      return;
    }

    // ✅ No handle yet → first-time setup uses the picker
    await connectSync();

  }catch(err){
    console.error(err);
    alert("Sync connect failed: " + (err?.message || err));
  }
});

function pad2(n){ return String(n).padStart(2, "0"); }
function isoDate(y,m,d){ return `${y}-${pad2(m)}-${pad2(d)}`; }
function ymdToDate(iso){
  const [y,m,d] = (iso||"").split("-").map(Number);
  return new Date(y, (m||1)-1, d||1);
}

// ============================================================================
// 06. WEATHER HELPERS
// ============================================================================
const WEATHER_LOCATIONS = {
  coloradoSprings: {
    label: "Colorado Springs, CO",
    latitude: 38.8339,
    longitude: -104.8214,
    timezone: "America/Denver"
  },
  denver: {
    label: "Denver, CO",
    latitude: 39.7392,
    longitude: -104.9903,
    timezone: "America/Denver"
  },
  pueblo: {
    label: "Pueblo, CO",
    latitude: 38.2544,
    longitude: -104.6091,
    timezone: "America/Denver"
  },
  fortCollins: {
    label: "Fort Collins, CO",
    latitude: 40.5853,
    longitude: -105.0844,
    timezone: "America/Denver"
  }
};

let weatherCache = null;

function getWeatherSettings(){
  return settings.weather || {
    enabled: true,
    locationKey: "coloradoSprings"
  };
}

function getWeatherLocation(){
  const weather = getWeatherSettings();
  return WEATHER_LOCATIONS[weather.locationKey] || WEATHER_LOCATIONS.coloradoSprings;
}

function weatherCodeLabel(code){
  const map = {
    0: ["☀️", "Clear"],
    1: ["🌤️", "Mostly clear"],
    2: ["⛅", "Partly cloudy"],
    3: ["☁️", "Cloudy"],
    45: ["🌫️", "Fog"],
    48: ["🌫️", "Fog"],
    51: ["🌦️", "Light drizzle"],
    53: ["🌦️", "Drizzle"],
    55: ["🌧️", "Heavy drizzle"],
    61: ["🌦️", "Light rain"],
    63: ["🌧️", "Rain"],
    65: ["🌧️", "Heavy rain"],
    71: ["🌨️", "Light snow"],
    73: ["🌨️", "Snow"],
    75: ["❄️", "Heavy snow"],
    80: ["🌦️", "Rain showers"],
    81: ["🌧️", "Showers"],
    82: ["⛈️", "Heavy showers"],
    95: ["⛈️", "Thunderstorm"],
    96: ["⛈️", "Thunderstorm"],
    99: ["⛈️", "Thunderstorm"]
  };

  return map[Number(code)] || ["🌡️", "Forecast"];
}

async function fetchWeatherForecast(){
  const loc = getWeatherLocation();
  const cacheKey = getWeatherSettings().locationKey;
  const now = Date.now();

  if(
    weatherCache &&
    weatherCache.key === cacheKey &&
    now - weatherCache.fetchedAt < 30 * 60 * 1000
  ){
    return weatherCache.data;
  }

  const params = new URLSearchParams({
  latitude: String(loc.latitude),
  longitude: String(loc.longitude), 
  daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  hourly: "temperature_2m,precipitation_probability,weather_code",
  temperature_unit: "fahrenheit",
  timezone: loc.timezone,
  forecast_days: "16"
});

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  if(!res.ok){
    throw new Error(`Weather request failed: ${res.status}`);
  }

  const data = await res.json();

  weatherCache = {
    key: cacheKey,
    fetchedAt: now,
    data
  };

  return data;
}

async function getWeatherForDay(dayISO){
  if(!getWeatherSettings().enabled) return null;

  const data = await fetchWeatherForecast();
  const daily = data?.daily;
  if(!daily?.time) return null;

  const idx = daily.time.indexOf(dayISO);
  if(idx < 0) return null;

  const [icon, label] = weatherCodeLabel(daily.weather_code?.[idx]);

  return {
    icon,
    label,
    high: Math.round(daily.temperature_2m_max?.[idx]),
    low: Math.round(daily.temperature_2m_min?.[idx]),
    precip: Number.isFinite(Number(daily.precipitation_probability_max?.[idx]))
      ? Number(daily.precipitation_probability_max[idx])
      : null,
    location: getWeatherLocation().label
  };
}

async function getHourlyWeatherForDay(dayISO){
  if(!getWeatherSettings().enabled) return [];

  const data = await fetchWeatherForecast();
  const hourly = data?.hourly;

  if(!hourly?.time) return [];

  const items = [];

  for(let i = 0; i < hourly.time.length; i++){
    const stamp = hourly.time[i];

    if(!stamp.startsWith(dayISO)) continue;

    const hour = parseInt(stamp.slice(11, 13), 10);

    // Every 3 hours keeps the overlay useful without turning it into glitter soup.
    if(hour % 3 !== 0) continue;

    const temp = hourly.temperature_2m?.[i];
    const precip = hourly.precipitation_probability?.[i];
    const code = hourly.weather_code?.[i];
    const [icon, label] = weatherCodeLabel(code);

    if(typeof temp !== "number") continue;

    items.push({
      hour,
      temp: Math.round(temp),
      precip: Number.isFinite(Number(precip)) ? Number(precip) : 0,
      icon,
      label
    });
  }

// Add midnight (24) as final point for visual closure
const last = items[items.length - 1];

if (last && last.hour !== 24) {
  items.push({
    ...last,
    hour: 24
  });
}

  return items;
}

function buildHourlyWeatherStrip(dayISO){
  const strip = document.createElement("div");
  strip.className = "weatherHourlyStrip";

  strip.innerHTML = `
    <div class="weatherStripLoading">Loading hourly weather...</div>
  `;

  getHourlyWeatherForDay(dayISO)
    .then(items => {
      if(!strip.isConnected) return;

      if(!items.length){
  strip.classList.add("weatherUnavailable");
  strip.innerHTML = `
    <div class="weatherStripUnavailable">
      <div class="weatherUnavailableIcon">⏳</div>
      <div>
        <div class="weatherUnavailableMain">Weather unavailable</div>
        <div class="weatherUnavailableSub">Forecasts are only available up to 16 days ahead.</div>
      </div>
    </div>
  `;
  return;
}

      const temps = items.map(x => x.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const tempRange = Math.max(1, maxTemp - minTemp);

      const points = items.map(item => {
        const x = (item.hour / 24) * 100;

        // Hotter temps rise higher, cooler temps sit lower.
        const y = 78 - (((item.temp - minTemp) / tempRange) * 52);

        return { ...item, x, y };
      });

      const pointString = points.map(p => `${p.x},${p.y}`).join(" ");

      strip.innerHTML = `
        <div class="weatherStripHours">
          <span>12a</span>
          <span>3a</span>
          <span>6a</span>
          <span>9a</span>
          <span>12p</span>
          <span>3p</span>
          <span>6p</span>
          <span>9p</span>
        </div>

        <div class="weatherStripGraph">
          <svg class="weatherStripSvg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline class="weatherStripLine" points="${pointString}" />
          </svg>
        </div>
      `;

      const graph = strip.querySelector(".weatherStripGraph");

      for(const p of points){
        const dot = document.createElement("div");
        dot.className = "weatherStripDot";
        dot.style.left = `${p.x}%`;
        dot.style.top = `${p.y}%`;
        dot.title = `${p.hour}:00 • ${p.temp}° • ${p.label} • ${p.precip}% rain`;

        dot.innerHTML = `
          <span class="weatherStripIcon">${p.icon}</span>
          <span class="weatherStripTemp">${p.temp}°</span>
        `;

        graph.appendChild(dot);
      }
    })
    .catch(() => {
      strip.remove();
    });

  return strip;
}
function buildDayWeatherCard(dayISO){
  const card = document.createElement("div");
  card.className = "dayWeatherCard";
  card.innerHTML = `
    <div class="weatherIcon">⏳</div>
    <div class="weatherText">
      <div class="weatherMain">Loading weather...</div>
      <div class="weatherSub">Open-Meteo</div>
    </div>
  `;

  getWeatherForDay(dayISO)
    .then(w => {
      if(!w){
        card.innerHTML = `
          <div class="weatherIcon">—</div>
          <div class="weatherText">
            <div class="weatherMain">No forecast</div>
            <div class="weatherSub">Outside forecast range</div>
          </div>
        `;
        return;
      }

      card.innerHTML = `
        <div class="weatherIcon">${w.icon}</div>
        <div class="weatherText">
          <div class="weatherMain">${w.high}° / ${w.low}° · ${w.label}</div>
          <div class="weatherSub">${w.precip ?? 0}% rain · ${escapeHtml(w.location)}</div>
        </div>
      `;
    })
    .catch(() => {
      card.innerHTML = `
        <div class="weatherIcon">⚠️</div>
        <div class="weatherText">
          <div class="weatherMain">Weather unavailable</div>
          <div class="weatherSub">Try again later</div>
        </div>
      `;
    });

  return card;
}

function dateToYmd(dt){
  return `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}`;
}
function fmtMonthYear(dt){
  return dt.toLocaleString(undefined, { month: "long", year: "numeric" });
}
function fmtPrettyISO(iso){
  const dt = ymdToDate(iso);
  return dt.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function updateCalendarMobileDateLabel(){
  if(!calendarMobileDateLabel) return;

  const now = new Date();
  const date = now.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric"
  });

  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });

  calendarMobileDateLabel.textContent = `${date} | ${time}`;
}

function getStartOfWeek(dt){
  const copy = new Date(dt);
  const diff = copy.getDay(); // Sunday-start
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0,0,0,0);
  return copy;
}

function buildDayViewWeekJumper(selectedISO){
  const wrap = document.createElement("div");
  wrap.className = "dayViewWeekJumper";

  const selected = ymdToDate(selectedISO);
  const start = getStartOfWeek(selected);

  const labels = ["S","M","T","W","T","F","S"];

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "weekdayBtn dayViewWeekNavBtn";
  prevBtn.textContent = "‹";
  prevBtn.title = "Previous week";
  prevBtn.setAttribute("aria-label", "Previous week");
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const prevWeek = addDaysISO(selectedISO, -7);
    selectDate(prevWeek);
    viewMode = "day";
    render();
    renderEventList();
  });
  wrap.appendChild(prevBtn);

  const daysWrap = document.createElement("div");
  daysWrap.className = "dayViewWeekdayRow";

  for(let i = 0; i < 7; i++){
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);

    const iso = dateToYmd(dt);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "weekdayBtn dayViewWeekdayBtn";
    btn.textContent = labels[i];
    btn.dataset.dayIso = iso;
    btn.title = fmtPrettyISO(iso);

    if(iso === selectedISO){
      btn.classList.add("active");
    }

    const todayISO = dateToYmd(new Date());
    if(iso === todayISO){
      btn.classList.add("todayDot");
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectDate(iso);
      viewMode = "day";
      render();
      renderEventList();
    });

    daysWrap.appendChild(btn);
  }

  wrap.appendChild(daysWrap);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "weekdayBtn dayViewWeekNavBtn";
  nextBtn.textContent = "›";
  nextBtn.title = "Next week";
  nextBtn.setAttribute("aria-label", "Next week");
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const nextWeek = addDaysISO(selectedISO, 7);
    selectDate(nextWeek);
    viewMode = "day";
    render();
    renderEventList();
  });
  wrap.appendChild(nextBtn);

  return wrap;
}

function hexToRgba(hex, a){
  const h = (hex||"").replace("#","").trim();
  if (h.length !== 6) return `rgba(255,255,255,${a})`;
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
function cryptoId(){
  // Prefer a cryptographically random, non-guessable ID. The old
  // timestamp+Math.random format remains as a fallback for very old browsers.
  if(typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"){
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
}

// ============================================================================
// 07. NAVIGATION + SECTION SWITCHING
// ============================================================================
function updateViewSlider(){
  if(!viewSwitcher || !viewSliderThumb) return;

  const activeBtn = viewSwitcher.querySelector(".navBtnView.active");
  if(!activeBtn) return;

  const switcherStyles = getComputedStyle(viewSwitcher);
  const switcherPadLeft = parseFloat(switcherStyles.paddingLeft) || 0;

  const thumbLeft = activeBtn.offsetLeft - switcherPadLeft;
  const thumbWidth = activeBtn.offsetWidth;

  viewSliderThumb.style.transform = `translateX(${thumbLeft}px)`;
  viewSliderThumb.style.width = `${thumbWidth}px`;
}

window.addEventListener("resize", updateViewSlider);

let activeSection = localStorage.getItem("myCalendar_activeSection") || "calendar";

function updateSectionSlider(){
  if(!sectionSwitcher || !sectionSliderThumb) return;

  const activeBtn = sectionSwitcher.querySelector(".sectionBtn.active");
  if(!activeBtn) return;

  const switcherStyles = getComputedStyle(sectionSwitcher);
  const padLeft = parseFloat(switcherStyles.paddingLeft) || 0;

  sectionSliderThumb.style.transform = `translateX(${activeBtn.offsetLeft - padLeft}px)`;
  sectionSliderThumb.style.width = `${activeBtn.offsetWidth}px`;
}

function setActiveSection(section){
  setAppState({ activeSection: section }, { persistActiveSection: true });
  document.body.dataset.activeSection = section;

  calendarSectionBtn?.classList.toggle("active", section === "calendar");
  budgetSectionBtn?.classList.toggle("active", section === "budget");
  weatherSectionBtn?.classList.toggle("active", section === "weather");

  const showCalendar = section === "calendar";
  const showBudget = section === "budget";
  const showWeather = section === "weather";

  calendarPage?.classList.toggle("hidden", !showCalendar);
  budgetPage?.classList.toggle("hidden", !showBudget);
  weatherPage?.classList.toggle("hidden", !showWeather);

  if(calendarPage){
    calendarPage.hidden = !showCalendar;
    calendarPage.style.display = showCalendar ? "" : "none";
  }

  if(budgetPage){
    budgetPage.hidden = !showBudget;
    budgetPage.style.display = showBudget ? "" : "none";
  }

  if(weatherPage){
    weatherPage.hidden = !showWeather;
    weatherPage.style.display = showWeather ? "" : "none";
  }

  calendarSubbar?.classList.toggle("hidden", !showCalendar);
document.querySelector(".calendar")?.classList.toggle("hidden", !showCalendar);
document.querySelector(".panel")?.classList.toggle("hidden", !showCalendar);

  if(section === "calendar"){
    queueRender({ calendar:true, eventList:true, sliders:true });
    requestAnimationFrame(() => {
      alignDowToGrid();
      updateViewSlider();
    });
  }

  if(section === "budget"){
    queueRender({ budgetFilters:true, budget:true, sliders:true });
  }

  requestAnimationFrame(updateSectionSlider);
}
calendarSectionBtn?.addEventListener("click", () => setActiveSection("calendar"));
budgetSectionBtn?.addEventListener("click", () => setActiveSection("budget"));
weatherSectionBtn?.addEventListener("click", () => setActiveSection("weather"));

window.addEventListener("resize", () => {
  updateSectionSlider();
});

// ============================================================================
// 08. BUDGET DASHBOARD + CATEGORIES
// ============================================================================
let budgetViewMode = localStorage.getItem("myCalendar_budgetViewMode") || "month";
let budgetTxEditState = null;
let budgetTransactionFilter = {
  search: "",
  category: "all",
  type: "all"
};

function money(n){
  return `$${Number(n || 0).toFixed(2)}`;
}

function pct(part, total){
  if(!total) return "0%";

  const value =
    (Number(part || 0) / Number(total || 1)) * 100;

  if(value > 0 && value < 1){
    return ">1%";
  }

  return `${Math.round(value)}%`;
}

function updateBudgetTypeSlider(){
  if(!budgetTypeSwitcher || !budgetTypeSliderThumb) return;

  const activeBtn = budgetTypeSwitcher.querySelector(".budgetTypeBtn.active");
  if(!activeBtn) return;

  const styles = getComputedStyle(budgetTypeSwitcher);
  const padLeft = parseFloat(styles.paddingLeft) || 0;

  budgetTypeSliderThumb.style.transform =
    `translateX(${activeBtn.offsetLeft - padLeft}px)`;

  budgetTypeSliderThumb.style.width = `${activeBtn.offsetWidth}px`;
}

function getDaysInBudgetRange(range){
  const start = ymdToDate(range.startISO);
  const end = ymdToDate(range.endISO);

  return Math.max(
    1,
    Math.round((end - start) / 86400000) + 1
  );
}

function getDaysRemainingInBudgetRange(range){
  const today = new Date();
  today.setHours(0,0,0,0);

  const start = ymdToDate(range.startISO);
  const end = ymdToDate(range.endISO);

  if(today < start) return getDaysInBudgetRange(range);
  if(today > end) return 0;

  return Math.max(
    0,
    Math.round((end - today) / 86400000)
  );
}

const BUDGET_PANES_KEY = "myCalendarBudgetPanes_v1";

const DEFAULT_BUDGET_PANES = {
  snapshot: ["expenses", "income", "net", "remaining"],
  insights: ["average", "pace", "topCategory", "leftPerDay"]
};

const BUDGET_INSIGHT_OPTIONS = [
  ["expenses", "Expenses"],
  ["income", "Income"],
  ["net", "Net cashflow"],
  ["remaining", "Remaining"],
  ["average", "Average spending"],
  ["pace", "Budget pace"],
  ["topCategory", "Top category"],
  ["leftPerDay", "Left per day"],
  ["daysLeft", "Days left"],
  ["projected", "Projected total"],
  ["pricedItems", "Priced items"],
  ["biggest", "Biggest item"],
  ["avgTransaction", "Avg transaction"],
  ["categoryCount", "Category count"],
  ["recurringItems", "Recurring items"]
];

let selectedBudgetPanes = loadBudgetPaneSelection();

function loadBudgetPaneSelection(){
  try{
    const saved = JSON.parse(localStorage.getItem(BUDGET_PANES_KEY));
    const validKeys = BUDGET_INSIGHT_OPTIONS.map(([key]) => key);

    return {
      snapshot: Array.isArray(saved?.snapshot)
        ? saved.snapshot.filter(key => validKeys.includes(key)).slice(0, 4)
        : DEFAULT_BUDGET_PANES.snapshot,

      insights: Array.isArray(saved?.insights)
        ? saved.insights.filter(key => validKeys.includes(key)).slice(0, 4)
        : DEFAULT_BUDGET_PANES.insights
    };
  }catch{}

  return structuredClone(DEFAULT_BUDGET_PANES);
}

function saveBudgetPaneSelection(){
  localStorage.setItem(
    BUDGET_PANES_KEY,
    JSON.stringify(selectedBudgetPanes)
  );
  setLocalPayload({ updatedAt: Date.now(), selectedBudgetPanes });
  cloudWriteDebounced(["selectedBudgetPanes"]);
}

function getBudgetInsightTiles({ range, items, expenseItems, expenseTotal, plan }){
  const incomeItems = items.filter(item => Number(item.price || 0) < 0);
  const incomeTotal = incomeItems.reduce((sum, item) => sum + Math.abs(Number(item.price || 0)), 0);
  const net = incomeTotal - expenseTotal;

  const daysInRange = getDaysInBudgetRange(range);
  const daysLeft = getDaysRemainingInBudgetRange(range);
  const daysElapsed = Math.max(1, daysInRange - daysLeft);

  const averageLabel =
    budgetViewMode === "year"
      ? "Avg / month"
      : budgetViewMode === "month"
        ? "Avg / week"
        : "Avg / day";

  const averageDivisor =
    budgetViewMode === "year"
      ? 12
      : budgetViewMode === "month"
        ? Math.max(1, daysInRange / 7)
        : daysInRange;

  const average = expenseTotal / averageDivisor;
  const categoryTotals = getBudgetCategoryTotals(expenseItems);
  const topCategory = categoryTotals[0];

  const biggest = [...expenseItems]
    .sort((a,b) => Number(b.price || 0) - Number(a.price || 0))[0];

  const recurringItems = items.filter(item => {
    const found = findBudgetMasterEvent?.(item.eventId);
    return found?.ev?.recurrence?.freq && found.ev.recurrence.freq !== "none";
  }).length;

  const pacePct = plan > 0
    ? Math.round((expenseTotal / plan) * 100)
    : 0;

  const paceText = !plan
    ? "No plan"
    : expenseTotal > plan
      ? "Over"
      : pacePct >= 85
        ? "Close"
        : "On track";

  const remaining = Math.max(0, plan - expenseTotal);
  const remainingPerDay = daysLeft > 0 ? remaining / daysLeft : remaining;
  const projected = daysElapsed > 0 ? (expenseTotal / daysElapsed) * daysInRange : expenseTotal;
  const avgTransaction = expenseItems.length ? expenseTotal / expenseItems.length : 0;

  return {
    expenses: { label: "Expenses", value: money(expenseTotal), sub: "This period" },
    income: { label: "Income", value: money(incomeTotal), sub: "This period" },
    net: { label: "Net", value: money(net), sub: net >= 0 ? "Positive cashflow" : "Negative cashflow" },
    remaining: { label: "Remaining", value: money(remaining), sub: plan ? "After spending" : "No plan yet" },

    average: { label: averageLabel, value: money(average), sub: "Spending pace" },
    pace: { label: "Budget pace", value: paceText, sub: plan ? `${pacePct}% used` : "Set a plan" },
    topCategory: { label: "Top category", value: topCategory ? topCategory.name : "None", sub: topCategory ? money(topCategory.total) : "No spending" },
    leftPerDay: { label: "Left / day", value: money(remainingPerDay), sub: plan ? "To stay on plan" : "No plan yet" },

    daysLeft: { label: "Days left", value: String(daysLeft), sub: range.title.replace(" budget", "") },
    projected: { label: "Projected", value: money(projected), sub: "At current pace" },
    pricedItems: { label: "Priced items", value: String(expenseItems.length), sub: "Expenses only" },
    biggest: { label: "Biggest item", value: biggest ? money(biggest.price) : "$0.00", sub: biggest ? biggest.title : "None yet" },
    avgTransaction: { label: "Avg item", value: money(avgTransaction), sub: "Expense average" },
    categoryCount: { label: "Categories", value: String(categoryTotals.length), sub: "With spending" },
    recurringItems: { label: "Recurring", value: String(recurringItems), sub: "Priced repeats" }
  };
}
function closeBudgetInsightsMenu(){
  document.querySelector(".budgetInsightsMenu")?.remove();
}

function closeBudgetInsightsMenu(){
  document.querySelector(".budgetInsightsMenu")?.remove();
}

function getSortedBudgetInsightOptions(paneKey){
  const sortMode = settings?.budgetCategorySort || "custom";

  const selected = selectedBudgetPanes[paneKey] || [];
  const otherPaneKey = paneKey === "snapshot" ? "insights" : "snapshot";
  const otherSelected = selectedBudgetPanes[otherPaneKey] || [];

  const bySetting = (list) => {
    const copy = [...list];

    if(["az", "a-z", "alphaAsc", "nameAsc"].includes(sortMode)){
      return copy.sort((a, b) => a[1].localeCompare(b[1]));
    }

    if(["za", "z-a", "alphaDesc", "nameDesc"].includes(sortMode)){
      return copy.sort((a, b) => b[1].localeCompare(a[1]));
    }

    return copy;
  };

  const selectedOptions = selected
    .map(key => BUDGET_INSIGHT_OPTIONS.find(([optionKey]) => optionKey === key))
    .filter(Boolean);

  const middleOptions = bySetting(
    BUDGET_INSIGHT_OPTIONS.filter(([key]) =>
      !selected.includes(key) &&
      !otherSelected.includes(key)
    )
  );

  const otherPaneOptions = bySetting(
    BUDGET_INSIGHT_OPTIONS.filter(([key]) =>
      otherSelected.includes(key)
    )
  );

  return [
    ...selectedOptions,
    ...middleOptions,
    ...otherPaneOptions
  ];
}

function openBudgetPaneMenu(paneKey, btn){
  closeBudgetInsightsMenu();

  const card = btn?.closest(".budgetInsightsCard");
  if(!card) return;

  const selected = selectedBudgetPanes[paneKey] || [];
  const selectedCount = selected.length;

  const menu = document.createElement("div");
  menu.className = "budgetInsightsMenu";
  menu.dataset.paneKey = paneKey;

  menu.innerHTML = `
    <div class="budgetInsightsMenuTitle">
      ${paneKey === "snapshot" ? "Snapshot tiles" : "Insight tiles"}
    </div>

    <div class="budgetInsightsMenuSub">${selectedCount}/4 selected</div>

    ${getSortedBudgetInsightOptions(paneKey).map(([key, label]) => {
      const active = selected.includes(key);

const otherPaneKey = paneKey === "snapshot" ? "insights" : "snapshot";
const usedOnOtherPane = selectedBudgetPanes[otherPaneKey]?.includes(key);

const locked =
  usedOnOtherPane ||
  (!active && selected.length >= 4);

const reason = usedOnOtherPane
  ? "Used in other pane"
  : locked
    ? "Max 4 selected"
    : "";

return `
  <button
    class="budgetInsightsOption ${active ? "active" : ""} ${usedOnOtherPane ? "usedElsewhere" : ""} ${locked ? "locked" : ""}"
    type="button"
    data-insight-key="${key}"
    data-disabled-reason="${escapeHtml(reason)}"
    aria-disabled="${locked ? "true" : "false"}"
  >
    <span>${escapeHtml(label)}</span>
    <span class="budgetInsightsOptionStatus">
      ${active ? "✓" : locked ? "ⓘ" : ""}
    </span>
  </button>
`;
    }).join("")}
  `;

  card.appendChild(menu);
}

budgetSnapshotMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  const openMenu = document.querySelector(".budgetInsightsMenu");

  if(openMenu?.dataset.paneKey === "snapshot"){
    closeBudgetInsightsMenu();
  }else{
    openBudgetPaneMenu("snapshot", budgetSnapshotMenuBtn);
  }
});

budgetInsightsMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  const openMenu = document.querySelector(".budgetInsightsMenu");

  if(openMenu?.dataset.paneKey === "insights"){
    closeBudgetInsightsMenu();
  }else{
    openBudgetPaneMenu("insights", budgetInsightsMenuBtn);
  }
});

document.addEventListener("click", (e) => {
  if(
    !e.target.closest(".budgetInsightsMenu") &&
    !e.target.closest(".budgetInsightsMenuBtn")
  ){
    closeBudgetInsightsMenu();
  }
});

document.addEventListener("click", (e) => {
  const option = e.target.closest(".budgetInsightsOption");
  if(!option) return;

  e.preventDefault();
  e.stopPropagation();

  const menu = option.closest(".budgetInsightsMenu");
  const paneKey = menu?.dataset.paneKey;
  if(!paneKey) return;

  const key = option.dataset.insightKey;
if(option.getAttribute("aria-disabled") === "true"){
  option.classList.add("showReason");

  clearTimeout(option._reasonTimer);
  option._reasonTimer = setTimeout(() => {
    option.classList.remove("showReason");
  }, 1100);

  return;
}
  const selected = selectedBudgetPanes[paneKey] || [];
  const isSelected = selected.includes(key);

  if(isSelected){
    if(selected.length <= 1) return;
    selectedBudgetPanes[paneKey] = selected.filter(x => x !== key);
  }else{
    if(selected.length >= 4) return;
    selectedBudgetPanes[paneKey] = [...selected, key];
  }

  saveBudgetPaneSelection();

  const scrollTop = menu ? menu.scrollTop : 0;

  renderBudgetPage();

  requestAnimationFrame(() => {
    openBudgetPaneMenu(
      paneKey,
      paneKey === "snapshot" ? budgetSnapshotMenuBtn : budgetInsightsMenuBtn
    );

    const nextMenu = document.querySelector(".budgetInsightsMenu");
    if(nextMenu){
      nextMenu.scrollTop = scrollTop;
    }
  });
});

function renderBudgetPane(grid, paneKey, data){
  if(!grid) return;

  const tiles = getBudgetInsightTiles(data);
  const selected = selectedBudgetPanes[paneKey] || [];

  grid.innerHTML = selected.slice(0, 4).map(key => {
    const tile = tiles[key];
    if(!tile) return "";

    return `
      <div class="budgetInsightTile">
        <div class="budgetInsightLabel">${escapeHtml(tile.label)}</div>
        <div class="budgetInsightValue">${escapeHtml(tile.value)}</div>
        <div class="budgetInsightSub">${escapeHtml(tile.sub)}</div>
      </div>
    `;
  }).join("");
}

function renderBudgetInsights(data){
  renderBudgetPane(budgetSnapshotGrid, "snapshot", data);
  renderBudgetPane(budgetInsightsGrid, "insights", data);
}

function setBudgetTxType(type){
  const nextType = type === "income" ? "income" : "expense";

  if(budgetTxType) budgetTxType.value = nextType;

  budgetExpenseBtn?.classList.toggle("active", nextType === "expense");
  budgetIncomeBtn?.classList.toggle("active", nextType === "income");

  requestAnimationFrame(updateBudgetTypeSlider);
}

budgetExpenseBtn?.addEventListener("click", () => setBudgetTxType("expense"));
budgetIncomeBtn?.addEventListener("click", () => setBudgetTxType("income"));
window.addEventListener("resize", updateBudgetTypeSlider);
window.addEventListener("resize", updateBudgetCashflowToggle);

function updateBudgetSlider(){
  if(!budgetViewSwitcher || !budgetSliderThumb) return;

  const activeBtn = budgetViewSwitcher.querySelector(".budgetViewBtn.active");
  if(!activeBtn) return;

  const styles = getComputedStyle(budgetViewSwitcher);
  const padLeft = parseFloat(styles.paddingLeft) || 0;

  budgetSliderThumb.style.transform = `translateX(${activeBtn.offsetLeft - padLeft}px)`;
  budgetSliderThumb.style.width = `${activeBtn.offsetWidth}px`;
}

function setBudgetDrawerMode(mode){
  const kicker = budgetTxDrawer?.querySelector(".budgetDrawerKicker");
  const title = budgetTxDrawer?.querySelector(".budgetTxDrawerHeader h3");

  if(mode === "edit"){
    if(kicker) kicker.textContent = "Edit transaction";
    if(title) title.textContent = "Update spending";
    if(budgetTxAddBtn) budgetTxAddBtn.textContent = "Update Transaction";
  }else{
    if(kicker) kicker.textContent = "New transaction";
    if(title) title.textContent = "Add spending";
    if(budgetTxAddBtn) budgetTxAddBtn.textContent = "Add Transaction";
  }
}

function resetBudgetTransactionForm(){
  const range = budgetRangeForMode();

  budgetTxEditState = null;
  currentReceiptScanDraft = null;

  if(budgetTxTitle) budgetTxTitle.value = "";
  if(budgetTxAmount) budgetTxAmount.value = "";
  if(budgetTxDate) budgetTxDate.value = selectedDateISO || range.startISO;

  if(budgetTxCategory) budgetTxCategory.value = "other";
  renderBudgetCategoryOptions();

  setBudgetRepeatValue("none");
  if(budgetRepeatInterval) budgetRepeatInterval.value = "1";
  if(budgetRepeatUntil) budgetRepeatUntil.value = "";
  budgetWeekdayBtns.forEach(btn => btn.classList.remove("active"));

setBudgetTxType("expense");
  setBudgetDrawerMode("add");
}

function openBudgetTxDrawer(){
  budgetTxDrawer?.classList.add("open");

  setTimeout(() => {
    budgetTxTitle?.focus({ preventScroll: true });
  }, 280);
}

function closeBudgetTxDrawer(){
  budgetTxDrawer?.classList.remove("open");
}

function openNewBudgetTransaction(){
  resetBudgetTransactionForm();
  clearReceiptScanStatus();
  openBudgetTxDrawer();
}

budgetTxDrawerOpenBtn?.addEventListener("click", openNewBudgetTransaction);

budgetTxDrawerCloseBtn?.addEventListener("click", () => {
  closeBudgetTxDrawer();
  resetBudgetTransactionForm();
  clearReceiptScanStatus();
});

budgetTxDrawerOpenBtn?.addEventListener("click", openBudgetTxDrawer);
budgetTxDrawerCloseBtn?.addEventListener("click", closeBudgetTxDrawer);

function setBudgetViewMode(mode){
  setBudgetState({ budgetViewMode: mode }, { persistBudgetViewMode: true, render:false });

  budgetWeekBtn?.classList.toggle("active", mode === "week");
  budgetMonthBtn?.classList.toggle("active", mode === "month");
  budgetYearBtn?.classList.toggle("active", mode === "year");

  queueRender({ budget:true, sliders:true });
}

const BUDGET_PLANS_KEY = "myCalendarBudgetPlans_v1";

let budgetPlans = loadBudgetPlans();

function loadBudgetPlans(){
  try{
    return JSON.parse(localStorage.getItem(BUDGET_PLANS_KEY)) || {
      week:{},
      month:{},
      year:{}
    };
  }catch{
    return {
      week:{},
      month:{},
      year:{}
    };
  }
}

function saveBudgetPlans(){
  localStorage.setItem(BUDGET_PLANS_KEY, JSON.stringify(budgetPlans));
  setLocalPayload({ updatedAt: Date.now(), budgetPlans });
  cloudWriteDebounced(["budgetPlans"]);
}

function getBudgetPlanKey(range){
  if(budgetViewMode === "week") return range.startISO;
  if(budgetViewMode === "year") return range.startISO.slice(0, 4);
  return range.startISO.slice(0, 7);
}

const BUDGET_CATEGORIES_KEY = "myCalendarBudgetCategories_v2";

let budgetCategories = loadBudgetCategories();

function loadBudgetCategories(){
  try{
    const saved = JSON.parse(localStorage.getItem(BUDGET_CATEGORIES_KEY));
    if(Array.isArray(saved) && saved.length) return saved;
  }catch{}

  return [
  { id:"other", name:"Other", color:"#7a5aff", budgets:{ week:0, month:0, year:0 } }
];
}

function renderBudgetCategoryHub(){
  if(!budgetCategoryHubList) return;

  budgetCategoryHubList.innerHTML = getSortedBudgetCategories().map(cat => {
    const isOther = cat.id === "other";

    return `
      <div class="budgetCategoryRow">
        <div class="budgetCategoryLabel">
          <span
            class="budgetCategoryDot"
            style="
              --cat-color:${safeHexColor(cat.color, "#7a5aff")};
              --cat-glow:${hexToRgba(cat.color || "#7a5aff", .35)};
            "
          ></span>

          <div>
            <div class="budgetCategoryName">${escapeHtml(cat.name)}</div>
            <div class="budgetCategoryBudgetMini">
              Week ${money(cat?.budgets?.week || 0)} ·
              Month ${money(cat?.budgets?.month || 0)} ·
              Year ${money(cat?.budgets?.year || 0)}
            </div>
          </div>
        </div>

        <div class="budgetCategoryActions">
          ${
            isOther
              ? `<button class="tiny budgetCategoryLock" type="button" disabled>🔒</button>`
              : `
                <button class="tiny budgetCategoryRenameBtn" type="button" data-category-id="${escapeHtml(cat.id)}">Edit</button>
                <button class="tiny budgetCategoryDeleteBtn" type="button" data-category-id="${escapeHtml(cat.id)}">X</button>
              `
          }
        </div>
      </div>
    `;
  }).join("");
}

function openBudgetCategoryHub(){
  budgetCategoryHubModal?.classList.remove("hidden");
  renderBudgetCategoryHub();
}

function closeBudgetCategoryHub(){
  budgetCategoryHubModal?.classList.add("hidden");
}

function renderBudgetCategoryManager(){
  if(!budgetCategoryManagerList) return;

  budgetCategoryManagerList.innerHTML = getSortedBudgetCategories().map(cat => {
    const isOther = cat.id === "other";
    const catBudget = getCategoryBudget(cat);

    return `
      <div class="budgetCategoryRow">
        <div class="budgetCategoryLabel">
          <span
            class="budgetCategoryDot"
            style="
              --cat-color:${safeHexColor(cat.color, "#7a5aff")};
              --cat-glow:${hexToRgba(cat.color || "#7a5aff", .35)};
            "
          ></span>

          <div class="budgetCategoryName">${escapeHtml(cat.name)}</div>
        </div>

        <div class="budgetCategoryActions">
          ${
            isOther
              ? `
                <button
                  class="tiny budgetCategoryLock"
                  type="button"
                  disabled
                  title="Other cannot be renamed or deleted"
                >
                  🔒
                </button>
              `
              : `
                <button
                  class="tiny budgetCategoryRenameBtn"
                  type="button"
                  data-category-id="${escapeHtml(cat.id)}"
                >
                  Edit
                </button>

                <button
                  class="tiny budgetCategoryDeleteBtn"
                  type="button"
                  data-category-id="${escapeHtml(cat.id)}"
                >
                  X
                </button>
              `
          }
        </div>
      </div>
    `;
  }).join("");
}

function renameBudgetCategory(categoryId){
  if(categoryId === "other") return;
  openBudgetCategoryModal("rename", categoryId);
}

let budgetCategoryModalMode = null;
let budgetCategoryModalCategoryId = null;

function openBudgetCategoryModal(mode, categoryId){
  const cat = budgetCategories.find(c => c.id === categoryId);
  if(!cat) return;

  budgetCategoryModalMode = mode;
  budgetCategoryModalCategoryId = categoryId;

  budgetCategoryModal?.classList.remove("hidden");

  if(mode === "rename"){
    budgetCategoryModalKicker.textContent = "Rename category";
    budgetCategoryModalTitle.textContent = "Give it a new name";
    budgetCategoryModalText.textContent = "";
    budgetCategoryModalInput.style.display = "block";
    budgetCategoryModalInput.value = cat.name;
budgetCategoryModalColor.value = cat.color || "#7a5aff";
budgetCategoryModalColorHint.textContent = budgetCategoryModalColor.value;
fillCategoryBudgetInputs(cat);

budgetCategoryModalBudgetWeek
  ?.closest(".budgetCategoryBudgetModalRow")
  ?.classList.remove("hidden");

    budgetCategoryModalConfirm.textContent = "Save";
    budgetCategoryModalConfirm.classList.remove("danger");
    setTimeout(() => budgetCategoryModalInput?.focus(), 0);
budgetCategoryModalColor?.closest(".budgetCategoryColorRow")?.classList.remove("hidden");
    return;
  }

  if(mode === "delete"){
    budgetCategoryModalKicker.textContent = "Delete category";
    budgetCategoryModalTitle.textContent = `Delete "${cat.name}"?`;
    budgetCategoryModalText.textContent = "Existing transactions in this category will be moved to Other.";
    budgetCategoryModalInput.style.display = "none";
    budgetCategoryModalConfirm.textContent = "Delete";
budgetCategoryModalColor?.closest(".budgetCategoryColorRow")?.classList.add("hidden");
budgetCategoryModalBudgetWeek
  ?.closest(".budgetCategoryBudgetModalRow")
  ?.classList.add("hidden");
  }
}

function closeBudgetCategoryModal(){
  budgetCategoryModal?.classList.add("hidden");
  budgetCategoryModalMode = null;
  budgetCategoryModalCategoryId = null;
}

function deleteBudgetCategory(categoryId){
  if(!categoryId || categoryId === "other") return;
  openBudgetCategoryModal("delete", categoryId);
}

function actuallyDeleteBudgetCategory(categoryId){
  if(!categoryId || categoryId === "other") return;

  const cat = budgetCategories.find(c => c.id === categoryId);
  if(!cat) return;

  const before = snapshotBeforeChange();

  for(const dayKey of Object.keys(events)){
    const list = events[dayKey];
    if(!Array.isArray(list)) continue;

    events[dayKey] = list.map(ev => {
      if(ev.categoryId === categoryId){
        return { ...ev, categoryId: "other" };
      }

      return ev;
    });
  }

  budgetCategories = budgetCategories.filter(c => c.id !== categoryId);

  saveBudgetCategories();
  saveEvents(before);
  syncStateFromLegacy();

  if(budgetTxCategory?.value === categoryId){
    budgetTxCategory.value = "other";
  }

  renderBudgetCategoryOptions();
  renderBudgetCategoryManager();
renderBudgetTransactionCategoryFilter();
  renderBudgetPage();
  renderEventList();
  render();
}

function saveBudgetCategories(){
  localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify(budgetCategories));
  setLocalPayload({ updatedAt: Date.now(), budgetCategories });
  cloudWriteDebounced(["budgetCategories"]);
}

function getBudgetCategory(id){
  return budgetCategories.find(c => c.id === id) || budgetCategories[0];
}

function getCategoryBudget(cat, mode = budgetViewMode){
  return Number(cat?.budgets?.[mode] || 0);
}

function fillCategoryBudgetInputs(cat){
  if(budgetCategoryModalBudgetWeek){
    budgetCategoryModalBudgetWeek.value = cat?.budgets?.week ? String(cat.budgets.week) : "";
  }

  if(budgetCategoryModalBudgetMonth){
    budgetCategoryModalBudgetMonth.value = cat?.budgets?.month ? String(cat.budgets.month) : "";
  }

  if(budgetCategoryModalBudgetYear){
    budgetCategoryModalBudgetYear.value = cat?.budgets?.year ? String(cat.budgets.year) : "";
  }
}

function readCategoryBudgetInputs(){
  return {
    week: Math.max(0, Number(budgetCategoryModalBudgetWeek?.value || 0)),
    month: Math.max(0, Number(budgetCategoryModalBudgetMonth?.value || 0)),
    year: Math.max(0, Number(budgetCategoryModalBudgetYear?.value || 0))
  };
}

function setCategoryBudget(categoryId, amount, mode = budgetViewMode){
  const cat = budgetCategories.find(c => c.id === categoryId);
  if(!cat) return;

  cat.budgets = cat.budgets || { week:0, month:0, year:0 };
  cat.budgets[mode] = Math.max(0, Number(amount) || 0);

  saveBudgetCategories();
}

function renderBudgetCategoryOptions(){
  if(!budgetTxCategory || !budgetCatDDMenu || !budgetCatDDLabel) return;

  const currentId = budgetTxCategory.value || "other";
  const currentCat = getBudgetCategory(currentId);

  budgetTxCategory.value = currentCat.id;

budgetCatDDButton?.style.setProperty(
  "--cat-color",
  currentCat.color || "#7a5aff"
);

budgetCatDDButton?.style.setProperty(
  "--cat-glow",
  hexToRgba(currentCat.color || "#7a5aff", .35)
);
  budgetCatDDLabel.innerHTML = `
  <span
    class="budgetCategoryDot"
    style="
      --cat-color:${safeHexColor(currentCat.color, "#7a5aff")};
      --cat-glow:${hexToRgba(currentCat.color || "#7a5aff", .35)};
    "
  ></span>

  <span>${escapeHtml(currentCat.name)}</span>
`;

  budgetCatDDMenu.innerHTML = getSortedBudgetCategories().map(cat => `
  <button
    class="ddItem budgetCategoryDDItem"
    type="button"
    data-category-id="${escapeHtml(cat.id)}"
    aria-selected="${cat.id === currentCat.id ? "true" : "false"}"
  >
    <span
      class="budgetCategoryDot"
      style="
        --cat-color:${safeHexColor(cat.color, "#7a5aff")};
        --cat-glow:${hexToRgba(cat.color || "#7a5aff", .35)};
      "
    ></span>

    <span class="budgetCategoryDDText">
      ${escapeHtml(cat.name)}
    </span>
  </button>
`).join("");
}

function renderEventCategoryOptions(){
  if(!eventCategory || !eventCatDDMenu || !eventCatDDLabel) return;

  const currentId = eventCategory.value || "other";
  const currentCat = getBudgetCategory(currentId);

  eventCategory.value = currentCat.id;

  eventCatDDButton?.style.setProperty("--cat-color", currentCat.color || "#7a5aff");
  eventCatDDButton?.style.setProperty("--cat-glow", hexToRgba(currentCat.color || "#7a5aff", .35));

  eventCatDDLabel.innerHTML = `
    <span>${escapeHtml(currentCat.name)}</span>
  `;

  eventCatDDMenu.innerHTML = getSortedBudgetCategories().map(cat => `
    <button
      class="ddItem budgetCategoryDDItem"
      type="button"
      data-category-id="${escapeHtml(cat.id)}"
      aria-selected="${cat.id === currentCat.id ? "true" : "false"}"
    >
      <span
        class="budgetCategoryDot"
        style="
          --cat-color:${safeHexColor(cat.color, "#7a5aff")};
          --cat-glow:${hexToRgba(cat.color || "#7a5aff", .35)};
        "
      ></span>

      <span class="budgetCategoryDDText">${escapeHtml(cat.name)}</span>
    </button>
  `).join("");
}

function getCurrentBudgetPlan(range){
  const key = getBudgetPlanKey(range);
  return Number(budgetPlans?.[budgetViewMode]?.[key] || 0);
}

function setCurrentBudgetPlan(range, amount){
  const key = getBudgetPlanKey(range);

  if(!budgetPlans[budgetViewMode]){
    budgetPlans[budgetViewMode] = {};
  }

  budgetPlans[budgetViewMode][key] = Math.max(0, Number(amount) || 0);
  saveBudgetPlans();
}

function budgetRangeForMode(){
  const anchor = selectedDateISO ? ymdToDate(selectedDateISO) : new Date(view);

  if(budgetViewMode === "week"){
    const start = getStartOfWeek(anchor);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      title: "Weekly budget",
      startISO: dateToYmd(start),
      endISO: dateToYmd(end),
      group: "day"
    };
  }

  if(budgetViewMode === "year"){
    const y = anchor.getFullYear();

    return {
      title: "Yearly budget",
      startISO: isoDate(y, 1, 1),
      endISO: isoDate(y, 12, 31),
      group: "month"
    };
  }

  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);

  return {
    title: "Monthly budget",
    startISO: dateToYmd(start),
    endISO: dateToYmd(end),
    group: "day"
  };
}


// ============================================================================
// 08b. RECEIPT OCR (privacy-first, no receipt photo storage)
// ============================================================================
// The selected receipt image only exists in memory long enough to compress it,
// send it to the Supabase Edge Function, and prefill the transaction drawer.
// Do NOT save receipt images to localStorage, IndexedDB, Supabase Storage, or JSON.

const RECEIPT_SCAN_FUNCTION = "scan-receipt";
const MERCHANT_ALIASES_KEY = "myCalendarMerchantAliases_v1";
const RECEIPT_ITEM_MEMORY_KEY = "myCalendarReceiptItemCategoryMemory_v1";
const RECEIPT_MEMORY_LIMIT = 5000;
const MERCHANT_MEMORY_LIMIT = 1000;
const RECEIPT_TRAINING_RECORDS_KEY = "myCalendarReceiptTrainingRecords_v1";
const RECEIPT_TRAINING_RECORD_LIMIT = 2000;
const RECEIPT_NAIVE_BAYES_MIN_RECORDS = 6;
const RECEIPT_NAIVE_BAYES_MAX_FEATURES = 40;
const RECEIPT_NAIVE_BAYES_SCORE_SCALE = 24;
const RECEIPT_TRAINING_DEBUG_ENABLED = false;
let receiptScanBusy = false;
let currentReceiptScanDraft = null;
let merchantAliases = loadMerchantAliases();
let receiptItemCategoryMemory = loadReceiptItemCategoryMemory();
let receiptTrainingRecords = loadReceiptTrainingRecords();


function loadMerchantAliases(){
  try{
    const saved = JSON.parse(localStorage.getItem(MERCHANT_ALIASES_KEY));
    return saved && typeof saved === "object" ? saved : {};
  }catch{
    return {};
  }
}

function loadReceiptItemCategoryMemory(){
  try{
    const saved = JSON.parse(localStorage.getItem(RECEIPT_ITEM_MEMORY_KEY));
    return saved && typeof saved === "object" ? saved : {};
  }catch{
    return {};
  }
}

function loadReceiptTrainingRecords(){
  try{
    const saved = JSON.parse(localStorage.getItem(RECEIPT_TRAINING_RECORDS_KEY));
    return Array.isArray(saved) ? saved : [];
  }catch{
    return [];
  }
}

function persistReceiptTrainingRecords(){
  localStorage.setItem(
    RECEIPT_TRAINING_RECORDS_KEY,
    JSON.stringify(receiptTrainingRecords)
  );

  setLocalPayload({ updatedAt: Date.now(), receiptTrainingRecords });
  cloudWriteDebounced(["receiptTrainingRecords"]);
}


// ---------------------------------------------------------------------------
// Naive Bayes category classifier
// ---------------------------------------------------------------------------

function buildReceiptTrainingFeatures({ merchant = "", amount = 0, phrases = [] } = {}){
  const features = [];

  const merchantKey = normalizeMerchantKey(merchant);
  if(merchantKey){
    features.push(`merchant:${merchantKey}`);
  }

  const roundedAmount = Math.round(Number(amount || 0));

  if(roundedAmount > 0){
    if(roundedAmount < 10) features.push("amount:under_10");
    else if(roundedAmount < 25) features.push("amount:10_25");
    else if(roundedAmount < 50) features.push("amount:25_50");
    else if(roundedAmount < 100) features.push("amount:50_100");
    else features.push("amount:100_plus");
  }

  for(const phrase of phrases || []){
    if(!phrase) continue;

    features.push(`phrase:${phrase}`);

    for(const keyword of extractReceiptLearningKeywords(phrase)){
      features.push(`word:${keyword}`);
    }
  }

  return Array.from(new Set(features)).slice(0, 80);
}

function getReceiptNaiveBayesFeatureWeight(feature = ""){
  const f = String(feature || "");

  if(f.startsWith("merchant:")) return 2.4;
  if(f.startsWith("phrase:")) return 1.7;
  if(f.startsWith("word:")) return 1.0;
  if(f.startsWith("amount:")) return 0.45;

  return 1;
}

function getReceiptNaiveBayesFeatureList(features = []){
  return Array.from(
    new Set(
      (features || [])
        .map(f => String(f || "").toLowerCase().trim())
        .filter(Boolean)
    )
  ).slice(0, RECEIPT_NAIVE_BAYES_MAX_FEATURES);
}

function buildReceiptNaiveBayesModel(records = receiptTrainingRecords){
  const categories = {};
  const vocabulary = new Set();
  let recordCount = 0;

  for(const record of records || []){
    const categoryId = record?.finalCategoryId || "";

    if(!categoryId || categoryId === "other") continue;
    if(!getBudgetCategory(categoryId)) continue;

    const featureSource =
      Array.isArray(record.features) && record.features.length
        ? record.features
        : buildReceiptTrainingFeatures({
            merchant: record.merchant || "",
            amount: record.amount || 0,
            phrases: record.phrases || []
          });

    const features = getReceiptNaiveBayesFeatureList(featureSource);

    if(!features.length) continue;

    if(!categories[categoryId]){
      categories[categoryId] = {
        recordCount: 0,
        featureCounts: {}
      };
    }

    categories[categoryId].recordCount++;
    recordCount++;

    // Binary feature model: one feature can only count once per receipt.
    for(const feature of features){
      vocabulary.add(feature);

      categories[categoryId].featureCounts[feature] =
        Number(categories[categoryId].featureCounts[feature] || 0) + 1;
    }
  }

  return {
    recordCount,
    categoryCount: Object.keys(categories).length,
    categories,
    vocabulary,
    vocabularySize: vocabulary.size
  };
}

function normalizeNaiveBayesLogScores(rows = []){
  if(!rows.length) return [];

  const maxLog = Math.max(...rows.map(row => row.logScore));
  const expanded = rows.map(row => ({
    ...row,
    expScore: Math.exp(row.logScore - maxLog)
  }));

  const total = expanded.reduce((sum, row) => sum + row.expScore, 0) || 1;

  return expanded
    .map(row => ({
      ...row,
      probability: row.expScore / total
    }))
    .sort((a, b) => b.probability - a.probability);
}

function predictReceiptCategoryNaiveBayes(features = [], opts = {}){
  const model = buildReceiptNaiveBayesModel();

  const allowTinyModel = !!opts.allowTinyModel;

  if(
    !allowTinyModel &&
    (
      model.recordCount < RECEIPT_NAIVE_BAYES_MIN_RECORDS ||
      model.categoryCount < 2
    )
  ){
    return {
      ready: false,
      reason: `Needs at least ${RECEIPT_NAIVE_BAYES_MIN_RECORDS} training records and 2 categories.`,
      model
    };
  }

  const inputFeatures = getReceiptNaiveBayesFeatureList(features)
    .filter(feature => model.vocabulary.has(feature));

  if(!inputFeatures.length){
    return {
      ready: false,
      reason: "No known Naive Bayes features matched this receipt.",
      model
    };
  }

  const totalRecords = Math.max(1, model.recordCount);
  const categoryIds = Object.keys(model.categories);
  const categoryCount = Math.max(1, categoryIds.length);

  const rows = [];

  for(const categoryId of categoryIds){
    const categoryModel = model.categories[categoryId];
    const categoryRecordCount = Math.max(1, Number(categoryModel.recordCount || 0));

    // Smoothed prior: P(category)
    let logScore = Math.log(
      (categoryRecordCount + 1) / (totalRecords + categoryCount)
    );

    const featureDetails = [];

    for(const feature of inputFeatures){
      const hitCount = Number(categoryModel.featureCounts?.[feature] || 0);

      // Laplace smoothing. Prevents one missing word from destroying the score.
      const probability = (hitCount + 1) / (categoryRecordCount + 2);
      const weight = getReceiptNaiveBayesFeatureWeight(feature);
      const contribution = Math.log(probability) * weight;

      logScore += contribution;

      featureDetails.push({
        feature,
        hitCount,
        probability,
        weight,
        contribution
      });
    }

    rows.push({
      categoryId,
      categoryName: getBudgetCategory(categoryId)?.name || "Category",
      logScore,
      featureDetails
    });
  }

  const probabilities = normalizeNaiveBayesLogScores(rows);
  const best = probabilities[0];

  if(!best){
    return {
      ready: false,
      reason: "Naive Bayes could not produce a winner.",
      model
    };
  }

  const scoreMap = new Map();

  for(const row of probabilities){
    scoreMap.set(
      row.categoryId,
      Math.round(row.probability * RECEIPT_NAIVE_BAYES_SCORE_SCALE * 100) / 100
    );
  }

  return {
    ready: true,
    model,
    features: inputFeatures,
    categoryId: best.categoryId,
    categoryName: best.categoryName,
    confidence: Math.round(best.probability * 100),
    probabilities,
    scoreMap
  };
}

function getReceiptNaiveBayesSummary(prediction = {}){
  if(!prediction.ready || !Array.isArray(prediction.probabilities)) return "";

  return prediction.probabilities
    .slice(0, 3)
    .map(row => `${row.categoryName} ${Math.round(row.probability * 100)}%`)
    .join(", ");
}


// ---------------------------------------------------------------------------
// Training data capture & text parsing
// ---------------------------------------------------------------------------

function saveReceiptTrainingRecordFromDraft(finalTransaction = {}){
  if(!currentReceiptScanDraft) return;

  const rawText = currentReceiptScanDraft.rawText || "";
  const finalCategoryId = finalTransaction.categoryId || "other";

  if(!rawText || !finalCategoryId || finalCategoryId === "other") return;

  const predictedCategoryId =
  currentReceiptScanDraft.predictedCategoryId ||
  Object.entries(currentReceiptScanDraft.categoryScores || {})
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ||
  "";

  const phrases = extractReceiptLearningPhrases(rawText)
  .filter(isUsefulReceiptTrainingPhrase)
  .slice(0, 20);
const merchant = finalTransaction.title || currentReceiptScanDraft.normalizedMerchant || "";
const amount = Math.abs(Number(finalTransaction.price || currentReceiptScanDraft.amount || 0));
const features = buildReceiptTrainingFeatures({ merchant, amount, phrases });
const trainingDebug = RECEIPT_TRAINING_DEBUG_ENABLED
  ? buildReceiptTrainingDebugRows(rawText)
  : [];

  const record = {
    id: cryptoId(),
    createdAt: Date.now(),

    merchant,
amount,

features,
featureCount: features.length,
    rawMerchant: currentReceiptScanDraft.rawMerchant || "",
    date: finalTransaction.startDate || currentReceiptScanDraft.date || "",

trainingDebug,
trainingDebugCount: trainingDebug.length,

    phrases,
    phraseCount: phrases.length,

    predictedCategoryId,
predictionSource: currentReceiptScanDraft.predictionSource || "",
naiveBayesPrediction: currentReceiptScanDraft.naiveBayesPrediction || null,
    finalCategoryId,
    predictionWasCorrect: !!predictedCategoryId && predictedCategoryId === finalCategoryId,

    confidence: Number(currentReceiptScanDraft.categoryConfidence || 0)
  };

  receiptTrainingRecords.push(record);

  if(receiptTrainingRecords.length > RECEIPT_TRAINING_RECORD_LIMIT){
    receiptTrainingRecords = receiptTrainingRecords.slice(
      receiptTrainingRecords.length - RECEIPT_TRAINING_RECORD_LIMIT
    );
  }

  persistReceiptTrainingRecords();
}

function persistReceiptItemCategoryMemory(){
  localStorage.setItem(
    RECEIPT_ITEM_MEMORY_KEY,
    JSON.stringify(receiptItemCategoryMemory)
  );

  setLocalPayload({ updatedAt: Date.now(), receiptItemCategoryMemory });
  cloudWriteDebounced(["receiptItemCategoryMemory"]);
}

function normalizeReceiptTrainingText(text = ""){
  return String(text || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\w\s.$:#@/'%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeReceiptItemPhrase(line = ""){
  let phrase = normalizeReceiptTrainingText(line);

  phrase = phrase
    // Remove money amounts like $33.21 or 33.21
    .replace(/\$?\d{1,5}(?:,\d{3})*\.\d{2}\b/g, " ")

    // Remove common quantity/unit chunks like 16 oz, 2 ct, 8.696 gal
    .replace(/\b\d+(?:\.\d+)?\s*(ct|oz|lb|lbs|gal|gals|gallon|gallons|ml|l|ea|pk|pack|qty)\b/g, " ")

    // Remove common receipt IDs
    .replace(/\b(upc|sku|tc|op|te|tr|ref|auth|aid|tvr|iad|tsi|arc|term|terminal|invoice|trace|site)\s*#?\s*[a-z0-9-]*\b/g, " ")

    // Remove standalone numbers after the meaningful ID/unit cleanup
    .replace(/\b\d+\b/g, " ")

    .replace(/[^\w\s&'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if(!phrase || phrase.length < 3 || phrase.length > 42) return "";

  const words = phrase.split(/\s+/).filter(Boolean);

  return words.slice(0, 5).join(" ");
}

const RECEIPT_LEARNING_STOPWORDS = new Set([
  "the", "and", "with", "for", "you", "your", "our", "are",
  "this", "that", "from", "have", "has", "had", "was", "were",
  "here", "there", "please", "thanks", "thank",

  "qty", "item", "items", "sale", "regular", "small", "large",
  "medium", "fresh", "hot", "cold", "new", "old",

  "each", "unit", "price", "amount", "total", "subtotal",
  "tax", "tip", "cash", "card"
]);

const RECEIPT_TRAINING_NOISE_WORDS = new Set([
  // Payment/card terminal
  "auth", "authorization", "approved", "approval", "aid", "tvr",
  "iad", "tsi", "arc", "terminal", "term", "trace", "invoice",
  "site", "merchant", "merch", "entry", "method", "issuer",
  "application", "contactless", "chip", "swipe", "pin",

  // Tender/payment
  "card", "cards", "debit", "credit", "visa", "mastercard",
  "amex", "discover", "cash", "change", "tender", "balance",

  // Receipt structure
  "receipt", "transaction", "trans", "txn", "register", "reg",
  "cashier", "clerk", "server", "order", "store", "terminal",

  // Totals/fees
  "subtotal", "total", "tax", "tip", "tips", "gratuity",
  "discount", "change", "amount", "paid", "due",

  // Address/contact
  "street", "st", "road", "rd", "avenue", "ave", "blvd",
  "boulevard", "drive", "dr", "lane", "ln", "highway", "hwy",
  "suite", "ste", "unit", "apt", "phone", "tel", "fax",

  // Promo/footer
  "survey", "reward", "rewards", "coupon", "promo", "offer",
  "download", "app", "visit", "website", "customer", "service",

  // Gas/quantity labels that are usually not item names by themselves
  "product", "price", "qty", "quantity", "net", "gal", "gals"
]);

const RECEIPT_PRODUCT_SIGNAL_WORDS = new Set([
  // Gas / auto
  "fuel", "gas", "unleaded", "diesel", "premium", "regular",
  "pump", "oil", "tire", "tires", "auto",

  // Food / grocery
  "grocery", "market", "produce", "milk", "bread", "eggs",
  "cheese", "chicken", "beef", "pork", "fish", "rice", "pasta",
  "pizza", "burger", "sandwich", "coffee", "tea", "soda",
  "water", "juice", "apple", "banana", "orange",

  // Household / retail
  "soap", "detergent", "towel", "paper", "trash", "battery",
  "batteries", "hardware", "clothing", "shirt", "pants",

  // Health
  "pharmacy", "medicine", "medication", "vitamin", "rx"
]);

function receiptTokens(text = ""){
  return normalizeReceiptTrainingText(text)
    .split(/\s+/)
    .map(t => t.replace(/[^a-z0-9'-]/g, ""))
    .filter(Boolean);
}

function isReceiptTrainingItemSectionStart(line = ""){
  const p = normalizeReceiptTrainingText(line);

  return (
    /^\s*(item|items|product|products|description|descriptions)\s*:?\s*$/.test(p) ||
    /\b(item|product|description)\s*[:#]\b/.test(p)
  );
}

function isReceiptTrainingHardStopLine(line = ""){
  const p = normalizeReceiptTrainingText(line);

  return (
    /\b(sub\s*total|subtotal|total|net total|grand total|tax|tip|gratuity|balance|amount due|change due)\b/.test(p) ||
    /\b(card amt|card amount|payment|tender|cash|credit|debit|approved|approval|auth|pin used)\b/.test(p) ||
    /\b(thank you|customer service|survey|reward|rewards|coupon|download|visit us|tell us|save on)\b/.test(p)
  );
}

function lineLooksLikeReceiptItem(line = ""){
  const p = normalizeReceiptTrainingText(line);

  if(!p || isReceiptTrainingHardStopLine(p)) return false;
  if(isReceiptBoilerplatePhrase(p)) return false;

  return (
    /\$?\d{1,5}(?:,\d{3})*\.\d{2}\b/.test(p) ||
    /\b\d+(?:\.\d+)?\s*(ct|oz|lb|lbs|gal|gals|ml|l|ea|pk|pack)\b/.test(p) ||
    RECEIPT_PRODUCT_SIGNAL_WORDS.has(p)
  );
}

function isReceiptBoilerplatePhrase(phrase = ""){
  const p = normalizeReceiptTrainingText(phrase);
  if(!p || p.length < 3) return true;

  const tokens = receiptTokens(p);
  if(!tokens.length) return true;

  // Mostly numbers, punctuation, receipt separators, or money.
  if(/^[\d\s.$:#*%-]+$/.test(p)) return true;

  // URLs/domains, including OCR-mangled "murphyusa com".
  if(/\b(?:www\s*)?[a-z0-9-]{3,}\s*(?:\.|\sdot\s)\s*(com|net|org|gov|edu|co)\b/.test(p)) return true;
  if(/\b[a-z0-9-]{4,}\s+(com|net|org|gov|edu)\b/.test(p)) return true;

  // Email-ish strings.
  if(/\b[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}\b/.test(p)) return true;

  // Phone numbers.
  if(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(p)) return true;
  if(/\b\d[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(p)) return true;

  // Long IDs / approval codes / hex-ish payment fields.
  if(/\b[a-f0-9]{8,}\b/i.test(p)) return true;
  if(/\b[a-z]{1,5}\s*[a-f0-9]{6,}\b/i.test(p)) return true;

  // Zip codes / long standalone numbers, unless the line clearly has product-unit context.
  if(/\b\d{5}(?:-\d{4})?\b/.test(p)) return true;

  const digitCount = (p.match(/\d/g) || []).length;
  const hasUnitContext = /\b(ct|oz|lb|lbs|gal|gals|ml|l|ea|pk|pack)\b/.test(p);
  if(digitCount >= 5 && !hasUnitContext) return true;

  // Address lines.
  if(/\b(street|road|avenue|blvd|boulevard|drive|lane|highway|suite|unit|apt)\b/.test(p)) return true;
  if(/\b(st|rd|ave|dr|ln|hwy|ste)\b/.test(p) && tokens.length <= 5) return true;

  // Promo/footer lines are often long sentences, not category clues.
  if(tokens.length > 6) return true;

  // Lines made only of receipt-control words.
  if(tokens.every(t =>
    RECEIPT_LEARNING_STOPWORDS.has(t) ||
    RECEIPT_TRAINING_NOISE_WORDS.has(t)
  )){
    return true;
  }

  // Any phrase heavily dominated by receipt-control words is probably not useful.
  const noiseCount = tokens.filter(t =>
    RECEIPT_TRAINING_NOISE_WORDS.has(t)
  ).length;

  if(tokens.length <= 3 && noiseCount >= 1 && noiseCount === tokens.length){
    return true;
  }

  if(tokens.length >= 3 && noiseCount / tokens.length >= 0.6){
    return true;
  }

  return false;
}

function getReceiptPhraseBaseWeight(phrase = ""){
  const words = String(phrase || "").split(/\s+/).filter(Boolean);

  if(words.length >= 3) return 2.25;
  if(words.length === 2) return 1.65;
  return 1;
}

function isUsefulReceiptTrainingPhrase(phrase = ""){
  const p = normalizeReceiptTrainingText(phrase);
  if(!p || p.length < 3) return false;

  if(isReceiptBoilerplatePhrase(p)) return false;

  const tokens = receiptTokens(p);

  const usefulTokens = tokens.filter(t =>
    t.length >= 3 &&
    !RECEIPT_LEARNING_STOPWORDS.has(t) &&
    !RECEIPT_TRAINING_NOISE_WORDS.has(t) &&
    !/^\d+$/.test(t)
  );

  if(!usefulTokens.length) return false;

  const hasProductSignal = usefulTokens.some(t =>
    RECEIPT_PRODUCT_SIGNAL_WORDS.has(t)
  );

  // Single useful words are okay if they are strong, like "unleaded", "pump", "alfredo".
  if(usefulTokens.length === 1){
    return usefulTokens[0].length >= 4 || hasProductSignal;
  }

  // Multi-word item names are usually useful unless caught by boilerplate rules.
  return true;
}

function extractReceiptLearningKeywords(phrase = ""){
  return receiptTokens(phrase)
    .filter(word =>
      word.length >= 4 &&
      !RECEIPT_LEARNING_STOPWORDS.has(word) &&
      !RECEIPT_TRAINING_NOISE_WORDS.has(word) &&
      !/^\d+$/.test(word) &&
      !isReceiptBoilerplatePhrase(word)
    )
    .slice(0, 5);
}

function receiptLineHasMoney(line = ""){
  return /\$?\d{1,5}(?:,\d{3})*\.\d{2}\b/.test(
    normalizeReceiptTrainingText(line)
  );
}

function receiptLineHasUnit(line = ""){
  return /\b\d+(?:\.\d+)?\s*(ct|oz|lb|lbs|gal|gals|gallon|gallons|ml|l|ea|pk|pack)\b/.test(
    normalizeReceiptTrainingText(line)
  );
}

function receiptLineHasProductSignal(line = ""){
  const tokens = receiptTokens(line);

  return tokens.some(t => RECEIPT_PRODUCT_SIGNAL_WORDS.has(t));
}

function scoreReceiptTrainingLine(rawLine = "", context = {}){
  const cleanLine = normalizeReceiptTrainingText(rawLine);
  const phrase = normalizeReceiptItemPhrase(rawLine);
  const phraseTokens = receiptTokens(phrase);
  const lineTokens = receiptTokens(cleanLine);

  let score = 0;
  const reasons = [];

  const add = (points, reason) => {
    score += points;
    reasons.push(`${points > 0 ? "+" : ""}${points} ${reason}`);
  };

  if(!cleanLine){
    return {
      rawLine,
      cleanLine,
      phrase: "",
      score: -999,
      keep: false,
      hardStop: false,
      sectionStart: false,
      reasons: ["empty line"]
    };
  }

  if(isReceiptTrainingItemSectionStart(cleanLine)){
    return {
      rawLine,
      cleanLine,
      phrase: "",
      score: 0,
      keep: false,
      hardStop: false,
      sectionStart: true,
      reasons: ["item/product section marker"]
    };
  }

  if(isReceiptTrainingHardStopLine(cleanLine)){
    return {
      rawLine,
      cleanLine,
      phrase: "",
      score: -999,
      keep: false,
      hardStop: true,
      sectionStart: false,
      reasons: ["totals/payment/footer stop line"]
    };
  }

  const hasMoney = receiptLineHasMoney(cleanLine);
  const hasUnit = receiptLineHasUnit(cleanLine);
  const hasProductSignal = receiptLineHasProductSignal(cleanLine);
  const boilerplateLine = isReceiptBoilerplatePhrase(cleanLine);
  const boilerplatePhrase = phrase ? isReceiptBoilerplatePhrase(phrase) : true;

  const usefulTokens = phraseTokens.filter(t =>
    t.length >= 3 &&
    !RECEIPT_LEARNING_STOPWORDS.has(t) &&
    !RECEIPT_TRAINING_NOISE_WORDS.has(t) &&
    !/^\d+$/.test(t)
  );

  const noiseCount = phraseTokens.filter(t =>
    RECEIPT_LEARNING_STOPWORDS.has(t) ||
    RECEIPT_TRAINING_NOISE_WORDS.has(t)
  ).length;

  if(context.inItemZone) add(2, "inside item/product area");
  if(context.afterFirstKept) add(1, "after first useful item clue");

  if(context.headerWindow){
    add(-4, "top/header area");
  }

  if(hasMoney){
    add(1, "has money amount");
  }

  if(hasUnit){
    add(2, "has quantity/unit");
  }

  if(hasProductSignal){
    add(5, "has product/category signal");
  }

  if(usefulTokens.length){
    add(Math.min(3, usefulTokens.length), "has useful words");
  }

  if(boilerplateLine){
    add(-8, "line looks like boilerplate");
  }

  if(boilerplatePhrase){
    add(-5, "phrase looks like boilerplate");
  }

  if(phraseTokens.length && noiseCount / phraseTokens.length >= 0.5){
    add(-4, "mostly receipt-control words");
  }

  if(!phrase){
    add(-8, "no clean phrase");
  }

  if(!usefulTokens.length && !hasProductSignal){
    add(-8, "no useful signal");
  }

  const keep =
    !!phrase &&
    score >= 4 &&
    !boilerplatePhrase &&
    (
      hasProductSignal ||
      (context.inItemZone && usefulTokens.length > 0) ||
      (hasMoney && usefulTokens.length > 0)
    );

  return {
    rawLine,
    cleanLine,
    phrase,
    score,
    keep,
    hardStop: false,
    sectionStart: false,
    reasons
  };
}

function buildReceiptTrainingDebugRows(rawText = ""){
  const rows = [];

  const rawLines = String(rawText || "")
    .split(/\n+/)
    .map(cleanReceiptLine)
    .filter(Boolean);

  let inItemZone = false;
  let afterFirstKept = false;
  let stopped = false;

  for(let i = 0; i < rawLines.length; i++){
    const rawLine = rawLines[i];

    if(stopped){
      rows.push({
        line: i,
        keep: false,
        score: "",
        phrase: "",
        rawLine,
        reasons: "after totals/payment/footer stop"
      });
      continue;
    }

    const result = scoreReceiptTrainingLine(rawLine, {
      inItemZone,
      afterFirstKept,
      headerWindow: i < 6 && !inItemZone
    });

    rows.push({
      line: i,
      keep: !!result.keep,
      score: result.score,
      phrase: result.phrase || "",
      rawLine: result.rawLine || rawLine,
      reasons: result.reasons.join(" | ")
    });

    if(result.sectionStart){
      inItemZone = true;
      continue;
    }

    if(result.hardStop){
      if(afterFirstKept || inItemZone){
        stopped = true;
      }
      continue;
    }

    if(result.keep){
      afterFirstKept = true;
    }
  }

  return rows;
}

// Strip payment-card, loyalty, account, and other identifying fragments from a
// receipt line before it is stored in learning memory or synced to the cloud.
// Returns "" when the whole phrase should be dropped.
const RECEIPT_SENSITIVE_KEYWORDS = /\b(visa|mastercard|master\s*card|amex|american\s*express|discover|debit|credit|card|acct|account|member(ship)?|loyalty|rewards?|rx|auth(orization)?|approval|approv(ed)?|ref(erence)?|invoice|trans(action)?\s*(id|no|num)|terminal|cashier|register)\b/i;
function redactReceiptPhrase(phrase = ""){
  let text = String(phrase || "");
  if(RECEIPT_SENSITIVE_KEYWORDS.test(text)) return "";
  // Long digit runs (4+) are card fragments, phone numbers, SKUs, or account
  // numbers — never useful category signal. Remove them, keep the words.
  text = text.replace(/\d{4,}/g, " ").replace(/\s{2,}/g, " ").trim();
  return text.length >= 3 ? text : "";
}

function extractReceiptLearningPhrases(rawText = ""){
  const seen = new Set();
  const phrases = [];

  const rawLines = String(rawText || "")
    .split(/\n+/)
    .map(cleanReceiptLine)
    .filter(Boolean);

  let inItemZone = false;
  let afterFirstKept = false;

  for(let i = 0; i < rawLines.length; i++){
    const rawLine = rawLines[i];

    const result = scoreReceiptTrainingLine(rawLine, {
      inItemZone,
      afterFirstKept,
      headerWindow: i < 6 && !inItemZone
    });

    if(result.sectionStart){
      inItemZone = true;
      continue;
    }

    if(result.hardStop){
      if(afterFirstKept || inItemZone) break;
      continue;
    }

    if(!result.keep) continue;

    const redactedPhrase = redactReceiptPhrase(result.phrase);
    if(!redactedPhrase) continue;
    if(seen.has(redactedPhrase)) continue;

    seen.add(redactedPhrase);
    phrases.push(redactedPhrase);
    afterFirstKept = true;

    if(phrases.length >= 40) break;
  }

  return phrases;
}

function debugReceiptTrainingExtraction(rawText = currentReceiptScanDraft?.rawText || ""){
  if(!rawText){
    console.warn("Scan a receipt first, then run debugReceiptTrainingExtraction() before clicking Add.");
    return [];
  }

  const rows = [];
  const rawLines = String(rawText || "")
    .split(/\n+/)
    .map(cleanReceiptLine)
    .filter(Boolean);

  let inItemZone = false;
  let afterFirstKept = false;
  let stopped = false;

  for(let i = 0; i < rawLines.length; i++){
    const rawLine = rawLines[i];

    if(stopped){
      rows.push({
        line: i,
        keep: false,
        score: "",
        phrase: "",
        rawLine,
        reasons: "after totals/payment/footer stop"
      });
      continue;
    }

    const result = scoreReceiptTrainingLine(rawLine, {
      inItemZone,
      afterFirstKept,
      headerWindow: i < 6 && !inItemZone
    });

    rows.push({
      line: i,
      keep: result.keep,
      score: result.score,
      phrase: result.phrase,
      rawLine: result.rawLine,
      reasons: result.reasons.join(" | ")
    });

    if(result.sectionStart){
      inItemZone = true;
      continue;
    }

    if(result.hardStop){
      if(afterFirstKept || inItemZone){
        stopped = true;
      }
      continue;
    }

    if(result.keep){
      afterFirstKept = true;
    }
  }

  console.table(rows);
  return rows;
}


// ---------------------------------------------------------------------------
// Category memory scoring & cleanup
// ---------------------------------------------------------------------------

function getReceiptMemoryCategoryScores(text = ""){
  const lower = String(text || "").toLowerCase();
  const scores = new Map();

  for(const [phrase, memory] of Object.entries(receiptItemCategoryMemory || {})){
    if(!phrase) continue;

    const isWordMemory = phrase.startsWith("word:");
    const needle = isWordMemory ? phrase.replace("word:", "") : phrase;

    if(!lower.includes(needle)) continue;

    const categories = memory?.categories || {};

    for(const [categoryId, meta] of Object.entries(categories)){
      const cat = getBudgetCategory(categoryId);
      if(!cat) continue;

      const weight = Number(meta?.weight || 0);
      const count = Number(meta?.count || 0);
      const successful = Number(meta?.successfulPredictionCount || 0);
      const corrections = Number(meta?.correctionCount || 0);

      const rawScore =
        weight +
        (count * 0.4) +
        (successful * 2) -
        (corrections * 3);

      if(rawScore <= 0) continue;

      const boost = isWordMemory
        ? Math.min(7, rawScore)
        : Math.min(16, rawScore);

      scores.set(categoryId, (scores.get(categoryId) || 0) + boost);
    }
  }

  return scores;
}

function getReceiptCategoryMemoryScore(meta = {}){
  return (
    Number(meta.weight || 0) +
    (Number(meta.correctionCount || 0) * 5) +
    (Number(meta.successfulPredictionCount || 0) * 2)
  );
}

function getReceiptMemoryTotalScore(memory = {}){
  return Object.values(memory.categories || {})
    .reduce((sum, meta) => sum + getReceiptCategoryMemoryScore(meta), 0);
}

function pruneReceiptItemCategoryMemory(){
  const entries = Object.entries(receiptItemCategoryMemory || {});

  if(entries.length <= RECEIPT_MEMORY_LIMIT) return;

  entries.sort((a, b) => {
    const scoreDiff =
      getReceiptMemoryTotalScore(b[1]) -
      getReceiptMemoryTotalScore(a[1]);

    if(scoreDiff) return scoreDiff;

    return Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0);
  });

  receiptItemCategoryMemory = Object.fromEntries(
    entries.slice(0, RECEIPT_MEMORY_LIMIT)
  );
}

function getMerchantAliasScore(alias = {}){
  const statsScore = Object.values(alias.categoryStats || {}).reduce((sum, stat) => {
    return sum +
      Number(stat.weight || 0) +
      (Number(stat.count || 0) * 2);
  }, 0);

  return (
    statsScore +
    (Number(alias.useCount || 0) * 3) +
    (Number(alias.correctionCount || 0) * 5)
  );
}

function pruneMerchantAliases(){
  const entries = Object.entries(merchantAliases || {});

  if(entries.length <= MERCHANT_MEMORY_LIMIT) return;

  entries.sort((a, b) => {
    const scoreDiff = getMerchantAliasScore(b[1]) - getMerchantAliasScore(a[1]);
    if(scoreDiff) return scoreDiff;

    return Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0);
  });

  merchantAliases = Object.fromEntries(entries.slice(0, MERCHANT_MEMORY_LIMIT));
  saveMerchantAliases();
}

function learnReceiptItemCategoryWeights(rawText = "", categoryId = "other"){
  const cat = getBudgetCategory(categoryId);
  if(!cat || !categoryId || categoryId === "other") return;

  const phrases = extractReceiptLearningPhrases(rawText);
  if(!phrases.length) return;

  for(const phrase of phrases){
    const baseWeight = getReceiptPhraseBaseWeight(phrase);

    const existing = receiptItemCategoryMemory[phrase] || {
      phrase,
      createdAt: Date.now(),
      categories: {}
    };

    const catMemory = existing.categories[categoryId] || {
      count: 0,
      weight: 0,
      firstSeenAt: Date.now()
    };

    existing.categories[categoryId] = {
      ...catMemory,
      count: Number(catMemory.count || 0) + 1,
      weight: Math.min(30, Number(catMemory.weight || 0) + baseWeight),
      lastSeenAt: Date.now()
    };

    existing.updatedAt = Date.now();
    receiptItemCategoryMemory[phrase] = existing;
    // Also learn strong individual words inside the phrase.
    // Example: "chicken alfredo" teaches both the phrase and "alfredo".
    for(const keyword of extractReceiptLearningKeywords(phrase)){
      const keywordKey = `word:${keyword}`;

      const wordExisting = receiptItemCategoryMemory[keywordKey] || {
        phrase: keywordKey,
        displayWord: keyword,
        createdAt: Date.now(),
        categories: {}
      };

      const wordMemory = wordExisting.categories[categoryId] || {
        count: 0,
        weight: 0,
        firstSeenAt: Date.now()
      };

      wordExisting.categories[categoryId] = {
        ...wordMemory,
        count: Number(wordMemory.count || 0) + 1,
        weight: Math.min(20, Number(wordMemory.weight || 0) + 1.4),
        lastSeenAt: Date.now()
      };

      wordExisting.updatedAt = Date.now();
      receiptItemCategoryMemory[keywordKey] = wordExisting;
    }
  }

  pruneReceiptItemCategoryMemory();

  persistReceiptItemCategoryMemory();
}

function mergeReceiptCategoryScoreMap(target, source){
  for(const [categoryId, score] of source.entries()){
    target.set(categoryId, (target.get(categoryId) || 0) + score);
  }

  return target;
}

function getReceiptMerchantCategoryScores(merchant = ""){
  const key = normalizeMerchantKey(merchant);
  const scores = new Map();

  if(!key) return scores;

  const alias = merchantAliases[key];
  const stats = alias?.categoryStats || {};

  for(const [categoryId, stat] of Object.entries(stats)){
    const weight = Number(stat?.weight || 0);
    const count = Number(stat?.count || 0);
    const successful = Number(stat?.successfulPredictionCount || 0);
    const corrections = Number(stat?.correctionCount || 0);

    const score =
      weight +
      (count * 0.5) +
      (successful * 2) -
      (corrections * 3);

    if(score <= 0) continue;

    scores.set(categoryId, Math.min(18, score));
  }

  return scores;
}

function learnReceiptMerchantCategoryWeights(
  merchant = "",
  categoryId = "other",
  predictedCategoryId = ""
){
  if(!merchant || !categoryId || categoryId === "other") return;

  const cat = getBudgetCategory(categoryId);
  if(!cat) return;

  const key = normalizeMerchantKey(merchant);
  if(!key || !isSafeMapKey(key)) return;

  const predictionWasCorrect =
    predictedCategoryId && predictedCategoryId === categoryId;

  const existing = merchantAliases[key] || {
    rawName: merchant,
    normalizedName: merchant,
    createdAt: Date.now(),
    useCount: 0
  };

  const categoryStats = existing.categoryStats || {};
  const stat = categoryStats[categoryId] || {
    count: 0,
    weight: 0,
    successfulPredictionCount: 0,
    correctionCount: 0,
    firstSeenAt: Date.now()
  };

  categoryStats[categoryId] = {
    ...stat,
    count: Number(stat.count || 0) + 1,
    weight: Math.min(40, Number(stat.weight || 0) + 2.5),
    successfulPredictionCount:
      Number(stat.successfulPredictionCount || 0) + (predictionWasCorrect ? 1 : 0),
    correctionCount:
      Number(stat.correctionCount || 0) + (predictionWasCorrect ? 0 : 1),
    lastOutcomeAt: Date.now(),
    lastSeenAt: Date.now()
  };

  merchantAliases[key] = {
    ...existing,
    normalizedName: existing.normalizedName || merchant,
    categoryStats,
    updatedAt: Date.now()
  };

  saveMerchantAliases();
  pruneMerchantAliases?.();
}
function weakenReceiptWrongCategory(rawText = "", wrongCategoryId = ""){
  if(!rawText || !wrongCategoryId || wrongCategoryId === "other") return;

  const phrases = extractReceiptLearningPhrases(rawText);

  for(const phrase of phrases){
    const memory = receiptItemCategoryMemory[phrase];
    const catMemory = memory?.categories?.[wrongCategoryId];

    if(catMemory){
      catMemory.weight = Math.max(0, Number(catMemory.weight || 0) - 1.25);
      catMemory.lastWeakenedAt = Date.now();
    }

    for(const keyword of extractReceiptLearningKeywords(phrase)){
      const wordKey = `word:${keyword}`;
      const wordMemory = receiptItemCategoryMemory[wordKey]?.categories?.[wrongCategoryId];

      if(wordMemory){
        wordMemory.weight = Math.max(0, Number(wordMemory.weight || 0) - 0.7);
        wordMemory.lastWeakenedAt = Date.now();
      }
    }
  }

  persistReceiptItemCategoryMemory();
}

function cleanupReceiptLearningMemory(){
  for(const [phrase, memory] of Object.entries(receiptItemCategoryMemory || {})){
    for(const [categoryId, meta] of Object.entries(memory.categories || {})){
      if(Number(meta?.weight || 0) <= 0){
        delete memory.categories[categoryId];
      }
    }

    if(!Object.keys(memory.categories || {}).length){
      delete receiptItemCategoryMemory[phrase];
    }
  }

  for(const [merchantKey, alias] of Object.entries(merchantAliases || {})){
    for(const [categoryId, stat] of Object.entries(alias.categoryStats || {})){
      if(Number(stat?.weight || 0) <= 0){
        delete alias.categoryStats[categoryId];
      }
    }

    if(alias.categoryStats && !Object.keys(alias.categoryStats).length){
      delete alias.categoryStats;
    }
  }

  persistReceiptItemCategoryMemory();
  saveMerchantAliases();
}

function markReceiptPredictionOutcome(rawText = "", predictedCategoryId = "", actualCategoryId = ""){
  if(!rawText || !actualCategoryId || actualCategoryId === "other") return;

  const predictionWasCorrect =
    predictedCategoryId && predictedCategoryId === actualCategoryId;

  const phrases = extractReceiptLearningPhrases(rawText);

  for(const phrase of phrases){
    const memory = receiptItemCategoryMemory[phrase];
    const actualMemory = memory?.categories?.[actualCategoryId];

    if(actualMemory){
      if(predictionWasCorrect){
        actualMemory.successfulPredictionCount =
          Number(actualMemory.successfulPredictionCount || 0) + 1;
      }else{
        actualMemory.correctionCount =
          Number(actualMemory.correctionCount || 0) + 1;
      }

      actualMemory.lastOutcomeAt = Date.now();
    }

    for(const keyword of extractReceiptLearningKeywords(phrase)){
      const wordKey = `word:${keyword}`;
      const wordMemory = receiptItemCategoryMemory[wordKey]?.categories?.[actualCategoryId];

      if(wordMemory){
        if(predictionWasCorrect){
          wordMemory.successfulPredictionCount =
            Number(wordMemory.successfulPredictionCount || 0) + 1;
        }else{
          wordMemory.correctionCount =
            Number(wordMemory.correctionCount || 0) + 1;
        }

        wordMemory.lastOutcomeAt = Date.now();
      }
    }
  }
}

function learnReceiptCategoryFromCurrentDraft(categoryId){
  if(!currentReceiptScanDraft) return;

  const predictedCategoryId =
    Object.entries(currentReceiptScanDraft.categoryScores || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];

  if(predictedCategoryId && predictedCategoryId !== categoryId){
    weakenReceiptWrongCategory(currentReceiptScanDraft.rawText || "", predictedCategoryId);
  }

  learnReceiptItemCategoryWeights(currentReceiptScanDraft.rawText || "", categoryId);

markReceiptPredictionOutcome(
  currentReceiptScanDraft.rawText || "",
  predictedCategoryId,
  categoryId
);

  learnReceiptMerchantCategoryWeights(
  currentReceiptScanDraft.normalizedMerchant || currentReceiptScanDraft.rawMerchant || "",
  categoryId,
  predictedCategoryId
);

cleanupReceiptLearningMemory();
}


// ---------------------------------------------------------------------------
// Merchant name normalization & aliases
// ---------------------------------------------------------------------------

function normalizeMerchantKey(name = ""){
  return String(name || "")
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1|]/g, "l")
    .replace(/[5]/g, "s")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(store|restaurant|gourmet|burgers?|supercenter|location|inc|llc|ltd|co|company|the)\b/g, " ")
    .replace(/\b(no|#)\s*\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseMerchantName(name = ""){
  return String(name || "")
    .toLowerCase()
    .replace(/\b\w/g, ch => ch.toUpperCase())
    .replace(/\bUsa\b/g, "USA")
    .replace(/\bCvs\b/g, "CVS");
}

function merchantSimilarity(a = "", b = ""){
  const left = normalizeMerchantKey(a).replace(/\s+/g, "");
  const right = normalizeMerchantKey(b).replace(/\s+/g, "");

  if(!left || !right) return 0;
  if(left === right) return 1;
  if(left.includes(right) || right.includes(left)){
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }

  const bigrams = str => {
    const set = new Set();
    for(let i = 0; i < str.length - 1; i++) set.add(str.slice(i, i + 2));
    return set;
  };

  const aSet = bigrams(left);
  const bSet = bigrams(right);
  if(!aSet.size || !bSet.size) return 0;

  let overlap = 0;
  for(const gram of aSet){
    if(bSet.has(gram)) overlap++;
  }

  return (overlap * 2) / (aSet.size + bSet.size);
}

function saveMerchantAliases(){
  localStorage.setItem(MERCHANT_ALIASES_KEY, JSON.stringify(merchantAliases));
  setLocalPayload({ updatedAt: Date.now(), merchantAliases });
  cloudWriteDebounced(["merchantAliases"]);
}

function saveMerchantAlias(rawName, cleanName){
  const key = normalizeMerchantKey(rawName);
  const normalized = String(cleanName || "").trim();

  if(!key || !isSafeMapKey(key) || !normalized || normalized.length < 2) return;

  const existing = merchantAliases[key] || {};

  merchantAliases[key] = {
    rawName: String(rawName || "").trim(),
    normalizedName: normalized,
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
    useCount: Number(existing.useCount || 0) + 1
  };

  saveMerchantAliases();
}

function normalizeMerchantName(rawName = ""){
  const raw = String(rawName || "").trim();
  const key = normalizeMerchantKey(raw);

  if(!key) return raw;

  const exact = merchantAliases[key];
  if(exact?.normalizedName){
    exact.useCount = Number(exact.useCount || 0) + 1;
    exact.updatedAt = Date.now();
    saveMerchantAliases();
    return exact.normalizedName;
  }

  let best = null;
  let bestScore = 0;

  for(const [aliasKey, alias] of Object.entries(merchantAliases)){
    const score = merchantSimilarity(key, aliasKey);
    if(score > bestScore){
      bestScore = score;
      best = alias;
    }
  }

  if(best?.normalizedName && bestScore >= 0.88){
    saveMerchantAlias(raw, best.normalizedName);
    return best.normalizedName;
  }

  return titleCaseMerchantName(raw);
}



// ---------------------------------------------------------------------------
// Scan UI status + image capture/compression
// ---------------------------------------------------------------------------

function setReceiptScanStatus(message = "", type = "info"){
  if(!budgetReceiptScanStatus) return;

  const text = String(message || "").trim();
  budgetReceiptScanStatus.textContent = text;
  budgetReceiptScanStatus.className = `budgetReceiptScanStatus ${text ? "" : "hidden"} ${type}`;
}

function clearReceiptScanStatus(){
  setReceiptScanStatus("");
}

function setReceiptScanBusy(isBusy){
  receiptScanBusy = !!isBusy;

  if(budgetReceiptScanBtn){
    budgetReceiptScanBtn.disabled = receiptScanBusy;
    budgetReceiptScanBtn.textContent = receiptScanBusy ? "Reading..." : "Scan Receipt";
  }
}

function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read receipt image."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load receipt image."));
    img.src = src;
  });
}

async function compressReceiptImage(file){
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImageElement(dataUrl);

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const imageBase64 = compressedDataUrl.split(",")[1] || "";

  // Scrub canvas pixels as soon as possible. The app never persists the image.
  canvas.width = 1;
  canvas.height = 1;

  return {
    imageBase64,
    mimeType: "image/jpeg"
  };
}


// ---------------------------------------------------------------------------
// Parsing OCR results (date/title/amount/category)
// ---------------------------------------------------------------------------

function normalizeReceiptDate(value){
  if(!value) return "";

  const raw = String(value).trim();
  const currentYear = new Date().getFullYear();

  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
    let [year, month, day] = raw.split("-").map(Number);

    if(year < 2020 || year > currentYear + 1){
      year = currentYear;
    }

    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const match = raw.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if(!match) return "";

  let [, mm, dd, yy] = match;
  let year = Number(yy);

  if(year < 100) year += year >= 70 ? 1900 : 2000;

  const month = Number(mm);
  const day = Number(dd);

  if(month < 1 || month > 12 || day < 1 || day > 31) return "";

  if(year < 2020 || year > currentYear + 1){
    year = currentYear;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function getReceiptCategoryGuess(text){
  const lower = String(text || "").toLowerCase();

  const guesses = [
    ["food", [
  "restaurant", "cafe", "coffee", "chick-fil-a", "chick fil a",
  "mcdonald", "wendy", "subway", "taco", "pizza", "chuy",
  "chipotle", "panera", "starbucks", "dutch bros", "sonic",
  "burger", "grill", "bbq", "barbecue", "fries", "sandwich",

  // Restaurant receipts / menu words
  "olive garden", "red robin", "server", "table", "guest", "guests",
  "lasagna", "alfredo", "pasta", "spaghetti", "ravioli", "breadstick",
  "appetizer", "entree", "dine in", "gratuity"
]],

    ["groceries", [
      "grocery", "king soopers", "safeway", "walmart", "target",
      "costco", "market", "aldi", "milk", "bread", "eggs", "cheese",
      "produce", "banana", "apple", "lettuce", "chicken", "beef"
    ]],

    ["gas", [
      "fuel", "gasoline", "shell", "conoco", "circle k", "7-eleven",
      "exxon", "mobil", "chevron", "phillips 66", "valero",
      "loaf n jug", "murphy", "unleaded", "diesel", "gallons"
    ]],

    ["shopping", [
      "amazon", "best buy", "walgreens", "cvs", "dollar tree",
      "home depot", "lowe's", "lowes", "hobby lobby", "michaels",
      "tj maxx", "ross", "kohls", "kohl's", "shirt", "socks",
      "decor", "toy", "charger", "soap", "shampoo"
    ]],

    ["car", [
      "auto", "autozone", "o'reilly", "oreilly", "discount tire",
      "jiffy lube", "brake", "oil change", "nissan", "motor oil",
      "wiper", "tire", "battery", "coolant"
    ]]
  ];

  const categories = getSortedBudgetCategories();

  const normalize = s => String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const candidateScores = new Map();

  function addScore(categoryId, score){
    if(!categoryId || !Number.isFinite(score) || score <= 0) return;
    candidateScores.set(categoryId, (candidateScores.get(categoryId) || 0) + score);
  }

  // Static starter brain: reliable defaults before the app has learned anything.
  for(const [nameHint, words] of guesses){
    let score = 0;

    for(const word of words){
      const wordLower = word.toLowerCase();

      if(lower.includes(wordLower)){
        score += 1;

        // Line-item style words should matter more than generic store names.
        if(!["walmart", "target", "costco", "walgreens", "cvs", "amazon"].includes(wordLower)){
          score += 0.5;
        }
      }
    }

    if(score <= 0) continue;

    const hintNorm = normalize(nameHint);

    const cat = categories.find(c => {
      const name = normalize(c.name);
      return name.includes(hintNorm) || hintNorm.includes(name);
    });

    if(cat) addScore(cat.id, score);
  }

  // Personal learned brain: phrases you previously confirmed on saved receipt transactions.
  const learnedScores = getReceiptMemoryCategoryScores(lower);
  for(const [categoryId, score] of learnedScores.entries()){
    addScore(categoryId, score);
  }

  const scores = Array.from(candidateScores.entries())
    .map(([categoryId, score]) => ({ categoryId, score }))
    .sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1];

  if(!best) return "";

  // Prevent weak ties from picking the wrong category on mixed receipts.
  if(second && best.score < second.score + 1.25){
    return "";
  }

  return best.categoryId || "";
}

function cleanReceiptLine(line){
  return String(line || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getBestReceiptTitle(result = {}){
  const rawText = String(result.rawText || result.text || "");
  const fallbackStore = String(result.storeName || result.merchant || result.title || "").trim();

  const lines = rawText
    .split(/\n+/)
    .map(cleanReceiptLine)
    .filter(Boolean);

  const headerLines = lines.slice(0, 14);
  const headerText = headerLines.join("\n").toLowerCase();

  const knownMerchants = [
    ["walmart", "Walmart"],
    ["target", "Target"],
    ["king soopers", "King Soopers"],
    ["safeway", "Safeway"],
    ["costco", "Costco"],
    ["sam's club", "Sam's Club"],
    ["sams club", "Sam's Club"],
    ["chick-fil-a", "Chick-fil-A"],
    ["chick fil a", "Chick-fil-A"],
    ["red robin", "Red Robin"],
    ["olive garden", "Olive Garden"],
    ["starbucks", "Starbucks"],
    ["dutch bros", "Dutch Bros"],
    ["chuy", "Chuy's"],
    ["shell", "Shell"],
    ["conoco", "Conoco"],
    ["circle k", "Circle K"],
    ["loaf n jug", "Loaf 'N Jug"],
    ["murphy", "Murphy USA"],
    ["walgreens", "Walgreens"],
    ["cvs", "CVS"],
    ["amazon", "Amazon"],
    ["home depot", "Home Depot"],
    ["lowe's", "Lowe's"],
    ["lowes", "Lowe's"],
    ["best buy", "Best Buy"]
  ];

  for(const [needle, label] of knownMerchants){
    if(headerText.includes(needle)){
      return label;
    }
  }

  const badPatterns = [
    "survey", "feedback", "thank", ".com", "www", "@",
    "subtotal", "total", "tax", "change due", "debit", "credit",
    "approved", "terminal", "ref #", "network id", "items sold",
    "scan", "delivery", "receipt", "cashier", "mgr", "phone",
    "address", "purchase", "pin verified", "customer copy",
    "server", "table", "guest", "guests", "check #", "check no"
  ];

  let best = "";
  let bestScore = -999;

  for(let i = 0; i < headerLines.length; i++){
    const line = headerLines[i];
    const lower = line.toLowerCase();
    let score = 0;

    const nearby = headerLines
      .slice(Math.max(0, i - 2), Math.min(headerLines.length, i + 3))
      .join(" ")
      .toLowerCase();

    if(i <= 2) score += 25;
    if(i <= 5) score += 8;

    if(badPatterns.some(bad => lower.includes(bad))) score -= 70;

    if(/\b(server|table|guest|guests|check)\b/.test(nearby)){
      score -= 45;
    }

    // Reject server-looking names like "Juan C".
    if(/^[A-Z][a-z]+\s+[A-Z]$/.test(line.trim())){
      score -= 100;
    }

    if(/^[a-z0-9 &'’.-]+$/i.test(line)) score += 10;
    if(line.length >= 3 && line.length <= 32) score += 8;

    const words = line.split(/\s+/).filter(Boolean);
    if(words.length >= 2 && words.length <= 4) score += 10;
    if(words.length === 1) score += 2;

    const letters = (line.match(/[a-z]/gi) || []).length;
    const digits = (line.match(/\d/g) || []).length;

    if(letters >= 3) score += 8;
    if(digits > 0) score -= digits * 3;
    if(digits > letters) score -= 35;

    if(/\b\d+\.\d{2}\b/.test(line)) score -= 45;
    if(/\b\d{5,}\b/.test(line)) score -= 35;
    if(/\b(items?|sold|tc#|op#|te#|tr#|st#|sku|qty)\b/i.test(line)) score -= 45;

    if(score > bestScore){
      bestScore = score;
      best = line;
    }
  }

  return bestScore > 0
    ? best.trim()
    : fallbackStore || "Receipt";
}

function rebuildReceiptTrainingRecords(){
  receiptTrainingRecords = (receiptTrainingRecords || []).map(record => {
    const rawText = (record.trainingDebug || [])
      .map(x => x.rawLine)
      .join("\n");

    const phrases = extractReceiptLearningPhrases(rawText)
      .filter(isUsefulReceiptTrainingPhrase)
      .slice(0, 20);

    const features = buildReceiptTrainingFeatures({
      merchant: record.merchant || record.rawMerchant || "",
      amount: record.amount || 0,
      phrases
    });

    return {
      ...record,
      phrases,
      phraseCount: phrases.length,
      features,
      featureCount: features.length,
      rebuiltAt: Date.now()
    };
  });

  persistReceiptTrainingRecords();
  console.log("Rebuilt receipt training records:", receiptTrainingRecords.length);
  return receiptTrainingRecords;
}

function getBestReceiptAmount(result = {}){
  const rawText = String(result.rawText || result.text || "");
  const lines = rawText.split(/\n+/).map(cleanReceiptLine).filter(Boolean);
  const moneyRe = /(-?\$?\s*(?:usd\$?\s*)?\d{1,4}(?:,\d{3})*\.\d{2})/gi;
  const candidates = [];

  for(let i = 0; i < lines.length; i++){
    const line = lines[i];
    const matches = [...line.matchAll(moneyRe)];
    if(!matches.length) continue;

    const prev = lines[i - 1] || "";
    const next = lines[i + 1] || "";
    const tightContext = `${prev} ${line} ${next}`.toLowerCase();
    const sameLine = line.toLowerCase();

    for(const match of matches){
      const value = Number(match[1].replace(/usd|\$|,|\s/gi, ""));
      if(!Number.isFinite(value) || value <= 0) continue;

      let score = 0;

      if(/\b(total\s+paid|paid\s+total|amount\s+paid|grand\s+total)\b/i.test(tightContext)) score += 5000;
      else if(/\bpurchase\s+amount\b/i.test(tightContext)) score += 1200;
      else if(/\btotal\b/i.test(tightContext)) score += 1000;
      else if(/\b(card|visa|mastercard|amex|debit|credit)\b/i.test(tightContext)) score += 100;

      // Only punish if the bad label is on the same line as this amount.
      if(/\b(tax|tip|gratuity|discount|change|balance due|cash back)\b/i.test(sameLine)) score -= 10000;
      if(/\b(subtotal|sub\s*total)\b/i.test(sameLine)) score -= 5000;
      if(/\b(auth|aid|rrn|tid|trn|tvr|iad|arc|mode|issuer)\b/i.test(sameLine)) score -= 2000;

      candidates.push({ value, score, line, tightContext });
    }
  }

  const preferred = candidates
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score || b.value - a.value);

  if(preferred.length) return preferred[0].value;

  const fallback = Number(result.grandTotal ?? result.total ?? result.amount ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
}

function findPossibleReceiptDuplicate({ merchant = "", amount = 0, date = "" } = {}){
  const total = Number(amount || 0);
  if(!date || !Number.isFinite(total) || total <= 0) return null;

  const startISO = addDaysISO(date, -1);
  const endISO = addDaysISO(date, 1);

  const candidates = getBudgetItems(startISO, endISO)
    .filter(item => Number(item.price || 0) > 0);

  let best = null;

  for(const item of candidates){
    const itemAmount = Math.abs(Number(item.price || 0));
    const amountDiff = Math.abs(itemAmount - total);

    // Fast filter: wildly different amounts cannot be duplicates.
    if(amountDiff > 1) continue;

    let score = 0;

    if(amountDiff <= 0.01) score += 45;
    else if(amountDiff <= 0.10) score += 35;
    else score += 15;

    if(item.date === date) score += 25;
    else score += 10;

    const merchantScore = merchantSimilarity(merchant, item.title || "");
    if(merchantScore >= 0.95) score += 30;
    else if(merchantScore >= 0.85) score += 22;
    else if(merchantScore >= 0.72) score += 12;

    if(!best || score > best.score){
      best = { item, score };
    }
  }

  return best && best.score >= 75 ? best : null;
}

function getReceiptCategoryPredictionSummary(scoreList = []){
  return scoreList.slice(0, 3).map(([categoryId, score]) => {
    const cat = getBudgetCategory(categoryId);
    return `${cat?.name || categoryId} ${Math.round(score)}`;
  }).join(", ");
}

function applyReceiptScanResult(result = {}){
  const rawText = result.rawText || result.text || "";
  const rawStore = getBestReceiptTitle(result);
  const store = normalizeMerchantName(rawStore);
  const amount = getBestReceiptAmount(result);
  const date = normalizeReceiptDate(result.date || result.purchaseDate || "");

const categoryText = `
${store}
${rawText}
`.toLowerCase();

  resetBudgetTransactionForm();

  if(budgetTxTitle){
    budgetTxTitle.value = store || "Receipt";
  }

  if(Number.isFinite(amount) && amount > 0 && budgetTxAmount){
    budgetTxAmount.value = amount.toFixed(2);
  }

  if(date && budgetTxDate){
    budgetTxDate.value = date;
  }

  const possibleDuplicate = findPossibleReceiptDuplicate({
  merchant: store,
  amount,
  date
});

currentReceiptScanDraft = {
  rawMerchant: rawStore,
  normalizedMerchant: store,
  rawText,
  amount,
  date,
  possibleDuplicate,
  scannedAt: Date.now()
};

  setBudgetTxType("expense");

  const categoryGuess = result.categoryId || getReceiptCategoryGuess(categoryText);

const receiptPredictionPhrases = extractReceiptLearningPhrases(rawText)
  .filter(isUsefulReceiptTrainingPhrase)
  .slice(0, 20);

const receiptPredictionFeatures = buildReceiptTrainingFeatures({
  merchant: store,
  amount,
  phrases: receiptPredictionPhrases
});

currentReceiptScanDraft.predictionPhrases = receiptPredictionPhrases;
currentReceiptScanDraft.predictionFeatures = receiptPredictionFeatures;

const scoreMap = getReceiptMemoryCategoryScores(categoryText);

mergeReceiptCategoryScoreMap(
  scoreMap,
  getReceiptMerchantCategoryScores(store)
);

const naiveBayesPrediction =
  predictReceiptCategoryNaiveBayes(receiptPredictionFeatures);

if(naiveBayesPrediction.ready){
  mergeReceiptCategoryScoreMap(
    scoreMap,
    naiveBayesPrediction.scoreMap
  );

  currentReceiptScanDraft.naiveBayesPrediction = {
    categoryId: naiveBayesPrediction.categoryId,
    categoryName: naiveBayesPrediction.categoryName,
    confidence: naiveBayesPrediction.confidence,
    summary: getReceiptNaiveBayesSummary(naiveBayesPrediction),
    features: naiveBayesPrediction.features
  };
}else{
  currentReceiptScanDraft.naiveBayesPrediction = {
    ready: false,
    reason: naiveBayesPrediction.reason || ""
  };
}

const scoreList = Array.from(scoreMap.entries())
  .sort((a, b) => b[1] - a[1]);

const topScore = scoreList[0]?.[1] || 0;
const secondScore = scoreList[1]?.[1] || 0;
const confidence = topScore > 0
  ? Math.round((topScore / Math.max(1, topScore + secondScore)) * 100)
  : 0;

if(scoreList[0]?.[0]){
  currentReceiptScanDraft.categoryConfidence = confidence;
  currentReceiptScanDraft.categoryScores = Object.fromEntries(scoreList);
}
const learnedGuess = scoreList[0]?.[0];
const finalGuess = learnedGuess || categoryGuess;

const naiveBayesHelped =
  naiveBayesPrediction.ready &&
  learnedGuess &&
  learnedGuess === naiveBayesPrediction.categoryId;

currentReceiptScanDraft.predictedCategoryId = finalGuess || "";

currentReceiptScanDraft.predictionSource = learnedGuess
  ? (naiveBayesHelped ? "naiveBayes+memory" : "memory")
  : finalGuess
    ? "rule"
    : "";

if(finalGuess && budgetTxCategory){
  budgetTxCategory.value = finalGuess;
  renderBudgetCategoryOptions();
}

  openBudgetTxDrawer();

  const pieces = [];
  if(store) pieces.push(store);
  if(Number.isFinite(amount) && amount > 0) pieces.push(money(amount));
  if(date) pieces.push(date);
if(currentReceiptScanDraft?.categoryConfidence){
  const cat = getBudgetCategory(budgetTxCategory?.value || "other");
  const contenders = getReceiptCategoryPredictionSummary(scoreList);

  pieces.push(`${cat?.name || "Category"} ${currentReceiptScanDraft.categoryConfidence}%`);

  if(contenders){
    currentReceiptScanDraft.categoryExplanation = contenders;
  }
}

const explanationText = currentReceiptScanDraft?.categoryExplanation
  ? ` Top matches: ${currentReceiptScanDraft.categoryExplanation}.`
  : "";

  const duplicateText = possibleDuplicate
  ? ` ⚠️ Possible duplicate: ${possibleDuplicate.item.title} on ${fmtPrettyISO(possibleDuplicate.item.date)} for ${money(Math.abs(possibleDuplicate.item.price))}.`
  : "";

setReceiptScanStatus(
  pieces.length
    ? `Receipt scanned: ${pieces.join(" • ")}. Review before adding.${explanationText}${duplicateText}`
: `Receipt scanned. Review the fields before adding.${explanationText}${duplicateText}`,
  possibleDuplicate ? "info" : "success"
);
}


// ---------------------------------------------------------------------------
// Scan pipeline entrypoint
// ---------------------------------------------------------------------------

async function scanReceiptFile(file){
  if(!file || receiptScanBusy) return;

  if(!file.type?.startsWith("image/")){
    openBudgetTxDrawer();
    setReceiptScanStatus("Please choose a receipt image.", "error");
    return;
  }

  if(!supabaseClient){
    openAccountModal?.();
    setReceiptScanStatus("Cloud OCR needs Supabase to be initialized first.", "error");
    return;
  }

  setReceiptScanBusy(true);
  openBudgetTxDrawer();
  setReceiptScanStatus("Reading receipt... the photo will not be saved.", "info");

  try{
    const { imageBase64, mimeType } = await compressReceiptImage(file);

    const { data, error } = await supabaseClient.functions.invoke(RECEIPT_SCAN_FUNCTION, {
      body: {
        imageBase64,
        mimeType
      }
    });

    // The base64 only lives in this function scope and is not written to app storage.
    if(error){
  let detail = error.message || "Receipt OCR failed.";

  try{
    if(error.context && typeof error.context.json === "function"){
      const body = await error.context.json();
      detail = body?.error || body?.message || detail;
    }
  }catch{}

  throw new Error(detail);
}

    if(!data?.ok){
      throw new Error(data?.error || "Could not read receipt.");
    }

    applyReceiptScanResult(data.receipt || data);
  }catch(err){
    console.error(err);
    setReceiptScanStatus(
      `Receipt scan failed: ${err?.message || err}. You can still enter it manually.`,
      "error"
    );
  }finally{
    setReceiptScanBusy(false);

    if(budgetReceiptScanInput){
      budgetReceiptScanInput.value = "";
    }
  }
}

budgetReceiptScanBtn?.addEventListener("click", () => {
  if(receiptScanBusy) return;
  budgetReceiptScanInput?.click();
});

budgetReceiptScanInput?.addEventListener("change", () => {
  const file = budgetReceiptScanInput.files?.[0];
  scanReceiptFile(file);
});


// ---------------------------------------------------------------------------
// 08c. BUDGET DASHBOARD (CONTINUED) — TRANSACTIONS, RENDERING & CASHFLOW
// This picks back up general budget-dashboard code (not receipt-OCR
// specific); it landed here because it was added right after the OCR
// feature without a new top-level header. Grouped here for clarity;
// left in place since it runs top-to-bottom with everything above it.
// ---------------------------------------------------------------------------

function addBudgetTransaction(){
  if(budgetTxEditState){
    updateBudgetTransactionFromDrawer();
    return;
  }

  createBudgetTransactionFromDrawer();
}

function renderBudgetTransactionCategoryFilter(){
  const menu = document.getElementById("budgetFilterCategoryMenu");
  const label = document.getElementById("budgetFilterCategoryLabel");

  if(!menu || !label) return;

  const current = budgetTransactionFilter.category;

  label.textContent =
    current === "all"
      ? "All Categories"
      : (getBudgetCategory(current)?.name || "Category");

  menu.innerHTML = `
    <button class="ddItem" data-category="all">
      All Categories
    </button>

    ${getSortedBudgetCategories().map(cat => `
      <button
        class="ddItem"
        data-category="${cat.id}"
      >
        ${escapeHtml(cat.name)}
      </button>
    `).join("")}
  `;
}

function learnMerchantAliasFromCurrentDraft(finalTitle){
  if(!currentReceiptScanDraft) return;

  const rawMerchant = currentReceiptScanDraft.rawMerchant || "";
  const cleanTitle = String(finalTitle || "").trim();

  if(!rawMerchant || !cleanTitle) return;

  const rawKey = normalizeMerchantKey(rawMerchant);
  const cleanKey = normalizeMerchantKey(cleanTitle);

  if(!rawKey || !cleanKey) return;

  // Learn when the user corrects it, or reinforce when the scan is accepted.
  saveMerchantAlias(rawMerchant, cleanTitle);
}

function createBudgetTransactionFromDrawer(){
  const title = budgetTxTitle?.value?.trim() || "";
  const rawAmount = Number(budgetTxAmount?.value || 0);
const amount = (budgetTxType?.value === "income" ? -1 : 1) * Math.abs(rawAmount);
  const date = budgetTxDate?.value || selectedDateISO || dateToYmd(new Date());

  if(!title || !Number.isFinite(rawAmount) || rawAmount <= 0) return;

  const before = snapshotBeforeChange();
  const list = getEventsForDay(date);

  const newEv = {
    id: cryptoId(),
    title,
    details: "Added from Budget",
    price: amount,
    source: "budget",
    categoryId: budgetTxCategory?.value || "other",
    color: DEFAULT_COLOR,
    startTime: "",
    endTime: "",
    startDate: date,
    span: null,
    recurrence: getBudgetRecurrenceFromForm([])
  };

  list.push(newEv);
  events[date] = list;

  saveEvents(before);
  syncStateFromLegacy();

  selectedDateISO = date;
  view = ymdToDate(date);
  monthLabel.textContent = fmtMonthYear(view);

  learnMerchantAliasFromCurrentDraft(title);
  learnReceiptCategoryFromCurrentDraft(newEv.categoryId);
saveReceiptTrainingRecordFromDraft(newEv);
  resetBudgetTransactionForm();

  renderBudgetPage();
  renderEventList();
  render();
  closeBudgetTxDrawer();
}

function updateBudgetTransactionFromDrawer(){
  const state = budgetTxEditState;
  if(!state) return;

  const title = budgetTxTitle?.value?.trim() || "";
  const rawAmount = Number(budgetTxAmount?.value || 0);
const amount = (budgetTxType?.value === "income" ? -1 : 1) * Math.abs(rawAmount);
  const nextDate = budgetTxDate?.value || state.date;

  if(!title || !Number.isFinite(rawAmount) || rawAmount <= 0) return;

  const found = findBudgetMasterEvent(state.eventId);
  if(!found) return;

  const before = snapshotBeforeChange();
  const master = found.ev;

  if(state.isOccurrence){
    const ex = Array.isArray(master.recurrence?.exceptions)
      ? [...master.recurrence.exceptions]
      : [];

    if(!ex.includes(state.occursOn)){
      ex.push(state.occursOn);
    }

    found.list[found.idx] = {
      ...master,
      recurrence: {
        ...(master.recurrence || {}),
        exceptions: ex
      }
    };

    events[found.storageKey] = found.list;

    const standalone = {
      ...master,
      id: cryptoId(),
      title,
      price: amount,
      categoryId: budgetTxCategory?.value || "other",
      startDate: nextDate,
      recurrence: {
        freq: "none",
        until: "",
        interval: 1,
        exceptions: [],
        days: []
      }
    };

    const targetList = getEventsForDay(nextDate);
    targetList.push(standalone);
    events[nextDate] = targetList;
  }else{
    const oldExceptions = Array.isArray(master.recurrence?.exceptions)
      ? master.recurrence.exceptions
      : [];

    const updated = {
      ...master,
      title,
      price: amount,
      categoryId: budgetTxCategory?.value || "other",
      startDate: nextDate,
      recurrence: getBudgetRecurrenceFromForm(oldExceptions)
    };

    found.list.splice(found.idx, 1);
    events[found.storageKey] = found.list;

    const targetList = getEventsForDay(nextDate);
    targetList.push(updated);
    events[nextDate] = targetList;
  }

  saveEvents(before);
  syncStateFromLegacy();

  selectedDateISO = nextDate;
  view = ymdToDate(nextDate);
  monthLabel.textContent = fmtMonthYear(view);

  resetBudgetTransactionForm();

  renderBudgetPage();
  renderEventList();
  render();
  closeBudgetTxDrawer();
}
function getBudgetRecurrenceFromForm(existingExceptions = []){
  const repeatFreq = budgetRepeat?.value || "none";

  const repeatIntervalValue = Math.max(
    1,
    parseInt(budgetRepeatInterval?.value || "1", 10) || 1
  );

  const repeatDays = budgetWeekdayBtns
    .filter(btn => btn.classList.contains("active"))
    .map(btn => Number(btn.dataset.day));

  return {
    freq: repeatFreq,
    until: budgetRepeatUntil?.value || "",
    interval: repeatIntervalValue,
    exceptions: Array.isArray(existingExceptions) ? existingExceptions : [],
    days: repeatFreq === "weeklyDays" ? repeatDays : []
  };
}

function findBudgetMasterEvent(eventId){
  const storageKey = findEventStorageKeyById(eventId) || findMasterDateById(eventId);
  if(!storageKey) return null;

  const list = getEventsForDay(storageKey);
  const idx = list.findIndex(ev => ev.id === eventId && ev.source === "budget");

  if(idx < 0) return null;

  return {
    storageKey,
    list,
    idx,
    ev: list[idx]
  };
}

function fillBudgetTransactionFormForEdit(meta){
  const found = findBudgetMasterEvent(meta.eventId);
  if(!found) return;

  const ev = found.ev;
  const r = ev.recurrence || { freq:"none", until:"", interval:1, exceptions:[], days:[] };

  budgetTxEditState = {
    eventId: meta.eventId,
    date: meta.date,
    isOccurrence: !!meta.isOccurrence,
    occursOn: meta.occursOn || meta.date
  };

  if(budgetTxTitle) budgetTxTitle.value = ev.title || "";
  if(budgetTxAmount) budgetTxAmount.value = Math.abs(Number(ev.price || 0)).toFixed(2);
setBudgetTxType(Number(ev.price || 0) < 0 ? "income" : "expense");
  if(budgetTxDate) budgetTxDate.value = meta.isOccurrence ? (meta.occursOn || meta.date) : (ev.startDate || found.storageKey);

  if(budgetTxCategory) budgetTxCategory.value = ev.categoryId || "other";
  renderBudgetCategoryOptions();

  if(meta.isOccurrence){
    setBudgetRepeatValue("none");
    if(budgetRepeatInterval) budgetRepeatInterval.value = "1";
    if(budgetRepeatUntil) budgetRepeatUntil.value = "";
    budgetWeekdayBtns.forEach(btn => btn.classList.remove("active"));
  }else{
    setBudgetRepeatValue(r.freq || "none");
    if(budgetRepeatInterval) budgetRepeatInterval.value = String(r.interval || 1);
    if(budgetRepeatUntil) budgetRepeatUntil.value = r.until || "";

    budgetWeekdayBtns.forEach(btn => {
      btn.classList.toggle("active", Array.isArray(r.days) && r.days.includes(Number(btn.dataset.day)));
    });
  }

  setBudgetDrawerMode("edit");
  openBudgetTxDrawer();
}

function addBudgetCategory(){
  budgetCategoryModalMode = "create";
  budgetCategoryModalCategoryId = null;

  budgetCategoryModal?.classList.remove("hidden");

budgetCategoryModalColor
  ?.closest(".budgetCategoryColorRow")
  ?.classList.remove("hidden");

  budgetCategoryModalKicker.textContent = "New category";
  budgetCategoryModalTitle.textContent = "Create a category";
  budgetCategoryModalText.textContent = "";

  budgetCategoryModalInput.style.display = "block";
  budgetCategoryModalInput.value = "";

  budgetCategoryModalColor.value = "#7a5aff";
  budgetCategoryModalColorHint.textContent =
    budgetCategoryModalColor.value;

fillCategoryBudgetInputs({
  budgets: { week:0, month:0, year:0 }
});

budgetCategoryModalBudgetWeek
  ?.closest(".budgetCategoryBudgetModalRow")
  ?.classList.remove("hidden");

  budgetCategoryModalConfirm.textContent = "Create";
  budgetCategoryModalConfirm.classList.remove("danger");

  setTimeout(() => budgetCategoryModalInput?.focus(), 0);
}

budgetAddCategoryBtn?.addEventListener("click", addBudgetCategory);

function computeBudgetItemsUncached(startISO, endISO){
  const items = [];
  const seen = new Set();

  let cursor = ymdToDate(startISO);
  const end = ymdToDate(endISO);

  while(cursor <= end){
    const iso = dateToYmd(cursor);
    const dayEvents = getComputedEventsForDay(iso).filter(ev => {
  const price = Number(ev.price);
  return Number.isFinite(price) && price !== 0;
});

    for(const ev of dayEvents){
      const price = Number(ev.price);
      if(!Number.isFinite(price) || price === 0) continue;

      const key = `${ev._masterId || ev.id}__${iso}`;
      if(seen.has(key)) continue;
      seen.add(key);

      items.push({
  id: key,
  eventId: ev._masterId || ev.id,
  date: iso,
  title: ev.title || "Untitled event",
  price,
  color: ev.color || DEFAULT_COLOR,
  source: ev.source || "calendar",
  categoryId: ev.categoryId || "other",
  isOccurrence: !!ev._isOccurrence,
  occursOn: ev._occursOn || iso
});
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return items.sort((a,b) => a.date.localeCompare(b.date));
}

function getBudgetItems(startISO, endISO){
  syncStateFromLegacy();

  if(
    derivedCache.budgetItemsVersion !== state.meta.eventsVersion ||
    derivedCache.budgetItemsRangeVersion !== indexedDbEventRangeCache.version ||
    derivedCache.budgetItemsTxRangeVersion !== indexedDbBudgetTransactionRangeCache.version
  ){
    derivedCache.budgetItems.clear();
    derivedCache.budgetItemsVersion = state.meta.eventsVersion;
    derivedCache.budgetItemsRangeVersion = indexedDbEventRangeCache.version;
    derivedCache.budgetItemsTxRangeVersion = indexedDbBudgetTransactionRangeCache.version;
  }

  const cacheKey = `${startISO}__${endISO}`;
  const cached = derivedCache.budgetItems.get(cacheKey);
  if(cached) return cached.map(item => ({ ...item }));

  const indexedDbItems = getIndexedDbCachedBudgetTransactionItemsForRange(startISO, endISO);
  const fresh = indexedDbItems
    ? mergeBudgetItemsByKey(indexedDbItems, computeRecurringBudgetItemsUncached(startISO, endISO))
    : computeBudgetItemsUncached(startISO, endISO);

  derivedCache.budgetItems.set(cacheKey, fresh);
  return fresh.map(item => ({ ...item }));
}

function groupBudgetItems(items, range){
  const map = new Map();

  if(range.group === "month"){
    for(let m = 0; m < 12; m++){
      const d = new Date(ymdToDate(range.startISO).getFullYear(), m, 1);
      const key = `${d.getFullYear()}-${pad2(m + 1)}`;
      const label = d.toLocaleDateString(undefined, { month:"short" });
      map.set(key, { label, total:0 });
    }

    for(const item of items){
      const key = item.date.slice(0, 7);
      if(map.has(key)) map.get(key).total += item.price;
    }

    return Array.from(map.values());
  }

  let cursor = ymdToDate(range.startISO);
  const end = ymdToDate(range.endISO);

  while(cursor <= end){
    const iso = dateToYmd(cursor);
    const label = budgetViewMode === "week"
      ? cursor.toLocaleDateString(undefined, { weekday:"short" })
      : String(cursor.getDate());

    map.set(iso, { label, total:0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for(const item of items){
    if(map.has(item.date)) map.get(item.date).total += item.price;
  }

  return Array.from(map.values());
}

function updateBudgetTransactionPrice(eventId, date, amount, opts = {}){
  const rawPrice = Number(amount);

  if(!eventId || !Number.isFinite(rawPrice) || rawPrice < 0) return;

  const isOccurrence = !!opts.isOccurrence;
  const occursOn = opts.occursOn || date;

  const before = snapshotBeforeChange();

  if(isOccurrence){
    const masterKey = findMasterDateById(eventId);
    if(!masterKey) return;

    const masterList = getEventsForDay(masterKey);
    const idx = masterList.findIndex(ev => ev.id === eventId && ev.source === "budget");
    if(idx < 0) return;

    const master = masterList[idx];

    const oldPrice = Number(master.price || 0);
    const nextPrice =
      oldPrice < 0
        ? -Math.abs(rawPrice)
        : Math.abs(rawPrice);

    const ex = Array.isArray(master.recurrence?.exceptions)
      ? [...master.recurrence.exceptions]
      : [];

    if(!ex.includes(occursOn)){
      ex.push(occursOn);
    }

    masterList[idx] = {
      ...master,
      recurrence: {
        ...(master.recurrence || {}),
        exceptions: ex
      }
    };

    events[masterKey] = masterList;

    const standalone = {
      ...master,
      id: cryptoId(),
      price: nextPrice,
      startDate: occursOn,
      recurrence: {
        freq: "none",
        until: "",
        interval: 1,
        exceptions: [],
        days: []
      }
    };

    const targetList = getEventsForDay(occursOn);
    targetList.push(standalone);
    events[occursOn] = targetList;

    saveEvents(before);
    syncStateFromLegacy();

    renderBudgetPage();
    renderEventList();
    render();
    return;
  }

  let storageKey = date;
  let list = getEventsForDay(storageKey);
  let idx = list.findIndex(ev => ev.id === eventId);

  if(idx < 0){
    storageKey = findEventStorageKeyById(eventId);
    if(!storageKey) return;

    list = getEventsForDay(storageKey);
    idx = list.findIndex(ev => ev.id === eventId);
  }

  if(idx < 0) return;

  const oldPrice = Number(list[idx].price || 0);
  const nextPrice =
    oldPrice < 0
      ? -Math.abs(rawPrice)
      : Math.abs(rawPrice);

  list[idx] = {
    ...list[idx],
    price: nextPrice
  };

  events[storageKey] = list;

  saveEvents(before);
  syncStateFromLegacy();

  renderBudgetPage();
  renderEventList();
  render();
}
function renderBudgetCashflow(incomeTotal, expenseTotal, netTotal, items = [], range = null){
  const max = Math.max(incomeTotal, expenseTotal, 1);

  if(budgetIncomeTotal) budgetIncomeTotal.textContent = money(incomeTotal);
  if(budgetExpenseTotal) budgetExpenseTotal.textContent = money(expenseTotal);

  if(budgetNetTotal){
    budgetNetTotal.textContent =
      `${netTotal >= 0 ? "+" : "-"}${money(Math.abs(netTotal))}`;

    budgetNetTotal.classList.toggle("budgetNetPositive", netTotal >= 0);
    budgetNetTotal.classList.toggle("budgetNetNegative", netTotal < 0);
  }

  if(budgetIncomeBar){
    budgetIncomeBar.style.width = `${Math.round((incomeTotal / max) * 100)}%`;
  }

  if(budgetExpenseBar){
    budgetExpenseBar.style.width = `${Math.round((expenseTotal / max) * 100)}%`;
  }

  renderBudgetCashflowTrend(items, range);
}

function getPreviousBudgetRange(range){
  const start = ymdToDate(range.startISO);
  const end = ymdToDate(range.endISO);

  if(budgetViewMode === "week"){
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);

    const prevEnd = new Date(end);
    prevEnd.setDate(prevEnd.getDate() - 7);

    return {
      ...range,
      startISO: dateToYmd(prevStart),
      endISO: dateToYmd(prevEnd)
    };
  }

  if(budgetViewMode === "year"){
    const y = start.getFullYear() - 1;

    return {
      ...range,
      startISO: isoDate(y, 1, 1),
      endISO: isoDate(y, 12, 31)
    };
  }

  const prevStart = new Date(start);
  prevStart.setMonth(prevStart.getMonth() - 1);

  const y = prevStart.getFullYear();
  const m = prevStart.getMonth();

  return {
    ...range,
    startISO: dateToYmd(new Date(y, m, 1)),
    endISO: dateToYmd(new Date(y, m + 1, 0))
  };
}

function getCumulativeExpensePoints(items, range){
  const expenseItems = items.filter(item => Number(item.price || 0) > 0);
  const groups = groupBudgetItems(expenseItems, range);

  let running = 0;

  return groups.map(g => {
    running += Number(g.total || 0);

    return {
      label: g.label,
      total: running
    };
  });
}

function formatBudgetRangeShort(range){
  const start = ymdToDate(range.startISO);
  const end = ymdToDate(range.endISO);

  if(budgetViewMode === "year"){
    return range.startISO.slice(0, 4);
  }

  return `${start.toLocaleDateString(undefined, {
    weekday:"long",
    month:"long",
    day:"numeric",
    year:"numeric"
  })} – ${end.toLocaleDateString(undefined, {
    weekday:"long",
    month:"long",
    day:"numeric",
    year:"numeric"
  })}`;
}

function shiftBudgetRange(range, offset){
  let shifted = { ...range };

  for(let i = 0; i < Math.abs(offset); i++){
    shifted = offset < 0
      ? getPreviousBudgetRange(shifted)
      : getNextBudgetRange(shifted);
  }

  return shifted;
}

function getNextBudgetRange(range){
  const start = ymdToDate(range.startISO);
  const end = ymdToDate(range.endISO);

  if(budgetViewMode === "week"){
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);

    return { ...range, startISO: dateToYmd(start), endISO: dateToYmd(end) };
  }

  if(budgetViewMode === "year"){
    const y = start.getFullYear() + 1;
    return { ...range, startISO: isoDate(y, 1, 1), endISO: isoDate(y, 12, 31) };
  }

  start.setMonth(start.getMonth() + 1);
  const y = start.getFullYear();
  const m = start.getMonth();

  return {
    ...range,
    startISO: dateToYmd(new Date(y, m, 1)),
    endISO: dateToYmd(new Date(y, m + 1, 0))
  };
}

function getAverageExpenseForLastPeriods(range, count = 10){
  const totals = [];

  for(let i = 1; i <= count; i++){
    const pastRange = shiftBudgetRange(range, -i);
    const pastItems = getBudgetItems(pastRange.startISO, pastRange.endISO);
    const points = getCumulativeExpensePoints(pastItems, pastRange);
    const total = points.at(-1)?.total || 0;

    if(total > 0){
      totals.push(total);
    }
  }

  if(!totals.length) return 0;

  return totals.reduce((sum, n) => sum + n, 0) / totals.length;
}

function renderBudgetCashflowTrend(items, range){
  if(!budgetCashflowTrend || !range) return;

  const previousRange = getPreviousBudgetRange(range);
  const previousItems = getBudgetItems(previousRange.startISO, previousRange.endISO);

  const currentPoints = getCumulativeExpensePoints(items, range);
  const previousPoints = getCumulativeExpensePoints(previousItems, previousRange);

  const averageTotal = getAverageExpenseForLastPeriods(range, 10);

const max = Math.max(
  1,
  averageTotal,
  ...currentPoints.map(p => p.total),
  ...previousPoints.map(p => p.total)
);

  const width = 100;
  const height = 62;

  const toPolyline = (points) => {
    if(points.length <= 1) return "";

    return points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p.total / max) * (height - 8)) - 4;

      return `${x},${y}`;
    }).join(" ");
  };

const averageY =
  height - ((averageTotal / max) * (height - 8)) - 4;

  const currentTotal = currentPoints.at(-1)?.total || 0;
  const previousTotal = previousPoints.at(-1)?.total || 0;
  const diff = currentTotal - previousTotal;

  const currentLabel = formatBudgetRangeShort(range);
const previousLabel = formatBudgetRangeShort(previousRange);

  budgetCashflowTrend.innerHTML = `
    <div class="cashflowTrendHero">
      <div>
  <div class="cashflowTrendTotal">${money(currentTotal)}</div>
</div>

      <div class="cashflowTrendDelta ${diff > 0 ? "negative" : "positive"}">
        ${diff === 0
  ? `Same as last ${budgetViewMode}`
  : `${money(Math.abs(diff))} ${diff > 0 ? "more than" : "less than"} last ${budgetViewMode}`
}
      </div>
    </div>

    <svg class="cashflowLineChart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
  ${
    averageTotal > 0
      ? `<line class="cashflowLine average" x1="0" y1="${averageY}" x2="${width}" y2="${averageY}"></line>`
      : ""
  }
  <polyline class="cashflowLine previous" points="${toPolyline(previousPoints)}"></polyline>
  <polyline class="cashflowLine current" points="${toPolyline(currentPoints)}"></polyline>
</svg>

    <div class="cashflowTrendLegend">
  <span><i class="previous"></i>${escapeHtml(previousLabel)}</span>
  <span><i class="current"></i>${escapeHtml(currentLabel)}</span>
  ${
    averageTotal > 0
      ? `<span><i class="average"></i>10-period avg</span>`
      : ""
  }
</div>
  `;
}


function formatShortDate(date){
  return date.toLocaleDateString(undefined,{
    month:"short",
    day:"numeric"
  });
}

function updateBudgetRangeLabel(range){
  const rangeLabel = document.getElementById("budgetRangeLabel");
  if(!rangeLabel || !range) return;

  if(window.innerWidth > 760){
    rangeLabel.style.display = "none";
    return;
  }

  const start = ymdToDate(range.startISO);
  const end = ymdToDate(range.endISO);

  if(budgetViewMode === "week"){
    rangeLabel.textContent = `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }else if(budgetViewMode === "month"){
    rangeLabel.textContent = start.toLocaleString("default", {
      month:"long",
      year:"numeric"
    });
  }else if(budgetViewMode === "year"){
    rangeLabel.textContent = String(start.getFullYear());
  }

  rangeLabel.style.display = "block";
}

function renderBudgetPage(){
  if(!budgetPage) return;

  const range = budgetRangeForMode();

  updateBudgetRangeLabel(range);

  if(budgetTxDate && !budgetTxDate.value){
    budgetTxDate.value = selectedDateISO || range.startISO;
  }

  requestIndexedDbBudgetTransactionRangeHydration(range.startISO, range.endISO, {
    source: "budget transaction range",
    renderBudget: true
  });

  // Keep the event range warm as a bridge for recurring transaction masters.
  requestIndexedDbEventRangeHydration(range.startISO, range.endISO, {
    source: "budget recurrence bridge",
    renderBudget: true
  });

  const items = getBudgetItems(range.startISO, range.endISO);

const filteredItems = items.filter(item => {
  const search = budgetTransactionFilter.search;
  const categoryFilter = budgetTransactionFilter.category;
  const typeFilter = budgetTransactionFilter.type;

  const matchesSearch =
    !search ||
    (item.title || "").toLowerCase().includes(search);

  const matchesCategory =
    categoryFilter === "all" ||
    item.categoryId === categoryFilter;

  const amount = Number(item.price || 0);

  const matchesType =
    typeFilter === "all" ||
    (typeFilter === "expense" && amount > 0) ||
    (typeFilter === "income" && amount < 0);

  return matchesSearch && matchesCategory && matchesType;
});

  const total = items.reduce((sum, item) => sum + item.price, 0);

const expenseItems = items.filter(item => Number(item.price || 0) > 0);

const incomeItems = items.filter(item => Number(item.price || 0) < 0);

const expenseTotal = expenseItems.reduce((sum, item) => {
  return sum + Number(item.price || 0);
}, 0);

const incomeTotal = incomeItems.reduce((sum, item) => {
  return sum + Math.abs(Number(item.price || 0));
}, 0);

const netTotal = incomeTotal - expenseTotal;

renderBudgetCategoryChart(expenseItems, expenseTotal);
renderBudgetCashflow(incomeTotal, expenseTotal, netTotal, items, range);

  const plan = getCurrentBudgetPlan(range);
  const remaining = plan - expenseTotal;

  renderBudgetInsights({
  range,
  items,
  expenseItems,
  expenseTotal,
  plan
});

  if(budgetPlanInput){
    budgetPlanInput.value = plan ? String(plan) : "";
  }

  if(budgetPlanSub){
    budgetPlanSub.textContent = `Remaining: ${money(remaining)}`;
    budgetPlanSub.classList.toggle("overBudget", remaining < 0);
  }

  if(budgetRangeTitle){
    budgetRangeTitle.textContent = range.title;
  }

  if(budgetRangeSub){
    budgetRangeSub.textContent =
      `${fmtPrettyISO(range.startISO)} – ${fmtPrettyISO(range.endISO)}`;
  }

  if(budgetTransactionCount){
    budgetTransactionCount.textContent =
      `${items.length} item${items.length === 1 ? "" : "s"}`;
  }



  const groups = groupBudgetItems(expenseItems, range);

const displayGroups = [
  ...groups,
  { label: "Total", total: expenseTotal, isTotal: true }
];

const hasPlan = plan > 0;

const barMax = hasPlan
  ? plan
  : Math.max(1, ...groups.map(g => g.total));

if(budgetBars){

  budgetBars.innerHTML = displayGroups.map(g => {

    const isOverBudget =
  g.isTotal &&
  hasPlan &&
  expenseTotal > plan;

    return `
      <div class="
        budgetBarRow
        ${g.isTotal ? "budgetBarRowTotal" : ""}
        ${isOverBudget ? "overBudget" : ""}
      ">

        <div class="budgetBarLabel">
          ${escapeHtml(g.label)}
        </div>

        <div class="budgetBarTrack">
          <div
            class="budgetBarFill"
            style="
              width:${Math.min(100, Math.round((g.total / barMax) * 100))}%;
            "
          ></div>
        </div>

        <div class="budgetBarAmount">
          ${money(g.total)}
        </div>

      </div>
    `;

  }).join("");
}

  if(budgetTransactionList){

    budgetTransactionList.innerHTML = filteredItems.length
  ? filteredItems.map(item => `
        <div class="budgetTransaction">

          <div>
            <div class="budgetTransactionTitle">
              ${escapeHtml(item.title)}
            </div>

            <div class="budgetTransactionDate">
              ${fmtPrettyISO(item.date)}
            </div>
          </div>

          <div class="budgetTransactionRight">

            <div class="budgetTxEditWrap ${Number(item.price || 0) < 0 ? 'incomeTx' : 'expenseTx'}">
              <span class="budgetTxDollar">$</span>

              <input
  class="budgetTxPriceInput"
  type="number"
  min="0"
  step="0.01"
  value="${Math.abs(Number(item.price || 0)).toFixed(2)}"
  data-event-id="${escapeHtml(item.eventId)}"
  data-date="${escapeHtml(item.date)}"
  data-is-occurrence="${item.isOccurrence ? "1" : "0"}"
  data-occurs-on="${escapeHtml(item.occursOn || item.date)}"
/>
            </div>

            ${
              item.source === "budget"
                ? `

<button
  class="budgetTxEditBtn"
  type="button"
  data-event-id="${escapeHtml(item.eventId)}"
  data-date="${escapeHtml(item.date)}"
  data-is-occurrence="${item.isOccurrence ? "1" : "0"}"
  data-occurs-on="${escapeHtml(item.occursOn || item.date)}"
>
  Edit
</button>

                  <button
                    class="budgetTxDeleteBtn"
                    type="button"
                    data-event-id="${escapeHtml(item.eventId)}"
data-date="${escapeHtml(item.date)}"
data-is-occurrence="${item.isOccurrence ? "1" : "0"}"
data-occurs-on="${escapeHtml(item.occursOn || item.date)}"
                  >
                    X
                  </button>
                `
                : `
                  <span
                    class="budgetTxLocked"
                    title="This came from a calendar event"
                  >
                    Calendar
                  </span>
                `
            }

          </div>

        </div>
      `).join("")
      : `
        <div class="budgetEmpty">
          No priced events in this period yet.
        </div>
      `;
  }

  requestAnimationFrame(() => {
  updateBudgetSlider();
  updateBudgetCashflowToggle();
});
}

budgetWeekBtn?.addEventListener("click", () => setBudgetViewMode("week"));
budgetMonthBtn?.addEventListener("click", () => setBudgetViewMode("month"));
budgetYearBtn?.addEventListener("click", () => setBudgetViewMode("year"));

window.addEventListener("resize", updateBudgetSlider);

function moveBudgetPeriod(direction){
  const anchor = selectedDateISO ? ymdToDate(selectedDateISO) : new Date(view);

  if(budgetViewMode === "week"){
    anchor.setDate(anchor.getDate() + direction * 7);
  }else if(budgetViewMode === "year"){
    anchor.setFullYear(anchor.getFullYear() + direction);
  }else{
    anchor.setMonth(anchor.getMonth() + direction);
  }

  selectedDateISO = dateToYmd(anchor);
  view = new Date(anchor);

  monthLabel.textContent = fmtMonthYear(view);

  renderBudgetPage();
}

function deleteBudgetTransaction(eventId, date, opts = {}){
  if(!eventId || !date) return;

  const isOccurrence = !!opts.isOccurrence;
  const occursOn = opts.occursOn || date;

  const before = snapshotBeforeChange();

  if(isOccurrence){
    const masterKey = findMasterDateById(eventId);
    if(!masterKey) return;

    const masterList = getEventsForDay(masterKey);
    const idx = masterList.findIndex(ev => ev.id === eventId && ev.source === "budget");
    if(idx < 0) return;

    const master = masterList[idx];
    const ex = Array.isArray(master.recurrence?.exceptions)
      ? [...master.recurrence.exceptions]
      : [];

    if(!ex.includes(occursOn)){
      ex.push(occursOn);
    }

    masterList[idx] = {
      ...master,
      recurrence: {
        ...(master.recurrence || {}),
        exceptions: ex
      }
    };

    events[masterKey] = masterList;

    saveEvents(before);
    syncStateFromLegacy();
renderBudgetTransactionCategoryFilter();

    renderBudgetPage();
    renderEventList();
    render();
    return;
  }

  const list = getEventsForDay(date);
  const idx = list.findIndex(ev => ev.id === eventId && ev.source === "budget");

  if(idx < 0) return;

  list.splice(idx, 1);
  events[date] = list;

  saveEvents(before);
  syncStateFromLegacy();
renderBudgetTransactionCategoryFilter();

  renderBudgetPage();
  renderEventList();
  render();
}

function jumpBudgetToToday(){
  const today = new Date();

  selectedDateISO = dateToYmd(today);
  view = new Date(today);

  monthLabel.textContent = fmtMonthYear(view);

  renderBudgetPage();
}

budgetPrevBtn?.addEventListener("click", () => moveBudgetPeriod(-1));
budgetNextBtn?.addEventListener("click", () => moveBudgetPeriod(1));
budgetTodayBtn?.addEventListener("click", jumpBudgetToToday);

budgetTxAddBtn?.addEventListener("click", addBudgetTransaction);

budgetTxAmount?.addEventListener("keydown", (e) => {
  if(e.key === "Enter") addBudgetTransaction();
});

budgetTxTitle?.addEventListener("keydown", (e) => {
  if(e.key === "Enter") addBudgetTransaction();
});

budgetTransactionList?.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".budgetTxEditBtn");
  if(editBtn){
    fillBudgetTransactionFormForEdit({
      eventId: editBtn.dataset.eventId,
      date: editBtn.dataset.date,
      isOccurrence: editBtn.dataset.isOccurrence === "1",
      occursOn: editBtn.dataset.occursOn || editBtn.dataset.date
    });
    return;
  }

  const deleteBtn = e.target.closest(".budgetTxDeleteBtn");
if(!deleteBtn) return;


e.preventDefault();
e.stopPropagation();

deleteBudgetTransaction(deleteBtn.dataset.eventId, deleteBtn.dataset.date, {
    isOccurrence: deleteBtn.dataset.isOccurrence === "1",
    occursOn: deleteBtn.dataset.occursOn || deleteBtn.dataset.date
  });
});

function getPreviousBudgetPlanKey(range){
  if(budgetViewMode === "week"){
    return addDaysISO(range.startISO, -7);
  }

  if(budgetViewMode === "year"){
    return String(Number(range.startISO.slice(0, 4)) - 1);
  }

  const d = ymdToDate(range.startISO);
  d.setMonth(d.getMonth() - 1);

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

budgetPlanCopyBtn?.addEventListener("click", () => {
  const range = budgetRangeForMode();
  const currentKey = getBudgetPlanKey(range);
  const previousKey = getPreviousBudgetPlanKey(range);

  const previousAmount = Number(
    budgetPlans?.[budgetViewMode]?.[previousKey] || 0
  );

  if(!previousAmount){
    budgetPlanCopyBtn.textContent = "No Last";
flashBudgetButtonError(budgetPlanCopyBtn);
    setTimeout(() => budgetPlanCopyBtn.textContent = "Copy Last", 900);
    return;
  }

  if(!budgetPlans[budgetViewMode]){
    budgetPlans[budgetViewMode] = {};
  }

  budgetPlans[budgetViewMode][currentKey] = previousAmount;

  saveBudgetPlans();
  renderBudgetPage();

  budgetPlanCopyBtn.textContent = "Copied";
  setTimeout(() => budgetPlanCopyBtn.textContent = "Copy Last", 900);
});

function getFutureBudgetPlanKeysThroughYear(range){
  const keys = [];

  if(budgetViewMode === "week"){
    let cursorISO = addDaysISO(range.startISO, 7);
    const year = Number(range.startISO.slice(0, 4));
    const endOfYear = `${year}-12-31`;

    while(cursorISO <= endOfYear){
      keys.push(cursorISO);
      cursorISO = addDaysISO(cursorISO, 7);
    }

    return keys;
  }

  if(budgetViewMode === "month"){
    const d = ymdToDate(range.startISO);
    const year = d.getFullYear();

    d.setMonth(d.getMonth() + 1);

    while(d.getFullYear() === year){
      keys.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
      d.setMonth(d.getMonth() + 1);
    }

    return keys;
  }

  return [];
}

budgetPlanUseForwardBtn?.addEventListener("click", () => {
  const range = budgetRangeForMode();

  if(budgetViewMode === "year"){
    budgetPlanUseForwardBtn.textContent = "Week/Month Only";
    setTimeout(() => budgetPlanUseForwardBtn.textContent = "Use Forward", 1100);
    return;
  }

  const amount = Number(budgetPlanInput?.value || getCurrentBudgetPlan(range) || 0);

  if(!amount){
  budgetPlanUseForwardBtn.textContent = "No Amount";

  flashBudgetButtonError(budgetPlanUseForwardBtn);

  setTimeout(() => {
    budgetPlanUseForwardBtn.textContent = "Use Forward";
  }, 900);

  return;
}

  if(!budgetPlans[budgetViewMode]){
    budgetPlans[budgetViewMode] = {};
  }

  const currentKey = getBudgetPlanKey(range);
  budgetPlans[budgetViewMode][currentKey] = Math.max(0, amount);

  const futureKeys = getFutureBudgetPlanKeysThroughYear(range);

  futureKeys.forEach(key => {
    budgetPlans[budgetViewMode][key] = Math.max(0, amount);
  });

  saveBudgetPlans();
  renderBudgetPage();

  budgetPlanUseForwardBtn.textContent = `Applied ${futureKeys.length + 1}`;
  setTimeout(() => budgetPlanUseForwardBtn.textContent = "Use Forward", 1000);
});

budgetPlanSaveBtn?.addEventListener("click", () => {
  const range = budgetRangeForMode();
  const amount = Number(budgetPlanInput?.value || 0);

  setCurrentBudgetPlan(range, amount);
  renderBudgetPage();
});

budgetPlanInput?.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    const range = budgetRangeForMode();
    const amount = Number(budgetPlanInput?.value || 0);

    setCurrentBudgetPlan(range, amount);
    renderBudgetPage();
  }
});

budgetTransactionList?.addEventListener("change", (e) => {
  const input = e.target.closest(".budgetTxPriceInput");
  if(!input) return;

  updateBudgetTransactionPrice(
  input.dataset.eventId,
  input.dataset.date,
  input.value,
  {
    isOccurrence: input.dataset.isOccurrence === "1",
    occursOn: input.dataset.occursOn || input.dataset.date
  }
);
});

budgetCatDDButton?.addEventListener("click", (e) => {
  e.stopPropagation();
  budgetCatDD?.classList.toggle("open");
});

budgetCatDDMenu?.addEventListener("click", (e) => {
  const item = e.target.closest(".ddItem");
  if(!item) return;

  const cat = getBudgetCategory(item.dataset.categoryId);

  budgetTxCategory.value = cat.id;
  budgetCatDDLabel.textContent = cat.name;

  budgetCatDD?.classList.remove("open");
  renderBudgetCategoryOptions();
});

document.addEventListener("click", (e) => {
  if(!budgetCatDD?.contains(e.target)){
    budgetCatDD?.classList.remove("open");
  }
});

budgetManageCategoryBtn?.addEventListener("click", () => {
  budgetCategoryManager?.classList.toggle("hidden");
  renderBudgetCategoryManager();
});

budgetPlanManageCategoryBtn?.addEventListener("click", openBudgetCategoryHub);

budgetCategoryHubCloseBtn?.addEventListener("click", closeBudgetCategoryHub);

budgetCategoryHubModal?.addEventListener("click", (e) => {
  if(e.target === budgetCategoryHubModal){
    closeBudgetCategoryHub();
  }
});

budgetCategoryHubAddBtn?.addEventListener("click", addBudgetCategory);

budgetCategoryHubList?.addEventListener("click", (e) => {
  const renameBtn = e.target.closest(".budgetCategoryRenameBtn");
  if(renameBtn){
    renameBudgetCategory(renameBtn.dataset.categoryId);
    return;
  }

  const deleteBtn = e.target.closest(".budgetCategoryDeleteBtn");
  if(deleteBtn){
    deleteBudgetCategory(deleteBtn.dataset.categoryId);
  }
});

budgetCategoryManager?.addEventListener("click", (e) => {
  const renameBtn = e.target.closest(".budgetCategoryRenameBtn");
  if(renameBtn){
    renameBudgetCategory(renameBtn.dataset.categoryId);
    return;
  }

  const deleteBtn = e.target.closest(".budgetCategoryDeleteBtn");
  if(deleteBtn){
    deleteBudgetCategory(deleteBtn.dataset.categoryId);
  }
});

budgetCategoryModalCancel?.addEventListener("click", closeBudgetCategoryModal);

budgetCategoryModal?.addEventListener("click", (e) => {
  if(e.target === budgetCategoryModal){
    closeBudgetCategoryModal();
  }
});

function updateBudgetCashflowToggle(){
  if(!budgetCashflowToggle || !budgetCashflowToggleThumb) return;

  const activeBtn = budgetCashflowToggle.querySelector("button.active");
  if(!activeBtn) return;

  const styles = getComputedStyle(budgetCashflowToggle);
  const padLeft = parseFloat(styles.paddingLeft) || 0;

  budgetCashflowToggleThumb.style.transform =
    `translateX(${activeBtn.offsetLeft - padLeft}px)`;

  budgetCashflowToggleThumb.style.width = `${activeBtn.offsetWidth}px`;
}

function setBudgetCashflowView(view){
  const isTrend = view === "trend";

  budgetCashflowTotalsBtn?.classList.toggle("active", !isTrend);
  budgetCashflowTrendBtn?.classList.toggle("active", isTrend);

  budgetCashflowTotalsView?.classList.toggle("hidden", isTrend);
  budgetCashflowTrendView?.classList.toggle("hidden", !isTrend);

  requestAnimationFrame(updateBudgetCashflowToggle);
}

budgetCashflowTotalsBtn?.addEventListener("click", () => setBudgetCashflowView("totals"));
budgetCashflowTrendBtn?.addEventListener("click", () => setBudgetCashflowView("trend"));

budgetCategoryModalConfirm?.addEventListener("click", () => {
  const categoryId = budgetCategoryModalCategoryId;

  if(budgetCategoryModalMode === "rename"){
    const cat = budgetCategories.find(c => c.id === categoryId);
    const nextName = budgetCategoryModalInput?.value?.trim();

    if(cat && nextName){
      cat.name = nextName;
cat.color =
    budgetCategoryModalColor?.value || "#7a5aff";
cat.budgets = readCategoryBudgetInputs();
      saveBudgetCategories();
      renderBudgetCategoryOptions();
      renderBudgetCategoryManager();
renderBudgetCategoryHub();
renderBudgetTransactionCategoryFilter();
      renderBudgetPage();
    }
  }

if(budgetCategoryModalMode === "create"){
  const nextName = budgetCategoryModalInput?.value?.trim();

  if(nextName){
    const cat = {
  id: cryptoId(),
  name: nextName,
  color: budgetCategoryModalColor?.value || "#7a5aff",
  budgets: readCategoryBudgetInputs()
};

    budgetCategories.push(cat);

saveBudgetCategories();

if(budgetTxCategory){
  budgetTxCategory.value = cat.id;
}

renderBudgetCategoryOptions();
renderBudgetCategoryManager();
renderBudgetCategoryHub();
renderBudgetTransactionCategoryFilter();
renderBudgetPage();
  }
}

  if(budgetCategoryModalMode === "delete"){
    actuallyDeleteBudgetCategory(categoryId);
  }

  closeBudgetCategoryModal();
});

budgetCategoryModalInput?.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    budgetCategoryModalConfirm?.click();
  }

  if(e.key === "Escape"){
    closeBudgetCategoryModal();
  }
});

if(budgetCategorySortSelect){ 
  budgetCategorySortSelect.value = settings.budgetCategorySort || "custom";
}

budgetCategorySortSelect?.addEventListener("change", () => {
  settings.budgetCategorySort = budgetCategorySortSelect.value || "custom";
  saveSettings();

  renderBudgetCategoryOptions();
  renderEventCategoryOptions();
  renderBudgetCategoryManager();
  renderBudgetCategoryHub();
  renderBudgetTransactionCategoryFilter();
});

eventCatDDButton?.addEventListener("click", (e) => {
  e.stopPropagation();
  eventCatDD?.classList.toggle("open");
});

eventCatDDMenu?.addEventListener("click", (e) => {
  const item = e.target.closest(".ddItem");
  if(!item) return;

  const cat = getBudgetCategory(item.dataset.categoryId);

  eventCategory.value = cat.id;
  eventCatDD?.classList.remove("open");
  renderEventCategoryOptions();
});

document.addEventListener("click", (e) => {
  if(!eventCatDD?.contains(e.target)){
    eventCatDD?.classList.remove("open");
  }
});

const budgetFilterCategoryDD = document.getElementById("budgetFilterCategoryDD");
const budgetFilterCategoryBtn = document.getElementById("budgetFilterCategoryBtn");
const budgetFilterTypeDD = document.getElementById("budgetFilterTypeDD");
const budgetFilterTypeBtn = budgetFilterTypeDD?.querySelector(".ddButton");

function closeBudgetFilterDropdowns(){
  budgetFilterCategoryDD?.classList.remove("open");
  budgetFilterTypeDD?.classList.remove("open");
}

budgetFilterCategoryBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  budgetFilterTypeDD?.classList.remove("open");
  budgetFilterCategoryDD?.classList.toggle("open");
});

budgetFilterTypeBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  budgetFilterCategoryDD?.classList.remove("open");
  budgetFilterTypeDD?.classList.toggle("open");
});

const BUDGET_REPEAT_LABELS = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  weeklyDays: "Weekly (pick days)",
  monthly: "Monthly",
  yearly: "Yearly",
};

const budgetTxSearch =
  document.getElementById("budgetTxSearch");

budgetTxSearch?.addEventListener("input", () => {
  budgetTransactionFilter.search =
    budgetTxSearch.value.trim().toLowerCase();

  renderBudgetPage();
});

document.addEventListener("click", (e) => {

  const categoryItem =
    e.target.closest("[data-category]");

  if(categoryItem){
    budgetTransactionFilter.category =
      categoryItem.dataset.category;

    renderBudgetTransactionCategoryFilter();
    renderBudgetPage();
  }

  const typeItem =
    e.target.closest("[data-type]");

  if(typeItem){
    budgetTransactionFilter.type =
      typeItem.dataset.type;

    const label =
      document.getElementById("budgetFilterTypeLabel");

    if(label){
      label.textContent = typeItem.textContent;
    }

    renderBudgetPage();
  }

if(
  !budgetFilterCategoryDD?.contains(e.target) &&
  !budgetFilterTypeDD?.contains(e.target)
){
  closeBudgetFilterDropdowns();
}
if(categoryItem){
  budgetTransactionFilter.category = categoryItem.dataset.category;

  renderBudgetTransactionCategoryFilter();
  renderBudgetPage();
  closeBudgetFilterDropdowns();
}
if(typeItem){
  budgetTransactionFilter.type = typeItem.dataset.type;

  const label = document.getElementById("budgetFilterTypeLabel");

  if(label){
    label.textContent = typeItem.textContent;
  }

  renderBudgetPage();
  closeBudgetFilterDropdowns();
}

});

function updateBudgetRepeatMenuSelection(v){
  budgetRepeatDDMenu?.querySelectorAll(".ddItem").forEach(btn => {
    btn.setAttribute("aria-selected", btn.dataset.value === v ? "true" : "false");
  });
}

function setBudgetRepeatValue(value){
  const v = BUDGET_REPEAT_LABELS[value] ? value : "none";

  if(budgetRepeat) budgetRepeat.value = v;
  if(budgetRepeatDDLabel) budgetRepeatDDLabel.textContent = BUDGET_REPEAT_LABELS[v];

  updateBudgetRepeatMenuSelection(v);

  budgetWeeklyIntervalRow?.classList.toggle(
    "hidden",
    !(v === "weekly" || v === "weeklyDays")
  );

  budgetWeeklyDaysRow?.classList.toggle(
    "hidden",
    v !== "weeklyDays"
  );

  budgetRepeatUntilCol?.classList.toggle(
    "hidden",
    v === "none"
  );

  if(v === "none" && budgetRepeatUntil){
    budgetRepeatUntil.value = "";
  }
}

function closeBudgetRepeatDropdown(){
  budgetRepeatDD?.classList.remove("open");
}

budgetRepeatDDButton?.addEventListener("click", (e) => {
  e.stopPropagation();
  budgetRepeatDD?.classList.toggle("open");
});

budgetRepeatDDMenu?.addEventListener("click", (e) => {
  const btn = e.target.closest(".ddItem");
  if(!btn) return;

  setBudgetRepeatValue(btn.dataset.value);
  closeBudgetRepeatDropdown();
});

budgetWeekdayBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
  });
});

document.addEventListener("click", (e) => {
  if(!budgetRepeatDD?.contains(e.target)){
    closeBudgetRepeatDropdown();
  }
});

setBudgetRepeatValue(budgetRepeat?.value || "none");

budgetTransactionFilters?.classList.add("hidden");

budgetTxFilterToggleBtn?.addEventListener("click", () => {
  const isHidden = budgetTransactionFilters?.classList.toggle("hidden");

  budgetTxFilterToggleBtn.classList.toggle("active", !isHidden);

  if(!isHidden){
    budgetTxSearch?.focus();
  }
});

// ============================================================================
// 09. SMART SUGGESTIONS
// ============================================================================

function daysBetweenISO(a, b){
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);

  const utcA = Date.UTC(ay, am - 1, ad);
  const utcB = Date.UTC(by, bm - 1, bd);

  return Math.round((utcB - utcA) / 86400000);
}

function analyzePatternsRaw(){
  const map = {};

  for (const dayKey of Object.keys(events)) {
    const list = events[dayKey];
    if (!Array.isArray(list)) continue;

    for (const ev of list) {
      if (ev._isOccurrence) continue;
      if ((ev.recurrence?.freq || "none") !== "none") continue;

      const dt = ymdToDate(dayKey);
      const dow = dt.getDay();
      const title = (ev.title || "").trim();
      if (!title) continue;

      const key = [
        title.toLowerCase(),
        ev.startTime || "",
        ev.endTime || "",
        dow
      ].join("|");

      if (!map[key]) {
        map[key] = {
          title,
          startTime: ev.startTime,
          endTime: ev.endTime,
          color: ev.color,
          dow,
          sourceDates: []
        };
      }

      map[key].sourceDates.push(dayKey);
    }
  }

  return Object.values(map).map(p => ({
    ...p,
    sourceDates: p.sourceDates.sort()
  }));
}
function scorePatternForCandidate(pattern, candidateISO){
  const LOOKBACK_DAYS = 75;
  const DECAY_HALF_LIFE = 28;

  const priorDates = pattern.sourceDates.filter(src => src < candidateISO);
  if (priorDates.length < 2) return null;

  let rawCount = 0;
  let score = 0;

  for (const src of priorDates) {
    const ageDays = daysBetweenISO(src, candidateISO);
    if (ageDays < 0 || ageDays > LOOKBACK_DAYS) continue;

    rawCount += 1;
    score += Math.pow(0.5, ageDays / DECAY_HALF_LIFE);
  }

  if (rawCount < 2 || score < 0.95) return null;

  const latestPriorISO = priorDates[priorDates.length - 1];
  return {
    rawCount,
    score,
    latestPriorISO
  };
}

function inferPatternCadenceDays(sourceDates, candidateISO) {

  const prior = sourceDates.filter(d => d < candidateISO).sort();
  if (prior.length < 2) return null;

  const gaps = [];
  for (let i = 1; i < prior.length; i++) {
    gaps.push(daysBetweenISO(prior[i - 1], prior[i]));
  }

  if (!gaps.length) return null;

  const cadenceOptions = [28, 21, 14, 7]; // check longest first

  for (const cadence of cadenceOptions) {

    let matches = 0;

    for (const g of gaps) {
      if (Math.abs(g - cadence) <= 1) matches++;
    }

    if (matches >= 2) {
      return cadence;
    }
  }

  return null;
}

function addDaysISO(iso, days){
  const dt = ymdToDate(iso);
  dt.setDate(dt.getDate() + days);
  return dateToYmd(dt);
}

function detectHabitWeekday(sourceDates){
  if (!sourceDates || sourceDates.length < 3) return null;

  const counts = new Array(7).fill(0);

  for (const iso of sourceDates){
    const d = ymdToDate(iso);
    counts[d.getDay()]++;
  }

  const total = sourceDates.length;

  let bestDow = null;
  let bestScore = 0;

  for (let dow = 0; dow < 7; dow++){
    const score = counts[dow] / total;

    if (score > bestScore){
      bestScore = score;
      bestDow = dow;
    }
  }

  // require at least 60% dominance
  if (bestScore >= 0.6){
    return {
      dow: bestDow,
      confidence: bestScore
    };
  }

  return null;
}

function openEventInEditor(ev, dayISO){
  if(!ev) return;

  const openedUnconnectedWeekEvent = viewMode === "week" && !getEventPrimaryConnectionGroupId(ev);

  if(openedUnconnectedWeekEvent){
    clearConnectionSelection({ silent:true });
  }

  const canPatchWeekSelection = isISOInCurrentRenderedWeek(dayISO);

  selectedDateISO = dayISO;

  if(ev._isOccurrence && ev._masterId){
    const masterDate = findMasterDateById(ev._masterId);
    if(!masterDate){
      alert("Couldn't find the original event for this recurring series.");
      return;
    }
    editBaseDateISO = masterDate;
    selectedEventId = ev._masterId;
    if(editLabel) editLabel.textContent = `Editing series (starts ${masterDate})`;
  } else {
    editBaseDateISO = null;
    selectedEventId = ev.id;
    if(editLabel) editLabel.textContent = "Editing event";
  }

  if(panelTitle) panelTitle.textContent = "Edit day";
  if(panelSub) panelSub.textContent = fmtPrettyISO(dayISO);

  populateFormFromSelected();
  openMobileEditor();
  renderEventList();

  if(openedUnconnectedWeekEvent){
    requestAnimationFrame(() => {
      document
        .querySelector("#weekConnectionRail .draftConnectionRow .weekConnectionNameInput")
        ?.focus({ preventScroll:true });
    });
  }

  if(canPatchWeekSelection){
    refreshWeekSelectionOnly();
  }else{
    render();
  }
}

// ============================================================================
// 10. DRAG & DROP
// ============================================================================
const DRAG_MIME = "application/x-my-calendar-event";

function buildDragPayload(meta){
  return JSON.stringify(meta);
}

function parseDragPayload(dt){
  try{
    const raw = dt.getData(DRAG_MIME) || dt.getData("text/plain");
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;
  }
}


function isCopyModifier(e){
  try{
    return (typeof e.getModifierState === "function" && (e.getModifierState("Alt") || e.getModifierState("Control")))
      || e.altKey || e.ctrlKey;
  }catch{
    return e.altKey || e.ctrlKey;
  }
}

/**
 * Chrome/Edge snapshot the drag image at dragstart and won't repaint it mid-drag.
 * So: if copy-mode is armed at dragstart, we set a custom drag image that visually shows "stacked pills".
 */
function setCustomDragImage(e, pillEl, copyMode){
  if(!e?.dataTransfer || !pillEl) return;

  // Clone the pill so we can style it independently as the drag preview.
  const clone = pillEl.cloneNode(true);
  clone.classList.add("dragImage");
  if(copyMode) clone.classList.add("dragCopyVisual");

  // Put it off-screen (must be in DOM for setDragImage to work reliably).
  clone.style.position = "fixed";
  clone.style.left = "-1000px";
  clone.style.top = "-1000px";
  clone.style.pointerEvents = "none";
  clone.style.margin = "0";

  document.body.appendChild(clone);

  // Offset the cursor a bit so it doesn't sit under the pointer.
  const xOff = 24;
  const yOff = 18;
  try{
    e.dataTransfer.setDragImage(clone, xOff, yOff);
  }catch{
    // If it fails, we just fall back to browser default drag image.
  }

  // Clean up right after the drag image is captured.
  setTimeout(() => clone.remove(), 0);
}

function findEventStorageKeyById(eventId){
  for(const k of Object.keys(events)){
    const list = events[k];
    if(Array.isArray(list) && list.some(e => e.id === eventId)) return k;
  }
  return null;
}

function ensureDayList(iso){
  if(!events[iso]) events[iso] = [];
  if(!Array.isArray(events[iso])) events[iso] = [];
  return events[iso];
}

function moveEventToDay({ eventId, sourceISO, targetISO }){
  if(!eventId || !targetISO) return false;
  if(sourceISO === targetISO) return false;

  const storageKey = sourceISO || findEventStorageKeyById(eventId);
  if(!storageKey) return false;

  const srcList = ensureDayList(storageKey);
  const idx = srcList.findIndex(e => e.id === eventId);
  if(idx < 0) return false;

  const before = snapshotBeforeChange();
  const ev = srcList[idx];

  srcList.splice(idx, 1);
  events[storageKey] = srcList;

  const moved = { ...ev, startDate: targetISO };

  const dstList = ensureDayList(targetISO);
  dstList.push(moved);
  events[targetISO] = dstList;

  saveEvents(before);
  syncStateFromLegacy();
  return true;
}

function moveOccurrenceToDay({ masterId, occursOnISO, targetISO }){
  if(!masterId || !occursOnISO || !targetISO) return false;
  if(occursOnISO === targetISO) return false;

  const masterKey = findMasterDateById(masterId);
  if(!masterKey) return false;

  const masterList = ensureDayList(masterKey);
  const midx = masterList.findIndex(e => e.id === masterId);
  if(midx < 0) return false;

  const before = snapshotBeforeChange();
  const master = masterList[midx];

  // 1) Add exception so the series DOESN'T show on the old day
  const ex = Array.isArray(master.recurrence?.exceptions) ? [...master.recurrence.exceptions] : [];
  if(!ex.includes(occursOnISO)) ex.push(occursOnISO);

  masterList[midx] = {
    ...master,
    recurrence: {
      ...(master.recurrence || {}),
      exceptions: ex
    }
  };
  events[masterKey] = masterList;

  // 2) Create a standalone event on the new day (a “moved instance”)
  const cloned = {
    id: cryptoId(),
    title: master.title,
    details: master.details,
    color: master.color,
    startTime: master.startTime,
    endTime: master.endTime,
    startDate: targetISO,
    recurrence: { freq: "none", until: "", interval: 1, exceptions: [] }
  };

  const dstList = ensureDayList(targetISO);
  dstList.push(cloned);
  events[targetISO] = dstList;

  saveEvents(before);
  syncStateFromLegacy();
  return true;
}

function duplicateEventToDay({ eventId, sourceISO, targetISO }){
  if(!eventId || !targetISO) return false;

  const storageKey = sourceISO || findEventStorageKeyById(eventId);
  if(!storageKey) return false;

  const srcList = ensureDayList(storageKey);
  const ev = srcList.find(e => e.id === eventId);
  if(!ev) return false;

  const before = snapshotBeforeChange();

  const cloned = {
    ...ev,
    id: cryptoId(),
    startDate: targetISO,
    recurrence: { freq: "none", until: "", interval: 1, exceptions: [] }
  };

  const dstList = ensureDayList(targetISO);
  dstList.push(cloned);
  events[targetISO] = dstList;

  saveEvents(before);
  syncStateFromLegacy();
  return true;
}

function duplicateOccurrenceToDay({ masterId, targetISO }){
  if(!masterId || !targetISO) return false;

  const masterKey = findMasterDateById(masterId);
  if(!masterKey) return false;

  const masterList = ensureDayList(masterKey);
  const master = masterList.find(e => e.id === masterId);
  if(!master) return false;

  const before = snapshotBeforeChange();

  const cloned = {
    id: cryptoId(),
    title: master.title,
    details: master.details,
    color: master.color,
    startTime: master.startTime,
    endTime: master.endTime,
    startDate: targetISO,
    recurrence: { freq: "none", until: "", interval: 1, exceptions: [] }
  };

  const dstList = ensureDayList(targetISO);
  dstList.push(cloned);
  events[targetISO] = dstList;

  saveEvents(before);
  syncStateFromLegacy();
  return true;
}

function handleDropOnDay(targetISO, payload, opts = {}){
  if(!payload || !targetISO) return;
  const duplicate = !!opts.duplicate;

  const finish = () => {
    editBaseDateISO = null;
    selectedEventId = null;

    selectDate(targetISO);

    const ps = document.getElementById("panelSub");
    if(ps) ps.textContent = fmtPrettyISO(targetISO);
  };

  if(payload.kind === "occurrence"){
    const ok = duplicate
      ? duplicateOccurrenceToDay({
          masterId: payload.masterId,
          targetISO
        })
      : moveOccurrenceToDay({
          masterId: payload.masterId,
          occursOnISO: payload.occursOnISO,
          targetISO
        });

    if(ok){
      clearGhost?.();
      finish();
    }
    return;
  }

  if(payload.kind === "event"){
    const ok = duplicate
      ? duplicateEventToDay({
          eventId: payload.eventId,
          sourceISO: payload.sourceISO,
          targetISO
        })
      : moveEventToDay({
          eventId: payload.eventId,
          sourceISO: payload.sourceISO,
          targetISO
        });

    if(ok){
      clearGhost?.();
      finish();
    }
  }
}

let timeDragState = null;
let timeResizeState = null;
let dayDragTimeGhost = null;

function beginDayTimeDrag(e, ev, dayISO, pillEl, dayEl){
  if(viewMode !== "day") return;
  if(!ev || !pillEl || !dayEl) return;
  if(e.button !== 0) return;

  // do not start time-drag on recurring occurrences for now
  if(ev._isOccurrence) return;

  const baseKey = dayISO;
  const list = getEventsForDay(baseKey);
  const stored = list.find(x => x.id === ev.id);
  if(!stored) return;

  const spanInfo = getEventSpanInfo(stored);
const startMins = spanInfo.start;
const durationMins = spanInfo.duration;

  const rect = pillEl.getBoundingClientRect();
  const grabOffsetY = e.clientY - rect.top;

  const metrics = getTimelineMetrics(dayEl);

    timeDragState = {
    eventId: stored.id,
    dayISO,
    baseKey,
    pillEl,
    dayEl,
    grabOffsetY,
    originalStartMins: startMins,
    durationMins,
    metrics
  };

  pillEl.classList.add("timeDragging");
  dayEl.classList.add("timeDragActive");
  document.body.classList.add("timeDraggingBody");

  e.preventDefault();
  e.stopPropagation();
}

function onDayTimeDragMove(e){
  if(!timeDragState) return;

  const { dayEl, pillEl, grabOffsetY, durationMins, metrics } = timeDragState;
  const dayRect = dayEl.getBoundingClientRect();

  const rawY = e.clientY - dayRect.top - grabOffsetY;
  const yWithinTimeline = clamp(rawY - metrics.top, 0, metrics.height);
  const pct = metrics.height > 0 ? (yWithinTimeline / metrics.height) : 0;

  const totalMinutes = 24 * 60;
  const rawStartMins = pct * totalMinutes;

  const safeDuration = clamp(durationMins, 15, MAX_EVENT_DURATION_MINS);
  const durationLimitHit = safeDuration !== durationMins;

  const originalStartMins = timeDragState.originalStartMins ?? 0;
  const steppedStart = snapDeltaFromAnchor(originalStartMins, rawStartMins);

  const clampedStart = clamp(steppedStart, 0, totalMinutes - 15);

  setPreviewPillGeometry(pillEl, metrics, clampedStart, safeDuration);
  setPreviewPillTimeText(pillEl, clampedStart, safeDuration);

  timeDragState.previewStartMins = clampedStart;
  showDayDragTimeGhost(e.clientX, e.clientY, clampedStart, safeDuration);
  setDayDurationLimitFeedback(pillEl, durationLimitHit);
}


function endDayTimeDrag(){
  if(!timeDragState) return;

  const { baseKey, eventId, previewStartMins, durationMins, pillEl, dayEl } = timeDragState;

  if(typeof previewStartMins === "number"){
  const before = snapshotBeforeChange();
  const ok = updateEventTimeById(baseKey, eventId, previewStartMins, durationMins);
  if(ok){
    saveEvents(before);
    syncStateFromLegacy();

    if(selectedEventId === eventId && getEditDateKey() === baseKey){
      populateFormFromSelected();
    }

    renderEventList();
    render();
  }
}

  pillEl?.classList.remove("timeDragging");
  pillEl?.classList.remove("durationLimitHit");
  dayEl?.classList.remove("timeDragActive");
  document.body.classList.remove("timeDraggingBody");
hideDayDragTimeGhost();
  timeDragState = null;
}

function beginDayTimeResize(e, ev, dayISO, pillEl, dayEl, edge){
  if(viewMode !== "day") return;
  if(!ev || !pillEl || !dayEl) return;
  if(e.button !== 0) return;
  if(ev._isOccurrence) return;
  if(edge !== "top" && edge !== "bottom") return;

  const isCarryover = !!ev._isCarryoverSegment;

  // Overnight start segment: top only
  if(!isCarryover && ev._overnight && edge !== "top") return;

  // Overnight carryover segment: bottom only
  if(isCarryover && edge !== "bottom") return;

  const baseKey = ev._segmentBaseDate || dayISO;
  const list = getEventsForDay(baseKey);
  const stored = list.find(x => x.id === ev.id);
  if(!stored) return;

  const spanInfo = getEventSpanInfo(stored);
  const startMins = spanInfo.start;
  const durationMins = spanInfo.duration;

   timeResizeState = {
    eventId: stored.id,
    baseKey,
    dayISO,
    pillEl,
    dayEl,
    edge,
    isCarryoverSegment: !!ev._isCarryoverSegment,
    originalStartMins: startMins,
    originalDurationMins: durationMins,
    metrics: getTimelineMetrics(dayEl)
  };

  pillEl.classList.add("timeResizing");
  dayEl.classList.add("timeResizeActive");
  document.body.classList.add("timeDraggingBody");

  e.preventDefault();
  e.stopPropagation();
}

function onDayTimeResizeMove(e){
  if(!timeResizeState) return;

  const {
    pillEl,
    dayEl,
    edge,
    metrics,
    originalStartMins,
    originalDurationMins,
    isCarryoverSegment
  } = timeResizeState;

  const dayRect = dayEl.getBoundingClientRect();
  const rawY = e.clientY - dayRect.top;
  const yWithinTimeline = clamp(rawY - metrics.top, 0, metrics.height);
  const pct = metrics.height > 0 ? (yWithinTimeline / metrics.height) : 0;

  const totalMinutes = 24 * 60;
  const rawPointerMins = pct * totalMinutes;

  let nextStart = originalStartMins;
  let nextDuration = originalDurationMins;

  let previewSegmentStart = originalStartMins;
  let previewSegmentDuration = originalDurationMins;

  let durationLimitHit = false;

  const originalEndTotal = originalStartMins + originalDurationMins;

  if(edge === "top"){
    const maxStart = originalEndTotal - 15;
    const minStart = Math.max(0, originalEndTotal - MAX_EVENT_DURATION_MINS);

    const steppedStart = snapDeltaFromAnchor(originalStartMins, rawPointerMins);
    const clampedStart = clamp(steppedStart, minStart, maxStart);
    durationLimitHit = clampedStart !== steppedStart;

    nextStart = clampedStart;
    nextDuration = originalEndTotal - nextStart;

    previewSegmentStart = nextStart;
    previewSegmentDuration = Math.min(nextDuration, totalMinutes - nextStart);
  } else {
    if(isCarryoverSegment){
      const originalCarryEnd = originalEndTotal - totalMinutes;
      const maxCarryEnd = Math.min(totalMinutes, originalStartMins);

      const steppedCarryEnd = snapDeltaFromAnchor(originalCarryEnd, rawPointerMins);
      const carryEnd = clamp(steppedCarryEnd, 15, maxCarryEnd);
      durationLimitHit = carryEnd !== steppedCarryEnd;

      nextStart = originalStartMins;
      nextDuration = (totalMinutes - originalStartMins) + carryEnd;

      previewSegmentStart = 0;
      previewSegmentDuration = carryEnd;
    } else {
      let rawEndTotal = rawPointerMins;
      if(rawEndTotal <= originalStartMins){
        rawEndTotal += totalMinutes;
      }

      const steppedEndTotal = snapDeltaFromAnchor(originalEndTotal, rawEndTotal);

      const minEndTotal = originalStartMins + 15;
      const maxEndTotal = originalStartMins + MAX_EVENT_DURATION_MINS;

      const clampedEndTotal = clamp(steppedEndTotal, minEndTotal, maxEndTotal);
      durationLimitHit = clampedEndTotal !== steppedEndTotal;

      nextDuration = clampedEndTotal - originalStartMins;
      nextStart = originalStartMins;

      previewSegmentStart = nextStart;
      previewSegmentDuration = Math.min(nextDuration, totalMinutes - nextStart);
    }
  }

  nextDuration = clamp(Math.max(15, nextDuration), 15, MAX_EVENT_DURATION_MINS);
  previewSegmentDuration = Math.max(15, previewSegmentDuration);

  setPreviewPillGeometry(pillEl, metrics, previewSegmentStart, previewSegmentDuration);
  setPreviewPillTimeText(pillEl, nextStart, nextDuration);

  timeResizeState.previewStartMins = nextStart;
  timeResizeState.previewDurationMins = nextDuration;

  showDayDragTimeGhost(e.clientX, e.clientY, nextStart, nextDuration);
  setDayDurationLimitFeedback(pillEl, durationLimitHit);
}

function endDayTimeResize(){
  if(!timeResizeState) return;

  const {
    baseKey,
    eventId,
    pillEl,
    dayEl,
    previewStartMins,
    previewDurationMins,
    originalStartMins,
    originalDurationMins
  } = timeResizeState;

  const finalStart = (typeof previewStartMins === "number")
    ? previewStartMins
    : originalStartMins;

  const finalDuration = (typeof previewDurationMins === "number")
    ? previewDurationMins
    : originalDurationMins;

const before = snapshotBeforeChange();
  const ok = updateEventTimeById(baseKey, eventId, finalStart, finalDuration);
  if(ok){
    saveEvents(before);
    syncStateFromLegacy();

    if(selectedEventId === eventId && getEditDateKey() === baseKey){
      populateFormFromSelected();
    }

    renderEventList();
    render();
  }

  pillEl?.classList.remove("timeResizing");
pillEl?.classList.remove("durationLimitHit");
  dayEl?.classList.remove("timeResizeActive");
  document.body.classList.remove("timeDraggingBody");
  hideDayDragTimeGhost();
  timeResizeState = null;
}

window.addEventListener("pointermove", (e) => {
  onDayTimeDragMove(e);
  onDayTimeResizeMove(e);
});

window.addEventListener("pointerup", () => {
  endDayTimeDrag();
  endDayTimeResize();
});

window.addEventListener("pointercancel", () => {
  endDayTimeDrag();
  endDayTimeResize();
});
// ============================================================================
// 10B. DRAG GHOST PREVIEW
// ============================================================================
let altDown = false;
let activeDragPayload = null;
let dragCopyPrimed = false;

// Track Alt globally because DragEvent.altKey is unreliable during dragover in some browsers.
document.addEventListener("keydown", (e) => {
  if (e.key === "Alt" || e.altKey) {
    if (!altDown) {
      altDown = true;
      if (activeGhostDay && activeDragPayload) {
        showGhost(activeGhostDay, activeDragPayload, { copy: true });
      }
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Alt") {
    if (altDown) {
      altDown = false;
      if (activeGhostDay && activeDragPayload) {
        showGhost(activeGhostDay, activeDragPayload, { copy: false });
      }
    }
  }
});

let activeGhostDay = null;
let isDragging = false;

function setGhostCopyVisual(on){
  if(!activeGhostDay) return;
  const g = activeGhostDay.querySelector(".ghostPill");
  if(!g) return;
  g.classList.toggle("ghostCopy", !!on);
}

function clearGhost(){
  if(activeGhostDay){
    const g = activeGhostDay.querySelector(".ghostPill");
    if(g) g.remove();
    activeGhostDay = null;
  }
}

function showGhost(dayEl, payload, opts = {}){
  if(!dayEl || !payload) return;

  clearGhost();
  activeGhostDay = dayEl;

  const ghost = document.createElement("div");
  ghost.className = "ghostPill" + (opts.copy ? " ghostCopy" : "");

  let title = "Event";
  let time = "";

  if(payload.kind === "event"){
    const srcKey = payload.sourceISO;
    const srcList = events[srcKey] || [];
    const ev = srcList.find(e => e.id === payload.eventId);
    if(ev){
      title = ev.title || title;
      time = formatTimeRange(ev.startTime, ev.endTime);
      ghost.style.background = hexToRgba(ev.color, 0.18);
      ghost.style.borderColor = hexToRgba(ev.color, 0.45);
    }
  }

  if(payload.kind === "occurrence"){
    const masterKey = findMasterDateById(payload.masterId);
    const masterList = events[masterKey] || [];
    const ev = masterList.find(e => e.id === payload.masterId);
    if(ev){
      title = ev.title || title;
      time = formatTimeRange(ev.startTime, ev.endTime);
      ghost.style.background = hexToRgba(ev.color, 0.18);
      ghost.style.borderColor = hexToRgba(ev.color, 0.45);
    }
  }

  ghost.innerHTML = `
    <div class="ghostFront">
      <div class="pillTitle">${escapeHtml(title)}</div>
      <div class="pillTime">${escapeHtml(time)}</div>
    </div>
  `;

  const header = dayEl.querySelector(".dayHeader");
  if(header && header.nextSibling){
    dayEl.insertBefore(ghost, header.nextSibling);
  }else{
    dayEl.appendChild(ghost);
  }
}

document.addEventListener("dragstart", (e) => {
  isDragging = true;
  // Some browsers do not update modifier keys during dragover/drag.
  // Capture the user’s intent at dragstart (works if Alt is held BEFORE starting the drag).
  dragCopyPrimed = !!(e?.altKey || e?.ctrlKey || e?.metaKey || altDown);
});
document.addEventListener("dragend", () => {
  isDragging = false;
  activeDragPayload = null;
  dragCopyPrimed = false;
  clearGhost();
});
document.addEventListener("drag", (e) => {
  if(!isDragging || !activeGhostDay) return;

  const copyMode =
    dragCopyPrimed ||
    ((typeof e.getModifierState === "function" && (e.getModifierState("Alt") || e.getModifierState("Control"))) || e.altKey || e.ctrlKey || altDown);

  // Flip the ghost’s visuals without recreating it
  setGhostCopyVisual(copyMode);
});


function parseClockToMinutes(str){
  const s = (str||"").toUpperCase().trim();
  if(!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if(!m) return null;
  let h = parseInt(m[1],10);
  let min = parseInt(m[2],10);
  const ap = m[3];
  if(!(h>=1 && h<=12 && min>=0 && min<=59)) return null;
  if(ap === "AM"){ if(h === 12) h = 0; }
  else { if(h !== 12) h += 12; }
  return h*60 + min;
}

function formatTimeRange(startStr, endStr){
  if(!startStr && !endStr) return "";
  if(startStr && !endStr) return startStr;
  if(!startStr && endStr) return endStr;

  const sMin = parseClockToMinutes(startStr);
  const eMin = parseClockToMinutes(endStr);
  if(sMin === null || eMin === null) return `${startStr} - ${endStr}`;

  const sIsPM = sMin >= 12*60;
  const eIsPM = eMin >= 12*60;

  const fmt = (mins, showSuffix) => {
    let h24 = Math.floor(mins/60);
    let m = mins%60;
    const suffix = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if(h12 === 0) h12 = 12;
    return `${h12}:${pad2(m)}${showSuffix ? " " + suffix : ""}`;
  };

  if(sIsPM === eIsPM) return `${fmt(sMin,false)}–${fmt(eMin,true)}`;
  return `${fmt(sMin,true)}–${fmt(eMin,true)}`;
}

function sortByTimeThenTitle(list){
  return [...list].sort((a,b) => {
    const am = parseClockToMinutes(a.startTime||"") ?? 999999;
    const bm = parseClockToMinutes(b.startTime||"") ?? 999999;
    if(am !== bm) return am - bm;
    return (a.title||"").toLowerCase().localeCompare((b.title||"").toLowerCase());
  });
}

function getEventMinutes(ev){
  if(typeof ev._segmentStart === "number" && typeof ev._segmentEnd === "number"){
    return { start: ev._segmentStart, end: ev._segmentEnd };
  }

  const span = getEventSpanInfo(ev);

  if(span.overnight){
    return { start: span.start, end: 24 * 60 };
  }

  return { start: span.start, end: span.end };
}

function buildOverlapColumns(list){
  const items = list.map(ev => {
    const { start, end } = getEventMinutes(ev);
    return { ev, start, end, col: 0, cols: 1 };
  });

  items.sort((a, b) => {
    if(a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });

  let group = [];
  let groupEnd = -1;

  function flushGroup(){
    if(!group.length) return;

    const colEnds = [];

    for(const item of group){
      let placed = false;

      for(let c = 0; c < colEnds.length; c++){
        if(item.start >= colEnds[c]){
          item.col = c;
          colEnds[c] = item.end;
          placed = true;
          break;
        }
      }

      if(!placed){
        item.col = colEnds.length;
        colEnds.push(item.end);
      }
    }

    const totalCols = colEnds.length;
    for(const item of group){
      item.cols = totalCols;
    }

    group = [];
    groupEnd = -1;
  }

  for(const item of items){
    if(!group.length){
      group.push(item);
      groupEnd = item.end;
      continue;
    }

    if(item.start < groupEnd){
      group.push(item);
      groupEnd = Math.max(groupEnd, item.end);
    } else {
      flushGroup();
      group.push(item);
      groupEnd = item.end;
    }
  }

  flushGroup();
  return items;
}

function getAmPm(groupEl){
  return (groupEl?.dataset?.value || "am");
}

function setAmPm(groupEl, value){
  if(!groupEl) return;
  const v = (value === "pm") ? "pm" : "am";
  groupEl.dataset.value = v;
  groupEl.querySelectorAll(".ampmBtn").forEach(b => {
    b.classList.toggle("active", b.dataset.value === v);
  });
}

setAmPm(startAmPm, "am");
setAmPm(endAmPm, "am");
[startAmPm, endAmPm].forEach(group => {
  group?.addEventListener("click", (e) => {
    const btn = e.target.closest(".ampmBtn");
    if(!btn) return;
    setAmPm(group, btn.dataset.value);
  });
});

function normalizeClock(clockStr, ampm){
  const raw = (clockStr||"").trim();
  if(!raw) return "";
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if(!m) return "";
  let h = parseInt(m[1],10);
  let min = parseInt(m[2] ?? "0",10);
  if(!(h>=1 && h<=12 && min>=0 && min<=59)) return "";
  const suffix = (ampm === "pm") ? "PM" : "AM";
  return `${h}:${pad2(min)} ${suffix}`;
}

function minutesToClockString(totalMins){
  let mins = Math.max(0, Math.min(24 * 60 - 1, totalMins));
  let h24 = Math.floor(mins / 60);
  const m = mins % 60;

  const suffix = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if(h12 === 0) h12 = 12;

  return `${h12}:${pad2(m)} ${suffix}`;
}

function roundToQuarter(mins){
  return roundToDragStep(mins);
}

function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

function nextDayISO(iso){
  const dt = ymdToDate(iso);
  dt.setDate(dt.getDate() + 1);
  return dateToYmd(dt);
}

function prevDayISO(iso){
  const dt = ymdToDate(iso);
  dt.setDate(dt.getDate() - 1);
  return dateToYmd(dt);
}

function getEventSpanInfo(ev){
  const start = parseClockToMinutes(ev.startTime || "") ?? (6 * 60);
  let end = parseClockToMinutes(ev.endTime || "");

  if(end === null){
    end = start + 60;
  }

  const overnight = end <= start;
  const duration = overnight ? ((24 * 60 - start) + end) : (end - start);

  return {
    start,
    end,
    overnight,
    duration: clamp(Math.max(15, duration), 15, MAX_EVENT_DURATION_MINS)
  };
}

function getSegmentDisplayTime(ev){
  if(ev._segmentKind === "carryover"){
    return `${ev.startTime}–${ev.endTime}`;
  }

  // On the first day of an overnight event, show the FULL range,
  // even though the visible block only covers the portion before midnight.
  if(ev._segmentKind === "start" && ev._overnight){
    return `${ev.startTime}–${ev.endTime}`;
  }

  return formatTimeRange(ev.startTime, ev.endTime);
}

function getDayViewSegments(dayISO){
  const segments = [];

  const todays = sortByTimeThenTitle(
    getComputedEventsForDay(dayISO).filter(ev => !(ev?.span?.mode === "bg"))
  );

  for(const ev of todays){
    const span = getEventSpanInfo(ev);

    if(span.overnight){
      segments.push({
        ...ev,
        _segmentKind: "start",
        _segmentBaseDate: dayISO,
        _segmentStart: span.start,
        _segmentEnd: 24 * 60,
        _segmentDuration: (24 * 60) - span.start,
        _overnight: true
      });
    } else {
      segments.push({
        ...ev,
        _segmentKind: "sameDay",
        _segmentBaseDate: dayISO,
        _segmentStart: span.start,
        _segmentEnd: span.end,
        _segmentDuration: span.end - span.start,
        _overnight: false
      });
    }
  }

  const yesterdayISO = prevDayISO(dayISO);
  const yesterdays = getComputedEventsForDay(yesterdayISO).filter(ev => !(ev?.span?.mode === "bg"));

  for(const ev of yesterdays){
    const span = getEventSpanInfo(ev);
    if(!span.overnight) continue;

    segments.push({
      ...ev,
      _segmentKind: "carryover",
      _segmentBaseDate: yesterdayISO,
      _segmentStart: 0,
      _segmentEnd: span.end,
      _segmentDuration: span.end,
      _isCarryoverSegment: true,
      _overnight: true
    });
  }

  return segments.sort((a, b) => {
    if(a._segmentStart !== b._segmentStart) return a._segmentStart - b._segmentStart;
    return (a.title || "").localeCompare(b.title || "");
  });
}

function getTimelineMetrics(dayEl){
  const cs = getComputedStyle(dayEl);
  const top = parseFloat(cs.getPropertyValue("--timeline-top")) || 88;
  const bottom = parseFloat(cs.getPropertyValue("--timeline-bottom")) || 18;
  const height = dayEl.clientHeight - top - bottom;
  return { top, bottom, height };
}

function ensureDayDragTimeGhost(){
  if(dayDragTimeGhost) return dayDragTimeGhost;

  dayDragTimeGhost = document.createElement("div");
  dayDragTimeGhost.className = "dayDragTimeGhost";
  dayDragTimeGhost.style.display = "none";
  document.body.appendChild(dayDragTimeGhost);
  return dayDragTimeGhost;
}

function showDayDragTimeGhost(x, y, startMins, durationMins){
  const ghost = ensureDayDragTimeGhost();

  const totalMinutes = 24 * 60;
  const startLabel = minutesToClockString(startMins);
  const endTotal = startMins + durationMins;
  const endLabel = minutesToClockString(endTotal % totalMinutes);

  if(endTotal > totalMinutes){
    ghost.dataset.baseText = `${startLabel}–${endLabel}`;
  } else {
    ghost.dataset.baseText = formatTimeRange(startLabel, endLabel);
  }

  ghost.textContent = ghost.dataset.baseText;
  ghost.style.left = `${x + 16}px`;
  ghost.style.top = `${y - 12}px`;
  ghost.style.display = "block";
}

function hideDayDragTimeGhost(){
  if(dayDragTimeGhost){
    dayDragTimeGhost.style.display = "none";
    dayDragTimeGhost.textContent = "";
    delete dayDragTimeGhost.dataset.baseText;
    dayDragTimeGhost.classList.remove("limitHit");
  }
}

function updateEventTimeById(baseKey, eventId, newStartMins, durationMins){
  const list = getEventsForDay(baseKey);
  const idx = list.findIndex(e => e.id === eventId);
  if(idx < 0) return false;

    const safeDuration = clamp(Math.max(15, durationMins), 15, MAX_EVENT_DURATION_MINS);
    const safeStart = clamp(newStartMins, 0, (24 * 60) - 15);

  const endTotal = safeStart + safeDuration;
  const endClock = endTotal % (24 * 60);

  list[idx] = {
    ...list[idx],
    startTime: minutesToClockString(safeStart),
    endTime: minutesToClockString(endClock)
  };

  events[baseKey] = list;
  return true;
}

function setPreviewPillTimeText(pillEl, startMins, durationMins){
  const timeEl = pillEl?.querySelector(".pillTime");
  if(!timeEl) return;

  const totalMinutes = 24 * 60;
  const startLabel = minutesToClockString(startMins);
  const endTotal = startMins + durationMins;
  const endLabel = minutesToClockString(endTotal % totalMinutes);

  if(endTotal > totalMinutes){
    timeEl.textContent = `${startLabel}–${endLabel}`;
  } else {
    timeEl.textContent = formatTimeRange(startLabel, endLabel);
  }
}

function setPreviewPillGeometry(pillEl, metrics, startMins, durationMins){
  const totalMinutes = 24 * 60;
  const endTotal = startMins + durationMins;
  const wrapsOvernight = endTotal > totalMinutes;

  const visibleDuration = wrapsOvernight
    ? (totalMinutes - startMins)
    : durationMins;

  const heightPct = (visibleDuration / totalMinutes) * 100;
  const topPct = (startMins / totalMinutes) * 100;

  pillEl.style.top = `calc(${metrics.top}px + (${topPct} / 100) * ${metrics.height}px)`;
  pillEl.style.height = `calc((${heightPct} / 100) * ${metrics.height}px)`;
}

function setDayDurationLimitFeedback(pillEl, limited){
  if(pillEl){
    pillEl.classList.toggle("durationLimitHit", !!limited);
  }

  const ghost = document.querySelector(".dayDragTimeGhost");
  if(!ghost) return;

  ghost.classList.toggle("limitHit", !!limited);

  const baseText = ghost.dataset.baseText || ghost.textContent || "";
  if(limited){
    ghost.textContent = `${baseText} • Max 24h`;
  } else {
    ghost.textContent = baseText;
  }
}

// ============================================================================
// 11. STORAGE NORMALIZATION + SAVE PIPELINE
// ============================================================================
function loadEvents(){
  return getLocalPayload(); // {updatedAt, events}
}

function toEvent(obj){
  const legacyTime = (obj?.time ?? "").toString().trim();
  const startTime = (obj?.startTime ?? "").toString().trim() || legacyTime;
  const endTime = (obj?.endTime ?? "").toString().trim();

  const color = (obj?.color ?? DEFAULT_COLOR).toString().trim();
  const freq = (obj?.recurrence?.freq ?? "none").toString();
  const until = (obj?.recurrence?.until ?? "").toString().trim();
  const interval = Math.max(1, parseInt(obj?.recurrence?.interval ?? "1", 10) || 1);
  const exceptions = Array.isArray(obj?.recurrence?.exceptions) ? obj.recurrence.exceptions : [];

const days = Array.isArray(obj?.recurrence?.days)
  ? obj.recurrence.days.map(Number).filter(n => n >= 0 && n <= 6)
  : [];

  // Optional: background range shading ("trip" style)
  const spanMode = (obj?.span?.mode ?? "").toString().trim();
  const spanEnd = (obj?.span?.end ?? "").toString().trim();
  const span = (spanMode === "bg" && spanEnd) ? { mode: "bg", end: spanEnd } : null;

  const rawConnectionGroup = (obj?.connectionGroupName ?? obj?.connectionGroup ?? "").toString().trim();
  const rawConnectionId = (obj?.connectionGroupId ?? "").toString().trim();
  const connectionGroupIds = Array.isArray(obj?.connectionGroupIds)
    ? obj.connectionGroupIds.map(x => String(x || "").trim()).filter(Boolean)
    : [];

  const connectionGroupId = rawConnectionId || connectionGroupIds[0] || normalizeConnectionGroupId(rawConnectionGroup);
  const connectionColor = (obj?.connectionColor ?? obj?.color ?? DEFAULT_COLOR).toString().trim();
  const connectionLineStyle = normalizeConnectionLineStyle(obj?.connectionLineStyle);
  const connections = normalizeEventConnections(obj, color || DEFAULT_COLOR);
  const primaryConnection = connections[0] || {
    id: connectionGroupId,
    name: rawConnectionGroup || obj?.connectionGroupName || obj?.connectionGroup || "",
    color: connectionColor.startsWith("#") ? connectionColor : (color.startsWith("#") ? color : DEFAULT_COLOR),
    lineStyle: connectionLineStyle
  };

  return {
  id: obj?.id || cryptoId(),
  title: (obj?.title ?? "").toString(),
  details: (obj?.details ?? "").toString(),
  price: Number.isFinite(Number(obj?.price)) ? Number(obj.price) : null,
  source: (obj?.source ?? "calendar").toString(),
categoryId: (obj?.categoryId ?? "other").toString(),
  color: color.startsWith("#") ? color : DEFAULT_COLOR,
  connectionGroupId: primaryConnection?.id || "",
  connectionGroupName: primaryConnection?.name || "",
  connectionGroupIds: connections.length ? connections.map(conn => conn.id) : connectionGroupIds,
  connections,
  connectionColor: primaryConnection?.color || (connectionColor.startsWith("#") ? connectionColor : (color.startsWith("#") ? color : DEFAULT_COLOR)),
  connectionLineStyle: primaryConnection?.lineStyle || connectionLineStyle,
  startTime,
  endTime,
  startDate: (obj?.startDate ?? "").toString(),
  time: legacyTime,
  span,
  recurrence: {
      freq: ["none","daily","weekly","weeklyDays","monthly","yearly"].includes(freq) ? freq : "none",
      until,
      interval,
      exceptions,
days,
    }
  };
}

function normalizeEventsMap(map){
  const out = {};
  const src = (map && typeof map === "object") ? map : {};
  for(const k of Object.keys(src)){
    const v = src[k];
    if(Array.isArray(v)) out[k] = v.map(toEvent);
    else if(v && typeof v === "object") out[k] = [toEvent(v)];
    else out[k] = [];
  }
  return out;
}

function saveEvents(previousEventsSnapshot = null, opts = {}){
  syncStateFromLegacy();
  invalidateDerivedData("events");

  const snapshot = previousEventsSnapshot
    ? cloneEventsMap(previousEventsSnapshot)
    : cloneEventsMap(events);

  if(!isUndoing && !isRedoing){
    undoStack.push({ events: snapshot });

    if(undoStack.length > UNDO_LIMIT){
      undoStack.shift();
    }

    redoStack = [];
  }

  const updatedAt = Number(opts.updatedAt || Date.now());
  const targetedOps = Array.isArray(opts.cloudOps)
    ? opts.cloudOps.filter(Boolean)
    : [];

  if(targetedOps.length){
    applyIndexedDbEventRecordOpsDebounced(targetedOps);
  }

  setLocalPayload(
    { updatedAt, events },
    {
      skipCloudPending: targetedOps.length > 0 || !!opts.skipCloudPending,
      skipIndexedDbSliceWrite: targetedOps.length > 0
    }
  );

  if(targetedOps.length){
    markCloudRecordOpsPending(opts.reason || "event change", ["events"], targetedOps);
  }

  syncWriteDebounced();
  cloudWriteDebounced();
  updateHistoryUI();
}

// ============================================================================
// 11B. RECURRENCE ENGINE
// ============================================================================
function recurrenceMatches(master, targetISO){
  const r = master?.recurrence;
  if(!r || !r.freq || r.freq === "none") return false;
const freq = r.freq;
  const start = master.startDate;
  if(!start) return false;

  if(targetISO < start) return false;
  if(r.until && targetISO > r.until) return false;

  const startDt = ymdToDate(start);
  const targetDt = ymdToDate(targetISO);

  if(r.freq === "daily") return true;

  if(r.freq === "weekly"){
    if(targetDt.getDay() !== startDt.getDay()) return false;
    const interval = Math.max(1, parseInt(r.interval || "1",10) || 1);
    const diffDays = Math.floor((targetDt - startDt) / (1000*60*60*24));
    const diffWeeks = Math.floor(diffDays / 7);
    return (diffWeeks % interval) === 0;
  }

if(freq === "weeklyDays"){
  const interval = Math.max(1, parseInt(r.interval || "1", 10) || 1);

  const days = Array.isArray(r.days) ? r.days : [];
  const dow = ymdToDate(targetISO).getDay();
  if(!days.includes(dow)) return false;

  const startDt2 = ymdToDate(master.startDate);
  const targetDt2 = ymdToDate(targetISO);

  const diffDays = Math.floor((targetDt2 - startDt2) / (1000*60*60*24));
  if(diffDays < 0) return false;

  const diffWeeks = Math.floor(diffDays / 7);
  return (diffWeeks % interval) === 0;
}

  if(r.freq === "monthly") return targetDt.getDate() === startDt.getDate();
  if(r.freq === "yearly") return targetDt.getDate() === startDt.getDate() && targetDt.getMonth() === startDt.getMonth();

  return false;
}

function getAllRecurringMasters(){
  return collectLegacyAndCachedDirectEvents()
    .filter(ev => (ev?.recurrence?.freq || "none") !== "none");
}

function getComputedEventsForDay(iso){
  const direct = getDirectEventsForComputedDay(iso);
  const out = [...direct];

  const masters = getAllRecurringMasters();
  for(const m of masters){
    if(m.startDate === iso) continue;
    if(!recurrenceMatches(m, iso)) continue;
    const ex = m.recurrence?.exceptions;
    if(Array.isArray(ex) && ex.includes(iso)) continue;

    out.push({
      ...m,
      id: `${m.id}@${iso}`,
      _isOccurrence: true,
      _masterId: m.id,
      _occursOn: iso,
    });
  }

  // Background span masters ("trip" shading) act like a lightweight occurrence
  // so they show up in the right panel on every day in the range.
  const spanMasters = getAllSpanMasters();
  for(const m of spanMasters){
    if(m.startDate === iso) continue;
    const start = m.startDate;
    const end = m.span?.end;
    if(!start || !end) continue;
    const a = start < end ? start : end;
    const b = start < end ? end : start;
    if(iso < a || iso > b) continue;

    out.push({
      ...m,
      id: `${m.id}#${iso}`,
      _isOccurrence: true,
      _masterId: m.id,
      _occursOn: iso,
      _isSpanOccurrence: true,
    });
  }

  return out;
}

function getCalendarEventsForDay(iso){
  return getComputedEventsForDay(iso).filter(ev => ev.source !== "budget");
}

// ============================================================================
// 11C. BACKGROUND SPANS / TRIP SHADING
// ============================================================================
function getAllSpanMasters(){
  return collectLegacyAndCachedDirectEvents()
    .filter(ev => ev?.span?.mode === "bg" && ev?.startDate && ev?.span?.end);
}

function getSpansForDay(iso){
  const spans = [];
  const masters = getAllSpanMasters();
  for(const m of masters){
    const start = m.startDate;
    const end = m.span?.end;
    if(!start || !end) continue;

    // inclusive range; ISO strings compare lexicographically safely
    const a = start < end ? start : end;
    const b = start < end ? end : start;
    if(iso < a || iso > b) continue;

    spans.push({
      id: m.id,
      color: m.color || DEFAULT_COLOR,
      start: a,
      end: b,
      title: m.title || "",
    });
  }
  return spans;
}

function findMasterDateById(masterId){
  for(const k of Object.keys(events)){
    const list = events[k];
    if(!Array.isArray(list)) continue;
    if(list.some(e => e.id === masterId)) return k;
  }
  return null;
}

// ============================================================================
// 11D. CALENDAR REPEAT DROPDOWN
// ============================================================================
const REPEAT_LABELS = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  weeklyDays: "Weekly (pick days)",
  span: "Trip (shade grid)",
  monthly: "Monthly",
  yearly: "Yearly",
};

function updateRepeatMenuSelection(v){
  repeatDDMenu?.querySelectorAll(".ddItem").forEach(btn => {
    btn.setAttribute("aria-selected", btn.dataset.value === v ? "true" : "false");
  });
}

function addSuggestionAsEvent(s){
  const before = snapshotBeforeChange();
  const list = events[s.date] || [];

  list.push({
    id: cryptoId(),
    title: s.title,
    details: "",
    color: s.color,
    startTime: s.startTime,
    endTime: s.endTime,
    startDate: s.date,
    recurrence: {
      freq: "none",
      until: "",
      interval: 1,
      exceptions: []
    }
  });

  events[s.date] = list;
  saveEvents(before);
  syncStateFromLegacy();
  render();
  renderEventList();
}

function getSuggestionsForMonth(year, month){
  const patterns = analyzePatterns();
  const suggestions = [];

  for (const p of patterns){
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    for(let d = new Date(first); d <= last; d.setDate(d.getDate()+1)){
      if(d.getDay() !== p.dow) continue;

      const iso = dateToYmd(d);

      // skip if event already exists
      const existing = getComputedEventsForDay(iso);
      if(existing.some(e =>
        e.title === p.title &&
        e.startTime === p.startTime
      )) continue;

      suggestions.push({
        ...p,
        date: iso
      });
    }
  }

  return suggestions;
}

function getSuggestionsForRange(startDate, days){
  const patterns = analyzePatternsRaw();
  const startISO = dateToYmd(startDate);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days - 1);
  const endISO = dateToYmd(endDate);

  const rawSuggestions = [];

  for (const p of patterns) {
    // Find the most recent real event for this pattern before or within the visible range
    const visibleRelevantDates = p.sourceDates
      .filter(d => d <= endISO)
      .sort();

    if (visibleRelevantDates.length < 2) continue;

    const latestRealISO = visibleRelevantDates[visibleRelevantDates.length - 1];
const cadenceDays = inferPatternCadenceDays(p.sourceDates, addDaysISO(endISO, 1));
const habit = cadenceDays === null ? detectHabitWeekday(p.sourceDates) : null;

// If we have cadence, chain forward by cadence.
// Otherwise, if we have a strong habit weekday, scan visible days for that weekday.
if (cadenceDays !== null) {
  let cursorISO = latestRealISO;

  for (let step = 0; step < 12; step++) {
    const nextISO = addDaysISO(cursorISO, cadenceDays);

    if (nextISO > endISO) break;
    cursorISO = nextISO;

    if (nextISO < startISO) continue;

    const dt = ymdToDate(nextISO);
    if (dt.getDay() !== p.dow) continue;

    const existing = getComputedEventsForDay(nextISO);

    if (existing.some(e =>
      (e.title || "").trim().toLowerCase() === (p.title || "").trim().toLowerCase()
    )) {
      continue;
    }

    const scored = scorePatternForCandidate(p, nextISO);
    if (!scored) continue;

    rawSuggestions.push({
      ...p,
      date: nextISO,
      score: scored.score,
      rawCount: scored.rawCount,
      latestPriorISO: addDaysISO(nextISO, -cadenceDays),
      cadenceDays
    });
  }
} else if (habit) {
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const iso = dateToYmd(d);
    if (iso < startISO || iso > endISO) continue;

    if (d.getDay() !== habit.dow) continue;

    const existing = getComputedEventsForDay(iso);
    if (existing.some(e =>
      (e.title || "").trim().toLowerCase() === (p.title || "").trim().toLowerCase()
    )) {
      continue;
    }

    const scored = scorePatternForCandidate(p, iso);
    if (!scored) continue;

    rawSuggestions.push({
      ...p,
      date: iso,
      score: scored.score * habit.confidence,
      rawCount: scored.rawCount,
      latestPriorISO: scored.latestPriorISO,
      cadenceDays: null,
      habitDow: habit.dow,
      habitConfidence: habit.confidence
    });
  }
}
}

  // Deduplicate by date + title and keep the best suggestion
  const bestByDateTitle = new Map();

  for (const s of rawSuggestions) {
    const key = `${s.date}__${(s.title || "").trim().toLowerCase()}`;
    const prev = bestByDateTitle.get(key);

    if (!prev) {
      bestByDateTitle.set(key, s);
      continue;
    }

    const prevCadenceKnown = prev.cadenceDays !== null;
    const currCadenceKnown = s.cadenceDays !== null;

    const isBetter =
      (currCadenceKnown && !prevCadenceKnown) ||
      (currCadenceKnown === prevCadenceKnown && s.score > prev.score) ||
      (currCadenceKnown === prevCadenceKnown && s.score === prev.score && s.rawCount > prev.rawCount);

    if (isBetter) {
      bestByDateTitle.set(key, s);
    }
  }

  return Array.from(bestByDateTitle.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.title || "").localeCompare(b.title || "");
  });
}


function setRepeatValue(value){
  const v = REPEAT_LABELS[value] ? value : "none";
  if(eventRepeat) eventRepeat.value = v;
  if(repeatDDLabel) repeatDDLabel.textContent = REPEAT_LABELS[v];
  updateRepeatMenuSelection(v);

  // Show/hide the right-side "Repeat until" control only for true recurrence types.
  const showRepeatUntil = (v !== "none" && v !== "span");
  if(repeatUntilCol) repeatUntilCol.style.display = showRepeatUntil ? "block" : "none";
  if(!showRepeatUntil && repeatUntil) repeatUntil.value = "";

  // Weekly interval applies to weekly + weeklyDays
  if(weeklyIntervalRow) weeklyIntervalRow.style.display = (v === "weekly" || v === "weeklyDays") ? "flex" : "none";

  // Pick-days row only for weeklyDays
  if(weeklyDaysRow) weeklyDaysRow.style.display = (v === "weeklyDays") ? "flex" : "none";

  // Trip (shade grid) end date only for span
  if(tripUntilRow) tripUntilRow.style.display = (v === "span") ? "flex" : "none";

  // If user switches away from span, clear the span until field.
  if(v !== "span" && spanUntil) spanUntil.value = "";
}

function closeRepeatDropdown(){
  repeatDD?.classList.remove("open");
  repeatDD?.setAttribute("aria-expanded", "false");
}

repeatDDButton?.addEventListener("click", (e) => {
  e.stopPropagation();
  repeatDD?.classList.toggle("open");
  repeatDD?.setAttribute("aria-expanded", repeatDD.classList.contains("open") ? "true" : "false");
});
repeatDDMenu?.addEventListener("click", (e) => {
  const btn = e.target.closest(".ddItem");
  if(!btn) return;
  setRepeatValue(btn.dataset.value);
  closeRepeatDropdown();
});

document.addEventListener("click", () => closeRepeatDropdown());
setRepeatValue(eventRepeat?.value || "none");

// ============================================================================
// 11E. TRIP SHADING UI
// ============================================================================
function setTripShadingUI(isOn){
  if(!spanUntil || !spanToggle) return;

  // Make the "Until" picker feel like it belongs, but keep it optional.
  spanUntil.disabled = !isOn;
  spanUntil.style.opacity = isOn ? "1" : ".55";

  // Trip shading is a different concept than repeating events.
  // When it's on, force repeat to none and gently disable the repeat controls.
  if(isOn){
    setRepeatValue("none");
    if(repeatUntil) repeatUntil.value = "";
    if(repeatInterval) repeatInterval.value = "1";
  }

  const disableRepeat = !!isOn;
  if(repeatDDButton) repeatDDButton.style.pointerEvents = disableRepeat ? "none" : "auto";
  if(repeatDDButton) repeatDDButton.style.opacity = disableRepeat ? ".55" : "1";
  if(repeatUntil) repeatUntil.disabled = disableRepeat;
  if(weeklyIntervalRow) weeklyIntervalRow.style.opacity = disableRepeat ? ".55" : "1";
  if(repeatInterval) repeatInterval.disabled = disableRepeat;
}

spanToggle?.addEventListener("change", () => {
  setTripShadingUI(!!spanToggle.checked);
});
setTripShadingUI(!!spanToggle?.checked);

eventColor?.addEventListener("input", () => {
  if(eventConnectionColor && !eventConnectionColor.value){
    eventConnectionColor.value = eventColor.value || DEFAULT_COLOR;
  }

  if(viewMode === "week"){
    renderWeekConnectionRail();
  }
});

// ============================================================================
// 12. APP STATE
// ============================================================================
// Copy old monolithic saves into split storage before the first app-state read.
// This prevents the calendar from appearing empty when myCalendarEvents_v1
// has not been created yet but myCalendarData_v4 still contains the old events.
migrateLegacyStorageToSlices();
let { events: eventsMap } = loadEvents();
let events = normalizeEventsMap(eventsMap);


let view = new Date();
view.setDate(1);

let viewMode = "month";

let selectedDateISO = null;
let selectedEventId = null;
let editBaseDateISO = null;
let selectedConnectionGroupId = null;
let connectionEditorRows = [];
let lastWeekAutoScrollKey = "";
let weekConnectionResizeTimer = null;
let weekConnectionRenderQueued = false;
let weekConnectionGeometryCheckQueued = false;
let weekConnectionResizeObserver = null;
let lastWeekConnectionGeometryKey = "";

// ============================================================================
// 12B. APP STATE STORE + RENDER SCHEDULER
// ============================================================================
// State is the little command crystal of the app. Most of the older code still
// reads legacy globals, so these bridge helpers keep the old functions alive
// while giving new code one clear place to mutate app state.
const state = {
  events,
  view,
  viewMode,
  selectedDateISO,
  selectedEventId,
  editBaseDateISO,
  selectedConnectionGroupId,
  settings,
  activeSection,
  budgetViewMode,
  selectedBudgetPanes,
  budgetPlans,
  budgetCategories,
  budgetTransactionFilter,
  budgetTxEditState,
  ui: {
    mobileEditorOpen: false,
    quickSearchOpen: false
  },
  meta: {
    eventsVersion: 0,
    renderVersion: 0
  }
};

const renderQueue = {
  scheduled: false,
  calendar: false,
  eventList: false,
  budget: false,
  budgetFilters: false,
  budgetCategories: false,
  sliders: false,
  history: false,
  section: false
};

const derivedCache = {
  budgetItemsVersion: -1,
  budgetItemsRangeVersion: -1,
  budgetItemsTxRangeVersion: -1,
  budgetItems: new Map()
};

function syncStateFromLegacy(){
  state.events = events;
  state.view = view;
  state.viewMode = viewMode;
  state.selectedDateISO = selectedDateISO;
  state.selectedEventId = selectedEventId;
  state.editBaseDateISO = editBaseDateISO;
  state.selectedConnectionGroupId = selectedConnectionGroupId;
  state.settings = settings;
  state.activeSection = activeSection;
  state.budgetViewMode = budgetViewMode;
  state.selectedBudgetPanes = selectedBudgetPanes;
  state.budgetPlans = budgetPlans;
  state.budgetCategories = budgetCategories;
  state.budgetTransactionFilter = budgetTransactionFilter;
  state.budgetTxEditState = budgetTxEditState;
}

function syncLegacyFromState(){
  events = state.events;
  view = state.view;
  viewMode = state.viewMode;
  selectedDateISO = state.selectedDateISO;
  selectedEventId = state.selectedEventId;
  editBaseDateISO = state.editBaseDateISO;
  selectedConnectionGroupId = state.selectedConnectionGroupId;
  settings = state.settings;
  activeSection = state.activeSection;
  budgetViewMode = state.budgetViewMode;
  selectedBudgetPanes = state.selectedBudgetPanes;
  budgetPlans = state.budgetPlans;
  budgetCategories = state.budgetCategories;
  budgetTransactionFilter = state.budgetTransactionFilter;
  budgetTxEditState = state.budgetTxEditState;
}

function invalidateDerivedData(scope = "events"){
  if(scope === "events" || scope === "budget"){
    if(scope === "events"){
      clearIndexedDbEventRangeCache("local event mutation");
      clearIndexedDbBudgetTransactionRangeCache?.("local event mutation");
    }

    state.meta.eventsVersion += 1;
    derivedCache.budgetItems.clear();
    derivedCache.budgetItemsVersion = state.meta.eventsVersion;
    derivedCache.budgetItemsRangeVersion = indexedDbEventRangeCache.version;
    derivedCache.budgetItemsTxRangeVersion = indexedDbBudgetTransactionRangeCache.version;
  }
}

function setAppState(patch = {}, options = {}){
  Object.assign(state, patch);
  syncLegacyFromState();

  if(options.invalidate){
    invalidateDerivedData(options.invalidate);
  }

  if(options.persistActiveSection && typeof state.activeSection === "string"){
    localStorage.setItem("myCalendar_activeSection", state.activeSection);
    writeIndexedDbSliceDebounced("activeSection", state.activeSection);
  }

  if(options.persistBudgetViewMode && typeof state.budgetViewMode === "string"){
    localStorage.setItem("myCalendar_budgetViewMode", state.budgetViewMode);
    writeIndexedDbSliceDebounced("budgetViewMode", state.budgetViewMode);
  }

  if(options.render){
    queueRender(options.render);
  }

  return state;
}

function setCalendarState(patch = {}, options = {}){
  return setAppState(patch, {
    ...options,
    render: options.render ?? { calendar:true, eventList:true, sliders:true }
  });
}

function setBudgetState(patch = {}, options = {}){
  return setAppState(patch, {
    ...options,
    render: options.render ?? { budget:true, sliders:true }
  });
}

function queueRender(scope = {}){
  if(scope === true || scope === "all"){
    renderQueue.calendar = true;
    renderQueue.eventList = true;
    renderQueue.budget = true;
    renderQueue.budgetFilters = true;
    renderQueue.budgetCategories = true;
    renderQueue.sliders = true;
    renderQueue.history = true;
  }else if(typeof scope === "string"){
    renderQueue[scope] = true;
  }else{
    Object.assign(renderQueue, scope);
  }

  if(renderQueue.scheduled) return;

  renderQueue.scheduled = true;
  requestAnimationFrame(flushRenderQueue);
}

function flushRenderQueue(){
  renderQueue.scheduled = false;
  syncLegacyFromState();

  const shouldRenderBudget =
    renderQueue.budget &&
    (!budgetPage || !budgetPage.hidden || activeSection === "budget");

  if(renderQueue.calendar) render();
  if(renderQueue.eventList) renderEventList();

  if(renderQueue.budgetCategories){
    renderBudgetCategoryOptions();
    renderEventCategoryOptions();
  }

  if(renderQueue.budgetFilters) renderBudgetTransactionCategoryFilter();
  if(shouldRenderBudget) renderBudgetPage();

  if(renderQueue.sliders){
    updateViewSlider();
    updateBudgetSlider();
    updateBudgetCashflowToggle();
    updateSectionSlider();
  }

  if(renderQueue.history) updateHistoryUI();

  renderQueue.calendar = false;
  renderQueue.eventList = false;
  renderQueue.budget = false;
  renderQueue.budgetFilters = false;
  renderQueue.budgetCategories = false;
  renderQueue.sliders = false;
  renderQueue.history = false;
  renderQueue.section = false;

  syncStateFromLegacy();
  state.meta.renderVersion += 1;
}


function getEventsForDay(iso){
  if(!events[iso]) events[iso] = [];
  return events[iso];
}

function getEditDateKey(){
  return editBaseDateISO || selectedDateISO;
}

function alignDowToGrid(){
  const dow = document.querySelector(".dow");
  const g = document.querySelector(".grid");
  if(!dow || !g) return;

  const dowCells = Array.from(dow.children).slice(0,7);
  const dayCells = Array.from(g.querySelectorAll(".day")).slice(0,7);
  if(dowCells.length !== 7 || dayCells.length !== 7) return;

  const dowRect = dow.getBoundingClientRect();
  for(let i=0; i<7; i++){
    const d = dowCells[i];
    const cRect = dayCells[i].getBoundingClientRect();
    d.style.left = `${cRect.left - dowRect.left}px`;
    d.style.width = `${cRect.width}px`;
  }
}

const WEEK_DOW_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function resetDowHeader(){
  if(!dow) return;

  Array.from(dow.children).slice(0, 7).forEach((cell, index) => {
    cell.classList.remove("weekDowDay", "todayDow", "selectedDow");
    delete cell.dataset.iso;
    cell.title = "";
    cell.onclick = null;
    cell.innerHTML = WEEK_DOW_LABELS[index] || "";
  });

  if(viewMode !== "week"){
    dow.classList.remove("hasConnectionRail");
    const rail = document.getElementById("weekConnectionRail");
    if(rail) rail.innerHTML = "";
  }
}

function updateWeekDowHeader(weekStartDate, todayISO){
  if(!dow) return;

  Array.from(dow.children).slice(0, 7).forEach((cell, index) => {
    const cellDate = new Date(weekStartDate);
    cellDate.setDate(weekStartDate.getDate() + index);
    const cellISO = dateToYmd(cellDate);
    const label = WEEK_DOW_LABELS[index] || cellDate.toLocaleDateString(undefined, { weekday:"short" }).toUpperCase();

    cell.classList.add("weekDowDay");
    cell.classList.toggle("todayDow", cellISO === todayISO);
    cell.classList.toggle("selectedDow", cellISO === selectedDateISO);
    cell.dataset.iso = cellISO;
    cell.title = cellDate.toLocaleDateString(undefined, {
      weekday:"long",
      month:"long",
      day:"numeric"
    });
    cell.innerHTML = `<span class="dowLabel">${escapeHtml(label)}</span>`;
    cell.onclick = () => {
      clearConnectionSelection({ silent:true });
      selectDate(cellISO);
    };
  });

  renderWeekConnectionRail();
}

function startOfWeek(dt){
  const d = new Date(dt);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getWeekBoundsForDate(dt = view){
  const start = startOfWeek(dt);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start,
    end,
    startISO: dateToYmd(start),
    endISO: dateToYmd(end)
  };
}

function isISOInCurrentRenderedWeek(iso){
  if(viewMode !== "week" || !grid || !iso) return false;

  const bounds = getWeekBoundsForDate(view);
  if(iso < bounds.startISO || iso > bounds.endISO) return false;

  return !!grid.querySelector(`.weekViewDay[data-iso="${iso}"]`);
}

function refreshWeekSelectionOnly(){
  if(viewMode !== "week") return;

  if(grid){
    grid.querySelectorAll(".weekViewDay").forEach(dayEl => {
      dayEl.classList.toggle("selectedDay", dayEl.dataset.iso === selectedDateISO);
    });
  }

  if(dow){
    Array.from(dow.children).slice(0, 7).forEach(cell => {
      cell.classList.toggle("selectedDow", cell.dataset.iso === selectedDateISO);
    });
  }

  if(grid && !selectedConnectionGroupId){
    grid.querySelectorAll(".chain-selected, .chain-dimmed").forEach(el => {
      el.classList.remove("chain-selected", "chain-dimmed");
    });

    grid.querySelectorAll(".weekConnector.selected, .weekConnector.dimmed").forEach(el => {
      el.classList.remove("selected", "dimmed");
    });
  }
}

function fmtWeekRange(dt){
  const start = startOfWeek(dt);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if(sameMonth && sameYear){
    return `${start.toLocaleString(undefined, { month: "long" })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function fmtDayLabel(dt){
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function updateViewModeButtons(){
  document.body.dataset.calendarView = viewMode;
  updateMobileCalendarStyleUI();

  monthViewBtn?.classList.toggle("active", viewMode === "month");
  weekViewBtn?.classList.toggle("active", viewMode === "week");
  dayViewBtn?.classList.toggle("active", viewMode === "day");
}

// ============================================================================
// 12C. RENDERING ENTRYPOINTS
// ============================================================================
function render(){
  syncStateFromLegacy();
  if(!grid) return;

  updateViewModeButtons();

  if(viewMode === "week") return renderWeekView();
  if(viewMode === "day") return renderDayView();
  return renderMonthView();
}


// ---------------------------------------------------------------------------
// Month view rendering
// ---------------------------------------------------------------------------

function renderMonthView(){
  if(!grid) return;
  grid.innerHTML = "";
  grid.classList.remove("weekViewGrid");
  clearConnectionSelection();
  disconnectWeekConnectionGeometryObservers();
  grid.style.gridTemplateColumns = "repeat(7, 1fr)";
  if(dow) dow.style.display = "";
  resetDowHeader();
  if(monthLabel) monthLabel.textContent = fmtMonthYear(view);

  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDow = firstDayOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startDow);

const monthSuggestions = getSuggestionsForRange(startDate, 42);
const monthEndDate = new Date(startDate);
monthEndDate.setDate(startDate.getDate() + 41);
requestIndexedDbEventRangeHydration(dateToYmd(startDate), dateToYmd(monthEndDate), {
  source: "month view",
  renderCalendar: true
});

  const today = new Date();
  const todayISO = isoDate(today.getFullYear(), today.getMonth()+1, today.getDate());

  for(let i=0; i<42; i++){
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);

    const cellISO = isoDate(cellDate.getFullYear(), cellDate.getMonth()+1, cellDate.getDate());

    const dayEl = document.createElement("div");
    dayEl.className = "day";
    dayEl.dataset.iso = cellISO;

    // Trip shading: stacked bands (so pills/text sit on top)
    const spanLayers = getSpansForDay(cellISO);

    // Build the day header ONCE (we may place it inside a tripBox)
    const header = document.createElement("div");
    header.className = "dayHeader";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = cellDate.getDate();

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = (cellDate.getMonth() === month) ? "" : cellDate.toLocaleString(undefined, {month:"short"});

    header.appendChild(num);
    header.appendChild(badge);

    // If a day has trip spans, render a dedicated "trip box" at the top.
    // This keeps the date number perfectly aligned across all days (symmetry),
    // while still letting trips reserve their own space WITHOUT stealing room from event pills.
    let tripBox = null;

    if(spanLayers.length){
      tripBox = document.createElement("div");
      tripBox.className = "tripBox";
      tripBox.appendChild(header);
      dayEl.appendChild(tripBox);

      const dow = cellDate.getDay();
      const MAX_BANDS = 6; // safety cap so it never gets ridiculous

      // Bands live inside the tripBox (absolute), so we reserve vertical space by setting tripBox height.
      const BAND_H = 6;
      const BAND_GAP = 2;
      const LABEL_EXTRA = 22; // extra pixels ONLY when a band shows its label

      const HEADER_PAD = 26; // space for the dayHeader inside the tripBox
      let y = HEADER_PAD;
      let hasAnyNamed = false;

      spanLayers.slice(0, MAX_BANDS).forEach((s) => {
        const band = document.createElement("div");
        band.className = "spanBand";

        const leftEdge = (cellISO === s.start) || (dow === 0);
        const rightEdge = (cellISO === s.end) || (dow === 6);

        if(!leftEdge && !rightEdge) band.classList.add("mid");
        else{
          if(leftEdge && !rightEdge) band.classList.add("edgeL");
          if(rightEdge && !leftEdge) band.classList.add("edgeR");
        }

        band.style.top = `${y}px`;
        band.style.height = `${BAND_H}px`;
        band.style.background = hexToRgba(s.color, 0.28);
        band.style.border = `1px solid ${hexToRgba(s.color, 0.55)}`;

        if(s.title) band.title = s.title;

        // Label: show on the start day of the span, and at week boundaries (Sunday)
        const NAMED_H = 16; // must match CSS .spanBand.named height
const named = !!(s.title && leftEdge);

if(named){
  hasAnyNamed = true;
  band.classList.add("named");
  band.style.height = `${NAMED_H}px`;
  band.textContent = s.title;
}

const thisH = named ? NAMED_H : BAND_H;
y += thisH + BAND_GAP;

        tripBox.appendChild(band);
      });

      // Make the box tall enough so everything below (events) gets pushed down.
      tripBox.style.height = `${y + 2}px`;
      if(hasAnyNamed) tripBox.classList.add("hasNamed");
    } else {
      // No trips: header belongs directly to the day cell (same position every time).
      dayEl.appendChild(header);
    }
    // Allow drop (and show ghost preview)
    dayEl.addEventListener("dragover", (e) => {
  e.preventDefault();
  dayEl.classList.add("dropTarget");

  const payload = parseDragPayload(e.dataTransfer);
  activeDragPayload = payload;

  const copyMode =
    dragCopyPrimed ||
    ((typeof e.getModifierState === "function" && (e.getModifierState("Alt") || e.getModifierState("Control"))) || e.altKey || e.ctrlKey || altDown);

  showGhost(dayEl, payload, { copy: copyMode });
});

dayEl.addEventListener("drop", (e) => {
  e.preventDefault();
  dayEl.classList.remove("dropTarget");
  clearGhost();

  const payload = parseDragPayload(e.dataTransfer);

  const copyMode =
    dragCopyPrimed ||
    ((typeof e.getModifierState === "function" && (e.getModifierState("Alt") || e.getModifierState("Control"))) || e.altKey || e.ctrlKey || altDown);

  handleDropOnDay(cellISO, payload, { duplicate: copyMode || dragCopyPrimed });
  activeDragPayload = null;
});


    if(cellDate.getMonth() !== month) dayEl.classList.add("otherMonth");
    if(cellISO === todayISO) dayEl.classList.add("today");
    if(selectedDateISO === cellISO) dayEl.style.boxShadow = "inset 0 0 0 2px rgba(255,255,255,.20)";


    const list = sortByTimeThenTitle(
      getCalendarEventsForDay(cellISO).filter(ev => !(ev?.span?.mode === "bg"))
    );

    dayEl.classList.toggle("hasEvents", list.length > 0);
    dayEl.dataset.eventCount = getEventPreviewCountText(list.length);

    if(isMobileViewport() && getMobileCalendarStyle() === "compact" && list.length > 0){
      const countBadge = document.createElement("span");
      countBadge.className = "mobileEventCountBadge";
      countBadge.textContent = getEventPreviewCountText(list.length);
      dayEl.appendChild(countBadge);
    }

    const maxShow = isMobileViewport() && getMobileCalendarStyle() === "compact" ? 0 : 3;

    for(let j=0; j<Math.min(maxShow, list.length); j++){
      const ev = list[j];
      const pill = document.createElement("span");
      pill.className = "eventPill";

if(shouldDimPastEvents() && isPastDayISO(cellISO)){
  pill.classList.add("pastEventDim");
}

      pill.draggable = true;

      if(ev._isOccurrence && ev._masterId){
        pill.addEventListener("dragstart", (e) => {
          const data = buildDragPayload({
            kind: "occurrence",
            masterId: ev._masterId,
            occursOnISO: cellISO
          });
          e.dataTransfer.setData(DRAG_MIME, data);
          e.dataTransfer.setData("text/plain", data);
          e.dataTransfer.effectAllowed = "copyMove";
          const copyMode = isCopyModifier(e);
          setCustomDragImage(e, pill, copyMode);
          pill.classList.toggle("dragCopyVisual", copyMode);
        });
      } else {
        pill.addEventListener("dragstart", (e) => {
          const data = buildDragPayload({
            kind: "event",
            eventId: ev.id,
            sourceISO: cellISO
          });
          e.dataTransfer.setData(DRAG_MIME, data);
          e.dataTransfer.setData("text/plain", data);
          e.dataTransfer.effectAllowed = "copyMove";
          const copyMode = isCopyModifier(e);
          setCustomDragImage(e, pill, copyMode);
          pill.classList.toggle("dragCopyVisual", copyMode);
        });
      }

      pill.addEventListener("dragend", () => {
        pill.classList.remove("dragCopyVisual");
      });

      const t = formatTimeRange(ev.startTime, ev.endTime);
      const title = ev.title || "(Untitled)";
      pill.innerHTML = `
  <div class="pillTopRow">
    <div class="pillTitle">${escapeHtml(title)}</div>
    <div class="pillTime">${escapeHtml(t)}</div>
  </div>
  ${ev.details ? `<div class="pillDetails">${escapeHtml(ev.details)}</div>` : ""}
`;

      const c = ev.color || DEFAULT_COLOR;
      pill.style.background = hexToRgba(c, 0.16);
      pill.style.borderColor = hexToRgba(c, 0.35);

pill.addEventListener("click", (e) => {
  e.stopPropagation();
  openEventInEditor(ev, cellISO);
});

      dayEl.appendChild(pill);
    }

    if(list.length > maxShow){
  const more = document.createElement("span");
  more.className = "eventPill";

  if(shouldDimPastEvents() && isPastDayISO(cellISO)){
    more.classList.add("pastEventDim");
  }

  more.textContent = `+${list.length - maxShow} more`;
  dayEl.appendChild(more);
}

/* ===== SMART SUGGESTIONS ===== */
if(settings.suggestions){

  const daySuggestions =
    monthSuggestions.filter(s => s.date === cellISO);

  for(const s of daySuggestions){
    const pill = document.createElement("span");
    pill.className = "eventPill suggestionPill";
    pill.textContent = s.cadenceDays ? `${s.title} (${s.cadenceDays}d)` : s.title;

    pill.style.background = hexToRgba(s.color, 0.10);
    pill.style.borderColor = hexToRgba(s.color, 0.35);

    pill.addEventListener("click", () => {
      addSuggestionAsEvent(s);
    });

    dayEl.appendChild(pill);
  }

} // ← CLOSE IT HERE (IMPORTANT)


/* ===== ALWAYS RUN ===== */
dayEl.addEventListener("click", () => selectDate(cellISO));
grid.appendChild(dayEl);

} // ← closes for-loop

if(!selectedDateISO){
  selectDate(todayISO, {silent:true});
}

requestAnimationFrame(() => alignDowToGrid());

} // ← closes render()



// ---------------------------------------------------------------------------
// Week connections: data model, editor UI & rail
// ---------------------------------------------------------------------------

function normalizeConnectionGroupId(value = ""){
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeConnectionLineStyle(value = "solid"){
  return CONNECTION_LINE_STYLES.includes(value) ? value : "solid";
}

function safeHexColor(value = "", fallback = DEFAULT_COLOR){
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function normalizeEventConnectionRecord(record = {}, fallbackColor = DEFAULT_COLOR){
  const rawName = String(
    record?.name ??
    record?.label ??
    record?.connectionGroupName ??
    record?.connectionGroup ??
    record?.group ??
    ""
  ).trim();

  const rawId = String(
    record?.id ??
    record?.connectionGroupId ??
    record?.groupId ??
    ""
  ).trim();

  const id = rawId || normalizeConnectionGroupId(rawName);
  if(!id) return null;

  const name = rawName || getEventConnectionGroupName({}, id);
  const color = safeHexColor(
    record?.color ?? record?.connectionColor ?? fallbackColor,
    safeHexColor(fallbackColor, DEFAULT_COLOR)
  );

  return {
    id,
    name,
    color,
    lineStyle: normalizeConnectionLineStyle(record?.lineStyle ?? record?.connectionLineStyle)
  };
}

function normalizeEventConnections(ev = {}, fallbackColor = DEFAULT_COLOR){
  const out = [];
  const seen = new Set();

  const add = (record = {}) => {
    const normalized = normalizeEventConnectionRecord(record, fallbackColor);
    if(!normalized || seen.has(normalized.id)) return;
    seen.add(normalized.id);
    out.push(normalized);
  };

  if(Array.isArray(ev?.connections)){
    ev.connections.forEach(add);
  }

  const legacyName = String(ev?.connectionGroupName ?? ev?.connectionGroup ?? "").trim();
  const legacyId = String(ev?.connectionGroupId ?? "").trim();

  if(legacyId || legacyName){
    add({
      id: legacyId || normalizeConnectionGroupId(legacyName),
      name: legacyName,
      color: ev?.connectionColor || ev?.color || fallbackColor,
      lineStyle: ev?.connectionLineStyle || "solid"
    });
  }

  if(Array.isArray(ev?.connectionGroupIds)){
    ev.connectionGroupIds.forEach((id, index) => {
      const safeId = String(id || "").trim();
      if(!safeId) return;

      add({
        id: safeId,
        name: index === 0 ? legacyName : "",
        color: ev?.connectionColor || ev?.color || fallbackColor,
        lineStyle: ev?.connectionLineStyle || "solid"
      });
    });
  }

  return out;
}

function getEventConnections(ev = {}){
  return normalizeEventConnections(ev, ev?.color || ev?.connectionColor || DEFAULT_COLOR);
}

function getPillWeekConnections(pill){
  if(Array.isArray(pill?.__weekConnections)){
    return pill.__weekConnections.map(conn => normalizeEventConnectionRecord(conn)).filter(Boolean);
  }

  const legacyId = pill?.dataset?.connectionGroupId || "";
  if(!legacyId) return [];

  return [normalizeEventConnectionRecord({
    id: legacyId,
    name: pill?.dataset?.connectionGroupName || legacyId,
    color: pill?.dataset?.connectionColor || DEFAULT_COLOR,
    lineStyle: pill?.dataset?.connectionLineStyle || "solid"
  })].filter(Boolean);
}

function getEventConnectionGroupIds(ev = {}){
  const ids = getEventConnections(ev).map(conn => conn.id);
  return [...new Set(ids.filter(Boolean))];
}

function getEventPrimaryConnectionGroupId(ev = {}){
  return getEventConnectionGroupIds(ev)[0] || "";
}

function formatConnectionNameFromId(groupId = ""){
  return String(groupId || "")
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEventConnectionGroupName(ev = {}, groupId = ""){
  const safeGroupId = String(groupId || "").trim();
  const match = getEventConnections(ev).find(conn => conn.id === safeGroupId);
  if(match?.name) return match.name;

  const name = String(ev.connectionGroupName || ev.connectionGroup || "").trim();
  if(name && (!safeGroupId || normalizeConnectionGroupId(name) === safeGroupId || ev.connectionGroupId === safeGroupId)){
    return name;
  }

  return formatConnectionNameFromId(safeGroupId);
}

function getEventConnectionLineStyle(ev = {}, groupId = ""){
  const safeGroupId = String(groupId || "").trim();
  const match = getEventConnections(ev).find(conn => !safeGroupId || conn.id === safeGroupId);
  return match?.lineStyle || normalizeConnectionLineStyle(ev.connectionLineStyle);
}

function getEventConnectionColor(ev = {}, groupId = ""){
  const safeGroupId = String(groupId || "").trim();
  const match = getEventConnections(ev).find(conn => !safeGroupId || conn.id === safeGroupId);
  return match?.color || safeHexColor(ev.connectionColor || ev.color || DEFAULT_COLOR);
}

function getWeekEventSortKey(ev = {}, iso = ""){
  const time = String(ev.startTime || "99:99").padStart(5, "0");
  return `${iso}T${time}::${ev._masterId || ev.id || ""}`;
}

function selectConnectionGroup(groupId){
  const safeGroupId = String(groupId || "").trim();
  if(!safeGroupId) return;

  selectedConnectionGroupId = safeGroupId;
  state.selectedConnectionGroupId = safeGroupId;

  if(viewMode === "week"){
    renderWeekConnectionHighlights();
    renderWeekConnectionRail();
  }
}

function clearConnectionSelection(opts = {}){
  if(!selectedConnectionGroupId) return;

  selectedConnectionGroupId = null;
  state.selectedConnectionGroupId = null;

  if(viewMode === "week" && !opts.silent){
    renderWeekConnectionHighlights();
    renderWeekConnectionRail();
  }
}

function getLegacyConnectionEditorRow(){
  const name = String(eventConnectionGroup?.value || "").trim();
  const id = normalizeConnectionGroupId(name);
  if(!name && !id) return null;

  return normalizeEventConnectionRecord({
    id,
    name,
    color: eventConnectionColor?.value || eventColor?.value || DEFAULT_COLOR,
    lineStyle: eventConnectionLineStyle?.value || "solid"
  }, eventColor?.value || DEFAULT_COLOR);
}

function syncLegacyConnectionFieldsFromEditorRows(){
  const first = connectionEditorRows[0] || null;

  if(eventConnectionGroup) eventConnectionGroup.value = first?.name || "";
  if(eventConnectionColor) eventConnectionColor.value = first?.color || eventColor?.value || DEFAULT_COLOR;
  if(eventConnectionLineStyle) eventConnectionLineStyle.value = first?.lineStyle || "solid";
}

function getSelectedConnectionMeta(groupMeta = collectWeekConnectionGroupMeta()){
  const safeGroupId = String(selectedConnectionGroupId || "").trim();
  if(!safeGroupId) return null;

  return groupMeta.get(safeGroupId) || null;
}

function formatConnectionLineStyleLabel(style = "solid"){
  const normalized = normalizeConnectionLineStyle(style);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function renderWeekConnectionStyleDropdown(value = "solid", inputClass = "weekConnectionStyleSelect", ariaLabel = "Connection line style"){
  const current = normalizeConnectionLineStyle(value);

  return `
    <div class="weekConnectionStyleDD" data-current-style="${escapeHtml(current)}">
      <input type="hidden" class="${escapeHtml(inputClass)}" value="${escapeHtml(current)}" />
      <button class="weekConnectionStyleDDButton" type="button" aria-label="${escapeHtml(ariaLabel)}">
        <span class="weekConnectionStyleDDLabel">${escapeHtml(formatConnectionLineStyleLabel(current))}</span>
        <span class="weekConnectionStyleDDArrow">▾</span>
      </button>
      <div class="weekConnectionStyleDDMenu" role="listbox" aria-label="${escapeHtml(ariaLabel)}">
        ${CONNECTION_LINE_STYLES.map(style => `
          <button
            class="weekConnectionStyleDDOption ${style === current ? "active" : ""}"
            type="button"
            data-line-style="${escapeHtml(style)}"
            role="option"
            aria-selected="${style === current ? "true" : "false"}"
          >
            ${escapeHtml(formatConnectionLineStyleLabel(style))}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function connectionRecordsEqual(a = {}, b = {}, fallbackColor = DEFAULT_COLOR){
  const left = normalizeEventConnectionRecord(a, fallbackColor);
  const right = normalizeEventConnectionRecord(b, fallbackColor);

  if(!left || !right) return left === right;

  return (
    left.id === right.id &&
    String(left.name || "") === String(right.name || "") &&
    safeHexColor(left.color || fallbackColor, fallbackColor) === safeHexColor(right.color || fallbackColor, fallbackColor) &&
    normalizeConnectionLineStyle(left.lineStyle) === normalizeConnectionLineStyle(right.lineStyle)
  );
}

function renderSelectedConnectionEditorHtml(selected = null){
  const safeSelected = selected
    ? normalizeEventConnectionRecord(selected, selected.color || eventColor?.value || DEFAULT_COLOR)
    : null;

  if(!safeSelected){
    return `
      <div class="weekConnectionEmptyHint">
        Select a chain chip or wire to edit that line.
      </div>
    `;
  }

  return `
    <div
      class="weekConnectionGlobalEdit"
      data-group-id="${escapeHtml(safeSelected.id)}"
      style="--connection-color:${safeHexColor(safeSelected.color, DEFAULT_COLOR)}"
    >
      <div class="weekConnectionGlobalEditTop">
        <span class="weekConnectionBannerDot"></span>
        <div>
          <div class="weekConnectionGlobalEditTitle">Editing selected line</div>
        </div>
      </div>

      <div class="weekConnectionGlobalEditRow" data-group-id="${escapeHtml(safeSelected.id)}">
        <input
          class="input weekConnectionGlobalNameInput"
          value="${escapeHtml(safeSelected.name || formatConnectionNameFromId(safeSelected.id))}"
          placeholder="e.g., Work routine"
          aria-label="Selected connection line name"
        />
        <input
          class="weekConnectionGlobalColorInput"
          type="color"
          value="${escapeHtml(safeHexColor(safeSelected.color, DEFAULT_COLOR))}"
          aria-label="Selected connection line color"
        />
        ${renderWeekConnectionStyleDropdown(
          safeSelected.lineStyle,
          "weekConnectionGlobalStyleSelect",
          "Selected connection line style"
        )}
      </div>
    </div>
  `;
}

function readSelectedConnectionEditorRow(overrides = {}){
  const row = document.querySelector(".weekConnectionGlobalEditRow");
  const oldGroupId = String(row?.dataset?.groupId || selectedConnectionGroupId || "").trim();
  if(!row || !oldGroupId) return null;

  const name = String(row.querySelector(".weekConnectionGlobalNameInput")?.value || "").trim();
  if(!name) return null;

  const fallbackColor = eventColor?.value || DEFAULT_COLOR;
  const color = safeHexColor(
    row.querySelector(".weekConnectionGlobalColorInput")?.value || fallbackColor,
    fallbackColor
  );
  const lineStyle = normalizeConnectionLineStyle(
    overrides.lineStyle ?? row.querySelector(".weekConnectionGlobalStyleSelect")?.value ?? "solid"
  );

  const next = normalizeEventConnectionRecord({
    id: normalizeConnectionGroupId(name),
    name,
    color,
    lineStyle
  }, fallbackColor);

  if(!next?.id) return null;

  return { oldGroupId, next };
}

function eventHasConnectionGroup(ev = {}, groupId = ""){
  const safeGroupId = String(groupId || "").trim();
  if(!safeGroupId) return false;

  return getEventConnections(ev).some(conn =>
    conn.id === safeGroupId || normalizeConnectionGroupId(conn.name || "") === safeGroupId
  );
}

function dedupeEventConnections(connections = [], fallbackColor = DEFAULT_COLOR){
  const out = [];
  const seen = new Set();

  for(const conn of connections || []){
    const normalized = normalizeEventConnectionRecord(conn, fallbackColor);
    if(!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    out.push(normalized);
  }

  return out;
}

function withUpdatedConnectionGroup(ev = {}, oldGroupId = "", nextConnection = null){
  const safeOldGroupId = String(oldGroupId || "").trim();
  const safeNext = normalizeEventConnectionRecord(nextConnection, ev?.color || DEFAULT_COLOR);

  if(!safeOldGroupId || !safeNext) return ev;

  let changed = false;
  const updatedConnections = getEventConnections(ev).map(conn => {
    const matches =
      conn.id === safeOldGroupId ||
      normalizeConnectionGroupId(conn.name || "") === safeOldGroupId;

    if(!matches) return conn;
    if(connectionRecordsEqual(conn, safeNext, ev?.color || DEFAULT_COLOR)) return conn;

    changed = true;
    return { ...safeNext };
  });

  if(!changed) return ev;

  const connections = dedupeEventConnections(updatedConnections, ev?.color || DEFAULT_COLOR);
  const primary = connections[0] || null;

  return toEvent({
    ...ev,
    connections,
    connectionGroupId: primary?.id || "",
    connectionGroupName: primary?.name || "",
    connectionGroupIds: connections.map(conn => conn.id),
    connectionColor: primary?.color || ev.connectionColor || ev.color || DEFAULT_COLOR,
    connectionLineStyle: primary?.lineStyle || ev.connectionLineStyle || "solid"
  });
}

function applySelectedConnectionEditorChange(overrides = {}){
  const edit = readSelectedConnectionEditorRow(overrides);
  if(!edit) return;

  const { oldGroupId, next } = edit;
  const before = snapshotBeforeChange();
  const updatedAt = Date.now();
  const changedEventOps = [];
  let changed = false;

  for(const dayKey of Object.keys(events || {})){
    const list = Array.isArray(events[dayKey]) ? events[dayKey] : [];

    events[dayKey] = list.map(ev => {
      if(!eventHasConnectionGroup(ev, oldGroupId)) return ev;

      const updated = withUpdatedConnectionGroup(ev, oldGroupId, next);
      if(updated !== ev){
        changed = true;
        changedEventOps.push(makeEventCloudOp(updated, dayKey, updatedAt, false));
      }
      return updated;
    });
  }

  if(!changed) return;

  selectedConnectionGroupId = next.id;
  state.selectedConnectionGroupId = next.id;

  saveEvents(before, {
    reason: "week connection line edit",
    updatedAt,
    cloudOps: changedEventOps
  });
  syncStateFromLegacy();

  if(selectedEventId){
    populateFormFromSelected();
  }

  renderWeekConnectionRail({ selectedMeta: next, preserveRows:true });
  render();
  renderEventList();
}

function setConnectionEditorRows(connections = []){
  const fallbackColor = eventColor?.value || DEFAULT_COLOR;

  connectionEditorRows = (connections || [])
    .map(conn => normalizeEventConnectionRecord(conn, fallbackColor))
    .filter(Boolean);

  syncLegacyConnectionFieldsFromEditorRows();
  renderWeekConnectionRail({ preserveRows:true });
}

function getConnectionEditorRowsFromRail(opts = {}){
  const keepEmpty = !!opts.keepEmpty;
  const rail = document.getElementById("weekConnectionRail");
  const rowEls = rail ? Array.from(rail.querySelectorAll(".weekConnectionEditRow")) : [];

  if(!rowEls.length){
    return connectionEditorRows.map(row => ({ ...row }));
  }

  const fallbackColor = eventColor?.value || DEFAULT_COLOR;

  return rowEls
    .map(row => {
      const name = String(row.querySelector(".weekConnectionNameInput")?.value || "").trim();
      const color = safeHexColor(row.querySelector(".weekConnectionColorInput")?.value || fallbackColor, fallbackColor);
      const lineStyle = normalizeConnectionLineStyle(row.querySelector(".weekConnectionStyleSelect")?.value || "solid");

      if(!name && !keepEmpty) return null;

      const id = normalizeConnectionGroupId(name);
      if(!id && !keepEmpty) return null;

      return {
        id,
        name,
        color,
        lineStyle
      };
    })
    .filter(Boolean);
}

function getConnectionRowsForSave(){
  let rows = [];

  if(viewMode === "week"){
    rows = getConnectionEditorRowsFromRail({ keepEmpty:false });
  }

  // Month/day and the side editor do not expose connection controls. If an
  // existing event already has connections, preserve them while editing normal
  // fields there. New week lines are created from the week rail only.
  if(!rows.length && connectionEditorRows.length){
    rows = connectionEditorRows;
  }

  return rows
    .map(row => normalizeEventConnectionRecord(row, eventColor?.value || DEFAULT_COLOR))
    .filter(row => row && row.id && row.name);
}

function getConnectionFieldsForSave(fallbackColor = DEFAULT_COLOR){
  const connections = getConnectionRowsForSave();
  const primary = connections[0] || null;

  return {
    connections,
    connectionGroupId: primary?.id || "",
    connectionGroupName: primary?.name || "",
    connectionGroupIds: connections.map(conn => conn.id),
    connectionColor: primary?.color || fallbackColor || DEFAULT_COLOR,
    connectionLineStyle: primary?.lineStyle || "solid"
  };
}

function syncConnectionEditorRowsFromLegacy(){
  const legacy = getLegacyConnectionEditorRow();

  if(legacy){
    if(connectionEditorRows.length){
      connectionEditorRows = [legacy, ...connectionEditorRows.slice(1)];
    }else{
      connectionEditorRows = [legacy];
    }
  }else if(connectionEditorRows.length <= 1){
    connectionEditorRows = [];
  }

  renderWeekConnectionRail({ preserveRows:true });
}

function ensureWeekConnectionRail(){
  if(!dow) return null;

  let rail = document.getElementById("weekConnectionRail");

  if(!rail){
    rail = document.createElement("section");
    rail.id = "weekConnectionRail";
    rail.className = "weekConnectionRail";
    rail.setAttribute("aria-live", "polite");
    dow.appendChild(rail);
  }

  dow.classList.toggle("hasConnectionRail", viewMode === "week");
  return rail;
}

function collectWeekConnectionGroupMeta(){
  const meta = new Map();
  if(!grid) return meta;

  const cards = Array.from(grid.querySelectorAll(".weekEventPill"));

  for(const card of cards){
    for(const conn of getPillWeekConnections(card)){
      if(!conn?.id) continue;

      if(!meta.has(conn.id)){
        meta.set(conn.id, {
          id: conn.id,
          name: conn.name || formatConnectionNameFromId(conn.id),
          color: conn.color || DEFAULT_COLOR,
          lineStyle: conn.lineStyle || "solid",
          count: 0
        });
      }

      meta.get(conn.id).count += 1;
    }
  }

  return meta;
}

function getSelectedEventForConnectionRail(){
  if(!selectedEventId) return null;

  const baseKey = getEditDateKey?.() || selectedDateISO;
  if(!baseKey) return null;

  const list = getEventsForDay(baseKey);
  return list.find(ev => ev.id === selectedEventId) || null;
}

function getDraftConnectionRowForSelectedEvent(){
  if(viewMode !== "week" || selectedConnectionGroupId) return null;

  const ev = getSelectedEventForConnectionRail();
  if(!ev || getEventConnections(ev).length) return null;

  return {
    id:"",
    name:"",
    color:eventColor?.value || ev.color || DEFAULT_COLOR,
    lineStyle:"solid",
    draft:true
  };
}

function getConnectionEditorRowsForDisplay(){
  const draft = getDraftConnectionRowForSelectedEvent();

  if(draft && !connectionEditorRows.length){
    return [draft];
  }

  return connectionEditorRows;
}

function renderConnectionEditorRowsHtml(rows = getConnectionEditorRowsForDisplay()){
  const displayRows = Array.isArray(rows) ? rows : [];

  if(!displayRows.length){
    return `<div class="weekConnectionEmptyHint">Select an event to add or edit lines.</div>`;
  }

  return displayRows.map((row, index) => {
    const safeRow = normalizeEventConnectionRecord(row, eventColor?.value || DEFAULT_COLOR) || {
      id:"",
      name:"",
      color:eventColor?.value || DEFAULT_COLOR,
      lineStyle:"solid"
    };
    const isDraft = !!(
      row?.draft ||
      (getDraftConnectionRowForSelectedEvent() && displayRows.length === 1 && !String(safeRow.name || "").trim())
    );

    return `
      <div class="weekConnectionEditRow ${isDraft ? "draftConnectionRow" : ""}" data-index="${index}">
        <input
          class="input weekConnectionNameInput"
          value="${escapeHtml(safeRow.name || "")}"
          placeholder="e.g., Work routine"
          aria-label="Connection line name"
        />
        <input
          class="weekConnectionColorInput"
          type="color"
          value="${escapeHtml(safeHexColor(safeRow.color, DEFAULT_COLOR))}"
          aria-label="Connection line color"
        />
        ${renderWeekConnectionStyleDropdown(
          safeRow.lineStyle,
          "weekConnectionStyleSelect",
          "Connection line style"
        )}
        ${isDraft ? "" : `<button class="weekConnectionRemoveBtn" type="button" data-index="${index}" title="Remove this line">×</button>`}
      </div>
    `;
  }).join("");
}

function renderConnectionChipsHtml(groupMeta = collectWeekConnectionGroupMeta(), selectedMeta = null){
  const groups = Array.from(groupMeta.values())
    .sort((a, b) => (b.count || 0) - (a.count || 0) || String(a.name || "").localeCompare(String(b.name || "")));

  const selected = selectedConnectionGroupId
    ? (selectedMeta || groupMeta.get(selectedConnectionGroupId))
    : null;

  const banner = `<div class="weekConnectionSelectedHint">Week lines</div>`;

  const chips = groups.length
    ? groups.map(group => `
      <button
        class="weekConnectionChip ${selectedConnectionGroupId === group.id ? "active" : ""}"
        type="button"
        data-group-id="${escapeHtml(group.id)}"
        style="--connection-color:${safeHexColor(group.color, DEFAULT_COLOR)}"
        title="Highlight ${escapeHtml(group.name || group.id)}"
      >
        <span class="weekConnectionBannerDot"></span>
        <span class="weekConnectionChipName">${escapeHtml(group.name || group.id)}</span>
        <span class="weekConnectionBannerCount">${group.count || 0}</span>
      </button>
    `).join("")
    : `<span class="weekConnectionNoChips">Add matching line names to two events and the wire appears here.</span>`;

  return `${banner}<div class="weekConnectionChipScroller">${chips}</div>`;
}

function renderWeekConnectionRail(opts = {}){
  const rail = document.getElementById("weekConnectionRail");

  if(viewMode !== "week"){
    dow?.classList.remove("hasConnectionRail");
    if(rail) rail.innerHTML = "";
    return;
  }

  const safeRail = ensureWeekConnectionRail();
  if(!safeRail) return;

  if(!opts.preserveRows && !selectedConnectionGroupId){
    const hadRowsBeforeRead = connectionEditorRows.length > 0;
    const rowsFromRail = getConnectionEditorRowsFromRail({ keepEmpty:true });
    const onlyEmptyDraft = !!(
      getDraftConnectionRowForSelectedEvent() &&
      !hadRowsBeforeRead &&
      rowsFromRail.length === 1 &&
      !String(rowsFromRail[0]?.name || "").trim()
    );

    connectionEditorRows = onlyEmptyDraft ? [] : rowsFromRail;
  }

  const groupMeta = collectWeekConnectionGroupMeta();
  const selectedMetaFromGrid = getSelectedConnectionMeta(groupMeta);
  const selectedMeta = selectedConnectionGroupId
    ? {
        ...(selectedMetaFromGrid || {}),
        ...(opts.selectedMeta || {})
      }
    : null;

  const isEditingSelectedGroup = !!(selectedConnectionGroupId && selectedMeta?.id);
  const draftRow = !isEditingSelectedGroup ? getDraftConnectionRowForSelectedEvent() : null;
  const displayRows = !isEditingSelectedGroup
    ? (draftRow && !connectionEditorRows.length ? [draftRow] : connectionEditorRows)
    : [];

  safeRail.innerHTML = `
    <div class="weekConnectionRailInner ${isEditingSelectedGroup ? "editingSelectedConnection" : ""} ${draftRow ? "draftingEventConnection" : ""}">
      <div class="weekConnectionComposer">
        ${isEditingSelectedGroup
          ? renderSelectedConnectionEditorHtml(selectedMeta)
          : `<div class="weekConnectionEditorRows">${renderConnectionEditorRowsHtml(displayRows)}</div>`
        }
      </div>

      <div class="weekConnectionChipWrap">
        ${renderConnectionChipsHtml(groupMeta, selectedMeta || null)}
      </div>
    </div>
  `;

  safeRail.querySelectorAll(".weekConnectionRemoveBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index || "-1", 10);
      connectionEditorRows = getConnectionEditorRowsFromRail({ keepEmpty:true });
      if(index >= 0) connectionEditorRows.splice(index, 1);
      syncLegacyConnectionFieldsFromEditorRows();
      renderWeekConnectionRail();
    });
  });

  safeRail.querySelectorAll(".weekConnectionEditRow .weekConnectionNameInput, .weekConnectionEditRow .weekConnectionColorInput").forEach(input => {
    input.addEventListener("input", () => {
      connectionEditorRows = getConnectionEditorRowsFromRail({ keepEmpty:true });
      syncLegacyConnectionFieldsFromEditorRows();
    });
  });

  safeRail.querySelectorAll(".weekConnectionGlobalNameInput, .weekConnectionGlobalColorInput").forEach(input => {
    const apply = () => applySelectedConnectionEditorChange();

    if(input.classList.contains("weekConnectionGlobalColorInput")){
      input.addEventListener("input", apply);
    }

    input.addEventListener("change", apply);

    if(input.classList.contains("weekConnectionGlobalNameInput")){
      input.addEventListener("keydown", (e) => {
        if(e.key === "Enter"){
          e.preventDefault();
          input.blur();
        }
      });
    }
  });

  safeRail.querySelectorAll(".weekConnectionStyleDDButton").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dd = btn.closest(".weekConnectionStyleDD");
      if(!dd) return;

      safeRail.querySelectorAll(".weekConnectionStyleDD.open").forEach(openDD => {
        if(openDD !== dd) openDD.classList.remove("open");
      });

      dd.classList.toggle("open");
    });
  });

  safeRail.querySelectorAll(".weekConnectionStyleDDOption[data-line-style]").forEach(option => {
    const chooseLineStyle = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const dd = option.closest(".weekConnectionStyleDD");
      if(!dd) return;

      const value = normalizeConnectionLineStyle(option.dataset.lineStyle || "solid");
      const hidden = dd.querySelector(".weekConnectionStyleSelect, .weekConnectionGlobalStyleSelect");
      const label = dd.querySelector(".weekConnectionStyleDDLabel");

      if(hidden) hidden.value = value;
      if(label) label.textContent = formatConnectionLineStyleLabel(value);
      dd.dataset.currentStyle = value;
      dd.classList.remove("open");

      dd.querySelectorAll(".weekConnectionStyleDDOption").forEach(btn => {
        const active = normalizeConnectionLineStyle(btn.dataset.lineStyle || "solid") === value;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });

      if(hidden?.classList.contains("weekConnectionGlobalStyleSelect")){
        applySelectedConnectionEditorChange({ lineStyle: value });
      }else{
        connectionEditorRows = getConnectionEditorRowsFromRail({ keepEmpty:true });
        syncLegacyConnectionFieldsFromEditorRows();
      }
    };

    option.addEventListener("click", chooseLineStyle);
  });

  safeRail.querySelectorAll(".weekConnectionChip[data-group-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const groupId = btn.dataset.groupId || "";
      if(selectedConnectionGroupId === groupId){
        clearConnectionSelection();
      }else{
        selectConnectionGroup(groupId);
      }
    });
  });

  safeRail.querySelector("[data-clear-selected]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    clearConnectionSelection();
  });
}

function setWeekConnectionBanner(groupMeta = null){
  const existing = grid?.querySelector(".weekConnectionBanner");
  if(existing) existing.remove();
  renderWeekConnectionRail({ selectedMeta: groupMeta });
}

function renderWeekConnectionHighlights(){
  if(!grid) return;

  const selected = selectedConnectionGroupId;

  // Build the banner/count from connected cards only, but apply the dimming
  // state to every week pill. Otherwise unrelated events with no connection
  // group stay bright while the selected chain is trying to take focus.
  const allCards = Array.from(grid.querySelectorAll(".weekEventPill"));
  const connectedCards = allCards.filter(card => getPillWeekConnections(card).length);
  const paths = Array.from(grid.querySelectorAll(".weekConnector[data-connection-group-id]"));
  const groupMeta = new Map();

  for(const card of connectedCards){
    for(const conn of getPillWeekConnections(card)){
      const groupId = conn.id || "";
      if(!groupId) continue;

      if(!groupMeta.has(groupId)){
        groupMeta.set(groupId, {
          id: groupId,
          name: conn.name || formatConnectionNameFromId(groupId),
          color: conn.color || DEFAULT_COLOR,
          lineStyle: conn.lineStyle || "solid",
          count: 0
        });
      }

      groupMeta.get(groupId).count += 1;
    }
  }

  allCards.forEach(card => {
    const cardConnections = getPillWeekConnections(card);
    const isMatch = !!(selected && cardConnections.some(conn => conn.id === selected));

    card.classList.toggle("chain-selected", !!isMatch);
    card.classList.toggle("chain-dimmed", !!selected && !isMatch);
  });

  paths.forEach(path => {
    const isMatch = selected && path.dataset.connectionGroupId === selected;
    path.classList.toggle("selected", !!isMatch);
    path.classList.toggle("dimmed", !!selected && !isMatch);
  });

  setWeekConnectionBanner(selected ? groupMeta.get(selected) : null);
}


// ---------------------------------------------------------------------------
// Week connections: line routing, geometry & render
// ---------------------------------------------------------------------------

function getWeekConnectorLocalRect(el, parentRect){
  const rect = el.getBoundingClientRect();

  return {
    x: rect.left - parentRect.left,
    y: rect.top - parentRect.top,
    width: rect.width,
    height: rect.height,
    right: rect.left - parentRect.left + rect.width,
    bottom: rect.top - parentRect.top + rect.height,
    centerX: rect.left - parentRect.left + rect.width / 2,
    centerY: rect.top - parentRect.top + rect.height / 2
  };
}

function getWeekCardAnchor(rect, side = "right", gap = 6, yOffset = 0){
  // Each pill has a left and right anchor. A route entering from the previous
  // day lands on the left anchor; a route leaving toward the next day exits
  // from the right anchor. When several routes share the same side of the
  // same pill, the caller can add a tiny yOffset so the wires fan into
  // separate pinholes instead of all snapping to the exact center.
  const height = Math.max(1, Number(rect?.height || 0));
  const maxOffset = Math.max(0, Math.min(isMobileViewport() ? 7 : 9, (height / 2) - 8));
  const safeOffset = clamp(Number(yOffset || 0), -maxOffset, maxOffset);
  const y = Number(rect?.centerY || 0) + safeOffset;

  return side === "left"
    ? { x: rect.x - gap, y }
    : { x: rect.right + gap, y };
}

function buildWeekRouteSegments(fromRect, toRect, groupId, opts = {}){
  const fromBeforeTo = fromRect.centerX <= toRect.centerX;

  // The side ports sit just outside the pill. Keeping the anchor close to the
  // port gives the gutter more usable room, which matters once 3 parallel
  // connection lanes are trying to pass through the same narrow doorway.
  const anchorGap = isMobileViewport() ? 3 : 4;
  const sameLaneThreshold = isMobileViewport() ? 10 : 12;
  const fromAnchorYOffset = Number(opts.fromAnchorYOffset || 0);
  const toAnchorYOffset = Number(opts.toAnchorYOffset || 0);
  const hasCustomPortLane =
    Math.abs(fromAnchorYOffset) > 0.5 ||
    Math.abs(toAnchorYOffset) > 0.5;

  const start = getWeekCardAnchor(
    fromRect,
    fromBeforeTo ? "right" : "left",
    anchorGap,
    fromAnchorYOffset
  );

  const end = getWeekCardAnchor(
    toRect,
    fromBeforeTo ? "left" : "right",
    anchorGap,
    toAnchorYOffset
  );

  // Normal routes can tolerate small natural DOM y differences and still draw
  // as one clean rail. Port-fanned routes cannot: if one endpoint moved, a
  // single "horizontal" segment would silently collapse back to y1 in the
  // path builder. Force a small dogleg so the custom anchor y actually lives.
  const sameLane = Math.abs(start.y - end.y) <= (hasCustomPortLane ? 0.75 : sameLaneThreshold);
  const hasClearHorizontalGap = fromBeforeTo
    ? start.x < end.x
    : start.x > end.x;

  // If the events line up visually, use one clean rail between the two proper
  // anchors. No duplicate half-lines, no card-crossing laser.
  if(sameLane && hasClearHorizontalGap){
    return [
      { type:"horizontal", x1:start.x, y1:start.y, x2:end.x, y2:end.y, groupId }
    ];
  }

  let midX = (start.x + end.x) / 2;

  // If the two cards are in neighboring days, their proper anchors can be
  // very close together. That is good: the vertical turn belongs in the tiny
  // gutter between the days, not around the outside of the target card. Only
  // use the outside escape lane when the anchors have crossed/overlapped.
  if(!hasClearHorizontalGap){
    const gutter = anchorGap + 8;
    midX = fromBeforeTo
      ? Math.max(fromRect.right, toRect.right) + gutter
      : Math.min(fromRect.x, toRect.x) - gutter;
  }

  const laneInset = 0;
  const laneMinX = hasClearHorizontalGap
    ? Math.min(start.x, end.x) + laneInset
    : midX - (isMobileViewport() ? 8 : 10);
  const laneMaxX = hasClearHorizontalGap
    ? Math.max(start.x, end.x) - laneInset
    : midX + (isMobileViewport() ? 8 : 10);

  return [
    { type:"horizontal", x1:start.x, y1:start.y, x2:midX, y2:start.y, groupId },
    {
      type:"vertical",
      x1:midX,
      y1:start.y,
      x2:midX,
      y2:end.y,
      groupId,
      laneMinX,
      laneMaxX
    },
    { type:"horizontal", x1:midX, y1:end.y, x2:end.x, y2:end.y, groupId }
  ].filter(seg => Math.abs(seg.x1 - seg.x2) > 1 || Math.abs(seg.y1 - seg.y2) > 1);
}


function getWeekRoutePortKey(item, side = "right"){
  const pillKey =
    item?.pill?.dataset?.weekSortKey ||
    item?.sortKey ||
    item?.dayISO ||
    "floating";

  return `${pillKey}::${side}`;
}

function getWeekPortFanoutMaxOffset(rect = {}){
  const height = Math.max(1, Number(rect.height || 0));
  return Math.max(0, Math.min(isMobileViewport() ? 7 : 9, (height / 2) - 8));
}

function assignWeekPortFanoutOffsets(routes = []){
  const ports = new Map();

  const addPort = (route, endpoint) => {
    const isFrom = endpoint === "from";
    const item = isFrom ? route.fromItem : route.toItem;
    const side = isFrom ? route.fromSide : route.toSide;
    const otherItem = isFrom ? route.toItem : route.fromItem;
    if(!item || !side) return;

    const key = getWeekRoutePortKey(item, side);
    if(!ports.has(key)) ports.set(key, []);

    ports.get(key).push({
      route,
      endpoint,
      item,
      side,
      otherY: Number(otherItem?.rect?.centerY || 0),
      otherX: Number(otherItem?.rect?.centerX || 0),
      groupId: String(route.group?.id || "")
    });
  };

  for(const route of routes || []){
    route.fromAnchorYOffset = 0;
    route.toAnchorYOffset = 0;
    addPort(route, "from");
    addPort(route, "to");
  }

  for(const entries of ports.values()){
    if(entries.length < 2) continue;

    entries.sort((a, b) =>
      a.otherY - b.otherY ||
      a.otherX - b.otherX ||
      a.groupId.localeCompare(b.groupId)
    );

    const maxOffset = Math.min(...entries.map(entry => getWeekPortFanoutMaxOffset(entry.item?.rect || {})));
    if(maxOffset <= 0) continue;

    const laneCount = entries.length;
    const idealSpacing = isMobileViewport() ? 6 : 7;
    const spacing = laneCount <= 1
      ? 0
      : Math.min(idealSpacing, (maxOffset * 2) / Math.max(1, laneCount - 1));
    const centerLane = (laneCount - 1) / 2;

    entries.forEach((entry, index) => {
      const offset = clamp((index - centerLane) * spacing, -maxOffset, maxOffset);

      if(entry.endpoint === "from"){
        entry.route.fromAnchorYOffset = offset;
      }else{
        entry.route.toAnchorYOffset = offset;
      }
    });
  }
}

function doesHorizontalCrossVertical(h, v){
  if(!h || !v) return false;

  const hMinX = Math.min(h.x1, h.x2);
  const hMaxX = Math.max(h.x1, h.x2);
  const vMinY = Math.min(v.y1, v.y2);
  const vMaxY = Math.max(v.y1, v.y2);
  const vx = Number(v.x1 ?? v.x2 ?? 0);
  const hy = Number(h.y1 ?? h.y2 ?? 0);
  const buffer = 8;

  // Do not skip same-group wires here. A chain can have multiple route legs,
  // and a same-color vertical from one leg can still pass through the middle
  // of a horizontal rail from another leg. Only endpoint touches are ignored
  // by the buffer below, so real elbows still connect normally.
  return (
    vx > hMinX + buffer &&
    vx < hMaxX - buffer &&
    hy > vMinY + buffer &&
    hy < vMaxY - buffer
  );
}

function getHorizontalVerticalBridgeCrossings(segment, verticalSegments = [], dir = 1){
  const bridgeRadius = isMobileViewport() ? 6 : 7;
  const clusterGap = bridgeRadius + (isMobileViewport() ? 3 : 4);

  const raw = (verticalSegments || [])
    .filter(v => doesHorizontalCrossVertical(segment, v))
    .map(v => Number(v.x1 ?? v.x2 ?? 0))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const clusters = [];

  for(const x of raw){
    const last = clusters[clusters.length - 1];

    if(!last || Math.abs(x - last.center) > clusterGap){
      clusters.push({ center:x, xs:[x] });
      continue;
    }

    last.xs.push(x);
    last.center = last.xs.reduce((sum, value) => sum + value, 0) / last.xs.length;
  }

  return clusters
    .map(cluster => cluster.center)
    .sort((a, b) => dir > 0 ? a - b : b - a);
}

function buildHorizontalPathWithBridges(segment, verticalSegments){
  const bridgeRadius = isMobileViewport() ? 6 : 7;
  const y = segment.y1;
  const dir = segment.x2 >= segment.x1 ? 1 : -1;
  const crossings = getHorizontalVerticalBridgeCrossings(segment, verticalSegments, dir);

  let d = `M ${segment.x1.toFixed(1)} ${y.toFixed(1)}`;

  for(const crossX of crossings){
    const beforeX = crossX - (bridgeRadius * dir);
    const afterX = crossX + (bridgeRadius * dir);

    d += ` L ${beforeX.toFixed(1)} ${y.toFixed(1)}`;
    d += ` Q ${crossX.toFixed(1)} ${(y + bridgeRadius).toFixed(1)} ${afterX.toFixed(1)} ${y.toFixed(1)}`;
  }

  d += ` L ${segment.x2.toFixed(1)} ${y.toFixed(1)}`;
  return d;
}

function getHorizontalBridgeY(segment = {}){
  const anchorY = Number(segment.y1 || segment.y2 || 0);
  const visualY = Number.isFinite(Number(segment.visualY))
    ? Number(segment.visualY)
    : anchorY;

  return visualY;
}

function horizontalSegmentCoversBridgeX(segment = {}, x = 0, padding = 0){
  const xMin = Math.min(Number(segment.x1 || 0), Number(segment.x2 || 0)) - padding;
  const xMax = Math.max(Number(segment.x1 || 0), Number(segment.x2 || 0)) + padding;

  return Number.isFinite(xMin) && Number.isFinite(xMax) && x >= xMin && x <= xMax;
}

function horizontalSegmentOverlapsBridgeSpan(segment = {}, spanMinX = 0, spanMaxX = 0, padding = 0){
  const xMin = Math.min(Number(segment.x1 || 0), Number(segment.x2 || 0)) - padding;
  const xMax = Math.max(Number(segment.x1 || 0), Number(segment.x2 || 0)) + padding;

  if(!Number.isFinite(xMin) || !Number.isFinite(xMax)) return false;

  return Math.max(xMin, spanMinX) <= Math.min(xMax, spanMaxX);
}

function scoreHorizontalBridgeDirection(segment, crossX, direction, horizontalSegments = []){
  const bridgeRadius = isMobileViewport() ? 6 : 7;
  const y = getHorizontalBridgeY(segment);
  const bridgeY = y + (bridgeRadius * direction);

  // The visible bridge is wider than the math curve because of stroke width,
  // glow, and anti-aliasing. Look around the whole overpass, not just the
  // center crossing point, so a nearby rail ending beside the crossing still
  // counts as blocked.
  const xPad = isMobileViewport() ? 15 : 18;
  const yPad = isMobileViewport() ? 5 : 6;
  const spanMinX = crossX - bridgeRadius - xPad;
  const spanMaxX = crossX + bridgeRadius + xPad;
  const bridgeMinY = Math.min(y, bridgeY) - yPad;
  const bridgeMaxY = Math.max(y, bridgeY) + yPad;

  let score = 0;

  for(const other of horizontalSegments || []){
    if(!other || other === segment || other.type !== "horizontal") continue;
    if(!horizontalSegmentOverlapsBridgeSpan(other, spanMinX, spanMaxX, 0)) continue;

    const otherY = getHorizontalBridgeY(other);
    if(!Number.isFinite(otherY) || Math.abs(otherY - y) < 0.75) continue;

    // Hard collision: another horizontal rail lives inside the vertical space
    // the bridge would occupy.
    if(otherY >= bridgeMinY && otherY <= bridgeMaxY){
      score += 100 + Math.max(0, (bridgeRadius + yPad) - Math.abs(otherY - bridgeY));
      continue;
    }

    // Soft collision: another rail is just outside the bridge, where the glow
    // would still visually merge. This is the part your screenshot was showing.
    const glowClearance = isMobileViewport() ? 5 : 6;
    const edgeDistance = Math.min(
      Math.abs(otherY - bridgeMinY),
      Math.abs(otherY - bridgeMaxY)
    );

    if(edgeDistance <= glowClearance){
      score += 25 + (glowClearance - edgeDistance);
    }
  }

  return score;
}

function chooseHorizontalBridgeDirection(segment, crossX, horizontalSegments = []){
  const bridgeRadius = isMobileViewport() ? 6 : 7;
  const y = getHorizontalBridgeY(segment);

  const upScore = scoreHorizontalBridgeDirection(segment, crossX, -1, horizontalSegments);
  const downScore = scoreHorizontalBridgeDirection(segment, crossX, 1, horizontalSegments);

  if(upScore !== downScore){
    return upScore < downScore ? -1 : 1;
  }

  // Fallback for cases where the actual curve space is clear but a nearby rail
  // sits close enough to make the overpass read as a blob. Use a wider scout
  // range than the old center-point check.
  const xPadding = bridgeRadius * 3 + (isMobileViewport() ? 10 : 14);
  const yClearance = bridgeRadius * 2 + (isMobileViewport() ? 8 : 10);

  let nearestAbove = Infinity;
  let nearestBelow = Infinity;

  for(const other of horizontalSegments || []){
    if(!other || other === segment || other.type !== "horizontal") continue;
    if(!horizontalSegmentCoversBridgeX(other, crossX, xPadding)) continue;

    const otherY = getHorizontalBridgeY(other);
    if(!Number.isFinite(otherY) || Math.abs(otherY - y) < 0.75) continue;

    const distance = Math.abs(otherY - y);
    if(distance > yClearance) continue;

    if(otherY < y) nearestAbove = Math.min(nearestAbove, distance);
    else nearestBelow = Math.min(nearestBelow, distance);
  }

  const blockedAbove = Number.isFinite(nearestAbove);
  const blockedBelow = Number.isFinite(nearestBelow);

  if(blockedAbove && !blockedBelow) return 1;
  if(blockedBelow && !blockedAbove) return -1;
  if(blockedAbove && blockedBelow) return nearestAbove <= nearestBelow ? 1 : -1;

  // A clean bridge now defaults downward. The top side of a rail is usually
  // where pill ports and neighboring rails visually merge, which is exactly
  // the little goblin shown in the screenshot.
  return 1;
}

function appendHorizontalPathWithBridges(d, segment, verticalSegments, horizontalSegments = [], opts = {}){
  const bridgeRadius = isMobileViewport() ? 6 : 7;
  const anchorY = Number(segment.y1 || segment.y2 || 0);
  const visualY = getHorizontalBridgeY(segment);
  const dir = segment.x2 >= segment.x1 ? 1 : -1;
  const isFirst = !!opts.isFirst;
  const joinStartAtVisualY = !!opts.joinStartAtVisualY;
  const joinEndAtVisualY = !!opts.joinEndAtVisualY;
  const anchorStartAtVisualY = !!opts.anchorStartAtVisualY;
  const anchorEndAtVisualY = !!opts.anchorEndAtVisualY;
  const startY = (joinStartAtVisualY || anchorStartAtVisualY) ? visualY : anchorY;
  const endY = (joinEndAtVisualY || anchorEndAtVisualY) ? visualY : anchorY;

  const bridgeSegment = {
    ...segment,
    y1: visualY,
    y2: visualY
  };

  const crossings = getHorizontalVerticalBridgeCrossings(
    bridgeSegment,
    verticalSegments,
    dir
  );

  d += isFirst
    ? `M ${segment.x1.toFixed(1)} ${startY.toFixed(1)}`
    : ` L ${segment.x1.toFixed(1)} ${startY.toFixed(1)}`;

  if(!joinStartAtVisualY && Math.abs(visualY - anchorY) > 0.5){
    d += ` L ${segment.x1.toFixed(1)} ${visualY.toFixed(1)}`;
  }

  for(const crossX of crossings){
    const beforeX = crossX - (bridgeRadius * dir);
    const afterX = crossX + (bridgeRadius * dir);
    const bridgeDirection = chooseHorizontalBridgeDirection(bridgeSegment, crossX, horizontalSegments);
    const bridgeY = visualY + (bridgeRadius * bridgeDirection);

    d += ` L ${beforeX.toFixed(1)} ${visualY.toFixed(1)}`;
    d += ` Q ${crossX.toFixed(1)} ${bridgeY.toFixed(1)} ${afterX.toFixed(1)} ${visualY.toFixed(1)}`;
  }

  d += ` L ${segment.x2.toFixed(1)} ${visualY.toFixed(1)}`;

  if(!joinEndAtVisualY && Math.abs(visualY - endY) > 0.5){
    d += ` L ${segment.x2.toFixed(1)} ${endY.toFixed(1)}`;
  }

  return d;
}

function buildPathForWeekRoute(segments, verticalSegments, horizontalSegments = []){
  const list = Array.isArray(segments) ? segments.filter(Boolean) : [];
  if(!list.length) return "";

  return list.reduce((d, segment, index) => {
    const prev = list[index - 1];
    const next = list[index + 1];

    if(segment.type === "horizontal"){
      const hasVisualY = Number.isFinite(Number(segment.visualY));

      return appendHorizontalPathWithBridges(d, segment, verticalSegments, horizontalSegments, {
        isFirst: index === 0,
        // When a y-laned horizontal rail joins a vertical turn, keep that
        // internal joint on the rail's visual lane. Otherwise two different
        // colors that merely touch endpoint-to-endpoint both return to the
        // original y first, creating the little red/purple knot in the gutter.
        joinStartAtVisualY: prev?.type === "vertical",
        joinEndAtVisualY: next?.type === "vertical",
        // Same idea at the actual pill ports: if the rail earned a visual
        // y-lane, let the side anchor move with it instead of snapping back
        // to the pill's exact center. The offset is tiny and still stays
        // inside the rounded pill, but it removes the last shared-pixel knot.
        anchorStartAtVisualY: !!segment.anchorStartAtVisualY || (!prev && hasVisualY),
        anchorEndAtVisualY: !!segment.anchorEndAtVisualY || (!next && hasVisualY)
      });
    }

    const startY = prev?.type === "horizontal"
      ? getHorizontalBridgeY(prev)
      : Number(segment.y1 || 0);

    const endY = next?.type === "horizontal"
      ? getHorizontalBridgeY(next)
      : Number(segment.y2 || 0);

    d += index === 0
      ? `M ${segment.x1.toFixed(1)} ${startY.toFixed(1)}`
      : ` L ${segment.x1.toFixed(1)} ${startY.toFixed(1)}`;

    d += ` L ${segment.x2.toFixed(1)} ${endY.toFixed(1)}`;
    return d;
  }, "");
}

function setWeekPillConnectorAnchorY(pill, rect, side = "right", y = 0){
  if(!pill || !rect || !Number.isFinite(Number(y))) return;

  const height = Math.max(1, Number(rect.height || 0));
  const relativeY = Number(y) - Number(rect.y || 0);

  // Keep the nub inside the pill's rounded sides. It can breathe a little
  // above/below center, but never drifts into the corners.
  const minPct = 24;
  const maxPct = 76;
  const pct = clamp((relativeY / height) * 100, minPct, maxPct);
  const prop = side === "left" ? "--connector-left-y" : "--connector-right-y";

  pill.style.setProperty(prop, `${pct.toFixed(1)}%`);
}

function clearWeekPillConnectorAnchorY(pill){
  if(!pill) return;
  pill.style.removeProperty("--connector-left-y");
  pill.style.removeProperty("--connector-right-y");
}

function applyWeekConnectorAnchorOffsets(routes = []){
  for(const route of routes || []){
    const segments = Array.isArray(route?.segments) ? route.segments : [];
    if(!segments.length) continue;

    const first = segments[0];
    const last = segments[segments.length - 1];

    if(Math.abs(Number(route.fromAnchorYOffset || 0)) > 0.5){
      setWeekPillConnectorAnchorY(
        route.fromItem?.pill,
        route.fromItem?.rect,
        route.fromSide || "right",
        Number(route.fromItem?.rect?.centerY || 0) + Number(route.fromAnchorYOffset || 0)
      );
    }

    if(Math.abs(Number(route.toAnchorYOffset || 0)) > 0.5){
      setWeekPillConnectorAnchorY(
        route.toItem?.pill,
        route.toItem?.rect,
        route.toSide || "left",
        Number(route.toItem?.rect?.centerY || 0) + Number(route.toAnchorYOffset || 0)
      );
    }

    if(first?.type === "horizontal" && Number.isFinite(Number(first.visualY))){
      const visualY = getHorizontalBridgeY(first);
      first.anchorStartAtVisualY = true;
      setWeekPillConnectorAnchorY(
        route.fromItem?.pill,
        route.fromItem?.rect,
        route.fromSide || "right",
        visualY
      );
    }

    if(last?.type === "horizontal" && Number.isFinite(Number(last.visualY))){
      const visualY = getHorizontalBridgeY(last);
      last.anchorEndAtVisualY = true;
      setWeekPillConnectorAnchorY(
        route.toItem?.pill,
        route.toItem?.rect,
        route.toSide || "left",
        visualY
      );
    }
  }
}

function createWeekConnectorPath(svg, segments, group, verticalSegments, horizontalSegments = [], extraClass = ""){
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", buildPathForWeekRoute(segments, verticalSegments, horizontalSegments));
  path.setAttribute("class", `weekConnector style-${group.lineStyle || "solid"} ${extraClass}`.trim());
  path.dataset.connectionGroupId = group.id;
  path.dataset.connectionGroupName = group.name;
  path.style.stroke = group.color || DEFAULT_COLOR;
  path.style.color = group.color || DEFAULT_COLOR;

  path.addEventListener("click", (e) => {
    e.stopPropagation();
    selectConnectionGroup(group.id);
  });

  svg.appendChild(path);
  return path;
}


function rangesOverlap(aMin, aMax, bMin, bMax, buffer = 0){
  return Math.max(aMin, bMin) <= Math.min(aMax, bMax) + buffer;
}

function setWeekRouteVerticalX(route, verticalSegment, nextX){
  if(!route || !verticalSegment || !Array.isArray(route.segments)) return;

  const oldX = Number(verticalSegment.x1 || verticalSegment.x2 || 0);
  const safeX = Number(nextX || oldX);

  if(!Number.isFinite(safeX)) return;

  verticalSegment.x1 = safeX;
  verticalSegment.x2 = safeX;

  const index = route.segments.indexOf(verticalSegment);
  if(index < 0) return;

  const prev = route.segments[index - 1];
  const next = route.segments[index + 1];
  const snap = 2;

  if(prev && prev.type === "horizontal"){
    if(Math.abs(Number(prev.x2 || 0) - oldX) <= snap) prev.x2 = safeX;
    else if(Math.abs(Number(prev.x1 || 0) - oldX) <= snap) prev.x1 = safeX;
  }

  if(next && next.type === "horizontal"){
    if(Math.abs(Number(next.x1 || 0) - oldX) <= snap) next.x1 = safeX;
    else if(Math.abs(Number(next.x2 || 0) - oldX) <= snap) next.x2 = safeX;
  }
}

function assignWeekVerticalConnectorLanes(routes = []){
  const verticals = [];

  for(const route of routes || []){
    for(const segment of route?.segments || []){
      if(segment?.type !== "vertical") continue;

      const yMin = Math.min(Number(segment.y1 || 0), Number(segment.y2 || 0));
      const yMax = Math.max(Number(segment.y1 || 0), Number(segment.y2 || 0));
      const x = Number(segment.x1 || segment.x2 || 0);

      if(!Number.isFinite(x) || !Number.isFinite(yMin) || !Number.isFinite(yMax)) continue;

      verticals.push({
        route,
        segment,
        x,
        yMin,
        yMax,
        groupId: String(segment.groupId || route?.group?.id || ""),
        laneMinX: Number(segment.laneMinX),
        laneMaxX: Number(segment.laneMaxX),
        lane:0
      });
    }
  }

  if(verticals.length < 2) return;

  // Adjacent week cards only leave a small gutter between them. Instead of
  // letting every vertical segment choose the same centerline, treat that
  // gutter like a tiny 3-lane road: left / center / right. More than 3 chains
  // intentionally reuse those lanes rather than exploding into the pills.
  const clusterDistance = isMobileViewport() ? 12 : 16;
  const laneLimit = 3;
  const minLaneSpacing = isMobileViewport() ? 4 : 5;
  const maxLaneSpacing = isMobileViewport() ? 5 : 6;

  const clusters = [];
  const sortedByX = [...verticals].sort((a, b) => a.x - b.x);

  for(const item of sortedByX){
    const last = clusters[clusters.length - 1];

    if(!last || Math.abs(item.x - last.centerX) > clusterDistance){
      clusters.push({ centerX:item.x, items:[item] });
      continue;
    }

    last.items.push(item);
    last.centerX = last.items.reduce((sum, x) => sum + x.x, 0) / last.items.length;
  }

  for(const cluster of clusters){
    if(cluster.items.length < 2) continue;

    const groupOrder = Array.from(new Set(
      cluster.items
        .slice()
        .sort((a, b) => a.yMin - b.yMin || a.yMax - b.yMax || a.groupId.localeCompare(b.groupId))
        .map(item => item.groupId || `route-${cluster.items.indexOf(item)}`)
    ));

    const laneCount = Math.min(laneLimit, Math.max(1, groupOrder.length));
    const laneForGroup = new Map();

    groupOrder.forEach((groupId, index) => {
      laneForGroup.set(groupId, index % laneLimit);
    });

    // If every item belongs to one chain, keep it in the middle. Otherwise,
    // give each chain a stable lane through this gutter so colors do not stack
    // on top of each other when their vertical spans barely miss overlapping.
    for(const item of cluster.items){
      item.lane = laneCount === 1
        ? 0
        : laneForGroup.get(item.groupId) ?? 0;
    }

    const finiteMin = cluster.items
      .map(item => item.laneMinX)
      .filter(Number.isFinite);
    const finiteMax = cluster.items
      .map(item => item.laneMaxX)
      .filter(Number.isFinite);

    const corridorMin = finiteMin.length ? Math.max(...finiteMin) : NaN;
    const corridorMax = finiteMax.length ? Math.min(...finiteMax) : NaN;
    const hasCorridor = Number.isFinite(corridorMin) && Number.isFinite(corridorMax) && corridorMax > corridorMin;
    const requiredSpread = (laneCount - 1) * minLaneSpacing;

    let spacing = laneCount > 1 ? maxLaneSpacing : 0;
    let centerX = cluster.centerX;

    if(hasCorridor){
      const available = corridorMax - corridorMin;

      if(laneCount > 1){
        spacing = Math.min(maxLaneSpacing, Math.max(minLaneSpacing, available / (laneCount - 1)));
      }

      const spread = spacing * (laneCount - 1);

      if(available >= requiredSpread){
        centerX = clamp(
          cluster.centerX,
          corridorMin + spread / 2,
          corridorMax - spread / 2
        );
      }else{
        // Last-resort squeeze: stay centered in the real gutter instead of
        // throwing lanes outward into the event cards.
        spacing = laneCount > 1 ? Math.max(3, available / Math.max(1, laneCount - 1)) : 0;
        centerX = (corridorMin + corridorMax) / 2;
      }
    }

    const centerLane = (laneCount - 1) / 2;

    for(const item of cluster.items){
      const normalizedLane = laneCount <= 1 ? 0 : Math.min(item.lane, laneCount - 1);
      let nextX = centerX + ((normalizedLane - centerLane) * spacing);

      if(Number.isFinite(item.laneMinX) && Number.isFinite(item.laneMaxX) && item.laneMaxX > item.laneMinX){
        nextX = clamp(nextX, item.laneMinX, item.laneMaxX);
      }

      setWeekRouteVerticalX(item.route, item.segment, nextX);
    }
  }
}

function horizontalRangesOverlap(a, b, buffer = 0){
  const aMin = Math.min(Number(a.x1 || 0), Number(a.x2 || 0));
  const aMax = Math.max(Number(a.x1 || 0), Number(a.x2 || 0));
  const bMin = Math.min(Number(b.x1 || 0), Number(b.x2 || 0));
  const bMax = Math.max(Number(b.x1 || 0), Number(b.x2 || 0));

  return Math.max(aMin, bMin) <= Math.min(aMax, bMax) + buffer;
}

function horizontalOverlapWidth(a, b){
  const aMin = Math.min(Number(a.x1 || 0), Number(a.x2 || 0));
  const aMax = Math.max(Number(a.x1 || 0), Number(a.x2 || 0));
  const bMin = Math.min(Number(b.x1 || 0), Number(b.x2 || 0));
  const bMax = Math.max(Number(b.x1 || 0), Number(b.x2 || 0));

  return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));
}

function horizontalEndpointGap(a, b){
  const aMin = Math.min(Number(a.x1 || 0), Number(a.x2 || 0));
  const aMax = Math.max(Number(a.x1 || 0), Number(a.x2 || 0));
  const bMin = Math.min(Number(b.x1 || 0), Number(b.x2 || 0));
  const bMax = Math.max(Number(b.x1 || 0), Number(b.x2 || 0));

  if(!Number.isFinite(aMin) || !Number.isFinite(aMax) || !Number.isFinite(bMin) || !Number.isFinite(bMax)){
    return Infinity;
  }

  if(aMax < bMin) return bMin - aMax;
  if(bMax < aMin) return aMin - bMax;
  return 0;
}

function horizontalSegmentsNeedSeparateLanes(a, b, opts = {}){
  const minUsefulOverlap = Number(opts.minUsefulOverlap ?? 0);
  const touchGap = Number(opts.touchGap ?? 0);
  const overlapBuffer = Number(opts.overlapBuffer ?? 0);

  const overlapWidth = horizontalOverlapWidth(a, b);

  if(
    horizontalRangesOverlap(a, b, overlapBuffer) &&
    overlapWidth >= minUsefulOverlap
  ){
    return true;
  }

  // Two different wires can be mathematically "not overlapping" while still
  // drawing as one chunky rail: one ends exactly where the other starts, or
  // their glowing stroke halos almost touch. That was the red-on-purple case
  // in the week gutter. Treat endpoint kisses as lane conflicts too.
  return horizontalEndpointGap(a, b) <= touchGap;
}

function assignWeekHorizontalConnectorLanes(routes = []){
  const horizontals = [];

  for(const route of routes || []){
    for(const segment of route?.segments || []){
      if(segment?.type !== "horizontal") continue;

      const y = Number(segment.y1 || segment.y2 || 0);
      const xMin = Math.min(Number(segment.x1 || 0), Number(segment.x2 || 0));
      const xMax = Math.max(Number(segment.x1 || 0), Number(segment.x2 || 0));

      if(!Number.isFinite(y) || !Number.isFinite(xMin) || !Number.isFinite(xMax)) continue;
      // NOTE: this used to skip segments under 8px, which excluded the short
      // exit/entry stubs right next to a card (the exact segments most likely
      // to collide when two cards in neighboring days share a row height).
      // Only skip truly-degenerate (near zero-length) segments now, so those
      // stubs get laned like everything else.
      if(Math.abs(xMax - xMin) < 0.5) continue;

      segment.visualY = undefined;

      horizontals.push({
        route,
        segment,
        y,
        xMin,
        xMax,
        groupId: String(segment.groupId || route?.group?.id || ""),
        lane:0
      });
    }
  }

  if(horizontals.length < 2) return;

  // Vertical lanes already get separated in the gutter. This handles the
  // matching horizontal rails: when two chains sit on nearly the same row and
  // their horizontal runs overlap, give those rails tiny y-lanes too. The line
  // still touches the card port; the path builder adds a miniature elbow up or
  // down to the visual lane and returns to the real anchor at the other end.
  // Treat rails that merely kiss at the pill anchor as conflicts too. This
  // is intentionally more generous than pure geometry because the line glow
  // makes near-misses look like overlaps. The actual offset stays small.
  const yClusterDistance = isMobileViewport() ? 14 : 18;
  const overlapBuffer = isMobileViewport() ? 4 : 6;
  const minUsefulOverlap = isMobileViewport() ? 1 : 1;
  const touchGap = isMobileViewport() ? 34 : 42;
  const laneLimit = 4;
  const laneMaxSpread = isMobileViewport() ? 16 : 20;

  const clusters = [];
  const sorted = [...horizontals].sort((a, b) => a.y - b.y || a.xMin - b.xMin);

  for(const item of sorted){
    let match = null;

    for(const cluster of clusters){
      const closeY = Math.abs(item.y - cluster.centerY) <= yClusterDistance;
      const overlapsExisting = cluster.items.some(existing =>
        horizontalSegmentsNeedSeparateLanes(item.segment, existing.segment, {
          overlapBuffer,
          minUsefulOverlap,
          touchGap
        })
      );

      if(closeY && overlapsExisting){
        match = cluster;
        break;
      }
    }

    if(!match){
      clusters.push({ centerY:item.y, items:[item] });
      continue;
    }

    match.items.push(item);
    match.centerY = match.items.reduce((sum, x) => sum + x.y, 0) / match.items.length;
  }

  for(const cluster of clusters){
    const groupOrder = Array.from(new Set(
      cluster.items
        .slice()
        .sort((a, b) => a.xMin - b.xMin || a.y - b.y || a.groupId.localeCompare(b.groupId))
        .map(item => item.groupId || `route-${cluster.items.indexOf(item)}`)
    ));

    if(groupOrder.length < 2) continue;

    const laneCount = Math.min(laneLimit, groupOrder.length);
    const laneForGroup = new Map();

    groupOrder.forEach((groupId, index) => {
      laneForGroup.set(groupId, index % laneLimit);
    });

    const centerLane = (laneCount - 1) / 2;

    for(const item of cluster.items){
      const rawLane = laneForGroup.get(item.groupId) ?? 0;
      const lane = Math.min(rawLane, laneCount - 1);
      const normalizedLane = centerLane > 0
        ? (lane - centerLane) / centerLane
        : 0;
      const offset = normalizedLane * (laneMaxSpread / 2);

      if(Math.abs(offset) < 0.5) continue;

      item.segment.visualY = item.y + offset;
    }
  }
}

function getWeekRouteItemsForGroup(items = []){
  const sorted = [...(items || [])].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // The week wire is a route, not a spiderweb. If the same connected chain has
  // multiple cards on one day, use one representative card for the inter-day
  // line and let the other cards simply glow with the chain selection. This
  // prevents the “one card fired two rails at the next day” look.
  const dayBuckets = new Map();

  for(const item of sorted){
    const dayISO = item.dayISO || item.pill?.dataset.weekDayIso || item.sortKey.slice(0, 10) || "";
    const key = dayISO || `floating-${dayBuckets.size}`;

    if(!dayBuckets.has(key)) dayBuckets.set(key, []);
    dayBuckets.get(key).push(item);
  }

  const routeItems = [];

  for(const bucket of dayBuckets.values()){
    bucket.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    routeItems.push(bucket[0]);
  }

  return routeItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function getWeekConnectionGeometryKey(){
  if(!grid || viewMode !== "week") return "";

  const calendarEl = grid.closest(".calendar");
  const gridRect = grid.getBoundingClientRect();
  const calendarRect = calendarEl?.getBoundingClientRect?.() || { width:0, height:0 };
  const docEl = document.documentElement;

  // This is the tiny tripwire for the scrollbar goblin: if a body/page
  // scrollbar appears, the usable viewport and the grid/card widths can shift
  // after the week wires were drawn. We only redraw when those real geometry
  // numbers change, not on every day click.
  return [
    Math.round(docEl?.clientWidth || 0),
    Math.round(window.innerWidth || 0),
    Math.round(calendarRect.width || 0),
    Math.round(calendarEl?.clientWidth || 0),
    Math.round(calendarEl?.scrollWidth || 0),
    Math.round(gridRect.width || 0),
    Math.round(gridRect.height || 0),
    Math.round(grid.scrollWidth || 0),
    Math.round(grid.scrollHeight || 0),
    Array.from(grid.querySelectorAll(".weekViewDay")).map(dayEl => {
      const rect = dayEl.getBoundingClientRect();
      return `${Math.round(rect.width)}x${Math.round(rect.height)}:${Math.round(dayEl.clientWidth || 0)}:${Math.round(dayEl.scrollHeight || 0)}`;
    }).join(","),
    Array.from(grid.querySelectorAll(".weekEventPill.connectedEventPill")).map(pill => {
      const rect = pill.getBoundingClientRect();
      return `${pill.dataset.weekSortKey || ""}:${Math.round(rect.left - gridRect.left)}:${Math.round(rect.top - gridRect.top)}:${Math.round(rect.width)}:${Math.round(rect.height)}`;
    }).join(",")
  ].join("|");
}

function disconnectWeekConnectionGeometryObservers(){
  if(weekConnectionResizeObserver){
    weekConnectionResizeObserver.disconnect();
    weekConnectionResizeObserver = null;
  }

  lastWeekConnectionGeometryKey = "";
}

function queueWeekConnectionsRenderIfGeometryChanged(){
  if(viewMode !== "week" || !grid) return;
  if(weekConnectionGeometryCheckQueued) return;

  weekConnectionGeometryCheckQueued = true;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      weekConnectionGeometryCheckQueued = false;

      const nextKey = getWeekConnectionGeometryKey();
      if(!nextKey || nextKey === lastWeekConnectionGeometryKey) return;

      lastWeekConnectionGeometryKey = nextKey;
      queueWeekConnectionsRender();
    });
  });
}

function updateWeekConnectionGeometryObservers(){
  if(weekConnectionResizeObserver){
    weekConnectionResizeObserver.disconnect();
    weekConnectionResizeObserver = null;
  }

  if(viewMode !== "week" || !grid || typeof ResizeObserver === "undefined") return;

  weekConnectionResizeObserver = new ResizeObserver(() => {
    queueWeekConnectionsRenderIfGeometryChanged();
  });

  const calendarEl = grid.closest(".calendar");
  const targets = [
    document.documentElement,
    document.body,
    calendarEl,
    dow,
    grid,
    ...Array.from(grid.querySelectorAll(".weekViewDay")),
    ...Array.from(grid.querySelectorAll(".weekEventPill.connectedEventPill"))
  ].filter(Boolean);

  for(const target of new Set(targets)){
    try{ weekConnectionResizeObserver.observe(target); }
    catch{}
  }
}

function renderWeekConnections(){
  if(!grid || viewMode !== "week") return;

  const svg = grid.querySelector(".weekConnectorLayer");
  if(!svg) return;

  svg.innerHTML = "";

  const parentRect = grid.getBoundingClientRect();
  const layerWidth = Math.max(
    1,
    Math.ceil(grid.scrollWidth || 0),
    Math.ceil(grid.offsetWidth || 0),
    Math.ceil(parentRect.width || 0)
  );
  const layerHeight = Math.max(
    1,
    Math.ceil(grid.scrollHeight || 0),
    Math.ceil(grid.offsetHeight || 0),
    Math.ceil(parentRect.height || 0)
  );

  // SVG defaults to a 300x150 internal coordinate system unless we pin it.
  // Without this, perfectly good pixel coordinates get stretched and can look
  // like duplicate rails shooting through unrelated cards.
  svg.setAttribute("viewBox", `0 0 ${layerWidth} ${layerHeight}`);
  svg.setAttribute("width", String(layerWidth));
  svg.setAttribute("height", String(layerHeight));
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.width = `${layerWidth}px`;
  svg.style.height = `${layerHeight}px`;

  const pills = Array.from(grid.querySelectorAll(".weekEventPill.connectedEventPill"));
  const groups = new Map();

  for(const pill of pills){
    const connections = getPillWeekConnections(pill);

    for(const conn of connections){
      const groupId = conn.id || "";
      if(!groupId) continue;

      if(!groups.has(groupId)){
        groups.set(groupId, {
          id: groupId,
          name: conn.name || getEventConnectionGroupName({}, groupId),
          color: conn.color || DEFAULT_COLOR,
          lineStyle: conn.lineStyle || "solid",
          items: []
        });
      }

      groups.get(groupId).items.push({
        pill,
        dayISO: pill.dataset.weekDayIso || "",
        sortKey: pill.dataset.weekSortKey || "",
        rect: getWeekConnectorLocalRect(pill, parentRect)
      });
    }
  }

  pills.forEach(pill => {
    pill.classList.remove("connector-left", "connector-right");
    clearWeekPillConnectorAnchorY(pill);
  });

  const allRoutes = [];
  const allVerticalSegments = [];

  for(const group of groups.values()){
    const routeItems = getWeekRouteItemsForGroup(group.items);
    if(routeItems.length < 2) continue;

    for(let i = 0; i < routeItems.length - 1; i++){
      const fromItem = routeItems[i];
      const toItem = routeItems[i + 1];
      const fromBeforeTo = fromItem.rect.centerX <= toItem.rect.centerX;

      // The SVG line stops at a tiny side port, while the pill keeps its
      // normal shape/style. This makes the connection feel attached without
      // drawing through the event card itself.
      fromItem.pill.classList.add(fromBeforeTo ? "connector-right" : "connector-left");
      toItem.pill.classList.add(fromBeforeTo ? "connector-left" : "connector-right");

      const fromSide = fromBeforeTo ? "right" : "left";
      const toSide = fromBeforeTo ? "left" : "right";
      allRoutes.push({
        group,
        segments: [],
        fromItem,
        toItem,
        fromSide,
        toSide,
        fromAnchorYOffset: 0,
        toAnchorYOffset: 0
      });
    }
  }

  assignWeekPortFanoutOffsets(allRoutes);

  for(const route of allRoutes){
    route.segments = buildWeekRouteSegments(route.fromItem.rect, route.toItem.rect, route.group.id, {
      fromAnchorYOffset: route.fromAnchorYOffset,
      toAnchorYOffset: route.toAnchorYOffset
    });
    allVerticalSegments.push(...route.segments.filter(seg => seg.type === "vertical"));
  }

  assignWeekVerticalConnectorLanes(allRoutes);
  assignWeekHorizontalConnectorLanes(allRoutes);
  applyWeekConnectorAnchorOffsets(allRoutes);

  const visibleVerticalSegments = allRoutes.flatMap(route =>
    (route.segments || []).filter(seg => seg.type === "vertical")
  );

  const visibleHorizontalSegments = allRoutes.flatMap(route =>
    (route.segments || []).filter(seg => seg.type === "horizontal")
  );

  for(const route of allRoutes){
    if(route.group.lineStyle === "double"){
      createWeekConnectorPath(svg, route.segments, route.group, visibleVerticalSegments, visibleHorizontalSegments, "style-double-base");
      createWeekConnectorPath(svg, route.segments, route.group, visibleVerticalSegments, visibleHorizontalSegments, "style-double-top");
    }else{
      createWeekConnectorPath(svg, route.segments, route.group, visibleVerticalSegments, visibleHorizontalSegments);
    }
  }

  renderWeekConnectionHighlights();
  lastWeekConnectionGeometryKey = getWeekConnectionGeometryKey();
}

function queueWeekConnectionsRender(){
  if(viewMode !== "week" || !grid) return;
  if(weekConnectionRenderQueued) return;

  weekConnectionRenderQueued = true;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      weekConnectionRenderQueued = false;
      renderWeekConnections();
      lastWeekConnectionGeometryKey = getWeekConnectionGeometryKey();
    });
  });
}

function getWeekVisibleAnchorISO(weekStartISO, weekEndISO, todayISO){
  if(selectedDateISO && selectedDateISO >= weekStartISO && selectedDateISO <= weekEndISO){
    return selectedDateISO;
  }

  if(todayISO >= weekStartISO && todayISO <= weekEndISO){
    return todayISO;
  }

  return weekStartISO;
}

function queueMobileWeekScroll(weekStartISO, weekEndISO, todayISO){
  requestAnimationFrame(() => {
    if(!isMobileViewport() || viewMode !== "week" || !grid) return;

    const calendarEl = grid.closest(".calendar");
    if(!calendarEl) return;

    const anchorISO = getWeekVisibleAnchorISO(weekStartISO, weekEndISO, todayISO);
    const dayEl = grid.querySelector(`.weekViewDay[data-iso="${anchorISO}"]`);
    if(!dayEl) return;

    const widthKey = Math.round(calendarEl.clientWidth);
    const scrollKey = `${weekStartISO}::${anchorISO}::${widthKey}`;
    if(lastWeekAutoScrollKey === scrollKey) return;
    lastWeekAutoScrollKey = scrollKey;

    const dayWidth = dayEl.getBoundingClientRect().width || dayEl.offsetWidth || 0;
    const maxScroll = Math.max(0, calendarEl.scrollWidth - calendarEl.clientWidth);
    const desiredLeft = Math.min(maxScroll, Math.max(0, dayEl.offsetLeft - dayWidth));

    calendarEl.scrollTo({ left: desiredLeft, behavior: "auto" });
  });
}

window.addEventListener("resize", () => {
  if(viewMode !== "week") return;

  clearTimeout(weekConnectionResizeTimer);
  weekConnectionResizeTimer = setTimeout(() => {
    lastWeekAutoScrollKey = "";
    alignDowToGrid();
    updateWeekConnectionGeometryObservers();
    queueWeekConnectionsRenderIfGeometryChanged();
  }, 120);
});

window.visualViewport?.addEventListener("resize", () => {
  if(viewMode !== "week") return;
  queueWeekConnectionsRenderIfGeometryChanged();
});


// ---------------------------------------------------------------------------
// Week view rendering
// ---------------------------------------------------------------------------

function renderWeekView(){
  grid.innerHTML = "";
  grid.classList.add("weekViewGrid");
  if(dow) dow.style.display = "";
  if(monthLabel) monthLabel.textContent = fmtWeekRange(view);

  grid.style.gridTemplateColumns = "repeat(7, minmax(0, 1fr))";

  const start = startOfWeek(view);
  const weekStartISO = dateToYmd(start);
  const weekEndDate = new Date(start);
  weekEndDate.setDate(start.getDate() + 6);
  const weekEndISO = dateToYmd(weekEndDate);
  requestIndexedDbEventRangeHydration(weekStartISO, weekEndISO, {
    source: "week view",
    renderCalendar: true
  });

  const today = new Date();
  const todayISO = isoDate(today.getFullYear(), today.getMonth()+1, today.getDate());
  updateWeekDowHeader(start, todayISO);

  for(let i = 0; i < 7; i++){
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + i);

    const cellISO = dateToYmd(cellDate);
    const dayEl = document.createElement("div");
    dayEl.className = "day weekViewDay";
    dayEl.dataset.iso = cellISO;
    dayEl.dataset.weekDayIndex = String(i);

    if(cellISO === todayISO) dayEl.classList.add("today");
    if(selectedDateISO === cellISO) dayEl.classList.add("selectedDay");

    // Trip shading: same idea as month view
    const spanLayers = getSpansForDay(cellISO);

    const header = document.createElement("div");
    header.className = "dayHeader";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = String(cellDate.getDate());

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = "";

    header.appendChild(num);
    header.appendChild(badge);

    let tripBox = null;

    if(spanLayers.length){
      tripBox = document.createElement("div");
      tripBox.className = "tripBox";
      tripBox.appendChild(header);
      dayEl.appendChild(tripBox);

      const dowIndex = cellDate.getDay();
      const MAX_BANDS = 6;
      const BAND_H = 6;
      const BAND_GAP = 2;
      const HEADER_PAD = 26;
      let y = HEADER_PAD;
      let extraNamedRows = 0;

      spanLayers.slice(0, MAX_BANDS).forEach((s) => {
        const band = document.createElement("div");
        band.className = "spanBand";

        const leftEdge = (cellISO === s.start) || (dowIndex === 0);
        const rightEdge = (cellISO === s.end) || (dowIndex === 6);

        if(!leftEdge && !rightEdge) {
          band.classList.add("mid");
        } else {
          if(leftEdge && !rightEdge) band.classList.add("edgeL");
          if(rightEdge && !leftEdge) band.classList.add("edgeR");
        }

        band.style.top = `${y}px`;
        band.style.height = `${BAND_H}px`;
        band.style.background = hexToRgba(s.color, 0.28);
        band.style.border = `1px solid ${hexToRgba(s.color, 0.55)}`;

        if(s.title) band.title = s.title;

        const named = !!(s.title && leftEdge);
        if(named){
          band.classList.add("named");
          band.style.height = `16px`;
          band.textContent = s.title;
          extraNamedRows += 1;
        }

        tripBox.appendChild(band);
        y += (named ? 16 : BAND_H) + BAND_GAP;
      });

      const tripHeight = Math.max(
        38,
        HEADER_PAD + (spanLayers.slice(0, MAX_BANDS).length * (BAND_H + BAND_GAP)) + (extraNamedRows * 10)
      );

      tripBox.style.minHeight = `${tripHeight}px`;
    } else {
      dayEl.appendChild(header);
    }

    const list = sortByTimeThenTitle(
      getCalendarEventsForDay(cellISO).filter(ev => !(ev?.span?.mode === "bg"))
    );

    for(const ev of list){
      const pill = document.createElement("span");
      pill.className = "eventPill weekEventPill";

      const pillConnections = getEventConnections(ev);
      if(pillConnections.length){
        const primaryConnection = pillConnections[0];

        pill.__weekConnections = pillConnections;
        pill.classList.add("connectedEventPill");
        pill.dataset.connectionGroupId = primaryConnection.id;
        pill.dataset.connectionGroupName = primaryConnection.name || getEventConnectionGroupName(ev, primaryConnection.id);
        pill.dataset.connectionColor = primaryConnection.color || DEFAULT_COLOR;
        pill.dataset.connectionLineStyle = primaryConnection.lineStyle || "solid";
        pill.dataset.weekDayIso = cellISO;
        pill.dataset.weekSortKey = getWeekEventSortKey(ev, cellISO);
        pill.style.setProperty("--connection-color", primaryConnection.color || DEFAULT_COLOR);
      }

      const t = formatTimeRange(ev.startTime, ev.endTime);
      const title = ev.title || "(Untitled)";
      pill.innerHTML = `
        <div class="pillTitle">${escapeHtml(title)}</div>
        <div class="pillTime">${escapeHtml(t)}</div>
      `;

      const c = ev.color || DEFAULT_COLOR;
      pill.style.background = hexToRgba(c, 0.16);
      pill.style.borderColor = hexToRgba(c, 0.35);

      pill.addEventListener("click", (e) => {
  e.stopPropagation();

  const groupId = getEventPrimaryConnectionGroupId(ev);
  if(groupId && selectedConnectionGroupId !== groupId){
    selectConnectionGroup(groupId);
    return;
  }

  openEventInEditor(ev, cellISO);
});

      dayEl.appendChild(pill);
    }

    dayEl.addEventListener("click", () => {
      clearConnectionSelection({ silent:true });
      selectDate(cellISO);
    });
    grid.appendChild(dayEl);
  }

  const connectorLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  connectorLayer.classList.add("weekConnectorLayer");
  connectorLayer.setAttribute("aria-hidden", "true");
  grid.appendChild(connectorLayer);

  requestAnimationFrame(() => {
    alignDowToGrid();
    updateWeekConnectionGeometryObservers();
    queueWeekConnectionsRender();
    queueMobileWeekScroll(weekStartISO, weekEndISO, todayISO);
  });
}

function isMobileLayout(){
  return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
}

function getDayTimelineLayout(){
  return isMobileLayout()
    ? { laneLeft: 58, laneRight: 10, gutter: 4 }
    : { laneLeft: 78, laneRight: 12, gutter: 5 };
}


// ---------------------------------------------------------------------------
// Day view rendering
// ---------------------------------------------------------------------------

function renderDayView(){
  const now = new Date();

  grid.innerHTML = "";
  grid.classList.remove("weekViewGrid");
  clearConnectionSelection();
  disconnectWeekConnectionGeometryObservers();
  grid.style.gridTemplateColumns = "1fr";
  if(dow) dow.style.display = "none";
  resetDowHeader();

  const base = new Date(view);
  const dayISO = dateToYmd(base);

  requestIndexedDbEventRangeHydration(dayISO, dayISO, {
    source: "day view",
    renderCalendar: true
  });

  selectedDateISO = dayISO;
  if(panelSub) panelSub.textContent = fmtPrettyISO(dayISO);

  if(monthLabel) monthLabel.textContent = fmtDayLabel(base);

  const dayEl = document.createElement("div");
  dayEl.className = "day dayViewDay";
dayEl.classList.toggle("weatherOn", getWeatherSettings().enabled);
  if(selectedDateISO === dayISO) dayEl.classList.add("selectedDay");

  // ===== Header + week jumper =====
  const headerWrap = document.createElement("div");
  headerWrap.className = "dayViewHeaderWrap";

  const header = document.createElement("div");
  header.className = "dayViewHeader";
  header.textContent = base.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  const weekJumper = buildDayViewWeekJumper(dayISO);

headerWrap.appendChild(header);
headerWrap.appendChild(weekJumper);
dayEl.appendChild(headerWrap);

if(getWeatherSettings().enabled){
  dayEl.appendChild(buildHourlyWeatherStrip(dayISO));
}

  const timeRail = document.createElement("div");
  timeRail.className = "dayTimeRail";

  const hourGrid = document.createElement("div");
  hourGrid.className = "dayHourGrid";

  const railLabels = [
    { label: "12 AM", hour: 0 },
    { label: "3 AM", hour: 3 },
    { label: "6 AM", hour: 6 },
    { label: "9 AM", hour: 9 },
    { label: "12 PM", hour: 12 },
    { label: "3 PM", hour: 15 },
    { label: "6 PM", hour: 18 },
    { label: "9 PM", hour: 21 }
  ];

  const sameDay =
  now.getFullYear() === base.getFullYear() &&
  now.getMonth() === base.getMonth() &&
  now.getDate() === base.getDate();

const dayStart = 0;
const dayEnd = 24 * 60;
const total = dayEnd - dayStart;

const nowMins = now.getHours() * 60 + now.getMinutes();

if(nowMins >= dayStart && nowMins <= dayEnd){
  const top = ((nowMins - dayStart) / total) * 100;

  const nowLine = document.createElement("div");
  nowLine.className = "nowLine";
  nowLine.style.top = `${top}%`;

  const nowDot = document.createElement("div");
  nowDot.className = "nowDot";
  nowDot.style.top = `${top}%`;

  dayEl.appendChild(nowLine);
  dayEl.appendChild(nowDot);
}

for(const item of railLabels){
  const itemMins = item.hour * 60;
  const top = ((itemMins - dayStart) / total) * 100;

  const mark = document.createElement("div");
  mark.className = "dayTimeMark";
  mark.style.top = `${top}%`;
  mark.textContent = item.label;
  timeRail.appendChild(mark);

  const line = document.createElement("div");
  line.className = "dayHourLine";
  line.style.top = `${top}%`;

  if(sameDay && Math.abs(nowMins - itemMins) <= 12){
    line.style.opacity = "0";
  }

  hourGrid.appendChild(line);
}

  dayEl.appendChild(hourGrid);
  dayEl.appendChild(timeRail);

  const list = getDayViewSegments(dayISO);
  const placed = buildOverlapColumns(list);

  dayEl.addEventListener("click", () => selectDate(dayISO));
  grid.appendChild(dayEl);

  if(!list.length){
    const empty = document.createElement("div");
    empty.className = "dayEmptyState";
    empty.textContent = "";
    dayEl.appendChild(empty);
    return;
  }

  const metrics = getTimelineMetrics(dayEl);
  const timelineLayout = getDayTimelineLayout();
  const laneLeft = timelineLayout.laneLeft;
  const laneRight = timelineLayout.laneRight;
  const gutter = timelineLayout.gutter;
  const laneWidthPx = dayEl.clientWidth - laneLeft - laneRight;

  for(const item of placed){
    const ev = item.ev;
    const pill = document.createElement("span");
    pill.className = "eventPill";

    const t = getSegmentDisplayTime(ev);
    const title = ev.title || "(Untitled)";
    const showTopResize = !ev._isCarryoverSegment;
    const showBottomResize = !ev._overnight || !!ev._isCarryoverSegment;

    pill.innerHTML = `
      ${showTopResize ? `<div class="resizeHandle resizeHandleTop" data-edge="top"></div>` : ""}
      <div class="pillTopRow">
        <div class="pillTitle">${escapeHtml(title)}</div>
        <div class="pillTime">${escapeHtml(t)}</div>
      </div>
      ${ev.details ? `<div class="pillDetails">${escapeHtml(ev.details)}</div>` : ""}
      ${showBottomResize ? `<div class="resizeHandle resizeHandleBottom" data-edge="bottom"></div>` : ""}
    `;

    const c = ev.color || DEFAULT_COLOR;
    pill.style.background = hexToRgba(c, 0.16);
    pill.style.borderColor = hexToRgba(c, 0.35);

    const start = item.start;
    const end = item.end;

    const colWidthPx = (laneWidthPx - ((item.cols - 1) * gutter)) / item.cols;
    const topPx = metrics.top + ((start - dayStart) / total) * metrics.height;
    const heightPx = Math.max(((end - start) / total) * metrics.height, 44);

    pill.style.position = "absolute";
    pill.style.top = `${topPx}px`;
    pill.style.height = `${heightPx}px`;
    pill.style.width = `${colWidthPx}px`;
    pill.style.left = `${laneLeft + (colWidthPx + gutter) * item.col}px`;
    pill.style.right = "auto";
    pill.style.zIndex = "2";

    pill.addEventListener("click", (e) => {
  e.stopPropagation();

  const isMobileDayPill =
    isMobileViewport() &&
    viewMode === "day" &&
    pill.closest(".dayViewDay");

  if(isMobileDayPill){
    selectedEventId = ev._masterId || ev.id;
    editBaseDateISO = dayISO;
    populateFormFromSelected();
    renderEventList();
    return;
  }

  openEventInEditor(ev, dayISO);
});

pill.addEventListener("dblclick", (e) => {
  e.stopPropagation();

  if(
    isMobileViewport() &&
    viewMode === "day" &&
    pill.closest(".dayViewDay")
  ){
    openEventInEditor(ev, dayISO);
  }
});

    const topHandle = pill.querySelector(".resizeHandleTop");
    const bottomHandle = pill.querySelector(".resizeHandleBottom");

    topHandle?.addEventListener("pointerdown", (e) => {
      beginDayTimeResize(e, ev, ev._segmentBaseDate || dayISO, pill, dayEl, "top");
    });

    bottomHandle?.addEventListener("pointerdown", (e) => {
      beginDayTimeResize(e, ev, ev._segmentBaseDate || dayISO, pill, dayEl, "bottom");
    });

    if(!ev._isCarryoverSegment){
      pill.addEventListener("pointerdown", (e) => {
        if(e.target.closest(".resizeHandle")) return;
        beginDayTimeDrag(e, ev, ev._segmentBaseDate || dayISO, pill, dayEl);
      });
    }

    dayEl.appendChild(pill);
  }

  if(!selectedDateISO){
    selectDate(dayISO, {silent:true});
  }
}


// ---------------------------------------------------------------------------
// Event list + live now-line
// ---------------------------------------------------------------------------

function renderEventList(){
  if(!eventsList) return;

  const settleWeekConnectionsAfterPanelLayout = () => {
    if(viewMode === "week"){
      queueWeekConnectionsRenderIfGeometryChanged();
    }
  };

  eventsList.innerHTML = "";

  if(!selectedDateISO){
    eventsList.innerHTML = `<div class="hint">Select a day to see events.</div>`;
    settleWeekConnectionsAfterPanelLayout();
    return;
  }

  const list = sortByTimeThenTitle(getCalendarEventsForDay(selectedDateISO));

  if(list.length === 0){
    eventsList.innerHTML = `<div class="hint">No events yet. Click <b>+ New</b> and add one.</div>`;
    settleWeekConnectionsAfterPanelLayout();
    return;
  }

  for(const ev of list){
    const item = document.createElement("div");
    item.className = "eventItem";

    const isActive = (ev.id === selectedEventId) || (ev._masterId && ev._masterId === selectedEventId);
    if(isActive) item.classList.add("active");

    const stripe = document.createElement("div");
    stripe.className = "eventStripe";
    stripe.style.background = safeHexColor(ev.color, DEFAULT_COLOR);
    item.appendChild(stripe);

    const pad = document.createElement("div");
    pad.className = "eventItemPad";
    item.appendChild(pad);

    const top = document.createElement("div");
    top.className = "eventItemTop";

    const title = document.createElement("div");
    title.className = "eventItemTitle";
    title.textContent = ev.title || "(Untitled)";

    const time = document.createElement("div");
    time.className = "eventItemTime";
    time.textContent = formatTimeRange(ev.startTime, ev.endTime);

    top.appendChild(title);
    top.appendChild(time);

    const details = document.createElement("div");
    details.className = "eventItemDetails";
    details.textContent = ev.details || "";

    pad.appendChild(top);
    if(ev.details) pad.appendChild(details);

    item.addEventListener("click", () => {
  openEventInEditor(ev, selectedDateISO);
});

    eventsList.appendChild(item);
  }

  settleWeekConnectionsAfterPanelLayout();
}

function renderNowLine(dayEl){
  if(!dayEl) return;

  // remove existing markers
  dayEl.querySelector(".nowLine")?.remove();
  dayEl.querySelector(".nowDot")?.remove();

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const pct = minutes / (24 * 60);

  const metrics = getTimelineMetrics(dayEl);
  const y = metrics.top + (metrics.height * pct);

  const line = document.createElement("div");
  line.className = "nowLine";
  line.style.top = `${y}px`;

  const dot = document.createElement("div");
  dot.className = "nowDot";
  dot.style.top = `${y}px`;

  dayEl.appendChild(line);
  dayEl.appendChild(dot);
}

function startNowLineTicker(){
  setInterval(() => {
    if(viewMode !== "day") return;

    const dayEl = document.querySelector(".day.dayViewDay");
    if(dayEl){
      renderNowLine(dayEl);
    }
  }, 60000); // every minute
}

// ============================================================================
// 13. EVENT EDITOR + CRUD
// ============================================================================
function clearFormForNew(){
  selectedEventId = null;
  editBaseDateISO = null;

  eventTitle.value = "";
  eventDetails.value = "";
if(eventPrice) eventPrice.value = "";

  startTimeInput.value = "";
  endTimeInput.value = "";
  setAmPm(startAmPm, "am");
  setAmPm(endAmPm, "am");

  if(eventColor) eventColor.value = DEFAULT_COLOR;

  setRepeatValue("none");
 setSelectedWeekdays([]); // clear weekly pick-days UI
  if(repeatUntil) repeatUntil.value = "";
  if(repeatInterval) repeatInterval.value = "1";
  if(weeklyIntervalRow) weeklyIntervalRow.style.display = "none";

  // Trip shading defaults off
  if(spanUntil) spanUntil.value = "";

    if(deleteWholeSeries) deleteWholeSeries.checked = false;

  if(editLabel) editLabel.textContent = "New event";
  if(deleteBtn) deleteBtn.disabled = true;
if(eventCategory) eventCategory.value = "other";
if(eventConnectionGroup) eventConnectionGroup.value = "";
if(eventConnectionColor) eventConnectionColor.value = eventColor?.value || DEFAULT_COLOR;
if(eventConnectionLineStyle) eventConnectionLineStyle.value = "solid";
setConnectionEditorRows([]);
renderEventCategoryOptions();
}

function populateFormFromSelected(){
  if(!selectedDateISO) return;

  const baseKey = getEditDateKey();
  const list = getEventsForDay(baseKey);
  const ev = list.find(e => e.id === selectedEventId);

  if(!ev){
    clearFormForNew();
    return;
  }

  eventTitle.value = ev.title || "";
  eventDetails.value = ev.details || "";
if(eventPrice) eventPrice.value = ev.price ?? "";
if(eventCategory) eventCategory.value = ev.categoryId || "other";
if(eventConnectionGroup) eventConnectionGroup.value = ev.connectionGroupName || ev.connectionGroup || "";
if(eventConnectionColor) eventConnectionColor.value = getEventConnectionColor(ev);
if(eventConnectionLineStyle) eventConnectionLineStyle.value = getEventConnectionLineStyle(ev);
renderEventCategoryOptions();

  startTimeInput.value = (ev.startTime || "").replace(/\s*(AM|PM)$/i, "").trim();
  endTimeInput.value = (ev.endTime || "").replace(/\s*(AM|PM)$/i, "").trim();

  setAmPm(startAmPm, /PM$/i.test(ev.startTime||"") ? "pm" : "am");
  setAmPm(endAmPm, /PM$/i.test(ev.endTime||"") ? "pm" : "am");

  if(eventColor) eventColor.value = ev.color || DEFAULT_COLOR;
  setConnectionEditorRows(getEventConnections(ev));

  // If this event is a trip band (background shading), show that in the Repeat dropdown.
  const isTrip = (ev?.span?.mode === "bg");
  setRepeatValue(isTrip ? "span" : (ev.recurrence?.freq || "none"));
// If weeklyDays, restore the picked weekdays into the UI
  if((ev.recurrence?.freq || "none") === "weeklyDays"){
    setSelectedWeekdays(ev.recurrence?.days || []);
  }else{
    setSelectedWeekdays([]); // not weeklyDays → keep pills cleared
  }
  if(repeatUntil) repeatUntil.value = (ev.recurrence?.until || "");
  if(repeatInterval) repeatInterval.value = String(Math.max(1, parseInt(ev.recurrence?.interval || "1",10) || 1));

  // Trip shading end date
  if(spanUntil) spanUntil.value = isTrip ? (ev.span?.end || "") : "";


  if(editLabel) editLabel.textContent = "Editing event";
  if(deleteBtn) deleteBtn.disabled = false;
}

function selectDate(iso, opts={silent:false}){
  const canPatchWeekSelection = isISOInCurrentRenderedWeek(iso);
  const shouldExpandEditor = !opts.silent && isEditorCollapsed();
  const nextView = (viewMode === "week" || viewMode === "day") ? ymdToDate(iso) : view;

  setCalendarState({ selectedDateISO: iso, view: nextView }, { render:false });

  // If the editor is collapsed, clicking a day should pop it back open.
  // That layout transition still gets a full render because the grid width changes.
  if(shouldExpandEditor){
    setEditorCollapsed(false);
  }

  if(panelTitle) panelTitle.textContent = "Edit day";
  if(panelSub) panelSub.textContent = fmtPrettyISO(iso);

  clearFormForNew();
  closeMobileEditor();
  renderEventList();

  syncStateFromLegacy();

  if(!opts.silent){
    if(canPatchWeekSelection && !shouldExpandEditor){
      refreshWeekSelectionOnly();
      queueWeekConnectionsRenderIfGeometryChanged();
    }else{
      queueRender({ calendar:true });
    }
  }
}

addBtn?.addEventListener("click", () => {
  if(!selectedDateISO) return;

  const title = eventTitle.value.trim();
  const details = eventDetails.value.trim();

const priceRaw = eventPrice?.value?.trim() || "";
let price = null;

if(priceRaw !== ""){
  const parsed = Number(priceRaw);
  if(!isNaN(parsed)){
    price = Math.max(0, parsed);
  }
}

  const startStr = normalizeClock(startTimeInput?.value, getAmPm(startAmPm));
  const endStr = normalizeClock(endTimeInput?.value, getAmPm(endAmPm));

  const color = (eventColor?.value || DEFAULT_COLOR).toString();
const categoryId = eventCategory?.value || "other";
const connectionFields = getConnectionFieldsForSave(color);
  const freq = (eventRepeat?.value || "none").toString();
  const until = (repeatUntil?.value || "").toString().trim();
  const interval = Math.max(1, parseInt(repeatInterval?.value || "1",10) || 1);

  if(!title && !details && !startStr && !endStr && price === null) return;

  const baseKey = getEditDateKey();
  const list = getEventsForDay(baseKey);
const before = snapshotBeforeChange();

  const nextRecurrence = { freq, until, interval, exceptions: [] };
 // ✅ Weekly (pick days): store chosen weekdays in recurrence.days (0=Sun ... 6=Sat)
  if(freq === "weeklyDays"){
    const picked = Array.from(document.querySelectorAll("#weeklyDaysRow .weekdayBtn.active"))
      .map(b => Number(b.dataset.day))
      .filter(n => Number.isInteger(n) && n >= 0 && n <= 6);

    // If none picked, default to the selected date's weekday so it still works
    const fallbackDow = new Date(selectedDateISO + "T00:00:00").getDay();
    nextRecurrence.days = picked.length ? picked : [fallbackDow];
  }

  // Trip shading: store a date range and paint the grid background (no extra pills).
  const isTrip = (freq === "span");
  let span = null;
  if(isTrip){
    let endISO = (spanUntil?.value || "").toString().trim();
    if(!endISO) endISO = selectedDateISO;
    const a = selectedDateISO < endISO ? selectedDateISO : endISO;
    const b = selectedDateISO < endISO ? endISO : selectedDateISO;
    span = { mode: "bg", end: b };
    // Trip shading is separate from repeat.
    nextRecurrence.freq = "none";
    nextRecurrence.until = "";
    nextRecurrence.interval = 1;
  }

  let changedEventForCloud = null;
  const changedAt = Date.now();

  if(selectedEventId){
    const idx = list.findIndex(e => e.id === selectedEventId);
    if(idx >= 0){
      const existing = list[idx];
      const prev = existing.recurrence || {};
      list[idx] = {
        ...existing,
        title,
        details,
price,
categoryId,
        color,
        ...connectionFields,
        startTime: startStr,
        endTime: endStr,
        startDate: existing.startDate || selectedDateISO,
        span,
        recurrence: {
          ...prev,
          ...nextRecurrence,
          exceptions: Array.isArray(prev.exceptions) ? prev.exceptions : [],
        }
      };
      changedEventForCloud = list[idx];
    } else {
      const newEv = {
        id: cryptoId(),
        title,
        details,
        price,
        categoryId,
        color,
        ...connectionFields,
        startTime: startStr,
        endTime: endStr,
        startDate: selectedDateISO,
        span,
        recurrence: nextRecurrence
      };
      list.push(newEv);
      selectedEventId = newEv.id;
      changedEventForCloud = newEv;
    }
  } else {
    const newEv = {
      id: cryptoId(),
      title,
      details,
      price,
      categoryId,
      color,
      ...connectionFields,
      startTime: startStr,
      endTime: endStr,
      startDate: selectedDateISO,
      span,
      recurrence: nextRecurrence
    };
    list.push(newEv);
    selectedEventId = newEv.id;
    changedEventForCloud = newEv;
  }

  events[baseKey] = list;
  saveEvents(before, {
    updatedAt: changedAt,
    reason: selectedEventId ? "event save" : "event create",
    cloudOps: [makeEventCloudOp(changedEventForCloud, baseKey, changedAt)]
  });
  syncStateFromLegacy();

  populateFormFromSelected();
  renderEventList();
  render();
  closeMobileEditor();
});

function isOccurrenceContext(){
  return !!(editBaseDateISO && editBaseDateISO !== selectedDateISO);
}

deleteBtn?.addEventListener("click", () => {
  if(!selectedDateISO || !selectedEventId) return;

  const baseKey = getEditDateKey();
  const list = getEventsForDay(baseKey);
  const idx = list.findIndex(e => e.id === selectedEventId);
  if(idx < 0) return;

  const ev = list[idx];
  const before = snapshotBeforeChange();
  const isSeries = (ev.recurrence?.freq || "none") !== "none";
  const wantSeriesDelete = !!deleteWholeSeries?.checked;

  if(wantSeriesDelete && isSeries){
    const changedAt = Date.now();
    events[baseKey] = list.filter(e => e.id !== selectedEventId);
    saveEvents(before, {
      updatedAt: changedAt,
      reason: "event delete",
      cloudOps: [makeEventCloudOp(ev, baseKey, changedAt, true)]
    });
    syncStateFromLegacy();
    clearFormForNew();
    renderEventList();
    render();
    return;
  }

  if(isSeries && isOccurrenceContext()){
    const changedAt = Date.now();
    const ex = Array.isArray(ev.recurrence.exceptions) ? ev.recurrence.exceptions : [];
    if(!ex.includes(selectedDateISO)) ex.push(selectedDateISO);
    list[idx] = { ...ev, recurrence: { ...ev.recurrence, exceptions: ex } };
    events[baseKey] = list;
    saveEvents(before, {
      updatedAt: changedAt,
      reason: "event occurrence delete",
      cloudOps: [makeEventCloudOp(list[idx], baseKey, changedAt)]
    });
    syncStateFromLegacy();
    clearFormForNew();
    renderEventList();
    render();
    return;
  }

  const changedAt = Date.now();
  events[baseKey] = list.filter(e => e.id !== selectedEventId);
  saveEvents(before, {
    updatedAt: changedAt,
    reason: "event delete",
    cloudOps: [makeEventCloudOp(ev, baseKey, changedAt, true)]
  });
  syncStateFromLegacy();
  clearFormForNew();
  renderEventList();
  render();
});

syncGatePrimary?.addEventListener("click", async () => {
  try{
    if(syncGateMode === "connect"){
      // first-time: picker
      await connectSync();
      closeSyncGate();
      return;
    }

    // enable mode: no browsing, just permission prompt
    if(!syncHandle){
      // no handle saved yet → fallback to connect flow
      openSyncGate("connect");
      return;
    }

    const ok = await requestPermissionInteractive(syncHandle);
    syncConnected = ok;
    setSyncUI();
    if(!ok) return;

    // Pull latest now that we have permission
    const fileData = await readSyncFile();
    const local = getLocalPayload();

    if(fileData && (fileData.updatedAt || 0) > (local.updatedAt || 0)){
      applyFullSavePayload(fileData, { skipRender: true });
      if(syncStatus){
        const d = new Date(fileData.updatedAt || Date.now());
        syncStatus.textContent = `Sync: Connected • Loaded ${d.toLocaleString()}`;
      }
      render();
      renderEventList();
    }else{
      await writeSyncFileNow();
    }

    closeSyncGate();
  }catch(err){
    console.error(err);
    alert("Sync enable failed: " + (err?.message || err));
  }
});

newEventBtn?.addEventListener("click", () => {
if(isEditorCollapsed()) setEditorCollapsed(false);
  clearFormForNew();
  openMobileEditor();
  renderEventList();
});

// --- Weekly (pick days) behavior ---
function getSelectedWeekdays(){
  return weekdayBtns
    .filter(b => b.classList.contains("active"))
    .map(b => Number(b.dataset.day))
    .filter(n => Number.isInteger(n) && n >= 0 && n <= 6)
    .sort((a,b) => a - b);
}

function setSelectedWeekdays(days){
  const set = new Set((Array.isArray(days) ? days : []).map(Number));
  weekdayBtns.forEach(btn => {
    const d = Number(btn.dataset.day);
    const on = set.has(d);
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

// toggle UI
weekdayBtns.forEach(btn => {
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
  });
});

prevBtn?.addEventListener("click", () => {
  if(viewMode === "month") {
    view.setMonth(view.getMonth() - 1);
    view.setDate(1);
  } else if(viewMode === "week") {
    view.setDate(view.getDate() - 7);
  } else {
    view.setDate(view.getDate() - 1);
  }
  setCalendarState({ view }, { render:{ calendar:true, eventList:true, sliders:true } });
});

nextBtn?.addEventListener("click", () => {
  if(viewMode === "month") {
    view.setMonth(view.getMonth() + 1);
    view.setDate(1);
  } else if(viewMode === "week") {
    view.setDate(view.getDate() + 7);
  } else {
    view.setDate(view.getDate() + 1);
  }
  setCalendarState({ view }, { render:{ calendar:true, eventList:true, sliders:true } });
});

todayBtn?.addEventListener("click", () => {
  const t = new Date();
  if(viewMode === "month") view = new Date(t.getFullYear(), t.getMonth(), 1);
  else view = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  setCalendarState({ view }, { render:false });
  selectDate(isoDate(t.getFullYear(), t.getMonth()+1, t.getDate()));
  queueRender({ calendar:true, eventList:true, sliders:true });
});

undoBtn?.addEventListener("click", () => {
  undoLastChange();
});

redoBtn?.addEventListener("click", () => {
  redoLastChange();
});

searchBtn?.addEventListener("click", () => {
  openQuickSearch();
});

monthViewBtn?.addEventListener("click", () => {
  viewMode = "month";
  if(selectedDateISO){
    const d = ymdToDate(selectedDateISO);
    view = new Date(d.getFullYear(), d.getMonth(), 1);
  } else {
    view.setDate(1);
  }
  setCalendarState({ viewMode, view }, { render:{ calendar:true, eventList:true, sliders:true } });
});

weekViewBtn?.addEventListener("click", () => {
  viewMode = "week";
  if(selectedDateISO) view = ymdToDate(selectedDateISO);
  setCalendarState({ viewMode, view }, { render:{ calendar:true, eventList:true, sliders:true } });
});

dayViewBtn?.addEventListener("click", () => {
  viewMode = "day";
  if(selectedDateISO) view = ymdToDate(selectedDateISO);
  setCalendarState({ viewMode, view }, { render:{ calendar:true, eventList:true, sliders:true } });
});

function isTypingTarget(el){
  const t = el?.tagName?.toLowerCase();
  return t === "input" || t === "textarea" || el?.isContentEditable;
}

document.addEventListener("keydown", (e) => {
  const key = String(e?.key || "").toLowerCase();
  if(!key) return;

  const mod = e.ctrlKey || e.metaKey;

  const isUndoCombo = mod && !e.shiftKey && key === "z";
  const isRedoCombo =
    (mod && e.shiftKey && key === "z") ||
    (mod && key === "y");

  if(!isUndoCombo && !isRedoCombo) return;

  if(isTypingTarget(document.activeElement)) return;
  if(document.querySelector(".quickSearch:not(.hidden)")) return;

  e.preventDefault();

  if(isUndoCombo){
    undoLastChange();
    return;
  }

  if(isRedoCombo){
    redoLastChange();
  }
});

// ============================================================================
// 14. QUICK ADD
// ============================================================================
// ---------- Quick add ("type like a human") ----------
const quickAddInputEl = document.getElementById("quickAddInput");
const quickAddBtn = document.getElementById("quickAddBtn");

// small helpers
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function pad2(n){ return String(n).padStart(2,"0"); }
function toISOFromDate(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function addDays(d, days){
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

const DOW = ["sun","mon","tue","wed","thu","fri","sat"];
const DOW_FULL = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function parseAnyDateToken(text, baseDate){
  const t = text.toLowerCase();

  // yyyy-mm-dd
  let m = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if(m){
    const y = +m[1], mo = +m[2], da = +m[3];
    const d = new Date(y, mo-1, da);
    if(!isNaN(d)) return { date: d, matched: m[0] };
  }

  // mm/dd[/yyyy]
  m = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if(m){
    const mo = +m[1], da = +m[2];
    let y = m[3] ? +m[3] : baseDate.getFullYear();
    if(y < 100) y += 2000;
    const d = new Date(y, mo-1, da);
    if(!isNaN(d)) return { date: d, matched: m[0] };
  }

  if(/\btoday\b/.test(t)) return { date: baseDate, matched: "today" };
  if(/\btomorrow\b/.test(t) || /\btmr\b/.test(t)) return { date: addDays(baseDate, 1), matched: (/\btmr\b/.test(t) ? "tmr" : "tomorrow") };

  // next <weekday> OR just <weekday>
  const dowRe = /\b(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/;
  m = t.match(dowRe);
  if(m){
    const token = m[1];
    const isNext = /\bnext\b/.test(m[0]);
    let idx = DOW_FULL.indexOf(token);
    if(idx < 0){
      const short = token.slice(0,3);
      idx = DOW.indexOf(short);
    }
    if(idx >= 0){
      const baseDow = baseDate.getDay();
      let delta = (idx - baseDow + 7) % 7;
      if(delta === 0) delta = isNext ? 7 : 0;
      if(isNext && delta === 0) delta = 7;
      return { date: addDays(baseDate, delta), matched: m[0] };
    }
  }

  return null;
}

function parseTimeToken(raw){
  // raw like "7", "7:30", "7pm", "7:30 pm"
  const m = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if(!m) return null;
  let h = +m[1];
  let mins = m[2] ? +m[2] : 0;
  mins = clamp(mins, 0, 59);
  let ampm = (m[3] || "").toLowerCase() || null;

  if(h === 0) h = 12;
  if(h > 12 && !ampm){
    // 13:00 style
    ampm = "pm";
    h = h - 12;
  }
  h = clamp(h, 1, 12);

  return { h, mins, ampm };
}

function timeToString(t){ // -> "7:30"
  return `${t.h}:${pad2(t.mins)}`;
}

function inferAmPmIfMissing(t, fallback){
  if(t && !t.ampm) t.ampm = fallback || "am";
  return t;
}

function parseTimeRange(text){
  const s = text.toLowerCase();

  // "from 7 to 9pm" | "7-9pm" | "7pm-9pm"
  // allow: "from 6-7:30pm" (no spaces around the dash)
  let m = s.match(/\bfrom\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|until|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  if(!m){
    m = s.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  }
  if(m){
    const a = parseTimeToken(m[1]);
    const b = parseTimeToken(m[2]);
    if(a && b){
      // if end has am/pm but start doesn't, copy it; or vice versa
      if(!a.ampm && b.ampm) a.ampm = b.ampm;
      if(!b.ampm && a.ampm) b.ampm = a.ampm;
      return { start: a, end: b, matched: m[0] };
    }
  }

  // single "at 7pm" OR bare "7pm"
  m = s.match(/\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  if(m){
    const a = parseTimeToken(m[1]);
    if(a) return { start: a, end: null, matched: m[0] };
  }

  return null;
}

function parseMDYToken(tok, baseYear){
  // tok: "2/10" or "2/10/2026"
  const m = String(tok||"").trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if(!m) return null;
  const mo = +m[1], da = +m[2];
  let y = m[3] ? +m[3] : baseYear;
  if(y < 100) y += 2000;
  const d = new Date(y, mo-1, da);
  if(isNaN(d)) return null;
  return d;
}

function nextWeekday(baseDate, targetDow){
  // baseDate is a Date at midnight. Return next occurrence (including today).
  const baseDow = baseDate.getDay();
  let delta = (targetDow - baseDow + 7) % 7;
  return addDays(baseDate, delta);
}

function parseEveryWeekdays(text){
  // "every wed/thu" | "every mon, wed, fri" | "every wednesday and thursday"
  const s = text.toLowerCase();
  const m = s.match(/\bevery\s+([a-z\s,\/]+)\b/);
  if(!m) return null;

  const part = m[1]
    .replace(/\band\b/g, "/")
    .replace(/[, ]+/g, " ")
    .trim();

  const tokens = part.split(/[\/ ]+/).map(t => t.trim()).filter(Boolean);
  const days = [];
  const matchedTokens = [];

  tokens.forEach(tok => {
    const t = tok.replace(/\./g,"");
    if(!t) return;
    const fullIdx = DOW_FULL.indexOf(t);
    let idx = fullIdx;
    if(idx < 0){
      const short = t.slice(0,3);
      idx = DOW.indexOf(short);
    }
    if(idx >= 0){
      days.push(idx);
      matchedTokens.push(tok);
    }
  });

  const uniqDays = Array.from(new Set(days)).sort((a,b)=>a-b);
  if(!uniqDays.length) return null;

  return { days: uniqDays, matched: m[0] };
}

function buildQuickAddFromText(raw){
  const base = selectedDateISO ? new Date(selectedDateISO + "T12:00:00") : new Date();
  const baseDate = new Date(base.getFullYear(), base.getMonth(), base.getDate());

  let workText = (raw || "").trim();
  if(!workText) return null;

  // small local helpers (keep Quick Add resilient to extra filler words)
  const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tidyTitle = (s) => {
    let t = (s || "").replace(/\s+/g, " ").trim();
    // common dangling fillers after we strip dates/times
    t = t.replace(/\b(from|at|on)\b\s*$/ig, "").trim();
    t = t.replace(/^\s*\b(from|at|on)\b\s+/ig, "").trim();
    // if a weekday got stripped but "this" remained ("Dinner this with Jimmy")
    t = t.replace(/\bthis\b\s+(?=with\b)/ig, "");
    t = t.replace(/\s+/g, " ").trim();
    return t;
  };

  // hex color token: "#ff0000" or "#f00"
  const parseHexColorToken = (input) => {
    const mm = String(input||"").match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
    if(!mm) return null;
    let hex = mm[1].toLowerCase();
    if(hex.length === 3){
      hex = hex.split("").map(c => c + c).join("");
    }
    return { color: "#" + hex, matched: mm[0] };
  };

  // pull color out first so it doesn't pollute title parsing
  let pickedColor = null;
  const colorHit = parseHexColorToken(workText);
  if(colorHit){
    pickedColor = colorHit.color;
    workText = workText.replace(new RegExp(escRe(colorHit.matched), "ig"), " ");
    workText = workText.replace(/\s+/g, " ").trim();
  }

  const text = workText;
  const lower = text.toLowerCase();


  // ------------------------------------------------------------
  // 1) Trip grammar:
  //    "trip to Texas from 2/10-2/17" | "trip Texas 2/10-2/17"
  //    -> creates a Trip (span shading)
  // ------------------------------------------------------------
  let m = lower.match(/\btrip\b[\s:,-]*(?:to\s+)?(.+?)\s+(?:from\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*-\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i);
  if(m){
    const placeRaw = (text.match(/\btrip\b[\s:,-]*(?:to\s+)?(.+?)\s+(?:from\s+)?\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s*-\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/i)?.[1] || "").trim();
    const place = placeRaw || "Trip";
    const startD = parseMDYToken(m[2], baseDate.getFullYear());
    const endD = parseMDYToken(m[3], baseDate.getFullYear());
    if(startD && endD){
      const startISO = toISOFromDate(startD);
      const endISO = toISOFromDate(endD);
      return {
        iso: startISO,
        title: place,
        color: pickedColor,
        start: null,
        end: null,
        repeatFreq: "span",
        spanEnd: endISO
      };
    }
  }

  // ------------------------------------------------------------
  // 1b) Trip + "this weekend" grammar:
  //     "trip this weekend to the woods" -> Trip span (Fri→Sun) with destination as title
  // ------------------------------------------------------------
  if(/\btrip\b/i.test(lower) && /\bthis weekend\b/i.test(lower)){
    const dow = baseDate.getDay(); // 0=Sun..6=Sat

    // weekend range
    let startD;
    if(dow === 5) startD = baseDate;         // Fri
    else if(dow === 6) startD = baseDate;    // Sat
    else if(dow === 0) startD = baseDate;    // Sun
    else startD = nextWeekday(baseDate, 5);  // next Fri

    const endD = (startD.getDay() === 5) ? addDays(startD, 2)
              : (startD.getDay() === 6) ? addDays(startD, 1)
              : startD; // Sun

    const startISO = toISOFromDate(startD);
    const endISO = toISOFromDate(endD);

    let place = text
      .replace(/\btrip\b/ig, " ")
      .replace(/\bthis weekend\b/ig, " ")
      .replace(/^\s*to\s+/i, " ");
    place = tidyTitle(place) || "Trip";

    return {
      iso: startISO,
      title: place,
      color: pickedColor,
      start: null,
      end: null,
      repeatFreq: "span",
      spanEnd: endISO
    };
  }

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // 2) "this weekend" grammar:
  //    "movie this weekend 7-9pm" -> Fri+Sat+Sun via Daily recurrence (+ optional time)
  // ------------------------------------------------------------
  if(/\bthis weekend\b/i.test(lower)){
    const dow = baseDate.getDay(); // 0=Sun..6=Sat

    // start date:
    // - If today is Fri: start Fri
    // - If today is Sat: start Sat (still part of this weekend)
    // - Otherwise: next Friday
    let startD;
    if(dow === 5) startD = baseDate;         // Fri
    else if(dow === 6) startD = baseDate;    // Sat
    else startD = nextWeekday(baseDate, 5);  // next Fri (covers Sun..Thu)

    // end date: Sunday of that same weekend
    const endD = (startD.getDay() === 6) ? addDays(startD, 1) : addDays(startD, 2); // Sat→Sun, Fri→Sun
    const startISO = toISOFromDate(startD);
    const endISO = toISOFromDate(endD);

    // optional time (applies to each day)
    const timeHit = parseTimeRange(text);
    let start = timeHit?.start || null;
    let end = timeHit?.end || null;
    if(start){
      inferAmPmIfMissing(start, "am");
      if(!end){
        end = { ...start };
        end.h = ((end.h % 12) + 1);
        end.ampm = start.ampm;
      }else{
        inferAmPmIfMissing(end, start.ampm);
      }
    }

    let title = text.replace(/\bthis weekend\b/ig, " ");
    if(timeHit?.matched){
      title = title.replace(new RegExp(timeHit.matched.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), " ");
    }
    title = tidyTitle(title);
    if(!title) title = "Weekend";

    return {
      iso: startISO,
      title,
      color: pickedColor,
      start,
      end,
      repeatFreq: "daily",
      repeatInterval: 1,
      repeatUntil: endISO
    };
  }

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // 3) Weekly pick-days grammar:
  //    "gym every wed/thu 6-7pm" -> Weekly (pick days) + optional time
  // ------------------------------------------------------------
  const everyHit = parseEveryWeekdays(text);
  if(everyHit){
    // optional time
    const timeHit = parseTimeRange(text);
    let start = timeHit?.start || null;
    let end = timeHit?.end || null;
    if(start){
      inferAmPmIfMissing(start, "am");
      if(!end){
        end = { ...start };
        end.h = ((end.h % 12) + 1);
        end.ampm = start.ampm;
      }else{
        inferAmPmIfMissing(end, start.ampm);
      }
    }

    // Title = strip "every ..." and strip the time if present
    let title = text.replace(new RegExp(escRe(everyHit.matched), "ig"), " ");
    if(timeHit?.matched){
      title = title.replace(new RegExp(escRe(timeHit.matched), "ig"), " ");
    }
    // if user typed "... from 6-7pm" and the matcher only caught "6-7pm", strip leftover "from"
    if(timeHit?.matched) title = title.replace(/\bfrom\b/ig, " ");
    title = tidyTitle(title);
    if(!title) title = "New event";

    // choose the next occurrence of the first picked weekday as the start date
    const firstDow = everyHit.days[0];
    const startD = nextWeekday(baseDate, firstDow);
    const startISO = toISOFromDate(startD);

    return {
      iso: startISO,
      title,
      color: pickedColor,
      start,
      end,
      repeatFreq: "weeklyDays",
      repeatInterval: 1,
      weeklyDays: everyHit.days
    };
  }

  // ------------------------------------------------------------
  // 4) Default quick add (date + time parsing)
  // ------------------------------------------------------------
  const dateHit = parseAnyDateToken(text, baseDate);
  const timeHit = parseTimeRange(text);

  const when = dateHit?.date || baseDate;

  let start = timeHit?.start || null;
  let end = timeHit?.end || null;

  // reasonable defaults
  if(start){
    inferAmPmIfMissing(start, "am");
    if(!end){
      // +1 hour default
      end = { ...start };
      end.h = ((end.h % 12) + 1);
      end.ampm = start.ampm;
    }else{
      inferAmPmIfMissing(end, start.ampm);
    }
  }

  // title = remove parsed bits
  let title = text;
  if(dateHit?.matched){
    // also remove optional "this" before weekdays ("this saturday")
    title = title.replace(new RegExp(`\\b(?:this\\s+)?${escRe(dateHit.matched)}\\b`, "ig"), " ");
  }
  if(timeHit?.matched) title = title.replace(new RegExp(escRe(timeHit.matched), "ig"), " ");
  // if user typed "from 6-7pm" and matcher caught only "6-7pm", strip leftover "from"
  if(timeHit?.matched) title = title.replace(/\bfrom\b/ig, " ");
  title = tidyTitle(title);
  if(!title) title = "New event";

  return {
    iso: toISOFromDate(when),
    title,
    color: pickedColor,
    start,
    end
  };
}

function applyQuickAdd(q){
  if(!q) return;

  // jump to date if needed
  const d = new Date(q.iso + "T12:00:00");
  view = new Date(d.getFullYear(), d.getMonth(), 1);
  selectDate(q.iso);
  render();
  renderEventList();

  // new event context
  clearFormForNew();

  eventTitle.value = q.title;
  if(q.color && eventColor) eventColor.value = q.color;

  // times
  if(q.start){
    startTimeInput.value = timeToString(q.start);
    setAmPm(startAmPm, q.start.ampm || "am");
  }else{
    startTimeInput.value = "";
    setAmPm(startAmPm, "am");
  }

  if(q.end){
    endTimeInput.value = timeToString(q.end);
    setAmPm(endAmPm, q.end.ampm || (q.start?.ampm || "am"));
  }else{
    endTimeInput.value = "";
    setAmPm(endAmPm, "am");
  }

  // default reset
  if(repeatInterval) repeatInterval.value = String(q.repeatInterval || 1);
  if(repeatUntil) repeatUntil.value = (q.repeatUntil || "");
  if(spanUntil) spanUntil.value = (q.spanEnd || "");

  // Repeat mode (use the app's helper so the UI + hidden input stay in sync)
  const setFreq = (freq) => {
    if(typeof setRepeatValue === "function") setRepeatValue(freq);
    else if(eventRepeat) eventRepeat.value = freq;
  };

  // weeklyDays UI (S M T W T F S buttons)
  if(typeof setSelectedWeekdays === "function"){
    setSelectedWeekdays(Array.isArray(q.weeklyDays) ? q.weeklyDays : []);
  } else {
    // fallback: toggle buttons directly
    const wanted = new Set((q.weeklyDays || []).map(Number));
    document.querySelectorAll("#weeklyDaysRow .weekdayBtn").forEach(btn => {
      const day = Number(btn.dataset.day);
      btn.classList.toggle("active", wanted.has(day));
    });
  }

  if(q.repeatFreq){
    setFreq(q.repeatFreq);
    // for "span", we already set spanUntil above
    // for "daily", repeatUntil is already set above
  } else {
    setFreq("none");
    if(repeatInterval) repeatInterval.value = "1";
    if(repeatUntil) repeatUntil.value = "";
    if(spanUntil) spanUntil.value = "";
    if(typeof setSelectedWeekdays === "function") setSelectedWeekdays([]);
  }

  // save using the normal pipeline (keeps all your existing validation + sync)
  addBtn?.click();
}

function runQuickAdd(){
  try{
    const q = buildQuickAddFromText(quickAddInputEl?.value || "");
    if(!q) return;
    applyQuickAdd(q);
    if(quickAddInputEl) quickAddInputEl.value = "";
  }catch(err){
    console.error(err);
    alert("Quick add error: " + (err?.message || err));
  }
}

quickAddBtn?.addEventListener("click", runQuickAdd);
quickAddInputEl?.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    e.preventDefault();
    runQuickAdd();
  }
});

toggleSuggestions.checked = settings.suggestions;

settingsBtn?.addEventListener("click", () => {
  settingsMenu.classList.toggle("hidden");
});

toggleSuggestions?.addEventListener("change", () => {
  settings.suggestions = toggleSuggestions.checked;
  saveSettings();
  syncStateFromLegacy();
  render();
});

if(weatherEnabled){
  weatherEnabled.checked = !!getWeatherSettings().enabled;
}

if(weatherLocationSelect){
  weatherLocationSelect.value = getWeatherSettings().locationKey || "coloradoSprings";
}

weatherEnabled?.addEventListener("change", () => {
  settings.weather = {
    ...getWeatherSettings(),
    enabled: !!weatherEnabled.checked
  };

  saveSettings();
  render();
});

weatherLocationSelect?.addEventListener("change", () => {
  settings.weather = {
    ...getWeatherSettings(),
    locationKey: weatherLocationSelect.value
  };

  weatherCache = null;
  saveSettings();
  render();
});

if(budgetChartPercentages){
  budgetChartPercentages.checked = !!settings.budgetChartPercentages;
}

budgetChartPercentages?.addEventListener("change", () => {
  settings.budgetChartPercentages = !!budgetChartPercentages.checked;
  saveSettings();
  renderBudgetPage();
});


// ============================================================================
// 15. QUICK SEARCH
// ============================================================================
// ---------- Quick search ("/") ----------
let quickSearchOpen = false;
let quickSearchOverlay = null;
let quickSearchInput = null;
let quickSearchResults = null;
let quickSearchActiveIndex = 0;

function ensureQuickSearchUI(){
  if(quickSearchOverlay) return;

  quickSearchOverlay = document.createElement("div");
  quickSearchOverlay.id = "quickSearchOverlay";
  quickSearchOverlay.className = "quickSearchOverlay hidden";

  const panel = document.createElement("div");
  panel.className = "quickSearchPanel";

  const input = document.createElement("input");
  input.id = "quickSearchInput";
  input.className = "quickSearchInput";
  input.type = "text";
  input.placeholder = "Search events… (type to filter, Enter to jump, Esc to close)";

  const results = document.createElement("div");
  results.id = "quickSearchResults";
  results.className = "quickSearchResults";

  panel.appendChild(input);
  panel.appendChild(results);
  quickSearchOverlay.appendChild(panel);
  document.body.appendChild(quickSearchOverlay);

  quickSearchInput = input;
  quickSearchResults = results;

  quickSearchOverlay.addEventListener("mousedown", (e) => {
    if(e.target === quickSearchOverlay) closeQuickSearch();
  });

  input.addEventListener("input", () => renderQuickSearchResults(input.value));
  input.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      e.preventDefault();
      closeQuickSearch();
      return;
    }
    if(e.key === "ArrowDown" || e.key === "ArrowUp"){
      e.preventDefault();
      const items = [...quickSearchResults.querySelectorAll(".qsItem")];
      if(!items.length) return;
      quickSearchActiveIndex += (e.key === "ArrowDown" ? 1 : -1);
      if(quickSearchActiveIndex < 0) quickSearchActiveIndex = items.length - 1;
      if(quickSearchActiveIndex >= items.length) quickSearchActiveIndex = 0;
      paintActiveQuickSearchItem();
      return;
    }
    if(e.key === "Enter"){
      e.preventDefault();
      const items = [...quickSearchResults.querySelectorAll(".qsItem")];
      const hit = items[quickSearchActiveIndex] || items[0];
      if(hit){
        const iso = hit.getAttribute("data-iso");
        if(iso){
          const d = new Date(iso + "T12:00:00");
          view = new Date(d.getFullYear(), d.getMonth(), 1);
          selectDate(iso);
        }
      }
      closeQuickSearch();
      return;
    }
  });
}

function openQuickSearch(){
  ensureQuickSearchUI();
  quickSearchOpen = true;
  quickSearchActiveIndex = 0;
  quickSearchOverlay.classList.remove("hidden");
  renderQuickSearchResults("");
  setTimeout(() => quickSearchInput?.focus(), 0);
}

function closeQuickSearch(){
  quickSearchOpen = false;
  if(quickSearchOverlay) quickSearchOverlay.classList.add("hidden");
}

function getAllEventsFlat(){
  const out = [];
  for(const iso of Object.keys(events || {})){
    const list = events[iso];
    if(!Array.isArray(list)) continue;
    for(const ev of list){
      if(!ev) continue;
      const title = (ev.title || "").trim();
      const notes = (ev.notes || ev.details || "").toString();
      const time = formatTimeRange(ev.startTime, ev.endTime);
      out.push({ iso, title, notes, time, color: ev.color || "" });
    }
  }
  // Newest first by date
  out.sort((a,b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0));
  return out;
}

function renderQuickSearchResults(query){
  if(!quickSearchResults) return;
  const q = (query || "").trim().toLowerCase();
  const all = getAllEventsFlat()
    .filter(e => e.title || e.time || e.notes);

  let hits = all;
  if(q){
    hits = all.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.time.toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q) ||
      e.iso.includes(q)
    );
  }

  hits = hits.slice(0, 50);

  quickSearchResults.innerHTML = "";
  if(!hits.length){
    const empty = document.createElement("div");
    empty.className = "qsEmpty";
    empty.textContent = "No matches";
    quickSearchResults.appendChild(empty);
    return;
  }

  hits.forEach((e, idx) => {
    const row = document.createElement("div");
    row.className = "qsItem";
    if(idx === 0) row.classList.add("active");
    row.setAttribute("data-iso", e.iso);

    const left = document.createElement("div");
    left.className = "qsLeft";

    const title = document.createElement("div");
    title.className = "qsTitle";
    title.textContent = e.title || "(untitled)";

    const meta = document.createElement("div");
    meta.className = "qsMeta";
    meta.textContent = `${e.iso}${e.time ? " • " + e.time : ""}`;

    left.appendChild(title);
    left.appendChild(meta);

    const swatch = document.createElement("div");
    swatch.className = "qsSwatch";
    if(e.color) swatch.style.background = safeHexColor(e.color, DEFAULT_COLOR);

    row.appendChild(swatch);
    row.appendChild(left);

    row.addEventListener("mouseenter", () => {
      quickSearchActiveIndex = idx;
      paintActiveQuickSearchItem();
    });

    row.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      const d = new Date(e.iso + "T12:00:00");
      view = new Date(d.getFullYear(), d.getMonth(), 1);
      selectDate(e.iso);
      closeQuickSearch();
    });

    quickSearchResults.appendChild(row);
  });

  quickSearchActiveIndex = 0;
  paintActiveQuickSearchItem();
}

function paintActiveQuickSearchItem(){
  const items = [...(quickSearchResults?.querySelectorAll(".qsItem") || [])];
  items.forEach((el, i) => el.classList.toggle("active", i === quickSearchActiveIndex));
  const active = items[quickSearchActiveIndex];
  active?.scrollIntoView({ block: "nearest" });
}


// ============================================================================
// 16. KEYBOARD SHORTCUTS
// ============================================================================
document.addEventListener("keydown", (e) => {
  // Don't hijack system/app shortcuts
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // If the quick search is open, only let Escape close it (other keys handled by the input)
  if (quickSearchOpen){
    if (e.key === "Escape"){
      e.preventDefault();
      closeQuickSearch();
    }
    return;
  }

  const typing = isTypingTarget(document.activeElement) || isTypingTarget(e.target);

  const k = e.key;
  const code = e.code;

  // "/" = open quick search (unless you're typing)
  if (!typing && (k === "/" || k === "?" || code === "Slash")) {
    e.preventDefault();
    openQuickSearch();
    return;
  }

  // "\" = collapse / expand editor panel (unless you're typing)
  if (!typing && (k === "\\" || k === "|" || code === "Backslash")) {
    e.preventDefault();
    setEditorCollapsed(!isEditorCollapsed());
    return;
  }

  // [ / ] navigation (Shift = ±1 week)
  const isPrev = (k === "[" || k === "{");
  const isNext = (k === "]" || k === "}");
  if (!typing && (isPrev || isNext)) {
    e.preventDefault();
    const dir = isPrev ? -1 : 1;
    const step = e.shiftKey ? 7 : 1;

    const baseISO = selectedDateISO || isoDate(view.getFullYear(), view.getMonth()+1, 1);
    const base = new Date(baseISO + "T12:00:00");
    base.setDate(base.getDate() + dir * step);

    const targetISO = isoDate(base.getFullYear(), base.getMonth()+1, base.getDate());

    // Keep the month view following the selection
    view = new Date(base.getFullYear(), base.getMonth(), 1);
    selectDate(targetISO);
    return;
  }

  // t = today
  if (!typing && (k === "t" || k === "T")) {
    e.preventDefault();
    todayBtn?.click();
    return;
  }
});


window.addEventListener("resize", () => alignDowToGrid());
// Prevent mobile pinch/double-tap zoom from triggering resize chaos
document.addEventListener("gesturestart", e => e.preventDefault(), { passive:false });
document.addEventListener("gesturechange", e => e.preventDefault(), { passive:false });
document.addEventListener("gestureend", e => e.preventDefault(), { passive:false });

document.addEventListener("touchmove", e => {
  if(e.touches && e.touches.length > 1){
    e.preventDefault();
  }
}, { passive:false });

// ============================================================================
// 16B. INIT
// ============================================================================

document.querySelector(".layout")?.addEventListener("transitionend", (e) => {
  if (e.propertyName.includes("grid")) {
    alignDowToGrid();
    render();
  }
});
startNowLineTicker();
if(deleteBtn) deleteBtn.disabled = true;
try{
setEditorCollapsed(isEditorCollapsed());
setSyncUI();
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(console.error);
  });
}

initCloudSync();
updateCalendarMobileDateLabel();
setInterval(updateCalendarMobileDateLabel, 30000);
tryAutoReconnect();
  render();
  renderEventList();
setBudgetViewMode(budgetViewMode);
renderBudgetCategoryOptions();
closeBudgetTxDrawer();
setActiveSection(activeSection);
updateSectionSlider();
bootstrapIndexedDbStorageAfterInitialLoad().catch(err => {
  console.warn("IndexedDB bootstrap skipped:", err);
});
}catch(err){
  console.error(err);
  alert("Calendar error: " + err.message);
}
updateHistoryUI();
requestAnimationFrame(updateViewSlider);

setInterval(() => {
  if(viewMode === "day") render();
}, 60000);
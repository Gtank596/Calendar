// ============================================================================
// My Digital Calendar
// Offline calendar + budget dashboard + weather + file sync
//
// Organization map:
//   01. DOM references
//   02. Settings + preferences
//   03. History / undo-redo
//   04. Utility helpers
//   05. File sync
//   06. Weather helpers
//   07. Navigation / section switching
//   08. Budget dashboard + categories
//   09. Smart Suggestions
//   10. Drag/drop + day-view time editing
//   11. Storage + recurrence
//   12. Rendering: month/week/day/events
//   13. Event editor + CRUD
//   14. Quick add
//   15. Quick search
//   16. Keyboard shortcuts + init
//
// Note: this pass keeps execution order intact to avoid breaking globals,
// listeners, and DOM initialization.
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
  setLocalPayload({ updatedAt: Date.now(), events });
  cloudWriteDebounced();
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
              --cat-color:${escapeHtml(cat.color)};
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
const STORAGE_KEY = "myCalendarData_v4";
const MAX_EVENT_DURATION_MINS = 24 * 60;

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
const SUPABASE_URL = "https://ddxiumutfrimgjzzbhus.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Icp1pf88iW1t5TUnmVqb6Q_bXSRI9e_";
const CLOUD_ROW_ID = "main";
const CLOUD_TABLE = "calendar_cloud_state";
const CLOUD_PENDING_KEY = "myCalendarCloudPending_v1";
const CLOUD_LAST_SYNC_KEY = "myCalendarCloudLastSync_v1";

let supabaseClient = null;
let cloudUser = null;
let cloudWriteTimer = null;
let cloudBusy = false;
let cloudFlushInProgress = false;

function getCloudPending(){
  try{
    return JSON.parse(localStorage.getItem(CLOUD_PENDING_KEY)) || null;
  }catch{
    return null;
  }
}

function isCloudPending(){
  return !!getCloudPending();
}

function markCloudPending(reason = "local change"){
  const local = getLocalPayload?.() || {};

  localStorage.setItem(CLOUD_PENDING_KEY, JSON.stringify({
    reason,
    updatedAt: Number(local.updatedAt || Date.now()),
    markedAt: Date.now()
  }));
}

function clearCloudPending(){
  localStorage.removeItem(CLOUD_PENDING_KEY);
  localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(Date.now()));
}

function getCloudSyncLabel(){
  if(!cloudUser) return "Cloud: Not signed in";
  if(isCloudPending()) return "Cloud: Pending sync";
  return `Cloud: Signed in as ${cloudUser.email || "user"}`;
}

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
      await pullCloudIfNewer();
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

async function readCloudState(){
  if(!supabaseClient || !cloudUser) return null;

  const { data, error } = await supabaseClient
    .from(CLOUD_TABLE)
    .select("payload, updated_at")
    .eq("id", CLOUD_ROW_ID)
    .maybeSingle();

  if(error){
    setCloudStatus("Cloud read failed: " + error.message);
    return null;
  }

  if(!data?.payload) return null;

  return buildFullSavePayload(data.payload);
}

async function writeCloudStateNow(){
  if(!supabaseClient || !cloudUser){
    markCloudPending("not signed in");
    updateCloudUI();
    return false;
  }

  if(typeof navigator !== "undefined" && navigator.onLine === false){
    markCloudPending("offline");
    setCloudStatus("Cloud: Offline, saved locally");
    return false;
  }

  const payload = buildFullSavePayload(getLocalPayload());

  const { error } = await supabaseClient
    .from(CLOUD_TABLE)
    .upsert({
      id: CLOUD_ROW_ID,
      user_id: cloudUser.id,
      payload,
      updated_at: new Date(payload.updatedAt || Date.now()).toISOString()
    }, { onConflict: "id" });

  if(error){
    markCloudPending("cloud save failed");
    setCloudStatus("Cloud save failed, will retry: " + error.message);
    return false;
  }

  clearCloudPending();
  setCloudStatus(`Cloud: Synced ${new Date(payload.updatedAt || Date.now()).toLocaleString()}`);
  updateCloudUI();
  return true;
}

function cloudWriteDebounced(){
  markCloudPending("local change");
  updateCloudUI();

  if(!cloudUser) return;

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

  if(typeof navigator !== "undefined" && navigator.onLine === false){
    if(isCloudPending()) setCloudStatus("Cloud: Offline, sync pending");
    return false;
  }

  cloudFlushInProgress = true;

  try{
    const pending = getCloudPending();

    if(pending){
      const cloud = await readCloudState();
      const local = getLocalPayload();
      const cloudTime = Number(cloud?.updatedAt || 0);
      const localTime = Number(local?.updatedAt || 0);

      if(cloud && cloudTime > localTime){
        setCloudStatus("Cloud: Sync paused, cloud has newer changes. Use Push or Pull.");
        return false;
      }

      setCloudStatus("Cloud: Syncing pending changes...");
      return await writeCloudStateNow();
    }

    await pullCloudIfNewer();
    return true;
  }finally{
    cloudFlushInProgress = false;
    updateCloudUI();
  }
}

async function pullCloudIfNewer(){
  const cloud = await readCloudState();
  if(!cloud) return;

  const local = getLocalPayload();

  if(isCloudPending() && Number(local.updatedAt || 0) >= Number(cloud.updatedAt || 0)){
    await writeCloudStateNow();
    return;
  }

  if(Number(cloud.updatedAt || 0) > Number(local.updatedAt || 0)){
    applyFullSavePayload(cloud);
    clearCloudPending();
    setCloudStatus(`Cloud: Pulled ${new Date(cloud.updatedAt).toLocaleString()}`);
  }else{
    setCloudStatus(isCloudPending() ? "Cloud: Pending sync" : "Cloud: Local copy is current");
  }
}

async function pushLocalToCloud(){
  markCloudPending("manual push");
  await writeCloudStateNow();
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
cloudPullBtn?.addEventListener("click", () => pullCloudIfNewer().catch(console.error));

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
    if(!raw) return { version: 1, updatedAt: 0, events: {} };

    const parsed = JSON.parse(raw);

    // Back-compat: old format was just the events map
    if(parsed && typeof parsed === "object" && !("events" in parsed)){
      return { version: 1, updatedAt: 0, events: parsed };
    }

    return {
      version: Number(parsed.version || 1),
      updatedAt: Number(parsed.updatedAt || 0),
      events: parsed.events || {},
      settings: parsed.settings || null,
      budgetPlans: parsed.budgetPlans || null,
      budgetCategories: parsed.budgetCategories || null,
      merchantAliases: parsed.merchantAliases || null,
      receiptItemCategoryMemory: parsed.receiptItemCategoryMemory || null,
      selectedBudgetPanes: parsed.selectedBudgetPanes || null,
      activeSection: parsed.activeSection || null,
      budgetViewMode: parsed.budgetViewMode || null
    };
  }catch{
    return { version: 1, updatedAt: 0, events: {} };
  }
}

function buildFullSavePayload(base = {}){
  return {
    version: 2,
    updatedAt: Number(base.updatedAt || Date.now()),
    events: base.events || events || {},
    settings: base.settings || settings || loadSettings(),
    budgetPlans: base.budgetPlans || budgetPlans || loadBudgetPlans(),
    budgetCategories: base.budgetCategories || budgetCategories || loadBudgetCategories(),
    merchantAliases: base.merchantAliases || merchantAliases || loadMerchantAliases(),
    receiptItemCategoryMemory: base.receiptItemCategoryMemory || receiptItemCategoryMemory || loadReceiptItemCategoryMemory(),
    selectedBudgetPanes: base.selectedBudgetPanes || selectedBudgetPanes || loadBudgetPaneSelection(),
    activeSection: base.activeSection || activeSection || "calendar",
    budgetViewMode: base.budgetViewMode || budgetViewMode || "month"
  };
}

function applyFullSavePayload(payload, opts = {}){
  if(!payload) return;

  const safe = buildFullSavePayload({
    ...payload,
    updatedAt: Number(payload.updatedAt || Date.now()),
    events: normalizeEventsMap(payload.events || {})
  });

  events = normalizeEventsMap(safe.events || {});
  settings = safe.settings || settings;
  budgetPlans = safe.budgetPlans || budgetPlans;
  budgetCategories = Array.isArray(safe.budgetCategories) && safe.budgetCategories.length
    ? safe.budgetCategories
    : budgetCategories;
  merchantAliases = safe.merchantAliases && typeof safe.merchantAliases === "object"
    ? safe.merchantAliases
    : merchantAliases;
  receiptItemCategoryMemory = safe.receiptItemCategoryMemory && typeof safe.receiptItemCategoryMemory === "object"
    ? safe.receiptItemCategoryMemory
    : receiptItemCategoryMemory;
  selectedBudgetPanes = safe.selectedBudgetPanes || selectedBudgetPanes;
  activeSection = safe.activeSection || activeSection;
  budgetViewMode = safe.budgetViewMode || budgetViewMode;

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem(BUDGET_PLANS_KEY, JSON.stringify(budgetPlans));
  localStorage.setItem(BUDGET_CATEGORIES_KEY, JSON.stringify(budgetCategories));
  localStorage.setItem(MERCHANT_ALIASES_KEY, JSON.stringify(merchantAliases));
  localStorage.setItem(RECEIPT_ITEM_MEMORY_KEY, JSON.stringify(receiptItemCategoryMemory));
  localStorage.setItem(BUDGET_PANES_KEY, JSON.stringify(selectedBudgetPanes));
  localStorage.setItem("myCalendar_activeSection", activeSection);
  localStorage.setItem("myCalendar_budgetViewMode", budgetViewMode);

  syncStateFromLegacy();
  invalidateDerivedData("events");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));

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
  const safe = buildFullSavePayload(payload);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));

  if(!opts.skipCloudPending){
    markCloudPending("local save");
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
    precip: daily.precipitation_probability_max?.[idx] ?? null,
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
      precip: precip ?? 0,
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
  return `${Math.round((Number(part || 0) / Number(total || 1)) * 100)}%`;
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
  setLocalPayload({ updatedAt: Date.now(), events });
  cloudWriteDebounced();
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
  setLocalPayload({ updatedAt: Date.now(), events });
  cloudWriteDebounced();
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
              --cat-color:${escapeHtml(cat.color || "#7a5aff")};
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
              --cat-color:${escapeHtml(cat.color || "#7a5aff")};
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
  setLocalPayload({ updatedAt: Date.now(), events });
  cloudWriteDebounced();
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
      --cat-color:${escapeHtml(currentCat.color || "#7a5aff")};
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
        --cat-color:${escapeHtml(cat.color || "#7a5aff")};
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
          --cat-color:${escapeHtml(cat.color || "#7a5aff")};
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
let receiptScanBusy = false;
let currentReceiptScanDraft = null;
let merchantAliases = loadMerchantAliases();
let receiptItemCategoryMemory = loadReceiptItemCategoryMemory();

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

function saveReceiptItemCategoryMemory(){
  localStorage.setItem(
    RECEIPT_ITEM_MEMORY_KEY,
    JSON.stringify(receiptItemCategoryMemory)
  );

  setLocalPayload({ updatedAt: Date.now(), events });
  cloudWriteDebounced();
}

function normalizeReceiptItemPhrase(line = ""){
  let phrase = String(line || "").toLowerCase();

  // Drop prices, quantities, SKU-ish fragments, and punctuation noise.
  phrase = phrase
    .replace(/\$?\d{1,4}(?:,\d{3})*\.\d{2}/g, " ")
    .replace(/\b\d+\s*(ct|oz|lb|lbs|gal|ml|l|ea|pk|pack|qty)\b/g, " ")
    .replace(/\b(upc|sku|tc|op|te|tr|ref|auth|aid|term|terminal)\s*#?\s*\w+\b/g, " ")
    .replace(/[^a-z0-9 &'-]/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const badLine =
    !phrase ||
    phrase.length < 3 ||
    phrase.length > 36 ||
    /\b(total|subtotal|sub total|tax|change|cash|card|visa|mastercard|amex|debit|credit|balance|approved|thank|survey|receipt|cashier|phone|address|www|http|items sold)\b/i.test(phrase);

  if(badLine) return "";

  // Keep compact phrases. Long receipt descriptions are usually noise.
  const words = phrase.split(/\s+/).filter(Boolean);
  return words.slice(0, 4).join(" ");
}

function extractReceiptLearningPhrases(rawText = ""){
  const seen = new Set();
  const phrases = [];

  const lines = String(rawText || "")
    .split(/\n+/)
    .map(cleanReceiptLine)
    .filter(Boolean);

  for(const line of lines){
    const phrase = normalizeReceiptItemPhrase(line);
    if(!phrase || seen.has(phrase)) continue;

    seen.add(phrase);
    phrases.push(phrase);

    if(phrases.length >= 60) break;
  }

  return phrases;
}

function getReceiptMemoryCategoryScores(text = ""){
  const lower = String(text || "").toLowerCase();
  const scores = new Map();

  for(const [phrase, memory] of Object.entries(receiptItemCategoryMemory || {})){
    if(!phrase || !lower.includes(phrase)) continue;

    const categories = memory?.categories || {};

    for(const [categoryId, meta] of Object.entries(categories)){
      const cat = getBudgetCategory(categoryId);
      if(!cat) continue;

      const count = Number(meta?.count || 0);
      if(count <= 0) continue;

      // A learned phrase should matter, but not bully a strong static match.
      const boost = Math.min(4, 1.25 + count * 0.65);
      scores.set(categoryId, (scores.get(categoryId) || 0) + boost);
    }
  }

  return scores;
}

function saveReceiptItemCategoryMemory(rawText = "", categoryId = "other"){
  const cat = getBudgetCategory(categoryId);
  if(!cat || !categoryId || categoryId === "other") return;

  const phrases = extractReceiptLearningPhrases(rawText);
  if(!phrases.length) return;

  for(const phrase of phrases){
    const existing = receiptItemCategoryMemory[phrase] || {
      phrase,
      createdAt: Date.now(),
      categories: {}
    };

    const catMemory = existing.categories[categoryId] || {
      count: 0,
      firstSeenAt: Date.now()
    };

    existing.categories[categoryId] = {
      ...catMemory,
      count: Number(catMemory.count || 0) + 1,
      lastSeenAt: Date.now()
    };

    existing.updatedAt = Date.now();
    receiptItemCategoryMemory[phrase] = existing;
  }

  // Keep the tiny local brain tiny. Oldest/least-used phrases get pruned first.
  const entries = Object.entries(receiptItemCategoryMemory);
  if(entries.length > 500){
    entries.sort((a, b) => {
      const aCount = Object.values(a[1]?.categories || {})
        .reduce((sum, x) => sum + Number(x?.count || 0), 0);
      const bCount = Object.values(b[1]?.categories || {})
        .reduce((sum, x) => sum + Number(x?.count || 0), 0);

      if(aCount !== bCount) return aCount - bCount;
      return Number(a[1]?.updatedAt || 0) - Number(b[1]?.updatedAt || 0);
    });

    for(const [key] of entries.slice(0, entries.length - 500)){
      delete receiptItemCategoryMemory[key];
    }
  }

  saveReceiptItemCategoryMemory();
}

function learnReceiptCategoryFromCurrentDraft(categoryId){
  if(!currentReceiptScanDraft) return;
  saveReceiptItemCategoryMemory(currentReceiptScanDraft.rawText || "", categoryId);
}

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
  setLocalPayload({ updatedAt: Date.now(), events });
  cloudWriteDebounced();
}

function saveMerchantAlias(rawName, cleanName){
  const key = normalizeMerchantKey(rawName);
  const normalized = String(cleanName || "").trim();

  if(!key || !normalized || normalized.length < 2) return;

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
      "burger", "grill", "bbq", "barbecue", "fries", "sandwich"
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

  const headerLines = lines.slice(0, 12);
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
    ["starbucks", "Starbucks"],
    ["dutch bros", "Dutch Bros"],
    ["chuy", "Chuy's"],
    ["shell", "Shell"],
    ["conoco", "Conoco"],
    ["circle k", "Circle K"],
    ["loaf n jug", "Loaf 'N Jug"],
    ["murphy", "Murphy"],
    ["murphy usa", "Murphy USA"],
    ["walgreens", "Walgreens"],
    ["cvs", "CVS"],
    ["amazon", "Amazon"],
    ["home depot", "Home Depot"],
    ["lowe's", "Lowe's"],
    ["lowes", "Lowe's"],
    ["best buy", "Best Buy"]
  ];

  // Known merchants win ONLY if they appear near the receipt header.
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
    "address", "purchase", "pin verified", "customer copy"
  ];

  let best = "";
  let bestScore = -999;

  for(const line of headerLines){
    const lower = line.toLowerCase();
    let score = 0;

    if(badPatterns.some(bad => lower.includes(bad))) score -= 60;

    if(/^[a-z0-9 &'’.-]+$/i.test(line)) score += 10;
    if(line.length >= 3 && line.length <= 28) score += 8;

    const words = line.split(/\s+/).filter(Boolean);
    if(words.length <= 3) score += 6;

    const letters = (line.match(/[a-z]/gi) || []).length;
    const digits = (line.match(/\d/g) || []).length;

    if(letters >= 3) score += 6;
    if(digits > 0) score -= digits * 3;
    if(digits > letters) score -= 30;

    if(/\b\d+\.\d{2}\b/.test(line)) score -= 40;
    if(/\b\d{5,}\b/.test(line)) score -= 30;
    if(/\b(items?|sold|tc#|op#|te#|tr#|st#|sku|qty)\b/i.test(line)) score -= 40;

    if(score > bestScore){
      bestScore = score;
      best = line;
    }
  }

  return bestScore > 0
    ? best.trim()
    : fallbackStore || "Receipt";
}

function getBestReceiptAmount(result = {}){
  const rawText = String(result.rawText || result.text || "");
  const moneyRe = /(-?\$?\d{1,4}(?:,\d{3})*\.\d{2})/;
  const lines = rawText.split(/\n+/).map(cleanReceiptLine).filter(Boolean);
  const candidates = [];

  for(const line of lines){
    const match = line.match(moneyRe);
    if(!match) continue;

    const value = Number(match[1].replace(/[$,]/g, ""));
    if(!Number.isFinite(value) || value <= 0) continue;

    let score = 0;
    if(/\b(grand\s+total|amount\s+paid|paid|card|visa|mastercard|amex)\b/i.test(line)) score += 40;
    if(/\btotal\b/i.test(line)) score += 25;
    if(/\b(subtotal|sub\s*total|tax|tip|discount|change|balance due|cash back)\b/i.test(line)) score -= 80;

    candidates.push({ value, score, line });
  }

  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  const best = candidates.find(c => c.score > 0);
  if(best) return best.value;

  const fallback = Number(result.grandTotal ?? result.amount ?? result.total ?? 0);
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
  if(categoryGuess && budgetTxCategory){
    budgetTxCategory.value = categoryGuess;
    renderBudgetCategoryOptions();
  }

  openBudgetTxDrawer();

  const pieces = [];
  if(store) pieces.push(store);
  if(Number.isFinite(amount) && amount > 0) pieces.push(money(amount));
  if(date) pieces.push(date);

  const duplicateText = possibleDuplicate
  ? ` ⚠️ Possible duplicate: ${possibleDuplicate.item.title} on ${fmtPrettyISO(possibleDuplicate.item.date)} for ${money(Math.abs(possibleDuplicate.item.price))}.`
  : "";

setReceiptScanStatus(
  pieces.length
    ? `Receipt scanned: ${pieces.join(" • ")}. Review before adding.${duplicateText}`
    : `Receipt scanned. Review the fields before adding.${duplicateText}`,
  possibleDuplicate ? "info" : "success"
);
}

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

  if(derivedCache.budgetItemsVersion !== state.meta.eventsVersion){
    derivedCache.budgetItems.clear();
    derivedCache.budgetItemsVersion = state.meta.eventsVersion;
  }

  const cacheKey = `${startISO}__${endISO}`;
  const cached = derivedCache.budgetItems.get(cacheKey);
  if(cached) return cached.map(item => ({ ...item }));

  const fresh = computeBudgetItemsUncached(startISO, endISO);
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

function updateBudgetTransactionPrice(eventId, date, amount){
  const price = Number(amount);

  if(!eventId || !Number.isFinite(price) || price < 0) return;

  const before = snapshotBeforeChange();

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

  list[idx] = {
    ...list[idx],
    price
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
    input.value
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
  render();
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

  return {
  id: obj?.id || cryptoId(),
  title: (obj?.title ?? "").toString(),
  details: (obj?.details ?? "").toString(),
  price: Number.isFinite(Number(obj?.price)) ? Number(obj.price) : null,
  source: (obj?.source ?? "calendar").toString(),
categoryId: (obj?.categoryId ?? "other").toString(),
  color: color.startsWith("#") ? color : DEFAULT_COLOR,
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

function saveEvents(previousEventsSnapshot = null){
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

  setLocalPayload({ updatedAt: Date.now(), events });
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
  const masters = [];
  for(const dayKey of Object.keys(events)){
    const list = events[dayKey];
    if(!Array.isArray(list)) continue;
    for(const ev of list){
      if((ev?.recurrence?.freq || "none") !== "none") masters.push(ev);
    }
  }
  return masters;
}

function getComputedEventsForDay(iso){
  const direct = Array.isArray(events[iso]) ? events[iso] : [];
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
  const masters = [];
  for(const dayKey of Object.keys(events)){
    const list = events[dayKey];
    if(!Array.isArray(list)) continue;
    for(const ev of list){
      if(ev?.span?.mode === "bg" && ev?.startDate && ev?.span?.end) masters.push(ev);
    }
  }
  return masters;
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

// ============================================================================
// 12. APP STATE
// ============================================================================
let { events: eventsMap } = loadEvents();
let events = normalizeEventsMap(eventsMap);


let view = new Date();
view.setDate(1);

let viewMode = "month";

let selectedDateISO = null;
let selectedEventId = null;
let editBaseDateISO = null;

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
  budgetItems: new Map()
};

function syncStateFromLegacy(){
  state.events = events;
  state.view = view;
  state.viewMode = viewMode;
  state.selectedDateISO = selectedDateISO;
  state.selectedEventId = selectedEventId;
  state.editBaseDateISO = editBaseDateISO;
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
    state.meta.eventsVersion += 1;
    derivedCache.budgetItems.clear();
    derivedCache.budgetItemsVersion = state.meta.eventsVersion;
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
  }

  if(options.persistBudgetViewMode && typeof state.budgetViewMode === "string"){
    localStorage.setItem("myCalendar_budgetViewMode", state.budgetViewMode);
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

function startOfWeek(dt){
  const d = new Date(dt);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
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

function renderMonthView(){
  if(!grid) return;
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = "repeat(7, 1fr)";
  if(dow) dow.style.display = "";
  if(monthLabel) monthLabel.textContent = fmtMonthYear(view);

  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDow = firstDayOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startDow);

const monthSuggestions = getSuggestionsForRange(startDate, 42);

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

function renderWeekView(){
  grid.innerHTML = "";
  if(dow) dow.style.display = "";
  if(monthLabel) monthLabel.textContent = fmtWeekRange(view);

  grid.style.gridTemplateColumns = "repeat(7, 1fr)";

  const start = startOfWeek(view);
  const today = new Date();
  const todayISO = isoDate(today.getFullYear(), today.getMonth()+1, today.getDate());

  for(let i = 0; i < 7; i++){
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + i);

    const cellISO = dateToYmd(cellDate);
    const dayEl = document.createElement("div");
    dayEl.className = "day weekViewDay";
    dayEl.dataset.iso = cellISO;

    if(cellISO === todayISO) dayEl.classList.add("today");
    if(selectedDateISO === cellISO) dayEl.classList.add("selectedDay");

    // Trip shading: same idea as month view
    const spanLayers = getSpansForDay(cellISO);

    const header = document.createElement("div");
    header.className = "dayHeader";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = cellDate.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric"
    });

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
      pill.className = "eventPill";

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
  openEventInEditor(ev, cellISO);
});

      dayEl.appendChild(pill);
    }

    dayEl.addEventListener("click", () => selectDate(cellISO));
    grid.appendChild(dayEl);
  }

  requestAnimationFrame(() => alignDowToGrid());
}

function isMobileLayout(){
  return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
}

function getDayTimelineLayout(){
  return isMobileLayout()
    ? { laneLeft: 58, laneRight: 10, gutter: 4 }
    : { laneLeft: 78, laneRight: 12, gutter: 5 };
}

function renderDayView(){
  const now = new Date();

  grid.innerHTML = "";
  grid.style.gridTemplateColumns = "1fr";
  if(dow) dow.style.display = "none";

  const base = new Date(view);
  const dayISO = dateToYmd(base);

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
      openEventInEditor(ev, ev._segmentBaseDate || dayISO);
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

function renderEventList(){
  if(!eventsList) return;
  eventsList.innerHTML = "";

  if(!selectedDateISO){
    eventsList.innerHTML = `<div class="hint">Select a day to see events.</div>`;
    return;
  }

  const list = sortByTimeThenTitle(getCalendarEventsForDay(selectedDateISO));

  if(list.length === 0){
    eventsList.innerHTML = `<div class="hint">No events yet. Click <b>+ New</b> and add one.</div>`;
    return;
  }

  for(const ev of list){
    const item = document.createElement("div");
    item.className = "eventItem";

    const isActive = (ev.id === selectedEventId) || (ev._masterId && ev._masterId === selectedEventId);
    if(isActive) item.classList.add("active");

    const stripe = document.createElement("div");
    stripe.className = "eventStripe";
    stripe.style.background = (ev.color || DEFAULT_COLOR);
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
renderEventCategoryOptions();

  startTimeInput.value = (ev.startTime || "").replace(/\s*(AM|PM)$/i, "").trim();
  endTimeInput.value = (ev.endTime || "").replace(/\s*(AM|PM)$/i, "").trim();

  setAmPm(startAmPm, /PM$/i.test(ev.startTime||"") ? "pm" : "am");
  setAmPm(endAmPm, /PM$/i.test(ev.endTime||"") ? "pm" : "am");

  if(eventColor) eventColor.value = ev.color || DEFAULT_COLOR;

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
  const nextView = (viewMode === "week" || viewMode === "day") ? ymdToDate(iso) : view;
  setCalendarState({ selectedDateISO: iso, view: nextView }, { render:false });
// If the editor is collapsed, clicking a day should pop it back open.
if(!opts.silent && isEditorCollapsed()){
  setEditorCollapsed(false);
}

  if(panelTitle) panelTitle.textContent = "Edit day";
  if(panelSub) panelSub.textContent = fmtPrettyISO(iso);

  clearFormForNew();
  closeMobileEditor();
  renderEventList();

  syncStateFromLegacy();

  if(!opts.silent) queueRender({ calendar:true });
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
    } else {
      const newEv = { id: cryptoId(), title, details, color, startTime: startStr, endTime: endStr, startDate: selectedDateISO, span, recurrence: nextRecurrence };
      list.push(newEv);
      selectedEventId = newEv.id;
    }
  } else {
    const newEv = { id: cryptoId(), title, details, price, categoryId, color, startTime: startStr, endTime: endStr, startDate: selectedDateISO, span, recurrence: nextRecurrence };
    list.push(newEv);
    selectedEventId = newEv.id;
  }

  events[baseKey] = list;
  saveEvents(before);
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
    events[baseKey] = list.filter(e => e.id !== selectedEventId);
    saveEvents(before);
    syncStateFromLegacy();
    clearFormForNew();
    renderEventList();
    render();
    return;
  }

  if(isSeries && isOccurrenceContext()){
    const ex = Array.isArray(ev.recurrence.exceptions) ? ev.recurrence.exceptions : [];
    if(!ex.includes(selectedDateISO)) ex.push(selectedDateISO);
    list[idx] = { ...ev, recurrence: { ...ev.recurrence, exceptions: ex } };
    events[baseKey] = list;
    saveEvents(before);
    syncStateFromLegacy();
    clearFormForNew();
    renderEventList();
    render();
    return;
  }

  events[baseKey] = list.filter(e => e.id !== selectedEventId);
  saveEvents(before);
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
  const key = e.key.toLowerCase();
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
    if(e.color) swatch.style.background = e.color;

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
tryAutoReconnect();
  render();
  renderEventList();
setBudgetViewMode(budgetViewMode);
renderBudgetCategoryOptions();
closeBudgetTxDrawer();
setActiveSection(activeSection);
updateSectionSlider();
}catch(err){
  console.error(err);
  alert("Calendar error: " + err.message);
}
updateHistoryUI();
requestAnimationFrame(updateViewSlider);

setInterval(() => {
  if(viewMode === "day") render();
}, 60000);
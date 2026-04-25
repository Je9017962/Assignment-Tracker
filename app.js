// ============================================================
//  Assignment & Group Tracker — app.js
// ============================================================

// ── State ────────────────────────────────────────────────────
let authMode = "login";
let assignments = [];
let syllabi = [];
let groups = [];
let currentGroupId = null;
let calendarOffset = 0;

// ── Toast Notifications ──────────────────────────────────────
// Replaces all alert() calls with unobtrusive slide-in toasts.

const TOAST_ICONS = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "ℹ️",
};

/**
 * Show a toast notification.
 * @param {string} message
 * @param {"success"|"error"|"warning"|"info"} [type="info"]
 * @param {number} [duration=3500] ms before auto-dismiss (0 = no auto-dismiss)
 */
function toast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toast-container");

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = TOAST_ICONS[type] || "ℹ️";

  const msg = document.createElement("span");
  msg.className = "toast-msg";
  msg.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.textContent = "✕";
  closeBtn.onclick = () => dismissToast(el);

  el.append(icon, msg, closeBtn);
  container.appendChild(el);

  if (duration > 0) {
    setTimeout(() => dismissToast(el), duration);
  }
}

function dismissToast(el) {
  if (!el.parentNode) return;
  el.classList.add("toast-out");
  el.addEventListener("animationend", () => el.remove(), { once: true });
}

// ── Inline Confirm Dialog ────────────────────────────────────
// Replaces all confirm() calls with a non-blocking in-app dialog.
let _confirmResolve = null;

/**
 * Show an in-app confirm dialog. Returns a Promise<boolean>.
 * @param {string} message
 * @param {string} [title="Are you sure?"]
 * @returns {Promise<boolean>}
 */
function confirmDialog(message, title = "Are you sure?") {
  return new Promise(resolve => {
    _confirmResolve = resolve;
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-msg").textContent = message;
    document.getElementById("confirm-overlay").classList.add("open");
  });
}

function confirmYes() {
  document.getElementById("confirm-overlay").classList.remove("open");
  if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
}

function confirmNo() {
  document.getElementById("confirm-overlay").classList.remove("open");
  if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
}

// ── Utilities ────────────────────────────────────────────────

/**
 * Build a localStorage key namespaced to the current session.
 * @param {string} prefix
 * @returns {string}
 */
function getSessionKey(prefix) {
  const session = localStorage.getItem("session") || "guest";
  return `${prefix}_${session}`;
}

/**
 * Format an ISO date string to a short human-readable label.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Return today's date as an ISO YYYY-MM-DD string.
 * @returns {string}
 */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Navigation ───────────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  const pageMap = { home: "page-home", groups: "page-groups", workspace: "page-workspace" };
  const navMap  = { home: "nav-home", groups: "nav-groups" };

  const pageEl = document.getElementById(pageMap[page]);
  if (pageEl) pageEl.classList.add("active");

  const navEl = navMap[page] ? document.getElementById(navMap[page]) : null;
  if (navEl) navEl.classList.add("active");
}

// ── Theme ────────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function loadTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
}

// ── Auth ─────────────────────────────────────────────────────
function openAuth(mode) {
  authMode = mode;
  document.getElementById("auth-modal").style.display = "flex";
  clearAuthErrors();
  closeForgotPanel();
  updateAuthUI();
}

function closeAuth() {
  document.getElementById("auth-modal").style.display = "none";
  clearAuthErrors();
  closeForgotPanel();
}

function switchAuth() {
  authMode = authMode === "login" ? "signup" : "login";
  clearAuthErrors();
  updateAuthUI();
}

function updateAuthUI() {
  document.getElementById("auth-title").textContent = authMode === "login" ? "Login" : "Sign up";
  document.getElementById("auth-switch").textContent =
    authMode === "login" ? "Create account" : "Already have one? Login";
  document.getElementById("auth-email").style.display = authMode === "signup" ? "block" : "none";
}

/** Show an inline error message inside the auth modal. */
function showAuthError(message) {
  const el = document.getElementById("auth-error");
  el.textContent = "⚠ " + message;
  el.style.display = "flex";
}

function clearAuthErrors() {
  const el = document.getElementById("auth-error");
  if (el) { el.textContent = ""; el.style.display = "none"; }
}

function handleAuth() {
  const user  = document.getElementById("auth-username").value.trim();
  const email = document.getElementById("auth-email").value.trim();
  const pass  = document.getElementById("auth-password").value;

  clearAuthErrors();

  if (!user || !pass) {
    showAuthError("Please fill in all required fields.");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users") || "{}");

  if (authMode === "signup") {
    if (!email)      { showAuthError("Email is required to sign up."); return; }
    if (users[user]) { showAuthError("That username is already taken."); return; }
    users[user] = { password: pass, email };
  } else {
    if (!users[user] || users[user].password !== pass) {
      showAuthError("Invalid username or password.");
      return;
    }
  }

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("session", user);

  updateUserUI();
  loadAllData();
  closeAuth();
  toast(`Welcome, ${user}!`, "success");
}

// ── Forgot password — inline panel (replaces prompt()) ───────
function openForgotPanel() {
  document.getElementById("forgot-panel").classList.add("open");
  document.getElementById("forgot-email-input").value   = "";
  document.getElementById("forgot-newpass-input").value = "";
  const errEl = document.getElementById("forgot-error");
  errEl.textContent = ""; errEl.style.display = "none";
}

function closeForgotPanel() {
  const panel = document.getElementById("forgot-panel");
  if (panel) panel.classList.remove("open");
}

function submitForgotPassword() {
  const email   = document.getElementById("forgot-email-input").value.trim();
  const newPass = document.getElementById("forgot-newpass-input").value;
  const errEl   = document.getElementById("forgot-error");
  errEl.style.display = "none";

  if (!email || !newPass) {
    errEl.textContent = "⚠ Please fill in both fields.";
    errEl.style.display = "flex";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const foundUser = Object.keys(users).find(u => users[u].email === email);

  if (!foundUser) {
    errEl.textContent = "⚠ No account found with that email.";
    errEl.style.display = "flex";
    return;
  }

  users[foundUser].password = newPass;
  localStorage.setItem("users", JSON.stringify(users));
  closeForgotPanel();
  closeAuth();
  toast("Password reset successfully. You can now log in.", "success", 5000);
}

function logout() {
  const name = localStorage.getItem("session");
  localStorage.removeItem("session");
  updateUserUI();
  loadAllData();
  showPage("home");
  toast(`Logged out${name ? " — see you, " + name : ""}.`, "info");
}

function updateUserUI() {
  const session    = localStorage.getItem("session");
  const hasSession = Boolean(session);

  document.getElementById("auth-area").style.display = hasSession ? "none" : "flex";
  document.getElementById("user-area").style.display = hasSession ? "flex"  : "none";

  if (hasSession) {
    document.getElementById("user-name").textContent = session;
  }
}

// ── Assignments ──────────────────────────────────────────────
function loadAssignments() {
  const raw = localStorage.getItem(getSessionKey("assignments"));
  assignments = raw ? JSON.parse(raw) : [];
  renderAssignments();
}

function saveAssignments() {
  localStorage.setItem(getSessionKey("assignments"), JSON.stringify(assignments));
}

function addAssignment() {
  const title  = document.getElementById("assignment-title").value.trim();
  const course = document.getElementById("assignment-course").value.trim();
  const due    = document.getElementById("assignment-due").value;

  if (!title) {
    toast("Please enter an assignment title.", "error");
    document.getElementById("assignment-title").focus();
    return;
  }

  assignments.push({
    id: Date.now().toString(),
    title,
    course,
    due,
    status: "new",
    tasks: [],
  });

  document.getElementById("assignment-title").value  = "";
  document.getElementById("assignment-course").value = "";
  document.getElementById("assignment-due").value    = "";

  saveAssignments();
  renderAssignments();
  toast(`"${title}" added.`, "success", 2500);
}

function changeStatus(id, newStatus) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  a.status = newStatus;
  saveAssignments();
  renderAssignments();
}

async function deleteAssignment(id) {
  const a    = assignments.find(x => x.id === id);
  const name = a ? `"${a.title}"` : "this assignment";
  const ok   = await confirmDialog(`Delete ${name}? This cannot be undone.`, "Delete assignment");
  if (!ok) return;
  assignments = assignments.filter(x => x.id !== id);
  saveAssignments();
  renderAssignments();
  toast(`${name} deleted.`, "info", 2500);
}

function addTaskToAssignment(id, inputEl) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  const label = inputEl.value.trim();
  if (!label) return;
  a.tasks.push({ id: Date.now().toString(), label, done: false });
  inputEl.value = "";
  saveAssignments();
  renderAssignments();
}

function toggleAssignmentTask(id, taskId) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  const t = a.tasks.find(x => x.id === taskId);
  if (!t) return;
  t.done = !t.done;
  saveAssignments();
  renderAssignments();
}

function deleteAssignmentTask(id, taskId) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  a.tasks = a.tasks.filter(x => x.id !== taskId);
  saveAssignments();
  renderAssignments();
}

/**
 * Create and return a single assignment card DOM element.
 * @param {Object} a - assignment object
 * @returns {HTMLElement}
 */
function buildAssignmentCard(a) {
  const card = document.createElement("div");
  card.className = "assignment-card";

  const header = document.createElement("div");
  header.className = "assignment-header";

  const titleEl = document.createElement("div");
  titleEl.className = "assignment-title";
  titleEl.textContent = a.title || "Untitled assignment";

  const statusSelect = document.createElement("select");
  statusSelect.className = "pill-select";
  statusSelect.style.fontSize = "0.75rem";
  statusSelect.innerHTML = `
    <option value="new">New</option>
    <option value="progress">In Progress</option>
    <option value="completed">Completed</option>
  `;
  statusSelect.value = a.status;
  statusSelect.onchange = e => changeStatus(a.id, e.target.value);
  header.append(titleEl, statusSelect);

  const meta = document.createElement("div");
  meta.className = "assignment-meta";

  if (a.course) {
    const courseBadge = document.createElement("span");
    courseBadge.className = "badge";
    courseBadge.textContent = a.course;
    meta.appendChild(courseBadge);
  }

  if (a.due) {
    const dueBadge = document.createElement("span");
    dueBadge.className = "badge badge-due";
    dueBadge.textContent = "Due " + formatDateLabel(a.due);
    meta.appendChild(dueBadge);
  }

  const footer = document.createElement("div");
  footer.className = "assignment-footer";

  const doneCount = a.tasks.filter(t => t.done).length;
  const tasksPill = document.createElement("div");
  tasksPill.className = "tasks-pill";
  tasksPill.innerHTML = `Tasks <span>${doneCount}/${a.tasks.length}</span>`;

  const btnDelete = document.createElement("button");
  btnDelete.className = "btn-xs";
  btnDelete.textContent = "Delete";
  btnDelete.onclick = () => deleteAssignment(a.id);

  const actions = document.createElement("div");
  actions.className = "assignment-actions";
  actions.appendChild(btnDelete);

  footer.append(tasksPill, actions);

  const tasksList = document.createElement("div");
  tasksList.className = "tasks-list";

  if (a.tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No tasks yet. Break this assignment into steps.";
    tasksList.appendChild(empty);
  } else {
    a.tasks.forEach(t => {
      const row = document.createElement("div");
      row.className = "task-row";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = t.done;
      cb.onchange = () => toggleAssignmentTask(a.id, t.id);

      const labelEl = document.createElement("span");
      labelEl.textContent = t.label;
      if (t.done) labelEl.classList.add("done");

      const delBtn = document.createElement("button");
      delBtn.className = "task-delete";
      delBtn.textContent = "✕";
      delBtn.onclick = () => deleteAssignmentTask(a.id, t.id);

      row.append(cb, labelEl, delBtn);
      tasksList.appendChild(row);
    });
  }

  const taskInputRow = document.createElement("div");
  taskInputRow.className = "task-input-row";

  const taskInput = document.createElement("input");
  taskInput.placeholder = "Add a task (e.g., outline, research, draft)...";
  taskInput.onkeydown = e => {
    if (e.key === "Enter") { e.preventDefault(); addTaskToAssignment(a.id, taskInput); }
  };

  const taskBtn = document.createElement("button");
  taskBtn.className = "btn-xs";
  taskBtn.textContent = "+ Task";
  taskBtn.onclick = () => addTaskToAssignment(a.id, taskInput);

  taskInputRow.append(taskInput, taskBtn);
  card.append(header, meta, footer, tasksList, taskInputRow);
  return card;
}

function renderAssignments() {
  const colNew       = document.getElementById("col-new");
  const colProgress  = document.getElementById("col-progress");
  const colCompleted = document.getElementById("col-completed");

  colNew.innerHTML = colProgress.innerHTML = colCompleted.innerHTML = "";
  let countNew = 0, countProgress = 0, countCompleted = 0;

  assignments.forEach(a => {
    const card = buildAssignmentCard(a);
    if (a.status === "new")           { colNew.appendChild(card);       countNew++; }
    else if (a.status === "progress") { colProgress.appendChild(card);  countProgress++; }
    else                              { colCompleted.appendChild(card); countCompleted++; }
  });

  document.getElementById("count-new").textContent       = countNew;
  document.getElementById("count-progress").textContent  = countProgress;
  document.getElementById("count-completed").textContent = countCompleted;
}

// ── Syllabi ──────────────────────────────────────────────────
function loadSyllabi() {
  const raw = localStorage.getItem(getSessionKey("syllabi"));
  syllabi = raw ? JSON.parse(raw) : [];
  renderSyllabi();
}

function saveSyllabi() {
  localStorage.setItem(getSessionKey("syllabi"), JSON.stringify(syllabi));
}

function uploadSyllabus() {
  const input = document.getElementById("syllabus-file");
  if (!input.files || input.files.length === 0) {
    toast("Choose a syllabus file first.", "warning");
    return;
  }
  const file = input.files[0];
  syllabi.push({
    id: Date.now().toString(),
    name: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  });
  input.value = "";
  saveSyllabi();
  renderSyllabi();
  toast(`"${file.name}" uploaded.`, "success", 2500);
}

function renderSyllabi() {
  const list = document.getElementById("syllabus-list");
  list.innerHTML = "";

  if (syllabi.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No syllabi uploaded yet.";
    list.appendChild(empty);
    return;
  }

  syllabi.forEach(s => {
    const item = document.createElement("div");
    item.className = "syllabus-item";

    const left = document.createElement("div");
    left.style.cssText = "display:flex;flex-direction:column;gap:2px;";

    const name = document.createElement("div");
    name.className = "syllabus-name";
    name.textContent = s.name;

    const meta = document.createElement("div");
    meta.className = "syllabus-meta";
    meta.textContent = Math.round(s.size / 1024) + " KB";

    left.append(name, meta);

    const btn = document.createElement("button");
    btn.className = "btn-xs";
    btn.textContent = "Remove";
    btn.onclick = async () => {
      const ok = await confirmDialog(`Remove "${s.name}" from your list?`, "Remove syllabus");
      if (!ok) return;
      syllabi = syllabi.filter(x => x.id !== s.id);
      saveSyllabi();
      renderSyllabi();
      toast(`"${s.name}" removed.`, "info", 2500);
    };

    item.append(left, btn);
    list.appendChild(item);
  });
}

function generateCalendarFromSyllabus() {
  if (syllabi.length === 0) {
    toast("Upload at least one syllabus first.", "warning");
    return;
  }
  // TODO: implement AI-powered calendar generation
  toast("Calendar generation is coming soon!", "info");
}

// ── Groups ───────────────────────────────────────────────────
function loadGroups() {
  const raw = localStorage.getItem(getSessionKey("groups"));
  groups = raw ? JSON.parse(raw) : [];
  renderGroups();
}

function saveGroups() {
  localStorage.setItem(getSessionKey("groups"), JSON.stringify(groups));
}

function createGroup() {
  const name = document.getElementById("group-name").value.trim();
  if (!name) {
    toast("Enter a group name.", "error");
    document.getElementById("group-name").focus();
    return;
  }
  const code = "GRP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  groups.push({ id: Date.now().toString(), name, code, desc: "", tasks: [], notes: "", files: [] });
  document.getElementById("group-name").value = "";
  saveGroups();
  renderGroups();
  toast(`Group "${name}" created — code: ${code}`, "success", 7000);
}

function joinGroup() {
  const code = document.getElementById("group-code-join").value.trim().toUpperCase();
  if (!code) {
    toast("Enter a group code.", "error");
    document.getElementById("group-code-join").focus();
    return;
  }
  if (groups.find(g => g.code.toUpperCase() === code)) {
    toast("You already have a group with that code.", "warning");
  } else {
    groups.push({ id: Date.now().toString(), name: "Joined group", code, desc: "", tasks: [], notes: "", files: [] });
    saveGroups();
    renderGroups();
    toast(`Joined group ${code}.`, "success", 2500);
  }
  document.getElementById("group-code-join").value = "";
}

function renderGroups() {
  const list = document.getElementById("group-list");
  list.innerHTML = "";

  if (groups.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No groups yet. Create one or join with a code.";
    list.appendChild(empty);
    return;
  }

  groups.forEach(g => {
    const item = document.createElement("div");
    item.className = "group-item";

    const left = document.createElement("div");
    left.style.cssText = "display:flex;flex-direction:column;gap:2px;";

    const nameEl = document.createElement("div");
    nameEl.className = "group-name";
    nameEl.textContent = g.name;

    const codeEl = document.createElement("div");
    codeEl.className = "group-code";
    codeEl.textContent = g.code;

    left.append(nameEl, codeEl);

    const right = document.createElement("div");
    right.style.cssText = "display:flex;gap:4px;";

    const btnEnter = document.createElement("button");
    btnEnter.className = "btn-xs";
    btnEnter.textContent = "Enter workspace";
    btnEnter.onclick = () => openWorkspace(g.id);

    const btnRemove = document.createElement("button");
    btnRemove.className = "btn-xs";
    btnRemove.textContent = "Remove";
    btnRemove.onclick = async () => {
      const ok = await confirmDialog(`Remove "${g.name}" from your list?`, "Remove group");
      if (!ok) return;
      groups = groups.filter(x => x.id !== g.id);
      saveGroups();
      renderGroups();
      toast(`"${g.name}" removed.`, "info", 2500);
    };

    right.append(btnEnter, btnRemove);
    item.append(left, right);
    list.appendChild(item);
  });
}

// ── Workspace ────────────────────────────────────────────────
function openWorkspace(groupId) {
  currentGroupId = groupId;
  const g = groups.find(x => x.id === groupId);
  if (!g) return;

  document.getElementById("ws-group-name").textContent = g.name;
  document.getElementById("ws-group-code").textContent = g.code || "";
  document.getElementById("ws-group-desc").textContent =
    g.desc || "Group tasks, notes, files, and calendar for this project.";
  document.getElementById("ws-notes").value = g.notes || "";

  renderWorkspaceTasks();
  renderWorkspaceFiles();
  renderCalendar();
  showPage("workspace");
}

function leaveWorkspace() {
  currentGroupId = null;
  showPage("groups");
}

async function removeCurrentGroup() {
  if (!currentGroupId) return;
  const g    = groups.find(x => x.id === currentGroupId);
  const name = g ? `"${g.name}"` : "this group";
  const ok   = await confirmDialog(`Remove ${name} from your local list?`, "Remove group");
  if (!ok) return;
  groups = groups.filter(x => x.id !== currentGroupId);
  saveGroups();
  currentGroupId = null;
  showPage("groups");
  renderGroups();
  toast(`${name} removed.`, "info", 2500);
}

// ── Workspace Tabs ───────────────────────────────────────────
function switchWorkspaceTab(tab) {
  document.querySelectorAll(".workspace-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".workspace-section").forEach(s => s.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  document.getElementById(`ws-section-${tab}`).classList.add("active");
  if (tab === "calendar") renderCalendar();
}

// ── Workspace Tasks ──────────────────────────────────────────
function addWorkspaceTask() {
  if (!currentGroupId) return;
  const g = groups.find(x => x.id === currentGroupId);
  if (!g) return;

  const title = document.getElementById("ws-task-title").value.trim();
  const owner = document.getElementById("ws-task-owner").value.trim();
  const due   = document.getElementById("ws-task-due").value;

  if (!title) {
    toast("Enter a task title.", "error");
    document.getElementById("ws-task-title").focus();
    return;
  }

  g.tasks.push({ id: Date.now().toString(), title, owner, due, done: false });

  document.getElementById("ws-task-title").value = "";
  document.getElementById("ws-task-owner").value = "";
  document.getElementById("ws-task-due").value   = "";

  saveGroups();
  renderWorkspaceTasks();
  renderCalendar();
  toast(`Task "${title}" added.`, "success", 2000);
}

function toggleWorkspaceTask(taskId) {
  if (!currentGroupId) return;
  const g = groups.find(x => x.id === currentGroupId);
  if (!g) return;
  const t = g.tasks.find(x => x.id === taskId);
  if (!t) return;
  t.done = !t.done;
  saveGroups();
  renderWorkspaceTasks();
  renderCalendar();
}

function deleteWorkspaceTask(taskId) {
  if (!currentGroupId) return;
  const g = groups.find(x => x.id === currentGroupId);
  if (!g) return;
  g.tasks = g.tasks.filter(x => x.id !== taskId);
  saveGroups();
  renderWorkspaceTasks();
  renderCalendar();
}

function renderWorkspaceTasks() {
  const list = document.getElementById("ws-task-list");
  list.innerHTML = "";

  if (!currentGroupId) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No group selected.";
    list.appendChild(empty);
    return;
  }

  const g = groups.find(x => x.id === currentGroupId);
  if (!g || g.tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No tasks yet. Add tasks for this group project.";
    list.appendChild(empty);
    return;
  }

  g.tasks.forEach(t => {
    const item = document.createElement("div");
    item.className = "ws-task-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.done;
    cb.onchange = () => toggleWorkspaceTask(t.id);

    const main = document.createElement("div");
    main.className = "ws-task-main";

    const titleEl = document.createElement("div");
    titleEl.className = "ws-task-title";
    titleEl.textContent = t.title;
    if (t.done) titleEl.classList.add("done");

    const parts = [];
    if (t.owner) parts.push("Owner: " + t.owner);
    if (t.due)   parts.push("Due: " + formatDateLabel(t.due));

    main.appendChild(titleEl);

    if (parts.length) {
      const meta = document.createElement("div");
      meta.className = "ws-task-meta";
      meta.textContent = parts.join(" • ");
      main.appendChild(meta);
    }

    const del = document.createElement("button");
    del.className = "btn-xs";
    del.textContent = "Delete";
    del.onclick = () => deleteWorkspaceTask(t.id);

    item.append(cb, main, del);
    list.appendChild(item);
  });
}

// ── Workspace Notes (debounced auto-save) ────────────────────
const notesDebounce = { timer: null };

document.addEventListener("input", e => {
  if (e.target.id !== "ws-notes" || !currentGroupId) return;
  clearTimeout(notesDebounce.timer);
  notesDebounce.timer = setTimeout(() => {
    const g = groups.find(x => x.id === currentGroupId);
    if (g) { g.notes = e.target.value; saveGroups(); }
  }, 400);
});

// ── Workspace Files ──────────────────────────────────────────
function uploadWorkspaceFile() {
  if (!currentGroupId) return;
  const g = groups.find(x => x.id === currentGroupId);
  if (!g) return;

  const input = document.getElementById("ws-file-input");
  if (!input.files || input.files.length === 0) {
    toast("Choose a file first.", "warning");
    return;
  }

  const file = input.files[0];
  g.files.push({
    id: Date.now().toString(),
    name: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  });

  input.value = "";
  saveGroups();
  renderWorkspaceFiles();
  toast(`"${file.name}" uploaded.`, "success", 2500);
}

function deleteWorkspaceFile(fileId) {
  if (!currentGroupId) return;
  const g = groups.find(x => x.id === currentGroupId);
  if (!g) return;
  g.files = g.files.filter(x => x.id !== fileId);
  saveGroups();
  renderWorkspaceFiles();
}

function renderWorkspaceFiles() {
  const list = document.getElementById("ws-file-list");
  list.innerHTML = "";

  if (!currentGroupId) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No group selected.";
    list.appendChild(empty);
    return;
  }

  const g = groups.find(x => x.id === currentGroupId);
  if (!g || g.files.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No files yet. Upload files for this group.";
    list.appendChild(empty);
    return;
  }

  g.files.forEach(f => {
    const item = document.createElement("div");
    item.className = "ws-file-item";

    const left = document.createElement("div");
    left.style.cssText = "display:flex;flex-direction:column;gap:2px;";

    const nameEl = document.createElement("div");
    nameEl.className = "ws-file-name";
    nameEl.textContent = f.name;

    const meta = document.createElement("div");
    meta.className = "ws-file-meta";
    meta.textContent = Math.round(f.size / 1024) + " KB";

    left.append(nameEl, meta);

    const btn = document.createElement("button");
    btn.className = "btn-xs";
    btn.textContent = "Remove";
    btn.onclick = () => deleteWorkspaceFile(f.id);

    item.append(left, btn);
    list.appendChild(item);
  });
}

// ── Calendar ─────────────────────────────────────────────────
function changeCalendarMonth(delta) { calendarOffset += delta; renderCalendar(); }
function resetCalendarMonth() { calendarOffset = 0; renderCalendar(); }

function renderCalendar() {
  const grid  = document.getElementById("calendar-grid");
  const label = document.getElementById("cal-month-label");
  grid.innerHTML = "";

  const base = new Date();
  base.setMonth(base.getMonth() + calendarOffset);
  base.setDate(1);

  const month = base.getMonth();
  const year  = base.getFullYear();

  label.textContent = base.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const startDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const today        = new Date();
  const todayISODate = today.toISOString().slice(0, 10);

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => {
    const h = document.createElement("div");
    h.className = "calendar-day-header";
    h.textContent = d;
    grid.appendChild(h);
  });

  for (let i = 0; i < startDay; i++) {
    grid.appendChild(Object.assign(document.createElement("div"), { className: "calendar-cell" }));
  }

  const events = [];

  if (currentGroupId) {
    const g = groups.find(x => x.id === currentGroupId);
    if (g) {
      g.tasks.forEach(t => {
        if (!t.due) return;
        const d = new Date(t.due);
        if (d.getMonth() === month && d.getFullYear() === year) {
          events.push({ date: t.due, label: t.title, done: t.done });
        }
      });
    }
  }

  syllabi.forEach(s => {
    const d = new Date(s.uploadedAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      events.push({ date: d.toISOString().slice(0, 10), label: "Syllabus: " + s.name, done: false });
    }
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const dateLabel = document.createElement("div");
    dateLabel.className = "calendar-date";
    dateLabel.textContent = day;
    cell.appendChild(dateLabel);

    const dateISO = new Date(year, month, day).toISOString().slice(0, 10);
    if (dateISO === todayISODate) dateLabel.style.textDecoration = "underline";

    events.filter(e => e.date === dateISO).forEach(e => {
      const ev = document.createElement("div");
      ev.className = "calendar-event";
      ev.textContent = e.label;
      const diffDays = Math.floor((new Date(e.date) - today) / 86400000);
      if (e.done)             ev.classList.add("event-completed");
      else if (diffDays < 0)  ev.classList.add("event-overdue");
      else if (diffDays <= 2) ev.classList.add("event-soon");
      else                    ev.classList.add("event-upcoming");
      cell.appendChild(ev);
    });

    grid.appendChild(cell);
  }
}

// ── Bootstrap ────────────────────────────────────────────────
function loadAllData() {
  loadAssignments();
  loadSyllabi();
  loadGroups();
  if (currentGroupId) openWorkspace(currentGroupId);
}

loadTheme();
updateUserUI();
loadAllData();
updateAuthUI();

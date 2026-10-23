/* AEGIS SWARM: synthetic demo only; no backend or network requests. */
(function (root) {
  'use strict';

  const priorityOrder = {high: 0, medium: 1, low: 2};
  const statusOrder = ['completed', 'running', 'queued', 'blocked'];
  const roles = ['Architect', 'Developer', 'UI/UX', 'QA'];

  function filterTasks(tasks, {query = '', status = 'all', role = 'all', sort = 'id'} = {}) {
    const needle = String(query).trim().toLowerCase();
    const result = tasks.filter(task =>
      (status === 'all' || task.status === status) &&
      (role === 'all' || task.role === role) &&
      (!needle || [task.id, task.title, task.role].some(value => String(value).toLowerCase().includes(needle)))
    );
    return result.sort((a, b) => {
      const byPriority = sort === 'priority'
        ? (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
        : 0;
      return byPriority || String(a.id).localeCompare(String(b.id));
    });
  }

  function calculateMetrics(tasks) {
    const metrics = {total: tasks.length, running: 0, completed: 0, queued: 0, blocked: 0, completionRate: 0};
    for (const task of tasks) {
      if (statusOrder.includes(task.status)) metrics[task.status] += 1;
    }
    metrics.completionRate = metrics.total ? Math.round(100 * metrics.completed / metrics.total) : 0;
    return metrics;
  }

  function buildExport(tasks) {
    return {demo: true, tasks: tasks.map(task => ({...task}))};
  }

  const api = {filterTasks, calculateMetrics, buildExport};
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  window.AegisDashboard = api;

  function initialize() {
    const tasks = Array.isArray(root.AEGIS_DEMO_TASKS) ? root.AEGIS_DEMO_TASKS : [];
    const byId = id => document.getElementById(id);
    const controls = {
      search: byId('search-input'), status: byId('status-filter'),
      role: byId('role-filter'), sort: byId('sort-select')
    };
    const taskList = byId('task-list');
    const dialog = byId('task-dialog');
    const toast = byId('toast');
    let filtered = [];
    let toastTimer;
    let lastDialogTrigger;

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = String(text);
      return node;
    }

    function showToast(message) {
      window.clearTimeout(toastTimer);
      toast.textContent = message;
      toast.hidden = false;
      toast.classList.add('is-visible');
      toastTimer = window.setTimeout(() => {
        toast.classList.remove('is-visible');
        toast.hidden = true;
      }, 4200);
    }

    function setTheme(theme, persist) {
      document.documentElement.dataset.theme = theme;
      const toggle = byId('theme-toggle');
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      toggle.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      const label = toggle.querySelector('[data-theme-label]');
      if (label) label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
      if (persist) {
        try { window.localStorage.setItem('aegis-theme', theme); }
        catch (_) { showToast('Theme changed for this view. Browser storage is unavailable.'); }
      }
    }

    let savedTheme;
    try { savedTheme = window.localStorage.getItem('aegis-theme'); }
    catch (_) { savedTheme = null; }
    setTheme(savedTheme === 'dark' ? 'dark' : 'light', false);
    byId('theme-toggle').addEventListener('click', () => {
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });

    function openDetails(task, trigger) {
      const content = byId('dialog-content');
      content.replaceChildren();
      const heading = element('h2', 'detail-heading', task.title);
      heading.id = 'task-detail-title';
      content.append(heading);
      dialog.setAttribute('aria-labelledby', heading.id);
      const list = element('dl', 'detail-grid');
      for (const [label, value] of [
        ['Task ID', task.id], ['Owner', task.role], ['Status', task.status],
        ['Priority', task.priority], ['Duration', `${task.duration} minutes`]
      ]) {
        const field = element('div', 'detail-field');
        field.append(element('dt', '', label), element('dd', '', value));
        list.append(field);
      }
      content.append(list, element('p', 'detail-demo-note', 'Synthetic demo task. No live agent session is connected.'));
      lastDialogTrigger = trigger;
      dialog.showModal();
    }

    byId('close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if (lastDialogTrigger && lastDialogTrigger.isConnected) lastDialogTrigger.focus();
    });

    function renderTable() {
      const fragment = document.createDocumentFragment();
      for (const task of filtered) {
        const row = element('tr', 'task-row');
        row.dataset.taskId = task.id;
        row.append(element('td', 'task-id', task.id), element('td', 'task-title', task.title), element('td', 'task-role', task.role));
        const statusCell = element('td');
        statusCell.append(element('span', `status-badge status-${task.status}`, task.status));
        const priorityCell = element('td');
        priorityCell.append(element('span', `priority-badge priority-${task.priority}`, task.priority));
        row.append(statusCell, priorityCell, element('td', 'duration-cell', `${task.duration} min`));
        const actionCell = element('td');
        const button = element('button', 'detail-btn', 'Details');
        button.type = 'button';
        button.setAttribute('aria-label', `View details for ${task.id}`);
        button.addEventListener('click', () => openDetails(task, button));
        actionCell.append(button);
        row.append(actionCell);
        fragment.append(row);
      }
      taskList.replaceChildren(fragment);
      byId('empty-state').hidden = filtered.length !== 0;
      byId('result-count').textContent = `${filtered.length} of ${tasks.length} demo tasks`;
    }

    function renderMetrics(metrics) {
      for (const key of ['total', 'running', 'completed', 'blocked']) byId(`metric-${key}`).textContent = metrics[key];
      byId('metric-completion').textContent = `${metrics.completionRate}%`;
      const chart = byId('status-chart');
      const colors = {completed: '#a9cc47', running: '#389d98', queued: '#abb4ba', blocked: '#d18465'};
      let cursor = 0;
      const segments = statusOrder.map(status => {
        const start = cursor;
        cursor += metrics.total ? metrics[status] / metrics.total * 100 : 0;
        return `${colors[status]} ${start}% ${cursor}%`;
      });
      chart.style.background = metrics.total ? `conic-gradient(${segments.join(', ')})` : 'var(--border, #d4d8d2)';
      chart.setAttribute('role', 'img');
      chart.setAttribute('aria-label', `Filtered task status: ${metrics.completed} completed, ${metrics.running} running, ${metrics.queued} queued, ${metrics.blocked} blocked.`);
      const center = element('div', 'chart-center');
      center.append(element('span', 'chart-value', `${metrics.completionRate}%`), element('span', 'chart-label', 'completed'));
      chart.replaceChildren(center);
      for (const status of statusOrder) {
        const count = byId(`count-${status}`);
        if (count) count.textContent = metrics[status];
      }
      const bars = document.createDocumentFragment();
      for (const role of roles) {
        const count = filtered.filter(task => task.role === role).length;
        const row = element('div', 'role-bar-row');
        const track = element('div', 'role-bar-track');
        const fill = element('div', 'role-bar-fill');
        fill.style.width = `${metrics.total ? count / metrics.total * 100 : 0}%`;
        track.append(fill);
        row.append(element('span', 'role-bar-label', role), track, element('span', 'role-bar-value', count));
        row.setAttribute('aria-label', `${role}: ${count} of ${metrics.total} filtered tasks`);
        bars.append(row);
      }
      byId('role-bars').replaceChildren(bars);
    }

    function renderActivity() {
      const items = filtered.filter(task => task.status === 'completed' || task.status === 'running').slice(-4).reverse();
      const fragment = document.createDocumentFragment();
      if (!items.length) fragment.append(element('li', 'activity-empty', 'No demo activity matches these filters.'));
      for (const task of items) {
        const item = element('li', 'activity-item');
        const dot = element('span', `activity-dot status-${task.status}`);
        dot.setAttribute('aria-hidden', 'true');
        const body = element('div', 'activity-body');
        body.append(element('p', 'activity-title', task.title), element('p', 'activity-meta', `${task.role} · ${task.id} · ${task.status} · demo fixture`));
        item.append(dot, body);
        fragment.append(item);
      }
      byId('activity-list').replaceChildren(fragment);
    }

    function render() {
      filtered = filterTasks(tasks, {query: controls.search.value, status: controls.status.value, role: controls.role.value, sort: controls.sort.value});
      renderTable();
      renderMetrics(calculateMetrics(filtered));
      renderActivity();
    }

    controls.search.addEventListener('input', render);
    for (const control of [controls.status, controls.role, controls.sort]) control.addEventListener('change', render);
    function resetFilters() {
      controls.search.value = '';
      controls.status.value = 'all';
      controls.role.value = 'all';
      controls.sort.value = 'id';
      render();
    }
    byId('reset-filters').addEventListener('click', resetFilters);
    for (const reset of document.querySelectorAll('[data-reset-filters]')) reset.addEventListener('click', resetFilters);

    byId('export-btn').addEventListener('click', () => {
      if (!filtered.length) {
        showToast('No demo tasks match your filters. Reset filters to export tasks.');
        return;
      }
      const blob = new Blob([JSON.stringify(buildExport(filtered), null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const link = element('a');
      link.href = url;
      link.download = 'aegis-swarm-tasks.json';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Exported ${filtered.length} synthetic demo tasks.`);
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
})(typeof globalThis !== 'undefined' ? globalThis : this);

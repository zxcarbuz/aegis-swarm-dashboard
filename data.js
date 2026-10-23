/* Deterministic synthetic demo fixtures. No live agent or runtime data. */
(function (root) {
  'use strict';
  const tasks = [
    {id: 'SW-101', title: 'Define acceptance criteria', role: 'Architect', status: 'completed', priority: 'high', duration: 12},
    {id: 'SW-102', title: 'Build task data model', role: 'Developer', status: 'completed', priority: 'high', duration: 38},
    {id: 'SW-103', title: 'Design dashboard layout', role: 'UI/UX', status: 'completed', priority: 'medium', duration: 24},
    {id: 'SW-104', title: 'Implement filter pipeline', role: 'Developer', status: 'running', priority: 'high', duration: 18},
    {id: 'SW-105', title: 'Refine responsive states', role: 'UI/UX', status: 'running', priority: 'medium', duration: 15},
    {id: 'SW-106', title: 'Verify export behavior', role: 'QA', status: 'running', priority: 'high', duration: 9},
    {id: 'SW-107', title: 'Add integration checks', role: 'Developer', status: 'queued', priority: 'medium', duration: 0},
    {id: 'SW-108', title: 'Audit keyboard navigation', role: 'QA', status: 'queued', priority: 'high', duration: 0},
    {id: 'SW-109', title: 'Review release decision', role: 'Architect', status: 'blocked', priority: 'high', duration: 4},
    {id: 'SW-110', title: 'Complete token palette', role: 'UI/UX', status: 'completed', priority: 'low', duration: 16},
    {id: 'SW-111', title: 'Wire task detail dialog', role: 'Developer', status: 'completed', priority: 'low', duration: 21},
    {id: 'SW-112', title: 'Validate fixture integrity', role: 'QA', status: 'completed', priority: 'medium', duration: 11}
  ];
  root.AEGIS_DEMO_TASKS = tasks;
  if (typeof module === 'object' && module.exports) module.exports = tasks;
})(typeof globalThis !== 'undefined' ? globalThis : this);

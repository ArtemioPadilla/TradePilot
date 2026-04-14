import type { DashboardWidget } from './types';

const widgets = new Map<string, DashboardWidget>();

export function registerWidget(widget: DashboardWidget): void {
  if (widgets.has(widget.id)) {
    console.warn(`[widget-registry] widget "${widget.id}" already registered, overwriting`);
  }
  widgets.set(widget.id, widget);
}

export function getWidget(id: string): DashboardWidget | undefined {
  return widgets.get(id);
}

export function listWidgets(): DashboardWidget[] {
  return Array.from(widgets.values());
}

export function getWidgetsByCategory(category: DashboardWidget['category']): DashboardWidget[] {
  return Array.from(widgets.values()).filter((w) => w.category === category);
}

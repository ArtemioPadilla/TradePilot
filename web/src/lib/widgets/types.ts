import type { ComponentType } from 'react';

export interface WidgetProps {
  width: number;
  height: number;
  isEditing: boolean;
}

export interface WidgetSize {
  cols: number;
  rows: number;
}

export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  component: ComponentType<WidgetProps>;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  category: 'portfolio' | 'trading' | 'analytics' | 'social';
}

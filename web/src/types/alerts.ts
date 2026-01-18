/**
 * Alert Types
 *
 * Type definitions for the alerts and notifications system.
 */

/**
 * Alert type categories
 */
export type AlertType =
  | 'price_above'
  | 'price_below'
  | 'price_crosses'
  | 'percent_change'
  | 'portfolio_value'
  | 'position_gain'
  | 'position_loss'
  | 'drawdown'
  | 'rebalance_due'
  | 'trade_executed'
  | 'custom';

/**
 * Alert status
 */
export type AlertStatus = 'active' | 'triggered' | 'disabled' | 'expired';

/**
 * Condition operators for alerts
 */
export type ConditionOperator =
  | 'greater_than'
  | 'less_than'
  | 'equals'
  | 'crosses_above'
  | 'crosses_below'
  | 'percent_increase'
  | 'percent_decrease';

/**
 * Notification channels
 */
export type NotificationChannel = 'push' | 'email' | 'in_app';

/**
 * Alert frequency (how often to check/notify)
 */
export type AlertFrequency = 'once' | 'every_time' | 'daily_digest';

/**
 * Base alert condition
 */
export interface AlertCondition {
  /** Condition operator */
  operator: ConditionOperator;
  /** Target value for comparison */
  targetValue: number;
  /** Current value when last checked */
  currentValue?: number;
  /** Reference value for crosses conditions */
  referenceValue?: number;
}

/**
 * Price alert configuration
 */
export interface PriceAlertConfig {
  type: 'price_above' | 'price_below' | 'price_crosses';
  /** Stock symbol */
  symbol: string;
  /** Target price */
  targetPrice: number;
  /** Last known price */
  lastPrice?: number;
}

/**
 * Percent change alert configuration
 */
export interface PercentChangeAlertConfig {
  type: 'percent_change';
  /** Stock symbol */
  symbol: string;
  /** Percentage threshold (positive or negative) */
  percentThreshold: number;
  /** Time period for change calculation */
  period: 'day' | 'week' | 'month';
}

/**
 * Portfolio value alert configuration
 */
export interface PortfolioAlertConfig {
  type: 'portfolio_value' | 'drawdown';
  /** Comparison operator */
  operator: 'greater_than' | 'less_than';
  /** Target value or percentage */
  targetValue: number;
  /** Whether value is a percentage */
  isPercentage?: boolean;
}

/**
 * Position alert configuration
 */
export interface PositionAlertConfig {
  type: 'position_gain' | 'position_loss';
  /** Stock symbol */
  symbol: string;
  /** Percentage threshold */
  percentThreshold: number;
}

/**
 * Rebalance alert configuration
 */
export interface RebalanceAlertConfig {
  type: 'rebalance_due';
  /** Days before rebalance to alert */
  daysBefore: number;
  /** Strategy ID */
  strategyId?: string;
}

/**
 * Trade executed alert configuration
 */
export interface TradeAlertConfig {
  type: 'trade_executed';
  /** Filter by symbol (optional) */
  symbol?: string;
  /** Filter by side (optional) */
  side?: 'buy' | 'sell' | 'both';
}

/**
 * Custom alert configuration
 */
export interface CustomAlertConfig {
  type: 'custom';
  /** Custom condition expression */
  expression: string;
  /** Variables used in expression */
  variables: Record<string, string>;
}

/**
 * Union type for all alert configurations
 */
export type AlertConfig =
  | PriceAlertConfig
  | PercentChangeAlertConfig
  | PortfolioAlertConfig
  | PositionAlertConfig
  | RebalanceAlertConfig
  | TradeAlertConfig
  | CustomAlertConfig;

/**
 * Alert definition
 */
export interface Alert {
  /** Unique identifier */
  id: string;
  /** User ID who owns this alert */
  userId: string;
  /** Alert name */
  name: string;
  /** Alert description */
  description?: string;
  /** Alert type */
  type: AlertType;
  /** Alert configuration */
  config: AlertConfig;
  /** Current status */
  status: AlertStatus;
  /** Notification channels */
  channels: NotificationChannel[];
  /** Alert frequency */
  frequency: AlertFrequency;
  /** Whether alert is enabled */
  enabled: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Last checked timestamp */
  lastCheckedAt?: Date;
  /** Last triggered timestamp */
  lastTriggeredAt?: Date;
  /** Number of times triggered */
  triggerCount: number;
  /** Expiration date (optional) */
  expiresAt?: Date;
  /** Tags for organization */
  tags: string[];
}

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Notification definition
 */
export interface Notification {
  /** Unique identifier */
  id: string;
  /** User ID */
  userId: string;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Severity level */
  severity: NotificationSeverity;
  /** Related alert ID (if from an alert) */
  alertId?: string;
  /** Link to navigate to */
  link?: string;
  /** Whether notification has been read */
  read: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Read timestamp */
  readAt?: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  /** Enable push notifications */
  pushEnabled: boolean;
  /** Enable email notifications */
  emailEnabled: boolean;
  /** Enable in-app notifications */
  inAppEnabled: boolean;
  /** Quiet hours start (24h format, e.g., "22:00") */
  quietHoursStart?: string;
  /** Quiet hours end (24h format, e.g., "08:00") */
  quietHoursEnd?: string;
  /** Email digest frequency */
  emailDigestFrequency: 'none' | 'daily' | 'weekly';
  /** Notification type preferences */
  typePreferences: {
    [key in AlertType]?: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
  };
}

/**
 * Alert trigger event
 */
export interface AlertTriggerEvent {
  /** Alert that was triggered */
  alertId: string;
  /** Trigger timestamp */
  triggeredAt: Date;
  /** Value that triggered the alert */
  triggerValue: number;
  /** Condition that was met */
  condition: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  inAppEnabled: true,
  emailDigestFrequency: 'daily',
  typePreferences: {},
};

/**
 * Alert type display info
 */
export const ALERT_TYPE_INFO: Record<AlertType, { label: string; description: string; icon: string }> = {
  price_above: {
    label: 'Price Above',
    description: 'Alert when price rises above a target',
    icon: 'trending-up',
  },
  price_below: {
    label: 'Price Below',
    description: 'Alert when price falls below a target',
    icon: 'trending-down',
  },
  price_crosses: {
    label: 'Price Crosses',
    description: 'Alert when price crosses a target (either direction)',
    icon: 'repeat',
  },
  percent_change: {
    label: 'Percent Change',
    description: 'Alert on significant price movement',
    icon: 'percent',
  },
  portfolio_value: {
    label: 'Portfolio Value',
    description: 'Alert on portfolio value changes',
    icon: 'briefcase',
  },
  position_gain: {
    label: 'Position Gain',
    description: 'Alert when a position gains value',
    icon: 'arrow-up-circle',
  },
  position_loss: {
    label: 'Position Loss',
    description: 'Alert when a position loses value',
    icon: 'arrow-down-circle',
  },
  drawdown: {
    label: 'Drawdown',
    description: 'Alert on portfolio drawdown',
    icon: 'alert-triangle',
  },
  rebalance_due: {
    label: 'Rebalance Due',
    description: 'Reminder when rebalancing is due',
    icon: 'calendar',
  },
  trade_executed: {
    label: 'Trade Executed',
    description: 'Notify when trades are executed',
    icon: 'check-circle',
  },
  custom: {
    label: 'Custom',
    description: 'Custom alert condition',
    icon: 'settings',
  },
};

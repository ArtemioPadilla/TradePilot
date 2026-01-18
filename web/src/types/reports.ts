/**
 * Reports & Export Types
 *
 * Type definitions for reporting, export, and goal tracking features.
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// Export Types
// ============================================================================

/**
 * Supported export formats
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Exportable data types
 */
export type ExportDataType =
  | 'holdings'
  | 'transactions'
  | 'portfolio_snapshot'
  | 'performance'
  | 'tax_lots';

/**
 * Export request configuration
 */
export interface ExportRequest {
  dataType: ExportDataType;
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  accountIds?: string[];
  includeHeaders?: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  data?: string;
  filename: string;
  mimeType: string;
  rowCount: number;
  error?: string;
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Report types available for generation
 */
export type ReportType =
  | 'portfolio_summary'
  | 'performance'
  | 'holdings_detail'
  | 'transaction_history'
  | 'tax_summary'
  | 'goal_progress';

/**
 * Report status
 */
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * Report request
 */
export interface ReportRequest {
  type: ReportType;
  dateRange: {
    start: Date;
    end: Date;
  };
  accountIds?: string[];
  options?: Record<string, unknown>;
}

/**
 * Generated report metadata
 */
export interface Report {
  id: string;
  userId: string;
  type: ReportType;
  status: ReportStatus;
  dateRange: {
    start: Date;
    end: Date;
  };
  accountIds?: string[];
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

// ============================================================================
// Tax Calculation Types
// ============================================================================

/**
 * Tax lot for tracking cost basis
 */
export interface TaxLot {
  id: string;
  holdingId: string;
  symbol: string;
  quantity: number;
  costBasisPerShare: number;
  totalCostBasis: number;
  acquiredDate: Date;
  isShortTerm: boolean; // Less than 1 year held
}

/**
 * Realized gain/loss from a sale
 */
export interface RealizedGainLoss {
  symbol: string;
  quantity: number;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  acquiredDate: Date;
  soldDate: Date;
  isShortTerm: boolean;
  holdingPeriodDays: number;
}

/**
 * Tax summary for a period
 */
export interface TaxSummary {
  year: number;
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  totalNetGainLoss: number;
  transactions: RealizedGainLoss[];
}

// ============================================================================
// Goal Types
// ============================================================================

/**
 * Goal categories
 */
export type GoalCategory =
  | 'retirement'
  | 'emergency_fund'
  | 'home_purchase'
  | 'education'
  | 'vacation'
  | 'investment'
  | 'debt_payoff'
  | 'other';

/**
 * Goal status
 */
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

/**
 * Financial goal
 */
export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: Date;
  startDate: Date;
  status: GoalStatus;
  linkedAccountIds: string[];
  monthlyContribution?: number;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Goal form data
 */
export interface GoalFormData {
  name: string;
  description?: string;
  category: GoalCategory;
  targetAmount: number;
  targetDate: Date;
  linkedAccountIds?: string[];
  monthlyContribution?: number;
  icon?: string;
  color?: string;
}

/**
 * Goal progress calculation
 */
export interface GoalProgress {
  goal: Goal;
  percentComplete: number;
  amountRemaining: number;
  daysRemaining: number;
  monthsRemaining: number;
  onTrack: boolean;
  projectedCompletion?: Date;
  requiredMonthlyContribution: number;
}

// ============================================================================
// Calculator Types
// ============================================================================

/**
 * Compound growth calculation input
 */
export interface CompoundGrowthInput {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturnRate: number;
  years: number;
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually';
}

/**
 * Compound growth calculation result
 */
export interface CompoundGrowthResult {
  finalValue: number;
  totalContributions: number;
  totalInterestEarned: number;
  yearlyBreakdown: Array<{
    year: number;
    startBalance: number;
    contributions: number;
    interest: number;
    endBalance: number;
  }>;
}

/**
 * Retirement projection input
 */
export interface RetirementProjectionInput {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturnRate: number;
  inflationRate: number;
  desiredAnnualIncome: number;
  socialSecurityIncome?: number;
  pensionIncome?: number;
}

/**
 * Retirement projection result
 */
export interface RetirementProjectionResult {
  projectedSavingsAtRetirement: number;
  yearsOfRetirementFunded: number;
  monthlyIncomeFromSavings: number;
  totalRetirementIncome: number;
  inflationAdjustedIncome: number;
  savingsGap: number;
  onTrack: boolean;
  yearlyProjection: Array<{
    age: number;
    year: number;
    balance: number;
    contributions: number;
    growth: number;
  }>;
}

/**
 * Risk tolerance questionnaire answer
 */
export interface RiskToleranceAnswer {
  questionId: string;
  answer: number; // 1-5 scale
}

/**
 * Risk tolerance result
 */
export interface RiskToleranceResult {
  score: number;
  category: 'conservative' | 'moderate_conservative' | 'moderate' | 'moderate_aggressive' | 'aggressive';
  description: string;
  recommendedAllocation: {
    stocks: number;
    bonds: number;
    cash: number;
    alternatives: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display name for goal category
 */
export function getGoalCategoryName(category: GoalCategory): string {
  const names: Record<GoalCategory, string> = {
    retirement: 'Retirement',
    emergency_fund: 'Emergency Fund',
    home_purchase: 'Home Purchase',
    education: 'Education',
    vacation: 'Vacation',
    investment: 'Investment',
    debt_payoff: 'Debt Payoff',
    other: 'Other',
  };
  return names[category];
}

/**
 * Get icon for goal category
 */
export function getGoalCategoryIcon(category: GoalCategory): string {
  const icons: Record<GoalCategory, string> = {
    retirement: '🏖️',
    emergency_fund: '🛟',
    home_purchase: '🏠',
    education: '🎓',
    vacation: '✈️',
    investment: '📈',
    debt_payoff: '💳',
    other: '🎯',
  };
  return icons[category];
}

/**
 * Get display name for report type
 */
export function getReportTypeName(type: ReportType): string {
  const names: Record<ReportType, string> = {
    portfolio_summary: 'Portfolio Summary',
    performance: 'Performance Report',
    holdings_detail: 'Holdings Detail',
    transaction_history: 'Transaction History',
    tax_summary: 'Tax Summary',
    goal_progress: 'Goal Progress',
  };
  return names[type];
}

/**
 * Calculate days until date
 */
export function daysUntil(targetDate: Date): number {
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate months until date
 */
export function monthsUntil(targetDate: Date): number {
  const now = new Date();
  let months = (targetDate.getFullYear() - now.getFullYear()) * 12;
  months += targetDate.getMonth() - now.getMonth();
  return Math.max(0, months);
}

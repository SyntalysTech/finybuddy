export type Currency = "EUR" | "USD" | "GBP" | "MXN" | "ARS" | "COP" | "CLP" | "PEN";
export type Theme = "light" | "dark" | "system";
export type StartPage = "dashboard" | "prevision-vs-realidad" | "calendario" | "operaciones";
export type CategoryType = "income" | "expense" | "savings";
export type Segment = "needs" | "wants" | "savings";
export type OperationType = "income" | "expense" | "transfer";
export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
export type SavingsGoalStatus = "active" | "paused" | "completed" | "cancelled";
export type DebtStatus = "active" | "paused" | "paid";
export type DebtType = "mortgage" | "car_loan" | "personal_loan" | "credit_card" | "student_loan" | "other";
export type AlertType = "payment_due" | "budget_exceeded" | "goal_reminder" | "custom";
export type MessageRole = "user" | "assistant" | "system";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  currency: Currency;
  locale: string;
  theme: Theme;
  start_page: StartPage;
  show_decimals: boolean;
  rule_needs_percent: number;
  rule_wants_percent: number;
  rule_savings_percent: number;
  billing_type: string | null;
  billing_name: string | null;
  billing_tax_id: string | null;
  billing_address: string | null;
  billing_country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  segment: Segment | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface Operation {
  id: string;
  user_id: string;
  category_id: string | null;
  type: OperationType;
  amount: number;
  concept: string;
  description: string | null;
  operation_date: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  recurring_end_date: string | null;
  parent_operation_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: SavingsGoalStatus;
  priority: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface SavingsContribution {
  id: string;
  user_id: string;
  savings_goal_id: string;
  operation_id: string | null;
  amount: number;
  contribution_date: string;
  notes: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  creditor: string | null;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number | null;
  start_date: string;
  due_date: string | null;
  status: DebtStatus;
  debt_type: DebtType;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  operation_id: string | null;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  alert_type: AlertType;
  reference_type: string | null;
  reference_id: string | null;
  alert_date: string;
  alert_time: string | null;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export type NotificationType = "info" | "success" | "warning" | "error" | "welcome";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  icon: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

// Dashboard aggregated types
export interface MonthlySummary {
  total_income: number;
  total_expenses: number;
  total_savings: number;
  balance: number;
  needs_total: number;
  wants_total: number;
  savings_total: number;
}

export interface CategoryExpense {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  segment: Segment | null;
  total_amount: number;
  operation_count: number;
}

export interface BudgetVsActual {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  segment: Segment | null;
  budgeted: number;
  actual: number;
  difference: number;
  percentage: number;
}

export interface MonthlyEvolution {
  year: number;
  month: number;
  month_name: string;
  total_income: number;
  total_expenses: number;
  balance: number;
}

export interface CalendarDay {
  operation_date: string;
  operations_count: number;
  total_income: number;
  total_expenses: number;
  net_amount: number;
}

export interface DebtToIncomeRatio {
  monthly_debt_payment: number;
  monthly_income: number;
  ratio_percentage: number;
  status: "excellent" | "good" | "warning" | "danger";
}

export interface SavingsSummary {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_target: number;
  total_saved: number;
  overall_progress: number;
}

export interface DebtsSummary {
  total_debts: number;
  active_debts: number;
  paid_debts: number;
  total_original: number;
  total_remaining: number;
  overall_progress: number;
  total_monthly_payment: number;
}

export interface AgentCardItem {
  id: string;
  text: string;
}

export interface AgentCardConfig {
  title: string;
  items: readonly AgentCardItem[];
  variant?: 'promptStarters';
}

/**
 * Agent icon types matching the web app icons
 * - rfp-proposal: Knowledge, Legal, Finance, RFP, Unleash (purple sparkle)
 * - analyst: Sales Analyst, Data (bar chart with search)
 * - internal-audit: Audit (blue grid)
 * - hand-heart: HR/Manager Edge (hand holding heart)
 */
export type AgentIconType =
  | 'rfp-proposal'
  | 'analyst'
  | 'internal-audit'
  | 'hand-heart';

export interface AgentMetadata {
  id: string;
  name: string;
  /** Display title shown on agent page (matches web app's 'title') */
  title: string;
  /** Subtitle shown below title (e.g., beta notice) */
  subTitle?: string;
  /** Full description text for the agent */
  text: string;
  /** Icon type matching web app icons */
  iconType: AgentIconType;
  /** Card data for suggestion cards */
  cardData?: readonly AgentCardConfig[];
  /** Category name for grouping */
  categoryName?: string;
}

export const AGENT_NAMES = {
  RFP: 'sales_rfp',
  HR: 'hr',
  Legal: 'legal',
  Audit: 'audit',
  Finance: 'finance',
  Knowledge: 'knowledge',
  Utility: 'utility',
  data: 'aionbi',
  Action: 'action',
  Unleash: 'unleash',
  MReview: 'mreview',
  ProcurementConcord: 'procurementconcord',
  FinancePnLGbi: 'financepnlgbi',
  FinancePnLHfm: 'financepnlhfm',
  FinanceFteGbi: 'financeftegbi',
  FinanceRevenueGbi: 'financerevenuegbi',
  FinanceRevenuePbcs: 'financerevenuepbcs',
  SalesDataGbi: 'salesdatagbi',
  GtdDemandGbi: 'gtddemandgbi',
  GtdSupplyGbi: 'gtdsupplygbi',
  GtdSkillsGbi: 'gtdskillsgbi',
} as const;

export type AgentName = (typeof AGENT_NAMES)[keyof typeof AGENT_NAMES];

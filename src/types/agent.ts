export interface AgentCardConfig {
  title: string;
  items?: { description: string }[];
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
  label: string;
  description: string;
  /** Icon type matching web app icons */
  iconType: AgentIconType;
  cardData?: readonly AgentCardConfig[];
}

export const AGENT_NAMES = {
  RFP: 'sales_rfp',
  HR: 'hr',
  Legal: 'legal',
  Audit: 'audit',
  Finance: 'finance',
  Knowledge: 'knowledge',
  Utility: 'utility',
  Data: 'aionbi',
  Action: 'action',
  Unleash: 'unleash',
  FinancePnLGbi: 'financepnlgbi',
  FinancePnLHfm: 'financepnlhfm',
  FinanceRevenueGbi: 'financerevenuegbi',
  FinanceRevenuePbcs: 'financerevenuepbcs',
  SalesDataGbi: 'salesdatagbi',
} as const;

export type AgentName = (typeof AGENT_NAMES)[keyof typeof AGENT_NAMES];

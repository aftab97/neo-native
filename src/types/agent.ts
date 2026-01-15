export interface AgentCardConfig {
  title: string;
  items?: { description: string }[];
}

export interface AgentMetadata {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: string;
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

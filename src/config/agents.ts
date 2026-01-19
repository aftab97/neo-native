import { AgentMetadata, AGENT_NAMES } from '../types/agent';

/**
 * Agent metadata matching the web app (neo3-ui)
 * Icons map to the same SVG icons used in the web app:
 * - rfp-proposal: Knowledge, Legal, Finance, RFP, Unleash
 * - analyst: Sales Analyst, Data (aionbi)
 * - internal-audit: Audit
 * - hand-heart: HR (Manager Edge)
 */
export const AGENTS: AgentMetadata[] = [
  {
    id: AGENT_NAMES.Knowledge,
    name: 'Knowledge',
    label: 'Neo Assistant',
    description: 'General purpose assistant for everyday tasks and questions',
    iconType: 'rfp-proposal',
    cardData: [
      {
        title: 'General Questions',
        items: [
          { description: 'Ask about company policies and procedures' },
          { description: 'Get help with common workplace tasks' },
        ],
      },
      {
        title: 'Quick Actions',
        items: [
          { description: 'Find information across company resources' },
          { description: 'Get answers to frequently asked questions' },
        ],
      },
    ],
  },
  {
    id: AGENT_NAMES.HR,
    name: 'HR',
    label: 'Manager Edge Assistant',
    description: 'HR-related queries, leave management, and employee information',
    iconType: 'hand-heart',
    cardData: [
      {
        title: 'Leave Management',
        items: [
          { description: 'How do I apply for leave?' },
          { description: 'Check my leave balance' },
        ],
      },
      {
        title: 'HR Policies',
        items: [
          { description: 'What are the work from home policies?' },
          { description: 'How do I update my personal information?' },
        ],
      },
    ],
  },
  {
    id: AGENT_NAMES.Legal,
    name: 'Legal',
    label: 'Contracts Assistant',
    description: 'Contract review, legal questions, and compliance guidance',
    iconType: 'rfp-proposal',
    cardData: [
      {
        title: 'Contract Review',
        items: [
          { description: 'Review contract terms and conditions' },
          { description: 'Identify potential risks in agreements' },
        ],
      },
      {
        title: 'Legal Guidance',
        items: [
          { description: 'Get compliance information' },
          { description: 'Understand legal requirements' },
        ],
      },
    ],
  },
  {
    id: AGENT_NAMES.Finance,
    name: 'Finance',
    label: 'Finance Assistant',
    description: 'Financial queries, expense reports, and budget information',
    iconType: 'rfp-proposal',
    cardData: [
      {
        title: 'Expense Management',
        items: [
          { description: 'How do I submit an expense report?' },
          { description: 'Track expense approvals' },
        ],
      },
      {
        title: 'Budget Queries',
        items: [
          { description: 'Check project budget status' },
          { description: 'Get financial reporting help' },
        ],
      },
    ],
  },
  {
    id: AGENT_NAMES.Audit,
    name: 'Audit',
    label: 'Internal Audit Assistant',
    description: 'Audit procedures, compliance checks, and risk assessment',
    iconType: 'internal-audit',
    cardData: [
      {
        title: 'Audit Support',
        items: [
          { description: 'Understand audit procedures' },
          { description: 'Prepare for compliance reviews' },
        ],
      },
    ],
  },
  {
    id: AGENT_NAMES.RFP,
    name: 'RFP',
    label: 'Proposal Assistant',
    description: 'RFP responses, proposal creation, and sales support',
    iconType: 'rfp-proposal',
    cardData: [
      {
        title: 'Proposal Creation',
        items: [
          { description: 'Generate proposal content' },
          { description: 'Review and improve RFP responses' },
        ],
      },
    ],
  },
  {
    id: AGENT_NAMES.Data,
    name: 'Data',
    label: 'Sales Analyst',
    description: 'Data analysis, reporting, and business intelligence',
    iconType: 'analyst',
    cardData: [
      {
        title: 'Data Analysis',
        items: [
          { description: 'Analyze sales data and trends' },
          { description: 'Generate business reports' },
        ],
      },
    ],
  },
  {
    id: AGENT_NAMES.Utility,
    name: 'Utility',
    label: 'Utility Assistant',
    description: 'General utilities and tools',
    iconType: 'rfp-proposal',
  },
  {
    id: AGENT_NAMES.FinancePnLGbi,
    name: 'FinancePnLGbi',
    label: 'Finance Analyst - P&L (GBI)',
    description: 'Profit and loss analysis using GBI data sources',
    iconType: 'analyst',
  },
  {
    id: AGENT_NAMES.FinancePnLHfm,
    name: 'FinancePnLHfm',
    label: 'Finance Analyst - P&L (HFM)',
    description: 'Profit and loss analysis using HFM data sources',
    iconType: 'analyst',
  },
  {
    id: AGENT_NAMES.FinanceRevenueGbi,
    name: 'FinanceRevenueGbi',
    label: 'Finance Analyst - Revenue (GBI)',
    description: 'Revenue analysis and reporting using GBI data sources',
    iconType: 'analyst',
  },
  {
    id: AGENT_NAMES.FinanceRevenuePbcs,
    name: 'FinanceRevenuePbcs',
    label: 'Finance Analyst - Revenue (PBCS)',
    description: 'Revenue analysis and reporting using PBCS data sources',
    iconType: 'analyst',
  },
  {
    id: AGENT_NAMES.SalesDataGbi,
    name: 'SalesDataGbi',
    label: 'Sales Data Analyst (GBI)',
    description: 'Sales data analysis and insights using GBI data sources',
    iconType: 'analyst',
  },
];

// Get agent by ID
export const getAgentById = (id: string): AgentMetadata | undefined => {
  return AGENTS.find((agent) => agent.id === id);
};

// Get agent by name
export const getAgentByName = (name: string): AgentMetadata | undefined => {
  return AGENTS.find((agent) => agent.name.toLowerCase() === name.toLowerCase());
};

// Default agent for general queries
export const DEFAULT_AGENT = AGENTS.find((a) => a.id === AGENT_NAMES.Knowledge);

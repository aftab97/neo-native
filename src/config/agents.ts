import { AgentMetadata, AGENT_NAMES } from '../types/agent';

/**
 * Agent metadata matching the web app (neo3-ui)
 * Icons map to the same SVG icons used in the web app:
 * - rfp-proposal: Knowledge, Legal, Finance, RFP, Unleash
 * - analyst: Sales Analyst, Data (aionbi), Finance Analysts, GTD Analysts
 * - internal-audit: Audit
 * - hand-heart: HR (Manager Edge)
 */
export const AGENTS: AgentMetadata[] = [
  {
    id: AGENT_NAMES.Knowledge,
    name: 'Knowledge',
    title: 'General',
    text: 'General purpose agent for various tasks.',
    iconType: 'rfp-proposal',
    categoryName: 'General',
    cardData: [],
  },
  {
    id: AGENT_NAMES.HR,
    name: 'HR',
    title: 'Manager Edge Assistant',
    text: 'The Manager Edge Assistant integrates data to give People Managers actionable insights, supporting performance and engagement processes but not replacing judgment—use it as a support tool, not for sensitive decisions, and remain accountable for outcomes.',
    iconType: 'hand-heart',
    categoryName: 'Manager Edge Assistant',
    cardData: [
      {
        title: 'Performance',
        items: [
          {
            id: 'hr-1',
            text: 'Could you synthesize the strengths and areas of improvement of my employee [employee name] based upon all the feedback given/received in GetSuccess?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Engagement',
        items: [
          {
            id: 'hr-2',
            text: 'What are some best practices I can leverage to maintain or improve team engagement?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Learning',
        items: [
          {
            id: 'hr-3',
            text: "Based on the areas of improvement, which training would you recommend for [employee's name]?",
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.Legal,
    name: 'Legal',
    title: 'Contracts Assistant',
    text: 'Search policies, analyse contracts and ensure internal policies compliance with AI-powered legal intelligence.',
    iconType: 'rfp-proposal',
    categoryName: 'Contracts Assistant',
    cardData: [
      {
        title: 'Contract Basic Info',
        items: [
          {
            id: 'legal-1',
            text: 'Summarize the key contract information like name of the client, name of the service provider, name of the agreement, effective date, term, renewal, and termination rules (including termination for convenience), governing law and jurisdiction, payment terms (including payment currency, price adjustments), scope of services and acceptance rules. Provide the answers in a form of a list.',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'WCP Liability Cap',
        items: [
          {
            id: 'legal-2',
            text: 'What is the maximum liability cap that can be agreed upon with a client, according to the WCP?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'WCP COMPARISION - Liability cap',
        items: [
          {
            id: 'legal-3',
            text: 'Are the limitations of liability (Liability cap) for vendor, including consequential and indirect losses and unlimited liability principles under the uploaded contract in line with the WCP limitations of liability (Liability cap) related principles?  In the response summarize the Capgemini standard positions, deviations, relevant mitigations and reviewers (if applicable).',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.Finance,
    name: 'Finance',
    title: 'Finance Assistant',
    text: 'Unlock Contract Intelligence with GenAI.  Review and analyse contracts efficiently using Generative AI. It identifies red-flag clauses by benchmarking against Capgemini standards,  Users can generate reminders for key contractual obligations, track deliverables, enhancing decision-making and helps renegotiation.',
    iconType: 'rfp-proposal',
    categoryName: 'Finance Assistant',
    cardData: [
      {
        title: 'Annual price increases /COLA Clause',
        items: [
          {
            id: 'finance-1',
            text: 'What are the terms around annual price increases/inflation adjustment/Cost of Living increases (COLA).',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Invoicing Schedule',
        items: [
          {
            id: 'finance-2',
            text: 'What is the invoicing schedule?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Contract payment terms',
        items: [
          {
            id: 'finance-3',
            text: 'What are the payment terms?',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.Audit,
    name: 'Audit',
    title: 'Internal Audit Assistant',
    text: 'Streamline audits, manage risks, and enhance writing with concise, accurate summaries.',
    iconType: 'internal-audit',
    categoryName: 'Internal Audit Assistant',
    cardData: [
      {
        title: 'List and summarize obligations of both parties.',
        items: [
          {
            id: 'audit-1',
            text: 'From the uploaded document, list and summarize the obligations of both parties, emphasizing any critical responsibilities and deadlines.',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Identify and summarize potential risks in the contract and appendices.',
        items: [
          {
            id: 'audit-2',
            text: 'From the uploaded document, identify and summarize any potential risks mentioned in the contract and its appendices, detailing their impacts and suggested mitigation strategies.',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Summarize the payment terms outlined in the contract.',
        items: [
          {
            id: 'audit-3',
            text: 'From the uploaded document, summarize the payment terms, including schedules, methods, conditions, and any penalties for late payments.',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.RFP,
    name: 'RFP',
    title: 'Proposal Assistant',
    text: 'Assists you in understanding client requirements & creating draft proposal content based on best past proposals and capability documents.',
    iconType: 'rfp-proposal',
    categoryName: 'Proposal Assistant',
    cardData: [
      {
        title: 'Understand Client Requirements',
        items: [
          {
            id: 'rfp-1',
            text: 'Summarize the uploaded documents, including sections for: Project Overview, Scope of Work, Deliverables, Timeline, Contact Information, Submission Process and Evaluation Criteria.',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: "Map Client Requirements with Capgemini's Capabilities",
        items: [
          {
            id: 'rfp-2',
            text: 'Map the offers and capabilities (in bullet points, along with rationale) that Capgemini can recommend to client, which are aligned with the client objectives.',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Know Capgemini Capabilities',
        items: [
          {
            id: 'rfp-3',
            text: "Describe Capgemini's [Technology/Domain] capabilities. The description should cover Key Services, Expertise, Tools & Accelerators, Partnerships, and Successful Case Studies.",
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.Unleash,
    name: 'Unleash',
    title: 'Unleash Assistant',
    text: 'The UNLEASH Assistant answers questions about the UNLEASH model and provides context in addition to the official UNLEASH documents. As UNLEASH deployment is conducted by geography, for local implementation queries, please contact your local UNLEASH SPOC',
    iconType: 'rfp-proposal',
    categoryName: 'Unleash Assistant',
    cardData: [
      {
        title: 'Understand roles & responsibilities',
        items: [
          {
            id: 'unleash-1',
            text: 'What are the role and the responsibilities of a [insert role]?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Learn about accountabilities',
        items: [
          {
            id: 'unleash-2',
            text: 'Who is accountable for [insert activity]?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Understand main changes',
        items: [
          {
            id: 'unleash-3',
            text: 'Please summarize the main changes that UNLEASH brings to Capgemini.',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.data,
    name: 'Data',
    title: 'Sales Analyst',
    subTitle: "Please note: You're using our Beta release — we appreciate your feedback.",
    text: "Sales Analyst enables natural language conversations with structured sales data from Capgemini's corporate applications. It delivers insights on key sales KPIs like Bookings, Win Rate, and Funnel health. With dynamic visual outputs and time-based comparisons, it empowers sales Executives with fast, intuitive analytics.",
    iconType: 'analyst',
    categoryName: 'Sales Analyst',
    cardData: [
      {
        title: 'Clients',
        items: [
          {
            id: 'data-1',
            text: 'What are the top 10 clients by external bookings this year?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Funnel Analysis',
        items: [
          {
            id: 'data-2',
            text: 'Show me funnel by SBU for Q1 2026.',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Win Rate Analysis',
        items: [
          {
            id: 'data-3',
            text: 'What is the overall win rate for 2025 split by sector?',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.FinancePnLGbi,
    name: 'FinancePnLGbi',
    title: 'Finance Analyst - P&L (HFM)',
    subTitle: "Please note: You're using our Beta release — we appreciate your feedback.",
    text: 'P&L HFM Analyst enables natural language conversation with structured P&L data from Group Reporting tool HFM. It delivers insights on key KPIs reported within HFM covering Revenue, Bookings, for a given SBU, BU, BL as per the HFM hierarchy and dimensions. It also provides visual outputs in form of charts and graphs.',
    iconType: 'analyst',
    categoryName: 'Finance Analyst - P&L (HFM)',
    cardData: [
      {
        title: 'Revenue Analysis',
        items: [
          {
            id: 'cardFinancePnL-1',
            text: 'What is the Group SBU revenue for H1 2025?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Bookings Analysis',
        items: [
          {
            id: 'cardFinancePnL-2',
            text: 'Which SBU are driving the most bookings in 2025?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Revenue Distribution',
        items: [
          {
            id: 'cardFinancePnL-3',
            text: 'How is my H1 2025 revenue distributed across sectors?',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.FinanceFteGbi,
    name: 'FinanceFteGbi',
    title: 'Finance Analyst - Client FTE',
    subTitle: "Please note: You're using our Beta release — we appreciate your feedback.",
    text: 'Finance Client FTE Analyst enables natural language conversation with structured time data from GFS & SAP and offers insights into FTEs. Chats should primarily concentrate on account-level analysis by grade, as well as pyramid and leverage analysis.',
    iconType: 'analyst',
    categoryName: 'Finance Analyst - Client FTE',
    cardData: [
      {
        title: 'FTE Insights',
        items: [
          {
            id: 'cardFinanceFte-1',
            text: 'Provide total FTE for CISCO Account YoY',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Grade Summary',
        items: [
          {
            id: 'cardFinanceFte-2',
            text: 'Show NBT FTE by Grade for CSL Account for year 2024 and 2025',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Workforce Breakdown',
        items: [
          {
            id: 'cardFinanceFte-3',
            text: 'Show FTE by Grade for CISCO account YOY',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.FinanceRevenueGbi,
    name: 'FinanceRevenueGbi',
    title: 'Finance Analyst - Client Revenue',
    subTitle: "Please note: You're using our Beta release — we appreciate your feedback.",
    text: 'Finance Client Revenue Analyst enables natural language conversation with structured data of Revenue at Global level, Chats should be primarily focused on Account level revenue analysis. This Platform also provides visual outputs in form of charts and graphs.',
    iconType: 'analyst',
    categoryName: 'Finance Analyst - Client Revenue',
    cardData: [
      {
        title: 'Revenue Overview',
        items: [
          {
            id: 'cardFinanceRevenue-1',
            text: 'What is the external revenue for Bayer Account for the year 2023 and 2024',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Account Performance',
        items: [
          {
            id: 'cardFinanceRevenue-2',
            text: 'Provide the monthly revenue for Airbus Account for 2024 and 2025',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Growth Breakdown',
        items: [
          {
            id: 'cardFinanceRevenue-3',
            text: 'What is the YOY revenue growth for Volkswagen Account by BL or region in 2025',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.GtdDemandGbi,
    name: 'GtdDemandGbi',
    title: 'GTD Demand Analyst',
    subTitle: "Please note: You're using our Beta release — we appreciate your feedback.",
    text: 'GTD Demand Analyst provides you with insights into demand patterns and fulfillment performance. By analyzing KPIs such as Demand Anticipation Days, (on-time)Fulfillment Rate, Average Fulfillment Time, it supports the identification of process improvement opportunities. Through natural language interaction, it transforms complex demand data into actionable insights— helping boost staffing efficiency and improve customer satisfaction.',
    iconType: 'analyst',
    categoryName: 'GTD Demand Analyst',
    cardData: [
      {
        title: 'On-Time Fulfillment Rate – ER&D Business Line',
        items: [
          {
            id: 'cardGtdDemandGbi-1',
            text: 'What is the (on-time) fulfilment rate for  ER&D Business Line? Has it improved over the last 6 months?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Avg Fulfillment globally',
        items: [
          {
            id: 'cardGtdDemandGbi-2',
            text: 'What is the average fulfilment time for globally? Has it evolved over the last 6 months?',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Past Due Demand Ratio – UK BU',
        items: [
          {
            id: 'cardGtdDemandGbi-3',
            text: 'What is the past due demand ratio for  UK BU? Has it improved over the last 6 months?',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.GtdSupplyGbi,
    name: 'GtdSupplyGbi',
    title: 'GTD Supply Analyst',
    subTitle: "Please note: You're using our Beta release — we appreciate your feedback.",
    text: "GTD Supply Analyst delivers visibility into Talents' allocation and utilization. By tracking KPIs such as ARVE Projections (firm and weighted), Bench Rate, and Utilization Rate, it transforms resource data into actionable insights that drive profitability and operational efficiency. Through natural language interaction, it empowers you to make informed decisions that maximize the utilization of talents.",
    iconType: 'analyst',
    categoryName: 'GTD Supply Analyst',
    cardData: [
      {
        title: "Current month's firm ARVE",
        items: [
          {
            id: 'cardGtdSupplyGbi-1',
            text: "What is current month's firm ARVE for Invent Business Line? Has it improved over the last 3 months?",
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'ARVE projection',
        items: [
          {
            id: 'cardGtdSupplyGbi-2',
            text: "Show the ARVE projection for the next 12 weeks for all practices in 'France'?",
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Bench evolution',
        items: [
          {
            id: 'cardGtdSupplyGbi-3',
            text: 'Show the bench evolution for  all practices in North America over the last 3 months and the trend in the next 6 months?',
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.GtdSkillsGbi,
    name: 'GtdSkillsGbi',
    title: 'GTD Skills Analyst',
    subTitle: "Please note: You're using our Beta release — we appreciate your feedback.",
    text: 'GTD Skills Analyst empowers you with visibility into workforce capabilities. By analyzing KPIs such as Certification Rate, Average Certifications per Talent, and Average Skills per Talent, it identifies trends in critical skills, ensuring alignment with organizational priorities. Through natural language interaction, it transforms complex talent data into clear, actionable insights—helping reduce risk from skill shortages and accelerate capability development.',
    iconType: 'analyst',
    categoryName: 'GTD Skills Analyst',
    cardData: [
      {
        title: 'Google Agile Certification Trend',
        items: [
          {
            id: 'cardGtdSkillsGbi-1',
            text: "What is the certification rate for 'Google Agile Project Management' certification? Has it improved over the last 6 months?",
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Avg Skills per Talent – CIS Business Line',
        items: [
          {
            id: 'cardGtdSkillsGbi-2',
            text: 'What is the average number of skills per talent for CIS Business Line',
          },
        ],
        variant: 'promptStarters',
      },
      {
        title: 'Avg Certificates – SAP for PBS',
        items: [
          {
            id: 'cardGtdSkillsGbi-3',
            text: "What is the average number of SAP certifications per talent for PBS Business Line  and 'D' grade? Has it improved over the last 6 months?",
          },
        ],
        variant: 'promptStarters',
      },
    ],
  },
  {
    id: AGENT_NAMES.Utility,
    name: 'Utility',
    title: 'Utility Assistant',
    text: 'General utilities and tools.',
    iconType: 'rfp-proposal',
    categoryName: 'Utility Assistant',
    cardData: [],
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

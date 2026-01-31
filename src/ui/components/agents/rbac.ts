import { Environment } from '../../../api/env';

/**
 * RBAC group access configuration.
 * The keys are agent IDs (backend values).
 * The values are objects mapping environment to allowed group name.
 *
 * Matches web app's rbac-groups.ts
 */
export const rbacGroups: Record<Environment, Record<string, string>> = {
  DEV: {
    sales_rfp: 'gpcorpgen_ai_be_sales_enduser',
    hr: 'gpcorpgen_ai_be_hr_enduser',
    audit: 'gpcorpgen_ai_be_aud_enduser',
    legal: 'gpcorpgen_ai_be_legal_enduser',
    finance: 'gpcorpgen_ai_be_fin_enduser',
    aionbi: 'gpcorpgen_ai_be_talktodata_enduser',
    unleash: 'gpcorpgen_ai_unleashassistant_enduser',
    financepnlgbi: 'gpcorpgenai_gbi_neo_looker_finance_pnl_enduser',
    financeftegbi: 'gpcorpgenai_gbi_neo_looker_finance_fte_enduser',
    financerevenuegbi: 'gpcorpgenai_gbi_neo_looker_finance_revenue_enduser',
    gtddemandgbi: 'gpcorpgenai_gbi_dev_neo_gtd_demand_enduser',
    gtdsupplygbi: 'gpcorpgenai_gbi_dev_neo_gtd_supply_enduser',
    gtdskillsgbi: 'gpcorpgenai_gbi_dev_neo_gtd_skills_enduser',
  },
  QA: {
    sales_rfp: 'gpcorpgenai_uat_sales_proposalassistant_enduser',
    hr: 'gpcorpgenai_uat_hr_performancecoach_enduser',
    audit: 'gpcorpgenai_uat_aud_documentsearch_enduser',
    legal: 'gpcorpgenai_uat_legal_legalccm_contractsummarization_endus',
    finance: 'gpcorpgenai_uat_fin_contractanalysis_enduser',
    aionbi: 'gpcorpgenai_uat_talktodata_enduser',
    unleash: 'gpcorpgenai_uat_unleashassistant_enduser',
    financepnlgbi: 'gpcorpgenai_gbi_neo_looker_finance_pnl_enduser',
    financeftegbi: 'gpcorpgenai_gbi_neo_looker_finance_fte_enduser',
    financerevenuegbi: 'gpcorpgenai_gbi_neo_looker_finance_revenue_enduser',
    gtddemandgbi: 'gpcorpgenai_gbi_uat_neo_gtd_demand_enduser',
    gtdsupplygbi: 'gpcorpgenai_gbi_uat_neo_gtd_supply_enduser',
    gtdskillsgbi: 'gpcorpgenai_gbi_uat_neo_gtd_skills_enduser',
  },
  PROD: {
    sales_rfp: 'gpcorpgenai_prd_sales_proposalassistant_enduser',
    hr: 'gpcorpgenai_prd_hr_performancecoach_enduser',
    audit: 'gpcorpgenai_prd_aud_documentsearch_enduser',
    legal: 'gpcorpgenai_prd_legalccm_contractsummarization_enduser',
    finance: 'gpcorpgenai_prd_fin_contractanalysis_enduser',
    aionbi: 'gpcorpgenai_prd_gbi_neo_looker_sales_enduser',
    unleash: 'gpcorpgenai_prd_unleashassistant_enduser',
    financepnlgbi: 'gpcorpgenai_prd_gbi_neo_looker_finance_pnl_enduser',
    financeftegbi: 'gpcorpgenai_prd_gbi_neo_looker_finance_fte_enduser',
    financerevenuegbi: 'gpcorpgenai_prd_gbi_neo_looker_finance_revenue_enduser',
    gtddemandgbi: 'gpcorpgenai_gbi_prd_neo_gtd_demand_enduser',
    gtdsupplygbi: 'gpcorpgenai_gbi_prd_neo_gtd_supply_enduser',
    gtdskillsgbi: 'gpcorpgenai_gbi_prd_neo_gtd_skills_enduser',
  },
} as const;

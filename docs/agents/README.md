# Multi-Agent System

## Overview
16+ specialized agents with RBAC-based access control.

## Files
| File | Purpose |
|------|---------|
| `src/ui/components/agents/agents.ts` | Agent metadata definitions |
| `src/ui/components/agents/types.ts` | Agent types |
| `src/ui/components/agents/rbac.ts` | RBAC group configuration |
| `src/pages/AgentScreen.tsx` | Agent chat page |
| `src/ui/components/agents/AgentStartScreen.tsx` | Agent landing with prompts |
| `src/ui/components/home-cards/AgentCards.tsx` | Agent grid on homepage |
| `src/hooks/useAvailableServices.ts` | RBAC filtering hook |

## Agents

| ID | Title | Icon | Category |
|----|-------|------|----------|
| `knowledge` | General | rfp-proposal | General |
| `hr` | Manager Edge Assistant | hand-heart | HR |
| `legal` | Contracts Assistant | rfp-proposal | Legal |
| `finance` | Finance Assistant | rfp-proposal | Finance |
| `audit` | Internal Audit Assistant | internal-audit | Audit |
| `sales_rfp` | Proposal Assistant | rfp-proposal | RFP |
| `unleash` | Unleash Assistant | rfp-proposal | Unleash |
| `aionbi` | Sales Analyst (Beta) | analyst | Data |
| `financepnlgbi` | Finance Analyst - P&L (HFM) | analyst | Finance |
| `financeftegbi` | Finance Analyst - Client FTE | analyst | Finance |
| `financerevenuegbi` | Finance Analyst - Client Revenue | analyst | Finance |
| `gtddemandgbi` | GTD Demand Analyst | analyst | GTD |
| `gtdsupplygbi` | GTD Supply Analyst | analyst | GTD |
| `gtdskillsgbi` | GTD Skills Analyst | analyst | GTD |
| `utility` | Utility Assistant | rfp-proposal | Utility |

## Features

### RBAC Filtering
```typescript
const { services: availableServices } = useAvailableServices();
const filteredAgents = AGENTS.filter((agent) =>
  availableServices.includes(agent.id)
);
```

### Agent Metadata
```typescript
interface AgentMetadata {
  id: string;           // Backend agent ID
  name: string;         // Internal name
  title: string;        // Display title
  subTitle?: string;    // Beta notice
  text: string;         // Description
  iconType: AgentIconType;
  categoryName: string;
  cardData: AgentCardItem[];  // Prompt suggestions
}
```

### Prompt Suggestions
Each agent has `cardData` with prompt starters:
```typescript
cardData: [
  {
    title: 'Category Name',
    items: [{ id: 'unique-id', text: 'Prompt text...' }],
    variant: 'promptStarters',
  }
]
```

## Edge Cases & Behaviors

### Don't Break These:

1. **Loading state shows all agents**
   ```typescript
   if (availableServices.length === 0) return AGENTS;
   ```
   While RBAC loads, show all.

2. **Agent cache isolation**
   ```typescript
   // Each agent has its own cache
   queryKeys.chat(agentId)  // ['chat', agentId]
   ```

3. **Reset agent cache before navigation**
   ```typescript
   resetForAgent(agent.id);
   navigation.navigate("Agent", { agentId: agent.id });
   ```
   Fresh start on agent selection.

4. **Card submissions route to 'action' but cache to agent**
   ```typescript
   chatMutation.mutate({
     agent: 'action',        // Route to action backend
     cacheAgent: activeAgent // Cache to current agent
   });
   ```

5. **Analyst icon detection**
   ```typescript
   const isAnalystAgent = agent.categoryName?.toLowerCase().includes('analyst');
   ```
   Determines icon type.

6. **Agent selection clears session highlight**
   ```typescript
   setSelectedAgent(null);  // When viewing history
   setSelectedAgent(agent); // When selecting agent
   ```

7. **Default agent**
   ```typescript
   export const DEFAULT_AGENT = AGENTS.find((a) => a.id === AGENT_NAMES.Knowledge);
   ```

## Navigation

### Agent Screen Route
```typescript
navigation.navigate("Agent", { agentId: string });
```

### Cache Key Selection in AgentScreen
```typescript
// On agent page (not history)
isPromptFromAgentPage: !useGeneralChat && !!activeAgent && !routeSessionId
```

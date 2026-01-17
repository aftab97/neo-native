import React from 'react';
import { RFPProposalIcon } from './RFPProposalIcon';
import { AnalystIcon } from './AnalystIcon';
import { InternalAuditIcon } from './InternalAuditIcon';
import { HandHeartIcon } from './HandHeartIcon';
import type { AgentIconType } from '../../types/agent';

interface AgentIconProps {
  type: AgentIconType;
  size?: number;
}

/**
 * Agent icon component that renders the appropriate icon based on type
 * Maps to the same icons used in neo3-ui web app
 */
export const AgentIcon: React.FC<AgentIconProps> = ({ type, size = 64 }) => {
  switch (type) {
    case 'rfp-proposal':
      return <RFPProposalIcon size={size} />;
    case 'analyst':
      return <AnalystIcon size={size} />;
    case 'internal-audit':
      return <InternalAuditIcon size={size} />;
    case 'hand-heart':
      return <HandHeartIcon size={size} />;
    default:
      // Default to RFP proposal icon (most common)
      return <RFPProposalIcon size={size} />;
  }
};

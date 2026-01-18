import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from './fetch';
import { ENDPOINTS } from '../config/api';
import { Linking } from 'react-native';

// Types
export type NotificationVariant = 'blue' | 'yellow' | 'gray' | 'green' | 'purple';

export interface ProcessedNotification {
  id: string;
  variant: NotificationVariant;
  tag: string;
  description: string;
  timestamp?: Date;
  link?: string;
}

interface RawNotification {
  id?: string;
  source?: string;
  title?: string;
  description?: string;
  link?: string;
  createdAt?: string;
  ritm_number?: string;
  talentName?: string;
}

// Service Tags
const SERVICE_TAGS = {
  GTD: 'GTD (WHOZ)',
  SERVICE_CENTRAL: 'ServiceCentral',
  CONCUR: 'Concur',
  SUCCESS_FACTOR: 'SuccessFactors',
  REPLICON_TIMESHEET: 'Replicon Timesheet',
  REPLICON_TIME_OFF: 'Replicon Time Off',
  VMS: 'VMS',
  ISOW: 'iSOW',
} as const;

// Aggregated ID Constants
const AGGREGATED_IDS = {
  GTD: 'gtd-aggregated',
  SERVICE_CENTRAL: 'serviceCentral-aggregated',
  CONCUR: 'concur-aggregated',
  SUCCESS_FACTOR: 'successFactor-aggregated',
  REPLICON_TIMESHEET: 'replicon-timesheet-aggregated',
  REPLICON_TIME_OFF: 'replicon-timeoff-aggregated',
  VMS: 'vms-aggregated',
  ISOW: 'isow-aggregated',
} as const;

// Service Links
const SERVICE_LINKS = {
  SERVICE_CENTRAL: 'https://servicecentral.capgemini.com/sc?id=approvals_apps',
  CONCUR: 'https://signin.capgemini.com/idp/startSSO.ping?PartnerSpId=https://emea.api.concursolutions.com/saml2',
  SUCCESS_FACTOR: 'https://performancemanager5.successfactors.eu/sf/myWorkflowRequests?bplte_company=capgemitecP3',
  GTD: 'https://app.whoz.com',
  VMS: 'https://cgem.us.fieldglass.cloud.sap/SSOLogin?SSOParams=company%3DCGEM',
  REPLICON: 'https://na9.replicon.com/',
} as const;

// Query configuration for notifications
const notificationQueryConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
  refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  retry: 2,
};

// Helper to pluralize approvals
const pluralizeApprovals = (count: number) => (count === 1 ? 'approval' : 'approvals');

// GTD Notifications Hook
export const useGtdNotifications = () => {
  return useQuery<RawNotification[]>({
    queryKey: ['notifications', 'gtd'],
    queryFn: () => apiFetchJson<RawNotification[]>(ENDPOINTS.GTD_NOTIFICATIONS),
    ...notificationQueryConfig,
  });
};

// Process GTD notifications
const processGtdNotifications = (
  gtdData: RawNotification[] | undefined,
  lastFetchTime: Date
): ProcessedNotification[] => {
  if (!gtdData || !Array.isArray(gtdData)) return [];

  const notifications = gtdData.filter((item) => item);

  if (notifications.length >= 2) {
    return [
      {
        id: AGGREGATED_IDS.GTD,
        variant: 'blue',
        tag: SERVICE_TAGS.GTD,
        description: `You have ${notifications.length} or more approvals pending in ${SERVICE_TAGS.GTD}.`,
        timestamp: lastFetchTime,
        link: SERVICE_LINKS.GTD,
      },
    ];
  }

  return notifications.map((item, index) => ({
    id: item.id || `gtd-${index}`,
    variant: 'blue' as NotificationVariant,
    tag: SERVICE_TAGS.GTD,
    description: item.talentName
      ? `${item.talentName} requests an approval for a new skill`
      : item.description || 'GTD approval request',
    timestamp: lastFetchTime,
    link: item.link || SERVICE_LINKS.GTD,
  }));
};

// Notify (aggregated) Notifications Hook
export const useNotifyNotifications = () => {
  return useQuery<RawNotification[]>({
    queryKey: ['notifications', 'notify'],
    queryFn: () => apiFetchJson<RawNotification[]>(ENDPOINTS.NOTIFICATIONS),
    ...notificationQueryConfig,
  });
};

// Process ServiceCentral notifications
const processServiceCentralNotifications = (
  data: RawNotification[],
  lastFetchTime: Date
): ProcessedNotification[] => {
  if (!data || data.length === 0) return [];

  if (data.length > 1) {
    return [
      {
        id: AGGREGATED_IDS.SERVICE_CENTRAL,
        variant: 'purple',
        tag: SERVICE_TAGS.SERVICE_CENTRAL,
        description: `You have ${data.length} ${pluralizeApprovals(data.length)} pending in ${SERVICE_TAGS.SERVICE_CENTRAL}`,
        timestamp: lastFetchTime,
        link: SERVICE_LINKS.SERVICE_CENTRAL,
      },
    ];
  }

  return data.map((item, index) => ({
    id: item.id || `serviceCentral-${index}`,
    variant: 'purple' as NotificationVariant,
    tag: SERVICE_TAGS.SERVICE_CENTRAL,
    description: item.ritm_number
      ? `${item.ritm_number} is pending for approval`
      : 'A request is pending for approval',
    timestamp: lastFetchTime,
    link: item.link || SERVICE_LINKS.SERVICE_CENTRAL,
  }));
};

// Process Concur notifications
const processConcurNotifications = (
  data: RawNotification[],
  lastFetchTime: Date
): ProcessedNotification[] => {
  if (!data || data.length === 0) return [];

  if (data.length > 1) {
    return [
      {
        id: AGGREGATED_IDS.CONCUR,
        variant: 'yellow',
        tag: SERVICE_TAGS.CONCUR,
        description: `You have ${data.length} ${pluralizeApprovals(data.length)} pending in ${SERVICE_TAGS.CONCUR}`,
        timestamp: lastFetchTime,
        link: data[0]?.link || SERVICE_LINKS.CONCUR,
      },
    ];
  }

  return data.map((item, index) => ({
    id: item.id || `concur-${index}`,
    variant: 'yellow' as NotificationVariant,
    tag: SERVICE_TAGS.CONCUR,
    description: item.title || 'Concur approval pending',
    timestamp: lastFetchTime,
    link: item.link || SERVICE_LINKS.CONCUR,
  }));
};

// Process SuccessFactors notifications
const processSuccessFactorNotifications = (
  data: RawNotification[],
  lastFetchTime: Date
): ProcessedNotification[] => {
  if (!data || data.length === 0) return [];

  if (data.length > 1) {
    return [
      {
        id: AGGREGATED_IDS.SUCCESS_FACTOR,
        variant: 'gray',
        tag: SERVICE_TAGS.SUCCESS_FACTOR,
        description: `You have ${data.length} BTO exemption approvals pending in ${SERVICE_TAGS.SUCCESS_FACTOR}.`,
        timestamp: lastFetchTime,
        link: SERVICE_LINKS.SUCCESS_FACTOR,
      },
    ];
  }

  return data.map((item) => ({
    id: item.id || 'successFactor-0',
    variant: 'gray' as NotificationVariant,
    tag: SERVICE_TAGS.SUCCESS_FACTOR,
    description: item.title
      ? `${item.title.split(' ').slice(1).join(' ')} is pending for approval`
      : 'New SuccessFactors notification',
    timestamp: new Date(item.createdAt || lastFetchTime),
    link: item.link || SERVICE_LINKS.SUCCESS_FACTOR,
  }));
};

// Process iSOW notifications
const processISowNotifications = (
  data: RawNotification[],
  lastFetchTime: Date
): ProcessedNotification[] => {
  if (!data || data.length === 0) return [];

  if (data.length > 1) {
    return [
      {
        id: AGGREGATED_IDS.ISOW,
        variant: 'green',
        tag: SERVICE_TAGS.ISOW,
        description: `You have ${data.length} ${pluralizeApprovals(data.length)} pending in ${SERVICE_TAGS.ISOW}`,
        timestamp: lastFetchTime,
        link: data[0]?.link,
      },
    ];
  }

  return data.map((item, index) => ({
    id: item.id || `isow-${index}`,
    variant: 'green' as NotificationVariant,
    tag: SERVICE_TAGS.ISOW,
    description: item.title || item.description || 'iSOW approval pending',
    timestamp: lastFetchTime,
    link: item.link,
  }));
};

// Process all notify notifications (splits by source)
const processNotifyNotifications = (
  notifyData: RawNotification[] | undefined,
  lastFetchTime: Date
): ProcessedNotification[] => {
  if (!notifyData || !Array.isArray(notifyData)) return [];

  const isowNotifications = notifyData.filter((item) => item.source === 'iSOW');
  const successFactorNotifications = notifyData.filter(
    (item) => item.source === 'successFactor'
  );
  const serviceCentralNotifications = notifyData.filter(
    (item) => item.source === 'service_central'
  );
  const concurNotifications = notifyData.filter((item) => item.source === 'concur');

  return [
    ...processISowNotifications(isowNotifications, lastFetchTime),
    ...processSuccessFactorNotifications(successFactorNotifications, lastFetchTime),
    ...processServiceCentralNotifications(serviceCentralNotifications, lastFetchTime),
    ...processConcurNotifications(concurNotifications, lastFetchTime),
  ];
};

// Replicon Timesheet Hook
export const useRepliconTimesheetNotifications = () => {
  return useQuery<ProcessedNotification[]>({
    queryKey: ['notifications', 'replicon-timesheet'],
    queryFn: async () => {
      const data = await apiFetchJson<RawNotification[]>(ENDPOINTS.REPLICON_TIMESHEETS);
      if (!data || !Array.isArray(data) || data.length === 0) return [];

      if (data.length > 1) {
        return [
          {
            id: AGGREGATED_IDS.REPLICON_TIMESHEET,
            variant: 'blue' as NotificationVariant,
            tag: SERVICE_TAGS.REPLICON_TIMESHEET,
            description: `You have ${data.length} open timesheets in Replicon`,
            timestamp: new Date(),
            link: SERVICE_LINKS.REPLICON,
          },
        ];
      }

      return data.map((item, index) => ({
        id: item.id || `replicon-timesheet-${index}`,
        variant: 'blue' as NotificationVariant,
        tag: SERVICE_TAGS.REPLICON_TIMESHEET,
        description: item.description || 'Open timesheet requires attention',
        timestamp: new Date(),
        link: item.link || SERVICE_LINKS.REPLICON,
      }));
    },
    ...notificationQueryConfig,
  });
};

// Replicon Time Off Hook
export const useRepliconTimeOffNotifications = () => {
  return useQuery<ProcessedNotification[]>({
    queryKey: ['notifications', 'replicon-timeoff'],
    queryFn: async () => {
      const data = await apiFetchJson<RawNotification[]>(ENDPOINTS.REPLICON_TIME_OFF);
      if (!data || !Array.isArray(data) || data.length === 0) return [];

      if (data.length > 1) {
        return [
          {
            id: AGGREGATED_IDS.REPLICON_TIME_OFF,
            variant: 'purple' as NotificationVariant,
            tag: SERVICE_TAGS.REPLICON_TIME_OFF,
            description: `You have ${data.length} time off requests waiting for approval`,
            timestamp: new Date(),
            link: SERVICE_LINKS.REPLICON,
          },
        ];
      }

      return data.map((item, index) => ({
        id: item.id || `replicon-timeoff-${index}`,
        variant: 'purple' as NotificationVariant,
        tag: SERVICE_TAGS.REPLICON_TIME_OFF,
        description: item.description || 'Time off request waiting for approval',
        timestamp: new Date(),
        link: item.link || SERVICE_LINKS.REPLICON,
      }));
    },
    ...notificationQueryConfig,
  });
};

// VMS Approvals Hook
export const useVmsApprovalsNotifications = () => {
  return useQuery<ProcessedNotification[]>({
    queryKey: ['notifications', 'vms'],
    queryFn: async () => {
      const data = await apiFetchJson<RawNotification[]>(ENDPOINTS.VMS_APPROVALS);
      if (!data || !Array.isArray(data) || data.length === 0) return [];

      if (data.length > 1) {
        return [
          {
            id: AGGREGATED_IDS.VMS,
            variant: 'yellow' as NotificationVariant,
            tag: SERVICE_TAGS.VMS,
            description: `You have ${data.length} ${pluralizeApprovals(data.length)} pending in VMS`,
            timestamp: new Date(),
            link: SERVICE_LINKS.VMS,
          },
        ];
      }

      return data.map((item, index) => ({
        id: item.id || `vms-${index}`,
        variant: 'yellow' as NotificationVariant,
        tag: SERVICE_TAGS.VMS,
        description: item.description || item.title || 'VMS approval pending',
        timestamp: new Date(),
        link: item.link || SERVICE_LINKS.VMS,
      }));
    },
    ...notificationQueryConfig,
  });
};

// ============================================
// MOCK DATA FOR TESTING - Remove when backend is ready
// ============================================
const USE_MOCK_DATA = true; // Set to false to use real API

const MOCK_NOTIFICATIONS: ProcessedNotification[] = [
  {
    id: 'mock-gtd-1',
    variant: 'blue',
    tag: 'GTD (WHOZ)',
    description: 'John Smith requests an approval for a new skill certification in Cloud Architecture.',
    timestamp: new Date(),
    link: 'https://app.whoz.com',
  },
  {
    id: 'mock-serviceCentral-1',
    variant: 'purple',
    tag: 'ServiceCentral',
    description: 'You have 3 approvals pending in ServiceCentral',
    timestamp: new Date(),
    link: 'https://servicecentral.capgemini.com',
  },
  {
    id: 'mock-concur-1',
    variant: 'yellow',
    tag: 'Concur',
    description: 'Expense report from Sarah Johnson ($1,250.00) is pending your approval.',
    timestamp: new Date(),
    link: 'https://concur.com',
  },
  {
    id: 'mock-successfactor-1',
    variant: 'gray',
    tag: 'SuccessFactors',
    description: 'BTO exemption request from Mike Chen is pending for approval',
    timestamp: new Date(),
    link: 'https://performancemanager5.successfactors.eu',
  },
  {
    id: 'mock-replicon-timesheet-1',
    variant: 'blue',
    tag: 'Replicon Timesheet',
    description: 'You have 2 open timesheets that require attention.',
    timestamp: new Date(),
    link: 'https://na9.replicon.com/',
  },
  {
    id: 'mock-vms-1',
    variant: 'yellow',
    tag: 'VMS',
    description: 'Contract extension approval needed for vendor ABC Consulting.',
    timestamp: new Date(),
    link: 'https://fieldglass.com',
  },
  {
    id: 'mock-isow-1',
    variant: 'green',
    tag: 'iSOW',
    description: 'New Statement of Work requires your review and signature.',
    timestamp: new Date(),
    link: 'https://isow.capgemini.com',
  },
];
// ============================================

// Main orchestrator hook - combines all notification sources
export const useNotifications = () => {
  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    return {
      data: MOCK_NOTIFICATIONS,
      isLoading: false,
      hasError: false,
      isRefetching: false,
      refetch: () => console.log('Mock refetch called'),
    };
  }

  const gtdQuery = useGtdNotifications();
  const notifyQuery = useNotifyNotifications();
  const repliconTimesheetQuery = useRepliconTimesheetNotifications();
  const repliconTimeOffQuery = useRepliconTimeOffNotifications();
  const vmsApprovalsQuery = useVmsApprovalsNotifications();

  const queries = [
    { key: 'gtd', query: gtdQuery },
    { key: 'notify', query: notifyQuery },
    { key: 'replicon-timesheet', query: repliconTimesheetQuery },
    { key: 'replicon-timeoff', query: repliconTimeOffQuery },
    { key: 'vms', query: vmsApprovalsQuery },
  ];

  const isLoading = queries.some((q) => q.query.isLoading);
  const hasError = queries.some((q) => q.query.error);
  const isRefetching = queries.some((q) => q.query.isRefetching);

  // Process and combine all notifications
  const processedNotifications: ProcessedNotification[] = [];

  // Process GTD
  if (gtdQuery.data && !gtdQuery.isLoading) {
    const fetchTime = gtdQuery.dataUpdatedAt
      ? new Date(gtdQuery.dataUpdatedAt)
      : new Date();
    processedNotifications.push(...processGtdNotifications(gtdQuery.data, fetchTime));
  }

  // Process Notify (aggregated source)
  if (notifyQuery.data && !notifyQuery.isLoading) {
    const fetchTime = notifyQuery.dataUpdatedAt
      ? new Date(notifyQuery.dataUpdatedAt)
      : new Date();
    processedNotifications.push(...processNotifyNotifications(notifyQuery.data, fetchTime));
  }

  // Process Replicon Timesheet
  if (repliconTimesheetQuery.data && !repliconTimesheetQuery.isLoading) {
    processedNotifications.push(...repliconTimesheetQuery.data);
  }

  // Process Replicon Time Off
  if (repliconTimeOffQuery.data && !repliconTimeOffQuery.isLoading) {
    processedNotifications.push(...repliconTimeOffQuery.data);
  }

  // Process VMS
  if (vmsApprovalsQuery.data && !vmsApprovalsQuery.isLoading) {
    processedNotifications.push(...vmsApprovalsQuery.data);
  }

  const refetch = () => {
    gtdQuery.refetch();
    notifyQuery.refetch();
    repliconTimesheetQuery.refetch();
    repliconTimeOffQuery.refetch();
    vmsApprovalsQuery.refetch();
  };

  return {
    data: processedNotifications,
    isLoading,
    hasError,
    isRefetching,
    refetch,
  };
};

// Hook to get notification count (excluding dismissed ones)
export const useNotificationCount = () => {
  const { data: notifications } = useNotifications();
  const { useNotificationStore } = require('../store');
  const dismissedIds = useNotificationStore((state: { dismissedIds: Set<string> }) => state.dismissedIds);

  const visibleCount = (notifications || []).filter(
    (notification) => !dismissedIds.has(notification.id)
  ).length;

  return visibleCount;
};

// Helper to open notification link
export const openNotificationLink = async (link?: string) => {
  if (!link) return;

  try {
    const canOpen = await Linking.canOpenURL(link);
    if (canOpen) {
      await Linking.openURL(link);
    }
  } catch (error) {
    console.error('Failed to open link:', error);
  }
};

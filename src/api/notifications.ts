import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from './fetch';
import { ENDPOINTS } from './config';
import { Linking } from 'react-native';

// Types - matches web app variants
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
  REPLICON: 'Replicon',
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
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  // Refetch on mount if data is stale
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
};

// Helper to pluralize approvals
const pluralizeApprovals = (count: number) => (count === 1 ? 'approval' : 'approvals');

// GTD Notifications Hook
export const useGtdNotifications = () => {
  return useQuery<RawNotification[]>({
    queryKey: ['notifications', 'gtd'],
    queryFn: async () => {
      const data = await apiFetchJson<RawNotification[]>(ENDPOINTS.GTD_NOTIFICATIONS);
      console.log('[Notifications] GTD:', Array.isArray(data) ? data.length : 0, 'items');
      return data;
    },
    ...notificationQueryConfig,
  });
};

// Process GTD notifications
const processGtdNotifications = (
  gtdData: RawNotification[] | undefined,
  lastFetchTime: Date
): ProcessedNotification[] => {
  if (!gtdData || !Array.isArray(gtdData)) {
    return [];
  }

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
    queryFn: async () => {
      const data = await apiFetchJson<RawNotification[]>(ENDPOINTS.NOTIFICATIONS);
      console.log('[Notifications] Notify:', Array.isArray(data) ? data.length : 0, 'items');
      return data;
    },
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
  if (!notifyData || !Array.isArray(notifyData)) {
    return [];
  }

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

// Replicon response type
interface RepliconResponse {
  d?: {
    rows?: RepliconRow[];
  };
}

interface RepliconRow {
  cells?: RepliconCell[];
}

interface RepliconCell {
  textValue?: string;
  numberValue?: number;
  slug?: string;
  dateValue?: {
    year: number;
    month: number;
    day: number;
  };
  dateRangeValue?: {
    startDate?: {
      year: number;
      month: number;
      day: number;
    };
    endDate?: {
      year: number;
      month: number;
      day: number;
    };
  };
}

// Helper to format date from Replicon
const formatDateFromReplicon = (dateValue?: { year: number; month: number; day: number }): string => {
  if (!dateValue) return '';
  const { year, month, day } = dateValue;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Replicon Timesheet Hook
export const useRepliconTimesheetNotifications = () => {
  return useQuery<ProcessedNotification[]>({
    queryKey: ['notifications', 'replicon-timesheet'],
    queryFn: async () => {
      const rawData = await apiFetchJson<RepliconResponse | RepliconRow[]>(ENDPOINTS.REPLICON_TIMESHEETS);

      // Handle both cases: data wrapped in d.rows OR data as direct array
      let data: RepliconRow[] | undefined;
      if (Array.isArray(rawData)) {
        data = rawData;
      } else {
        data = (rawData as RepliconResponse)?.d?.rows;
      }

      console.log('[Notifications] Replicon Timesheet:', data?.length || 0, 'rows');

      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter only overdue timesheets (where today > endDate)
      const notifications = data.filter((item) => {
        const endDateObj = item?.cells?.[0]?.dateRangeValue?.endDate;
        if (!endDateObj || !endDateObj.year || !endDateObj.month || !endDateObj.day) {
          return false;
        }
        // Replicon month is 1-based, JS Date month is 0-based
        const endDate = new Date(endDateObj.year, endDateObj.month - 1, endDateObj.day);
        endDate.setHours(0, 0, 0, 0);
        return today > endDate;
      });

      console.log('[Notifications] Replicon Timesheet overdue:', notifications.length);
      if (notifications.length === 0) return [];

      if (notifications.length > 1) {
        return [
          {
            id: AGGREGATED_IDS.REPLICON_TIMESHEET,
            variant: 'green' as NotificationVariant,
            tag: SERVICE_TAGS.REPLICON,
            description: `You have ${notifications.length} timesheet submissions pending in Replicon`,
            timestamp: new Date(),
            link: SERVICE_LINKS.REPLICON,
          },
        ];
      }

      return notifications.map((item, index) => {
        const dateEnd = formatDateFromReplicon(item.cells?.[3]?.dateValue);
        const periodText = item.cells?.[0]?.textValue;
        const workHours = item.cells?.[4]?.textValue;

        return {
          id: item.cells?.[2]?.slug || `replicon-timesheet-${index}`,
          variant: 'green' as NotificationVariant,
          tag: SERVICE_TAGS.REPLICON,
          description: periodText && workHours
            ? `Your timesheet for timeperiod ${periodText} is overdue with an expected work hours of ${workHours}`
            : 'Replicon timesheet overdue',
          timestamp: new Date(),
          link: dateEnd ? `${SERVICE_LINKS.REPLICON}/${dateEnd}` : SERVICE_LINKS.REPLICON,
        };
      });
    },
    ...notificationQueryConfig,
  });
};

// Replicon Time Off Hook
export const useRepliconTimeOffNotifications = () => {
  return useQuery<ProcessedNotification[]>({
    queryKey: ['notifications', 'replicon-timeoff'],
    queryFn: async () => {
      const rawData = await apiFetchJson<RepliconResponse | RepliconRow[]>(ENDPOINTS.REPLICON_TIME_OFF);

      // Handle both cases: data wrapped in d.rows OR data as direct array
      let data: RepliconRow[] | undefined;
      if (Array.isArray(rawData)) {
        data = rawData;
      } else {
        data = (rawData as RepliconResponse)?.d?.rows;
      }

      console.log('[Notifications] Replicon TimeOff:', data?.length || 0, 'rows');

      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }

      const notifications = data.filter((item) => item);
      if (notifications.length === 0) return [];

      if (notifications.length > 1) {
        return [
          {
            id: AGGREGATED_IDS.REPLICON_TIME_OFF,
            variant: 'green' as NotificationVariant,
            tag: SERVICE_TAGS.REPLICON,
            description: `You have ${notifications.length} time off approvals pending in Replicon`,
            timestamp: new Date(),
            link: SERVICE_LINKS.REPLICON,
          },
        ];
      }

      return notifications.map((item, index) => {
        const ownerName = item.cells?.[0]?.textValue?.replace(/\s*\(\d+\)/, '') || '';
        const startDate = item.cells?.[1]?.textValue || '';
        const totalDays = item.cells?.[4]?.textValue || '';
        const numDays = item.cells?.[4]?.numberValue || 0;
        const dayWord = numDays > 1 ? 'days' : 'day';

        return {
          id: item.cells?.[5]?.textValue || `replicon-timeoff-${index}`,
          variant: 'green' as NotificationVariant,
          tag: SERVICE_TAGS.REPLICON,
          description: ownerName && startDate
            ? `${ownerName} is requesting a leave approval for the time period from ${startDate} with a total of ${totalDays} ${dayWord}`
            : 'Replicon time off approval request waiting for you',
          timestamp: new Date(),
          link: SERVICE_LINKS.REPLICON,
        };
      });
    },
    ...notificationQueryConfig,
  });
};

// VMS Approval data type
interface VmsApprovalNotification {
  id?: string;
  subcontractorName?: string;
  sourceLink?: string;
}

// VMS Approvals Hook
export const useVmsApprovalsNotifications = () => {
  return useQuery<ProcessedNotification[]>({
    queryKey: ['notifications', 'vms'],
    queryFn: async () => {
      const data = await apiFetchJson<VmsApprovalNotification[]>(ENDPOINTS.VMS_APPROVALS);
      console.log('[Notifications] VMS:', Array.isArray(data) ? data.length : 0, 'approvals');
      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }

      if (data.length > 1) {
        return [
          {
            id: AGGREGATED_IDS.VMS,
            variant: 'blue' as NotificationVariant,
            tag: SERVICE_TAGS.VMS,
            description: `You have ${data.length} VMS approvals pending`,
            timestamp: new Date(),
            link: SERVICE_LINKS.VMS,
          },
        ];
      }

      return data.map((item, index) => ({
        id: item.id || `vms-${index}`,
        variant: 'blue' as NotificationVariant,
        tag: SERVICE_TAGS.VMS,
        description: item.subcontractorName
          ? `The timesheet of subcontractor ${item.subcontractorName} needs to be reviewed and approved`
          : 'VMS approval pending',
        timestamp: new Date(),
        link: item.sourceLink || SERVICE_LINKS.VMS,
      }));
    },
    ...notificationQueryConfig,
  });
};

// ============================================
// MOCK DATA FOR TESTING - Remove when backend is ready
// ============================================
const USE_MOCK_DATA = false; // Set to false to use real API

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
    variant: 'green',
    tag: SERVICE_TAGS.REPLICON,
    description: 'Your timesheet for timeperiod Dec 30, 2024 - Jan 5, 2025 is overdue with an expected work hours of 40:00',
    timestamp: new Date(),
    link: 'https://na9.replicon.com/',
  },
  {
    id: 'mock-vms-1',
    variant: 'blue',
    tag: 'VMS',
    description: 'The timesheet of subcontractor ABC Consulting needs to be reviewed and approved',
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

  // Process and combine all notifications - include data from any query that has it
  // (don't require !isLoading, so we can show cached data even during refetch)
  const processedNotifications: ProcessedNotification[] = [];

  // Process GTD (only if we have data)
  if (gtdQuery.data) {
    const fetchTime = gtdQuery.dataUpdatedAt
      ? new Date(gtdQuery.dataUpdatedAt)
      : new Date();
    const gtdProcessed = processGtdNotifications(gtdQuery.data, fetchTime);
    processedNotifications.push(...gtdProcessed);
  }

  // Process Notify (aggregated source)
  if (notifyQuery.data) {
    const fetchTime = notifyQuery.dataUpdatedAt
      ? new Date(notifyQuery.dataUpdatedAt)
      : new Date();
    const notifyProcessed = processNotifyNotifications(notifyQuery.data, fetchTime);
    processedNotifications.push(...notifyProcessed);
  }

  // Process Replicon Timesheet
  if (repliconTimesheetQuery.data) {
    processedNotifications.push(...repliconTimesheetQuery.data);
  }

  // Process Replicon Time Off
  if (repliconTimeOffQuery.data) {
    processedNotifications.push(...repliconTimeOffQuery.data);
  }

  // Process VMS
  if (vmsApprovalsQuery.data) {
    processedNotifications.push(...vmsApprovalsQuery.data);
  }

  // Debug log (can be removed later)
  console.log('[Notifications] Combined:', processedNotifications.length, 'notifications');

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

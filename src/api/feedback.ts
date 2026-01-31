import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, ENDPOINTS } from './config';
import { usePopupStore } from '../store';

export interface FeedbackRequest {
  session_id?: string;
  message_id?: string;
  feedback: 'positive' | 'negative';
  feedback_msg: string;
  user_id?: string;
}

export interface FeedbackResponse {
  status: string;
  message: string;
  result: string;
}

/**
 * Send feedback for an AI message
 * Matches web app implementation in feedback.ts
 */
export const useMutateSendFeedback = () => {
  const queryClient = useQueryClient();
  const { addToast } = usePopupStore();
  const user = queryClient.getQueryData<{ email: string }>(['user']);

  return useMutation<
    FeedbackResponse,
    Error,
    Omit<FeedbackRequest, 'user_id'> & {
      onSuccess?: () => void;
    }
  >({
    mutationFn: async ({ session_id, message_id, feedback, feedback_msg, onSuccess }) => {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.FEEDBACK}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
          message_id,
          feedback,
          feedback_msg,
          user_id: user?.email || 'anonymous@example.com',
        }),
      });

      if (!response.ok) {
        addToast({
          variant: 'danger',
          label: 'Unable to send feedback',
        });
        throw new Error('Failed to send feedback');
      }

      addToast({
        variant: 'default',
        label: 'Thank you for your feedback',
      });

      onSuccess?.();
      return response.json();
    },
  });
};

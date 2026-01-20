import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

interface StockPrice {
  price: number;
  change_pc: number;
}

interface StockPriceResponse {
  stock_price: StockPrice;
}

/**
 * Fetch Capgemini stock price
 * Refetches every 4 hours to match web app behavior
 */
export const useGetStockPrice = () => {
  return useQuery<StockPriceResponse>({
    queryKey: ['stockPrice'],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.STOCK_PRICE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch stock price');
      }
      return response.json();
    },
    refetchInterval: 4 * 60 * 60 * 1000, // 4 hours
    staleTime: 4 * 60 * 60 * 1000, // Consider data fresh for 4 hours
    retry: 2,
  });
};

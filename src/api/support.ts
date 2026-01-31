import { useQuery } from '@tanstack/react-query';
import { WORDPRESS_URL } from './env';
import { getOrFetchJwt } from './sessionToken';

// Support API endpoint
const SUPPORT_API = `${WORDPRESS_URL}/wp-json/cg-neo/v1/block-data?slug=support-overview-page&post_type=page`;

// Types for support data
export interface SupportCardAttributes {
  title: string;
  description?: string;
  supportCategoryId?: string;
  articleCount?: number;
}

export interface SupportBlock {
  name: string;
  attributes?: Record<string, unknown>;
  innerBlocks?: SupportBlock[];
}

export interface SupportData {
  blocks: SupportBlock[];
}

/**
 * Fetch from WordPress with authentication
 */
const fetchWordPress = async (url: string): Promise<Response> => {
  // Get JWT token for authentication
  const token = await getOrFetchJwt();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('[Support API] Fetching:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  console.log('[Support API] Response status:', response.status);
  return response;
};

/**
 * Fetch support overview content from WordPress
 */
export const useSupportOverview = () => {
  return useQuery<SupportData>({
    queryKey: ['supportOverview'],
    queryFn: async () => {
      try {
        const response = await fetchWordPress(SUPPORT_API);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Support API] Error response:', errorText);
          throw new Error(`Failed to load support content. Status: ${response.status}`);
        }
        const data = await response.json();
        return data?.block_data;
      } catch (error) {
        console.error('[Support API] Fetch error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

/**
 * Helper to find a block by name from support data
 */
export const findBlock = (blocks: SupportBlock[] | undefined, name: string): SupportBlock | undefined => {
  return blocks?.find((b) => b.name.includes(name));
};

/**
 * Helper to strip HTML tags from description
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]+>/g, '');
};

// Terms and Conditions types
export interface TermsData {
  id: string;
  title: string;
  content: string;
}

interface TermsBlockData {
  blocks?: Array<{
    name: string;
    attributes?: {
      content?: string;
      ordered?: boolean;
    };
    innerBlocks?: Array<{
      name: string;
      attributes?: {
        content?: string;
        ordered?: boolean;
      };
      innerBlocks?: Array<{
        name: string;
        attributes?: { content?: string };
        innerBlocks?: Array<{
          name: string;
          attributes?: { ordered?: boolean };
          innerBlocks?: Array<{ attributes?: { content?: string }; innerBlocks?: any[] }>;
        }>;
      }>;
    }>;
  }>;
}

interface TermsApiResponse {
  ID?: number;
  title?: string;
  block_data?: TermsBlockData;
}

// Helper to render list items recursively
const renderListItems = (items: any[] = []): string => {
  return items
    .map((item) => {
      const itemText = item.attributes?.content?.trim() ?? '';
      let nestedHtml = '';

      if (Array.isArray(item.innerBlocks) && item.innerBlocks.length > 0) {
        item.innerBlocks.forEach((nestedBlock: any) => {
          if (nestedBlock.name === 'core/list') {
            const nestedItems = renderListItems(nestedBlock.innerBlocks ?? []);
            if (!nestedItems.trim()) return;
            const nestedTag = nestedBlock.attributes?.ordered ? 'ol' : 'ul';
            nestedHtml += `<${nestedTag}>${nestedItems}</${nestedTag}>`;
          }
        });
      }

      if (!itemText && !nestedHtml) return '';

      if (itemText) {
        return `<li>${itemText}${nestedHtml}</li>`;
      }
      return nestedHtml;
    })
    .filter(Boolean)
    .join('');
};

// Helper to render list blocks
const renderListBlock = (innerBlock: any): string => {
  if (innerBlock.name !== 'core/list') return '';
  const listItems = renderListItems(innerBlock.innerBlocks ?? []);
  if (!listItems.trim()) return '';
  const listTag = innerBlock.attributes?.ordered ? 'ol' : 'ul';
  return `<${listTag}>${listItems}</${listTag}>`;
};

// Normalize terms post data
const normalizeTermsPost = (post: TermsApiResponse): TermsData => {
  const blocks = post.block_data?.blocks || [];
  const postWithInnerBlock = blocks.find((block) => block.innerBlocks);
  const baseContent =
    blocks.find((b) => b?.attributes?.content)?.attributes?.content ?? '';

  if (!postWithInnerBlock) {
    return {
      id: String(post.ID ?? Math.random().toString(36).substr(2, 9)),
      title: post.title ?? 'Untitled',
      content: baseContent,
    };
  }

  const intro = postWithInnerBlock.attributes?.content?.trim();
  let content = intro ? `<p>${intro}</p>` : '';

  postWithInnerBlock.innerBlocks?.forEach((innerBlock) => {
    if (innerBlock.name === 'core/paragraph') {
      const para = innerBlock.attributes?.content?.trim();
      if (para) content += `<p>${para}</p>`;
      return;
    }
    if (innerBlock.name === 'core/list') {
      content += renderListBlock(innerBlock);
    }
  });

  return {
    id: String(post.ID ?? Math.random().toString(36).substr(2, 9)),
    title: post.title ?? 'Untitled',
    content: content || baseContent,
  };
};

/**
 * Build terms URL with locale support
 */
const buildTermsUrl = (locale?: string): string => {
  const langMap: Record<string, string> = {
    en: '',
    fr: 'fr-fr',
    de: 'de-de',
    es: 'es-es',
    pl: 'pl-pl',
  };
  const wpLang = locale ? (langMap[locale] ?? '') : '';
  const prefix = wpLang ? `/${wpLang}` : '';
  return `${WORDPRESS_URL}${prefix}/wp-json/cg-neo/v1/block-data?slug=terms-and-conditions&post_type=page`;
};

const DEFAULT_TERMS_DATA: TermsData = {
  id: 'default',
  title: '',
  content: '',
};

/**
 * Fetch terms and conditions content from WordPress
 */
export const useTermsAndConditionsPage = (locale: string = 'en') => {
  const termsUrl = buildTermsUrl(locale);

  const queryResult = useQuery<TermsData>({
    queryKey: ['termsAndConditionsPage', locale],
    queryFn: async () => {
      try {
        const response = await fetchWordPress(termsUrl);
        if (!response.ok) {
          console.error('[Terms API] Error status:', response.status);
          throw new Error('Failed to load terms & conditions content.');
        }
        const json: TermsApiResponse = await response.json();

        if (!json?.block_data) return DEFAULT_TERMS_DATA;

        return normalizeTermsPost(json);
      } catch (error) {
        console.error('[Terms API] Fetch error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return { ...queryResult, locale, termsUrl };
};

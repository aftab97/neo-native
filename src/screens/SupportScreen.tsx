import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { t } from 'ttag';
import { useLayoutStore } from '../store';
import { useSupportOverview, findBlock, stripHtml, SupportBlock } from '../api/support';
import { ChevronLeftIcon } from '../components/icons';
import { colors } from '../theme/colors';

/**
 * SupportScreen - Help & FAQ page matching web app design
 * Displays support categories as cards in a responsive grid
 */
export const SupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const { data: supportData, isLoading, isError, error } = useSupportOverview();

  // Theme colors matching web app
  const backgroundColor = isDarkTheme ? '#17191f' : '#f5f6f8';
  const cardBg = isDarkTheme ? colors.gray['900'] : colors.gray['000'];
  const cardBorder = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const textPrimary = isDarkTheme ? colors.gray['100'] : colors.gray['900']; // text-100
  const textSecondary = isDarkTheme ? colors.gray['200'] : colors.gray['700']; // text-200
  const textTertiary = isDarkTheme ? colors.gray['400'] : colors.gray['500']; // text-300
  const accentColor = colors.blue['700'];

  // Extract header and cards from support data
  const headerBlock = findBlock(supportData?.blocks, 'page-header');
  const cardWrapper = findBlock(supportData?.blocks, 'article-card-wrapper');
  const supportCards: SupportBlock[] = cardWrapper?.innerBlocks || [];

  // Calculate number of columns based on screen width
  const numColumns = width >= 768 ? 3 : width >= 480 ? 2 : 1;
  const cardWidth = numColumns === 1
    ? '100%'
    : numColumns === 2
      ? (width - 48 - 16) / 2 // 48 = padding, 16 = gap
      : (width - 48 - 32) / 3; // 48 = padding, 32 = 2 gaps

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCardPress = (categoryId: string, title: string) => {
    // Navigate to article list for this category
    // For now, just log - can be implemented later
    console.log('Navigate to category:', categoryId, title);
  };

  const renderCard = (card: SupportBlock, index: number) => {
    const attrs = card.attributes || {};
    const title = String(attrs.title ?? '');
    const description = attrs.description
      ? stripHtml(String(attrs.description))
      : t`No description`;
    const supportCategoryId = String(attrs.supportCategoryId ?? '');
    const articleCount = typeof attrs.articleCount === 'number' ? attrs.articleCount : undefined;

    if (!title) return null;

    return (
      <TouchableOpacity
        key={`${title}-${index}`}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            width: numColumns === 1 ? '100%' : cardWidth,
          },
        ]}
        onPress={() => handleCardPress(supportCategoryId, title)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: textPrimary }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[styles.cardDescription, { color: textTertiary }]}
            numberOfLines={3}
          >
            {description}
          </Text>
        </View>
        {articleCount !== undefined && (
          <Text style={[styles.cardFooter, { color: textTertiary }]}>
            {articleCount} {t`articles`}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: cardBorder }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>{t`Support`}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.red['500'] }]}>
            {error instanceof Error ? error.message : t`Failed to load support content.`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeftIcon size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>{t`Support`}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header Section */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: textPrimary }]}>
            {String(headerBlock?.attributes?.title || t`Support`)}
          </Text>
          {headerBlock?.attributes?.description && (
            <Text style={[styles.pageDescription, { color: textSecondary }]}>
              {String(headerBlock.attributes.description)}
            </Text>
          )}
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsContainer}>
          {supportCards
            .filter((card) => typeof card?.attributes?.title === 'string')
            .map((card, index) => renderCard(card, index))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24, // pt-5 equivalent on mobile
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  pageHeader: {
    marginBottom: 32, // gap-8
  },
  pageTitle: {
    fontSize: 36, // text-4xl
    fontWeight: '400', // font-normal
    letterSpacing: -0.32, // tracking-[-0.02rem]
    marginBottom: 24, // gap-6
  },
  pageDescription: {
    fontSize: 18, // text-lg
    fontWeight: '400',
    lineHeight: 26,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // gap-4
  },
  card: {
    borderWidth: 1,
    borderRadius: 16, // rounded-2xl
    padding: 24, // p-6
    height: 200, // h-50 (200px)
    justifyContent: 'space-between',
  },
  cardContent: {
    gap: 16, // gap-4
  },
  cardTitle: {
    fontSize: 16, // text-md
    fontWeight: '400', // font-normal
    lineHeight: 22, // leading-[1.35]
  },
  cardDescription: {
    fontSize: 14, // text-sm
    fontWeight: '400',
    lineHeight: 19, // leading-[1.35]
  },
  cardFooter: {
    fontSize: 14, // text-sm
    fontWeight: '400',
    marginTop: 16, // mt-4
  },
});

export default SupportScreen;

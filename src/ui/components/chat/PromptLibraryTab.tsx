import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ANIMATION_DURATION = 250;
import { useGetPrompts, PromptLibraryPrompt } from '../../../api/promptLibrary';
import { useLayoutStore } from '../../../store';
import { useChatStore } from '../../../store/chatStore';
import { useAvailableServices } from '../../../hooks';
import { AGENTS } from '../agents/agents';
import { colors } from '../../foundation/colors/colors';
import {
  SearchIcon,
  CloseIcon,
  PromptLibraryIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '../../foundation/icons';

type ScreenType = 'categories' | 'prompts';

// Category info derived from AGENTS config
interface CategoryInfo {
  id: string;
  name: string;
  categoryName: string;
  promptCount: number;
}

interface PromptLibraryTabProps {
  onSelectPrompt: () => void;
  onBack: () => void;
}

export const PromptLibraryTab: React.FC<PromptLibraryTabProps> = ({
  onSelectPrompt,
  onBack,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const { services: availableServices, isLoading: isServicesLoading } = useAvailableServices();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('categories');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);

  // Animation value for slide transition
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { data, isLoading: isPromptsLoading, isError, refetch } = useGetPrompts();

  const isLoading = isPromptsLoading || isServicesLoading;

  // Theme colors - matching web app exactly
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryTextColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const borderColor = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const accentColor = colors.blue['700'];
  const tileBackground = isDarkTheme ? colors.gray['800'] : colors.gray['100'];
  const cardBgColor = isDarkTheme ? colors.gray['800'] : colors.gray['000'];
  const badgeBgColor = isDarkTheme ? colors.gray['700'] : colors.gray['100'];

  // Input colors matching web app's input.css
  const inputBgColor = isDarkTheme ? colors.gray['1000'] : colors.gray['000'];
  const inputTextColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const inputPlaceholderColor = isDarkTheme ? colors.gray['600'] : colors.gray['400'];
  const inputBorderColor = isDarkTheme ? colors.gray['800'] : colors.gray['300'];
  const inputIconColor = isDarkTheme ? colors.gray['400'] : colors.gray['500'];

  // Get prompt count per category (using categoryName from prompts)
  const promptCountsByCategory = useMemo(() => {
    if (!data?.prompts) return {};
    return data.prompts.reduce((acc, prompt) => {
      acc[prompt.agent] = (acc[prompt.agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data?.prompts]);

  // Get categories from AGENTS config, filtered by RBAC and only those with prompts
  // Maintains AGENTS order (source of truth)
  const categories = useMemo((): CategoryInfo[] => {
    if (!data?.prompts) return [];

    // Get available agents based on RBAC, only those with categoryName defined
    const availableAgents = availableServices.length === 0
      ? AGENTS.filter((agent) => agent.categoryName) // Show all with categoryName if services not loaded yet
      : AGENTS.filter((agent) => agent.categoryName && availableServices.includes(agent.id));

    // Map to CategoryInfo - show all agents (even with 0 prompts) to match web app
    return availableAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      categoryName: agent.categoryName!, // Safe: filtered above
      promptCount: promptCountsByCategory[agent.categoryName!] || 0,
    }));
  }, [data?.prompts, availableServices, promptCountsByCategory]);

  // Filter prompts based on search and category
  const filteredPrompts = useMemo(() => {
    if (!data?.prompts) return [];

    return data.prompts.filter((prompt) => {
      // Category filter (when on prompts screen)
      if (selectedCategory && prompt.agent !== selectedCategory.categoryName) {
        return false;
      }

      // Search filter
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          prompt.title.toLowerCase().includes(search) ||
          prompt.prompt.toLowerCase().includes(search) ||
          prompt.agent.toLowerCase().includes(search) ||
          prompt.subCategory.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [data?.prompts, selectedCategory, searchText]);

  // Filter categories based on search (when on categories screen)
  const filteredCategories = useMemo(() => {
    if (!searchText) return categories;
    const search = searchText.toLowerCase();
    return categories.filter((cat) =>
      cat.categoryName.toLowerCase().includes(search) ||
      cat.name.toLowerCase().includes(search)
    );
  }, [categories, searchText]);

  const handleSelectPrompt = (prompt: PromptLibraryPrompt) => {
    setInputValue(prompt.prompt);
    onSelectPrompt();
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  const handleCategorySelect = (category: CategoryInfo) => {
    setSelectedCategory(category);
    setCurrentScreen('prompts');
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const handleBackToCategories = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      setSelectedCategory(null);
      setCurrentScreen('categories');
    });
  };

  const handleBackPress = () => {
    if (currentScreen === 'prompts') {
      handleBackToCategories();
    } else {
      onBack();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header
          title="Prompts"
          onBack={onBack}
          textColor={textColor}
          borderColor={borderColor}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Loading prompts...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.container}>
        <Header
          title="Prompts"
          onBack={onBack}
          textColor={textColor}
          borderColor={borderColor}
        />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.red['500'] }]}>
            Failed to load prompts
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: accentColor }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state (no prompts available)
  if (!data?.prompts || data.prompts.length === 0) {
    return (
      <View style={styles.container}>
        <Header
          title="Prompts"
          onBack={onBack}
          textColor={textColor}
          borderColor={borderColor}
        />
        <View style={styles.centerContainer}>
          <PromptLibraryIcon size={48} color={secondaryTextColor} />
          <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
            No prompts available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <Header
        title={currentScreen === 'categories' ? 'Prompts' : selectedCategory?.categoryName || 'Prompts'}
        onBack={handleBackPress}
        textColor={textColor}
        borderColor={borderColor}
      />

      {/* Search Input - matching web app styling */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            { backgroundColor: inputBgColor, borderColor: inputBorderColor },
          ]}
        >
          <SearchIcon size={20} color={inputIconColor} />
          <TextInput
            style={[styles.searchInput, { color: inputTextColor }]}
            placeholder="Search for prompts"
            placeholderTextColor={inputPlaceholderColor}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon size={18} color={inputIconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content based on current screen - animated */}
      {(() => {
        const categoriesTranslateX = slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -SCREEN_WIDTH],
        });
        const promptsTranslateX = slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_WIDTH, 0],
        });

        return (
          <View style={styles.contentContainer}>
            {/* Categories List Screen */}
            <Animated.View
              style={[
                styles.animatedScreen,
                { transform: [{ translateX: categoriesTranslateX }] },
              ]}
              pointerEvents={currentScreen === 'categories' ? 'auto' : 'none'}
            >
              <ScrollView
                style={styles.contentScroll}
                showsVerticalScrollIndicator={false}
              >
                {filteredCategories.length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <SearchIcon size={32} color={secondaryTextColor} />
                    <Text style={[styles.noResultsText, { color: secondaryTextColor }]}>
                      No categories match your search
                    </Text>
                  </View>
                ) : (
                  filteredCategories.map((category, index) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryRow,
                        { borderBottomColor: index === filteredCategories.length - 1 ? 'transparent' : borderColor },
                      ]}
                      onPress={() => handleCategorySelect(category)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: tileBackground }]}>
                        <PromptLibraryIcon size={22} color={accentColor} />
                      </View>
                      <View style={styles.categoryContent}>
                        <Text style={[styles.categoryTitle, { color: textColor }]} numberOfLines={1}>
                          {category.categoryName}
                        </Text>
                        <Text style={[styles.categorySubtitle, { color: secondaryTextColor }]}>
                          {category.promptCount} prompts
                        </Text>
                      </View>
                      <ChevronRightIcon size={20} color={secondaryTextColor} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Animated.View>

            {/* Filtered Prompts Screen */}
            <Animated.View
              style={[
                styles.animatedScreen,
                styles.promptsScreen,
                { transform: [{ translateX: promptsTranslateX }] },
              ]}
              pointerEvents={currentScreen === 'prompts' ? 'auto' : 'none'}
            >
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.promptsListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredPrompts.length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <SearchIcon size={32} color={secondaryTextColor} />
                    <Text style={[styles.noResultsText, { color: secondaryTextColor }]}>
                      No prompts match your search
                    </Text>
                  </View>
                ) : (
                  filteredPrompts.map((prompt, index) => (
                    <TouchableOpacity
                      key={`${prompt.agent}-${prompt.title}-${index}`}
                      style={[
                        styles.promptCard,
                        { backgroundColor: cardBgColor, borderColor },
                      ]}
                      onPress={() => handleSelectPrompt(prompt)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.promptTitle, { color: textColor }]}
                        numberOfLines={2}
                      >
                        {prompt.title}
                      </Text>
                      <Text
                        style={[styles.promptPreview, { color: secondaryTextColor }]}
                        numberOfLines={3}
                      >
                        {prompt.prompt}
                      </Text>
                      <View style={styles.promptMeta}>
                        <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
                          <Text
                            style={[styles.badgeText, { color: secondaryTextColor }]}
                            numberOfLines={1}
                          >
                            {prompt.subCategory}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </View>
        );
      })()}
    </View>
  );
};

// Header component with back button
interface HeaderProps {
  title: string;
  onBack: () => void;
  textColor: string;
  borderColor: string;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, textColor, borderColor }) => (
  <View style={[styles.header, { borderBottomColor: borderColor }]}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <ChevronLeftIcon size={24} color={textColor} />
    </TouchableOpacity>
    <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
      {title}
    </Text>
    <View style={styles.headerSpacer} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  animatedScreen: {
    flex: 1,
  },
  promptsScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40, // Same as back button for centering
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12, // rounded-xl
    paddingLeft: 12, // pl-3
    paddingRight: 12,
    borderWidth: 1,
    gap: 8, // gap-2
  },
  searchInput: {
    flex: 1,
    fontSize: 14, // text-sm (0.875rem = 14px)
    height: '100%',
    fontWeight: '400',
  },
  contentScroll: {
    flex: 1,
  },
  // Category row styles (similar to action rows)
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
  },
  // Prompts list styles
  promptsListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 14,
  },
  promptCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  promptTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  promptPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  promptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

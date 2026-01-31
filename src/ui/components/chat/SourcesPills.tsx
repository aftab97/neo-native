import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { useLayoutStore } from '../../../store';
import { colors } from '../../foundation/colors/colors';
import { CloseIcon, SourceIcon, GoogleLogo, FileSpreadsheetIcon } from '../../foundation/icons';
import { SlideoutDrawer } from '../common';

// Source type matching web app
export type Source = {
  title: string;
  url: string;
  type: string;
};

interface SuggestedSearch {
  title: string;
  source_url: string;
}

interface SourcesPillsProps {
  metadata?: Record<string, unknown>;
}

/**
 * Get source type from file extension - matches web app logic
 */
const getSourceType = (ext: string): string => {
  switch (ext.toLowerCase()) {
    case 'ppt':
    case 'pptx':
      return 'PowerPoint';
    case 'pdf':
      return 'PDF';
    case 'doc':
    case 'docx':
      return 'Word';
    case 'xls':
    case 'xlsx':
      return 'Excel';
    default:
      return ext ? ext.toUpperCase() : 'Source';
  }
};

/**
 * Extract all sources from metadata - matches web app logic exactly
 */
const extractAllSources = (metadata: any): Source[] => {
  if (!metadata?.sources) return [];

  return metadata.sources.map((src: any) => {
    const { title = '', source_url = '' } = src;
    const lastDot = title.lastIndexOf('.');
    let ext = '';
    if (lastDot !== -1 && lastDot < title.length - 1) {
      ext = title.substring(lastDot + 1);
    }
    return {
      title,
      url: source_url,
      type: ext ? getSourceType(ext) : 'Source',
    };
  });
};

/**
 * SourcesPills - Displays sources and suggested search buttons
 * Matches the web app styling with pill-shaped buttons
 */
export const SourcesPills: React.FC<SourcesPillsProps> = ({ metadata }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Extract sources using web app's exact logic
  const sourceObjects = extractAllSources(metadata);
  const sourceObjectsLength = sourceObjects.length;

  // Extract suggested searches
  const suggestedSearches = (metadata?.suggested_search as SuggestedSearch[]) || [];

  // Theme colors - matching web app's pillClasses
  const pillBg = isDarkTheme ? colors.gray['900'] : colors.gray['000'];
  const pillText = isDarkTheme ? colors.gray['200'] : colors.gray['700'];
  const pillBorder = isDarkTheme ? colors.gray['700'] : colors.gray['200'];
  const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];
  const secondaryText = isDarkTheme ? colors.gray['400'] : colors.gray['500'];
  const linkColor = isDarkTheme ? colors.blue['400'] : colors.blue['600'];
  const surfaceHighlight = isDarkTheme ? colors.gray['800'] : colors.gray['100'];

  // If no sources or suggested searches, don't render
  if (sourceObjectsLength === 0 && suggestedSearches.length === 0) {
    return null;
  }

  const handleOpenUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sources Button - matches web app's SourcesButton component */}
      {sourceObjectsLength > 0 && (
        <TouchableOpacity
          style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}
          onPress={() => setIsSourceModalOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <SourceIcon size={16} />
          </View>
          <Text style={[styles.pillText, { color: pillText }]}>
            {sourceObjectsLength}
            {sourceObjectsLength === 1 ? ' source' : ' sources'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Suggested Search Buttons (max 2) - matches web app */}
      {suggestedSearches.slice(0, 2).map((search, idx) => (
        <TouchableOpacity
          key={`search-${idx}`}
          style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}
          onPress={() => handleOpenUrl(search.source_url)}
          activeOpacity={0.7}
        >
          <View style={styles.googleIconWrapper}>
            <GoogleLogo size={12} />
          </View>
          <Text style={[styles.pillText, { color: pillText }]} numberOfLines={1}>
            {search.title}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Source Modal - using shared SlideoutDrawer component */}
      <SlideoutDrawer
        visible={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        maxHeightPercent={0.7}
        expandable={false}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            Sources
          </Text>
          <TouchableOpacity
            onPress={() => setIsSourceModalOpen(false)}
            style={styles.closeButton}
          >
            <CloseIcon size={20} color={secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Sources List - matches web app's source-modal styling */}
        <ScrollView
          style={styles.sourcesList}
          contentContainerStyle={styles.sourcesListContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {sourceObjects.map((source, idx) => (
            <TouchableOpacity
              key={`${idx}-${source.url}`}
              style={styles.sourceItem}
              onPress={() => handleOpenUrl(source.url)}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View style={[styles.sourceIconWrapper, { backgroundColor: surfaceHighlight }]}>
                <FileSpreadsheetIcon size={16} color={linkColor} />
              </View>

              {/* Source details */}
              <View style={styles.sourceDetails}>
                <Text
                  style={[styles.sourceTitle, { color: textColor }]}
                  numberOfLines={1}
                >
                  {source.title}
                </Text>
                <View style={styles.sourceMetaRow}>
                  <Text style={[styles.sourceType, { color: secondaryText }]}>
                    {source.type}
                  </Text>
                  <Text style={[styles.sourceDot, { color: secondaryText }]}> • </Text>
                  <Text
                    style={[styles.sourceUrl, { color: secondaryText }]}
                    numberOfLines={1}
                  >
                    {source.url}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SlideoutDrawer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  // Pill styles - matching web app's pillClasses
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '400',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  // Google icon with white background - matches web app
  googleIconWrapper: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0.5,
    paddingLeft: 0.5,
  },
  // Modal content styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  sourcesList: {
    flex: 1,
    paddingHorizontal: 6,
  },
  sourcesListContent: {
    paddingBottom: 40,
    gap: 12,
  },
  // Source item - matches web app's source-modal styling
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
    borderRadius: 16,
  },
  sourceIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sourceDetails: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  sourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceType: {
    fontSize: 14,
  },
  sourceDot: {
    fontSize: 14,
  },
  sourceUrl: {
    fontSize: 14,
    flex: 1,
  },
});

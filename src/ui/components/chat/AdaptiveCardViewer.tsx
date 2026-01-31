import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  TextStyle,
} from 'react-native';
import { useLayoutStore } from '../../store';
import { colors } from '../../theme/colors';

interface AdaptiveCardViewerProps {
  content: any;
  onSubmit?: (data: any) => void;
}

type TextSize = 'small' | 'default' | 'medium' | 'large' | 'extraLarge';
type ImageSize = 'small' | 'medium' | 'large' | 'auto' | 'stretch';

const fontSizeMap: Record<TextSize, number> = {
  small: 12,
  default: 14,
  medium: 16,
  large: 20,
  extraLarge: 24,
};

const imageSizeMap: Record<ImageSize, number | string | undefined> = {
  small: 40,
  medium: 80,
  large: 160,
  auto: undefined,
  stretch: '100%',
};

/**
 * Custom Adaptive Card renderer for React Native
 * Handles common adaptive card elements without requiring native modules
 * Based on Microsoft Adaptive Cards schema: https://adaptivecards.io/explorer/
 */
export const AdaptiveCardViewer: React.FC<AdaptiveCardViewerProps> = ({
  content,
  onSubmit,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const themeColors = {
    text: isDarkTheme ? colors.gray['000'] : colors.gray['900'],
    textSecondary: isDarkTheme ? colors.gray['400'] : colors.gray['500'],
    textAccent: colors.blue['600'],
    textAttention: colors.red['500'],
    textGood: colors.green['600'],
    textWarning: colors.yellow['600'],
    background: isDarkTheme ? colors.gray['800'] : colors.gray['100'],
    buttonBg: colors.blue['700'],
    buttonText: colors.gray['000'],
    border: isDarkTheme ? colors.gray['700'] : colors.gray['200'],
  };

  // Parse content if it's a string
  const card = typeof content === 'string' ? JSON.parse(content) : content;

  // Handle action press
  const handleAction = (action: any) => {
    if (action.type === 'Action.OpenUrl' && action.url) {
      Linking.openURL(action.url);
    } else if (action.type === 'Action.Submit') {
      onSubmit?.(action.data || {});
    }
  };

  // Get text color based on adaptive card color property
  const getTextColor = (colorName: string): string => {
    switch (colorName) {
      case 'accent':
        return themeColors.textAccent;
      case 'attention':
        return themeColors.textAttention;
      case 'good':
        return themeColors.textGood;
      case 'warning':
        return themeColors.textWarning;
      default:
        return themeColors.text;
    }
  };

  // Render a TextBlock element
  const renderTextBlock = (element: any, key: string) => {
    const size: TextSize = element.size || 'default';
    const weight = element.weight || 'default';
    const color = element.color || 'default';

    const fontSize = fontSizeMap[size] || 14;
    const fontWeight: TextStyle['fontWeight'] = weight === 'bolder' ? '600' : '400';
    const textColor = getTextColor(color);

    const textStyle: TextStyle = {
      fontSize,
      fontWeight,
      color: textColor,
      textAlign: element.horizontalAlignment || 'left',
      marginBottom: 8,
    };

    return (
      <Text
        key={key}
        style={[styles.textBlock, textStyle]}
        numberOfLines={element.wrap === false ? 1 : undefined}
      >
        {element.text}
      </Text>
    );
  };

  // Render an Image element
  const renderImage = (element: any, key: string) => {
    const size: ImageSize = element.size || 'auto';
    const dimension = imageSizeMap[size];

    return (
      <Image
        key={key}
        source={{ uri: element.url }}
        style={[
          styles.image,
          {
            width: dimension as any,
            height: dimension as any,
            alignSelf: element.horizontalAlignment === 'center' ? 'center' :
                       element.horizontalAlignment === 'right' ? 'flex-end' : 'flex-start',
          },
        ]}
        resizeMode="contain"
      />
    );
  };

  // Render an ActionSet
  const renderActionSet = (element: any, key: string) => {
    return (
      <View key={key} style={styles.actionSet}>
        {element.actions?.map((action: any, idx: number) => (
          <TouchableOpacity
            key={`${key}-action-${idx}`}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.style === 'destructive'
                  ? colors.red['600']
                  : themeColors.buttonBg,
              },
            ]}
            onPress={() => handleAction(action)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render a Container element
  const renderContainer = (element: any, key: string) => {
    return (
      <View
        key={key}
        style={[
          styles.containerElement,
          element.style === 'emphasis' && { backgroundColor: themeColors.background },
          element.separator && { borderTopWidth: 1, borderTopColor: themeColors.border },
        ]}
      >
        {element.items?.map((item: any, idx: number) => renderElement(item, `${key}-item-${idx}`))}
      </View>
    );
  };

  // Render a ColumnSet element
  const renderColumnSet = (element: any, key: string) => {
    return (
      <View key={key} style={styles.columnSet}>
        {element.columns?.map((column: any, idx: number) => (
          <View
            key={`${key}-col-${idx}`}
            style={[
              styles.column,
              column.width === 'stretch' && { flex: 1 },
              column.width === 'auto' && { flex: 0 },
              typeof column.width === 'number' && { flex: column.width },
            ]}
          >
            {column.items?.map((item: any, itemIdx: number) =>
              renderElement(item, `${key}-col-${idx}-item-${itemIdx}`)
            )}
          </View>
        ))}
      </View>
    );
  };

  // Render a FactSet element
  const renderFactSet = (element: any, key: string) => {
    return (
      <View key={key} style={styles.factSet}>
        {element.facts?.map((fact: any, idx: number) => (
          <View key={`${key}-fact-${idx}`} style={styles.factRow}>
            <Text style={[styles.factTitle, { color: themeColors.textSecondary }]}>
              {fact.title}
            </Text>
            <Text style={[styles.factValue, { color: themeColors.text }]}>
              {fact.value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Main element renderer
  const renderElement = (element: any, key: string): React.ReactNode => {
    if (!element || !element.type) return null;

    switch (element.type) {
      case 'TextBlock':
        return renderTextBlock(element, key);
      case 'Image':
        return renderImage(element, key);
      case 'ActionSet':
        return renderActionSet(element, key);
      case 'Container':
        return renderContainer(element, key);
      case 'ColumnSet':
        return renderColumnSet(element, key);
      case 'FactSet':
        return renderFactSet(element, key);
      default:
        // For unsupported elements, try to render children
        if (element.items) {
          return (
            <View key={key}>
              {element.items.map((item: any, idx: number) =>
                renderElement(item, `${key}-child-${idx}`)
              )}
            </View>
          );
        }
        return null;
    }
  };

  // Render the card body
  const renderBody = () => {
    if (!card.body) return null;
    return card.body.map((element: any, idx: number) =>
      renderElement(element, `body-${idx}`)
    );
  };

  // Render card actions
  const renderActions = () => {
    if (!card.actions || card.actions.length === 0) return null;
    return (
      <View style={styles.cardActions}>
        {card.actions.map((action: any, idx: number) => (
          <TouchableOpacity
            key={`card-action-${idx}`}
            style={[styles.actionButton, { backgroundColor: themeColors.buttonBg }]}
            onPress={() => handleAction(action)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.card, { borderColor: themeColors.border }]}>
      {renderBody()}
      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  textBlock: {
    // Base styles, specific styles applied inline
  },
  image: {
    marginVertical: 8,
    borderRadius: 8,
  },
  actionSet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  containerElement: {
    marginVertical: 4,
    padding: 8,
    borderRadius: 8,
  },
  columnSet: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  column: {
    flex: 1,
  },
  factSet: {
    marginVertical: 8,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  factTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  factValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});

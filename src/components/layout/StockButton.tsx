import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { useLayoutStore } from '../../store';
import { useGetStockPrice } from '../../api';

// Daily logo assets (PNG extracted from SVG)
const dailyLogoLight = require('../../../assets/daily-logo.png');
const dailyLogoDark = require('../../../assets/daily-logo-dark.png');

// Color constants matching web app
const colors = {
  // Text colors
  text100Light: '#21232c',
  text100Dark: '#f0f2f6',
  text200Light: '#363b49',
  text200Dark: '#4c5366',
  text300Light: '#646b82',
  text300Dark: '#929aaf',
  // Badge colors
  greenLight: '#d4f7e5',
  greenDark: '#006633',
  redLight: '#ffe5ea',
  redDark: '#4d000d',
  grayLight: '#e2e5ee',
  grayDark: '#21232c',
};

const DAILY_URL = 'https://capgemini.sharepoint.com/sites/HomeSite/';

/**
 * StockButton - Displays Capgemini stock price with change percentage + Daily link
 * Matches web app styling from header-buttons.tsx
 */
export const StockButton: React.FC = () => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const { data, isLoading } = useGetStockPrice();

  const stock = data?.stock_price;

  // Theme-based colors
  const containerBg = isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)';
  const textColor = isDarkTheme ? colors.text200Dark : colors.text200Light;
  const labelColor = isDarkTheme ? colors.text300Dark : colors.text300Light;
  const badgeTextColor = isDarkTheme ? colors.text100Dark : colors.text100Light;

  // Badge background based on change percentage
  let badgeBg: string;
  if (stock && stock.change_pc > 0) {
    badgeBg = isDarkTheme ? colors.greenDark : colors.greenLight;
  } else if (stock && stock.change_pc < 0) {
    badgeBg = isDarkTheme ? colors.redDark : colors.redLight;
  } else {
    badgeBg = isDarkTheme ? colors.grayDark : colors.grayLight;
  }

  // Format the change percentage with + sign for positive
  const changeText = stock
    ? `${stock.change_pc > 0 ? '+' : ''}${stock.change_pc}%`
    : '';

  const handleDailyPress = () => {
    Linking.openURL(DAILY_URL);
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Stock price section */}
      {!isLoading && stock && (
        <View style={styles.stockSection}>
          <Text style={[styles.label, { color: labelColor }]}>CAP </Text>
          <Text style={[styles.price, { color: textColor }]}>
            {stock.price ? `€${stock.price}` : ''}
          </Text>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeTextColor }]}>
              {changeText}
            </Text>
          </View>
        </View>
      )}

      {/* Daily link button */}
      <TouchableOpacity
        onPress={handleDailyPress}
        style={styles.dailyButton}
        accessibilityLabel="Go to Daily"
        accessibilityRole="link"
      >
        <Image
          source={isDarkTheme ? dailyLogoDark : dailyLogoLight}
          style={styles.dailyLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36, // h-9
    paddingHorizontal: 2, // px-0.5
    borderRadius: 12, // rounded-xl
    // Shadow matching web: shadow-[0_2px_6px_rgba(0,0,0,0.06)]
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stockSection: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32, // h-8
    paddingLeft: 12, // md:pl-3
    paddingRight: 2, // pr-0.5
  },
  label: {
    fontSize: 14, // text-sm
    fontWeight: '400',
  },
  price: {
    fontSize: 14, // text-sm
    fontWeight: '400',
    marginRight: 4,
  },
  badge: {
    paddingVertical: 4, // py-1
    paddingHorizontal: 6, // px-1.5
    borderRadius: 6, // rounded-md
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '400',
  },
  dailyButton: {
    height: 32,
    paddingHorizontal: 8, // md:px-2
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10, // rounded-[0.625rem]
  },
  dailyLogo: {
    width: 28, // matches web SvgIcon size={28}
    height: 28,
  },
});

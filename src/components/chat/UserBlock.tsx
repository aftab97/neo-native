import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLayoutStore } from '../../store';
import { ChatMessage } from '../../types/chat';

interface UserBlockProps {
  message: ChatMessage;
}

export const UserBlock: React.FC<UserBlockProps> = ({ message }) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);

  const backgroundColor = isDarkTheme ? '#3a424a' : '#e0e3e6';
  const textColor = isDarkTheme ? '#ffffff' : '#21232c';

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor }]}>
        <Text style={[styles.text, { color: textColor }]}>{message.message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});

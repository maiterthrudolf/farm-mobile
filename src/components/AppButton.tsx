import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function AppButton({
  title,
  onPress,
  color = Colors.primary,
  textColor = Colors.textLight,
  style,
  textStyle,
  disabled = false,
}: AppButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }, disabled && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: textColor }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.15)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
    }),
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});

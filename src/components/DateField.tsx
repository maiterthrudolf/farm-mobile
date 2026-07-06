import React from 'react';
import { Platform, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

type Props = {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
};

export default function DateField({ value, onChange, min, max }: Props) {
  const inputRef = React.useRef<any>(null);

  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <div
        onClick={() => inputRef.current?.showPicker?.()}
        style={{ position: 'relative', cursor: 'pointer' }}
      >
        {/* @ts-ignore */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            fontSize: 16,
            padding: '12px 14px',
            borderRadius: 8,
            border: `2px solid ${Colors.border}`,
            width: '100%',
            boxSizing: 'border-box',
            color: Colors.textDark,
            backgroundColor: Colors.card,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            cursor: 'pointer',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      placeholderTextColor={Colors.border}
      keyboardType="number-pad"
      maxLength={10}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textDark,
    backgroundColor: Colors.card,
  },
});

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  value: string;          // ISO: YYYY-MM-DD
  onChange: (iso: string) => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoToDisplay(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function DatePickerField({ value, onChange }: Props) {
  const today = todayISO();
  const canGoForward = value < today;
  const inputRef = useRef<any>(null);

  if (Platform.OS === 'web') {
    const [y, m, d] = value.split('-');
    const displayed = value ? `${d}.${m}.${y}` : '';
    return (
      <View style={styles.webWrapper}>
        {/* hidden native input — zero size, only used for picker */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          max={today}
          onChange={(e: any) => onChange(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' } as any}
        />
        {/* visible styled button — opens picker via showPicker() */}
        <div
          onClick={() => inputRef.current?.showPicker?.()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 14px',
            fontSize: 17,
            fontWeight: '700',
            border: '1.5px solid #C8C8C8',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            color: '#1A1A1A',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            boxSizing: 'border-box',
            cursor: 'pointer',
            userSelect: 'none',
          } as any}
        >
          <span>{displayed}</span>
          <span style={{ fontSize: 16, color: '#888' } as any}>📅</span>
        </div>
      </View>
    );
  }

  // Native fallback
  return (
    <View style={styles.nativeRow}>
      <TouchableOpacity style={styles.arrow} onPress={() => onChange(addDays(value, -1))}>
        <Text style={styles.arrowTxt}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.dateDisplay}>{isoToDisplay(value)}</Text>
      <TouchableOpacity
        style={[styles.arrow, !canGoForward && styles.arrowOff]}
        onPress={() => canGoForward && onChange(addDays(value, 1))}
        disabled={!canGoForward}
      >
        <Text style={[styles.arrowTxt, !canGoForward && styles.arrowTxtOff]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper:   { width: '100%' },
  nativeRow:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.card, overflow: 'hidden' },
  arrow:        { paddingHorizontal: 18, paddingVertical: 12 },
  arrowOff:     { opacity: 0.3 },
  arrowTxt:     { fontSize: 24, fontWeight: '700', color: Colors.primary },
  arrowTxtOff:  { color: Colors.textMuted },
  dateDisplay:  { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.textDark },
});

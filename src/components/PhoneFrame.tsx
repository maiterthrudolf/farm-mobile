import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.outer}>
      <View style={styles.phone}>
        {/* Top bar with camera */}
        <View style={styles.topBar}>
          <View style={styles.speaker} />
          <View style={styles.camera} />
        </View>
        {/* Screen */}
        <View style={styles.screen}>
          {children}
        </View>
        {/* Bottom bar with home indicator */}
        <View style={styles.bottomBar}>
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#E8E4DC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  } as any,
  phone: {
    width: 370,
    maxHeight: 780,
    flex: 1,
    backgroundColor: '#2C2C2C',
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
  } as any,
  topBar: {
    height: 36,
    backgroundColor: '#2C2C2C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  } as any,
  speaker: {
    width: 52,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#444',
  },
  camera: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3A3A3A',
    borderWidth: 1,
    borderColor: '#555',
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  } as any,
  bottomBar: {
    height: 28,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicator: {
    width: 110,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#505050',
  },
});

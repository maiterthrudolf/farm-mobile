import React, { useState } from 'react';
import { Platform, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/i18n/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import PhoneFrame from './src/components/PhoneFrame';

const isWeb = Platform.OS === 'web';
const PW = '9824';
const PW_KEY = 'farm-auth';

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState(() => {
    if (isWeb && typeof localStorage !== 'undefined') return localStorage.getItem(PW_KEY) === PW;
    return false;
  });
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (input === PW) {
      if (isWeb && typeof localStorage !== 'undefined') localStorage.setItem(PW_KEY, PW);
      setAuth(true);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 800);
    }
  };

  if (auth) return <>{children}</>;

  return (
    <View style={pw.wrap}>
      <View style={pw.box}>
        <Text style={pw.icon}>🐄</Text>
        <Text style={pw.title}>Farm App</Text>
        <Text style={pw.sub}>Bitte Passwort eingeben</Text>
        <TextInput
          style={[pw.input, error && pw.inputErr]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
          secureTextEntry
          placeholder="Passwort"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          autoFocus
          textAlign="center"
        />
        <TouchableOpacity style={pw.btn} onPress={submit}>
          <Text style={pw.btnText}>Weiter →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pw = StyleSheet.create({
  wrap:     { flex: 1, backgroundColor: '#1A2B4A', alignItems: 'center', justifyContent: 'center' },
  box:      { backgroundColor: '#FFF', borderRadius: 16, padding: 40, width: 300, alignItems: 'center' },
  icon:     { fontSize: 48, marginBottom: 12 },
  title:    { fontSize: 22, fontWeight: '800', color: '#1A2B4A', marginBottom: 4 },
  sub:      { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  input:    { width: '100%', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 22, letterSpacing: 8, marginBottom: 16, color: '#111827' },
  inputErr: { borderColor: '#EF4444' },
  btn:      { width: '100%', backgroundColor: '#1A2B4A', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText:  { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default function App() {
  const content = (
    <PasswordGate>
      <LanguageProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </LanguageProvider>
    </PasswordGate>
  );

  if (isWeb) {
    return <PhoneFrame>{content}</PhoneFrame>;
  }

  return content;
}

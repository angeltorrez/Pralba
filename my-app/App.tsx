import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { useStorageInit } from './src/hooks/useStorageInit';
import { SettingsButton } from './src/components/SettingsButton';
import { HomeScreen } from './src/screens/HomeScreen';
import { CreatePresupuestoScreen } from './src/screens/CreatePresupuestoScreen';
import { PresupuestoDetailScreen } from './src/screens/PresupuestoDetailScreen';
import { PresupuestoPDFScreen } from './src/screens/PresupuestoPDFScreen';
import { initializeSchema } from './src/storage/database';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          headerRight: () => <SettingsButton />,
        }}
      />
      <Stack.Screen
        name="CreateBudget"
        component={CreatePresupuestoScreen}
        options={{
          title: 'Nuevo Presupuesto',
          headerLeft: () => null,
          headerRight: () => <SettingsButton />,
        }}
      />
      <Stack.Screen
        name="BudgetDetail"
        component={PresupuestoDetailScreen}
        options={{
          title: 'Detalle del Presupuesto',
          headerRight: () => <SettingsButton />,
        }}
      />
      <Stack.Screen
        name="BudgetPDF"
        component={PresupuestoPDFScreen}
        options={{
          title: 'Generar PDFs',
          headerRight: () => <SettingsButton />,
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isInitialized, error } = useStorageInit();

  if (!isInitialized) {
    return null; // Show splash screen or loading state
  }

  if (error) {
    console.warn('Storage init error (app will use fallback):', error);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SQLiteProvider databaseName="presuobra.db" onInit={initializeSchema}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SQLiteProvider>
  );
}

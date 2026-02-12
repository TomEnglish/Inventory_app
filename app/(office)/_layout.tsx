import { View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { SignOutButton } from '@/components/ui/SignOutButton';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';

export default function OfficeLayout() {
  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#94A3B8',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '600' },
          headerRight: () => <SignOutButton />,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="dashboard" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="materials"
          options={{
            title: 'Materials',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="cubes" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="exceptions"
          options={{
            title: 'Exceptions',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="exclamation-triangle" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="locations"
          options={{
            title: 'Locations',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="map-marker" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="qr-codes"
          options={{
            title: 'QR Codes',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="qrcode" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color }) => (
              <FontAwesome name="bar-chart" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

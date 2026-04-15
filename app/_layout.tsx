import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PhotoProvider } from '../context/PhotoContext';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <PhotoProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
      </PhotoProvider>
    </>
  );
}

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FeatureCard } from '../components/FeatureCard';
import { usePhotos } from '../context/PhotoContext';
import { colors, spacing, typography } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const { checkSavedSession, resumeSession, clearSession, setMode } = usePhotos();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setPermissionStatus(status);
        if (status === 'granted') {
          const result = await MediaLibrary.getAssetsAsync({
            first: 1,
            mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          });
          setMediaCount(result.totalCount);
        }
      })();
    }, []),
  );

  const handleFeaturePress = useCallback(
    async (mode: 'cleanup' | 'organize') => {
      const session = await checkSavedSession();
      if (session && session.mode === mode && session.currentIndex > 0) {
        Alert.alert(
          'Resume Session?',
          `You have a saved ${mode === 'cleanup' ? 'Clean Up' : 'Organize'} session at ${session.currentIndex} of ${session.totalCount}. Continue where you left off?`,
          [
            {
              text: 'Start Fresh',
              style: 'destructive',
              onPress: async () => {
                await clearSession();
                setMode(mode);
                router.push(`/swipe?mode=${mode}`);
              },
            },
            {
              text: 'Resume',
              onPress: async () => {
                await resumeSession();
                router.push(`/swipe?mode=${mode}`);
              },
            },
          ],
        );
      } else {
        if (session) await clearSession();
        setMode(mode);
        router.push(`/swipe?mode=${mode}`);
      }
    },
    [checkSavedSession, resumeSession, clearSession, setMode, router],
  );

  if (permissionStatus === 'denied') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.errorTitle}>Photo Access Required</Text>
          <Text style={styles.errorText}>
            Swipe Wipe needs full access to your photo library to help you clean up.
            Please grant access in Settings.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Swipe Wipe</Text>
        <Text style={styles.subtitle}>
          {mediaCount !== null
            ? `${mediaCount.toLocaleString()} photos & videos in your library`
            : 'Loading...'}
        </Text>
      </View>

      <View style={styles.cards}>
        <FeatureCard
          title="Clean Up"
          description="Swipe to keep or delete photos & videos"
          icon="trash-outline"
          iconColor={colors.delete}
          stat={mediaCount !== null ? `${mediaCount.toLocaleString()} items` : undefined}
          onPress={() => handleFeaturePress('cleanup')}
        />

        <FeatureCard
          title="Duplicates"
          description="Find and remove duplicate photos"
          icon="copy-outline"
          iconColor={colors.warning}
          onPress={() => router.push('/duplicates')}
        />

        <FeatureCard
          title="Organize"
          description="Sort: keep on phone or export"
          icon="folder-outline"
          iconColor={colors.phone}
          onPress={() => handleFeaturePress('organize')}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tip: Start with Clean Up to remove unwanted photos, then use Duplicates to find copies,
          and finally Organize to decide what stays on your phone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cards: {
    marginBottom: spacing.lg,
  },
  footer: {
    paddingTop: spacing.md,
  },
  footerText: {
    ...typography.footnote,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.title2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

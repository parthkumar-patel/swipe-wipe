import { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SwipeCard, SwipeDirection } from '../components/SwipeCard';
import { ProgressBar } from '../components/ProgressBar';
import { usePhotos, SwipeMode } from '../context/PhotoContext';
import { colors, spacing, radius, typography } from '../constants/theme';

export default function SwipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = (params.mode as SwipeMode) || 'cleanup';

  const {
    state,
    currentAsset,
    nextAsset,
    isDone,
    loadMore,
    swipeRight,
    swipeLeft,
    undo,
    setMode,
  } = usePhotos();

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  useEffect(() => {
    if (state.assets.length === 0 && state.hasNextPage && state.mode === mode) {
      loadMore();
    }
  }, []);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentAsset) return;
      if (direction === 'right') {
        swipeRight(currentAsset.id);
      } else {
        swipeLeft(currentAsset.id);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [currentAsset, swipeRight, swipeLeft],
  );

  const handleUndo = useCallback(() => {
    undo();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [undo]);

  const handleButtonLeft = useCallback(() => {
    if (!currentAsset) return;
    swipeLeft(currentAsset.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [currentAsset, swipeLeft]);

  const handleButtonRight = useCallback(() => {
    if (!currentAsset) return;
    swipeRight(currentAsset.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [currentAsset, swipeRight]);

  const isCleanup = mode === 'cleanup';
  const leftLabel = isCleanup ? 'DELETE' : 'EXPORT';
  const rightLabel = isCleanup ? 'KEEP' : 'PHONE';
  const leftColor = isCleanup ? colors.delete : colors.export;
  const rightColor = isCleanup ? colors.keep : colors.phone;
  const reviewCount = isCleanup ? state.deleteIds.length : state.exportIds.length;

  if (state.loading && state.assets.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  if (state.assets.length === 0 && !state.hasNextPage) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="images-outline" size={80} color={colors.textTertiary} />
        <Text style={styles.doneTitle}>No Photos Found</Text>
        <Text style={styles.doneSubtitle}>Your photo library appears to be empty.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDone) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="checkmark-circle" size={80} color={colors.keep} />
        <Text style={styles.doneTitle}>All Done!</Text>
        <Text style={styles.doneSubtitle}>
          {isCleanup
            ? `${state.keepIds.length} kept, ${state.deleteIds.length} to delete`
            : `${state.phoneIds.length} on phone, ${state.exportIds.length} to export`}
        </Text>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => router.push(`/review?mode=${mode}`)}
        >
          <Text style={styles.reviewButtonText}>Review & Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.modeLabel}>{isCleanup ? 'Clean Up' : 'Organize'}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/review?mode=${mode}`)}
          style={styles.topButton}
        >
          {reviewCount > 0 && <Text style={styles.reviewBadge}>{reviewCount}</Text>}
          <Ionicons name="list" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ProgressBar
        current={state.currentIndex}
        total={state.totalCount}
        label={isCleanup ? 'photos reviewed' : 'photos sorted'}
      />

      <View style={styles.cardStack}>
        {nextAsset && (
          <SwipeCard
            key={`next-${nextAsset.id}`}
            uri={nextAsset.uri}
            isTop={false}
            isVideo={nextAsset.mediaType === 'video'}
            onSwipe={() => {}}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            leftColor={leftColor}
            rightColor={rightColor}
          />
        )}
        {currentAsset && (
          <SwipeCard
            key={`current-${currentAsset.id}`}
            uri={currentAsset.uri}
            isTop={true}
            isVideo={currentAsset.mediaType === 'video'}
            onSwipe={handleSwipe}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            leftColor={leftColor}
            rightColor={rightColor}
          />
        )}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: leftColor + '20' }]}
          onPress={handleButtonLeft}
        >
          <Ionicons
            name={isCleanup ? 'close' : 'cloud-upload-outline'}
            size={32}
            color={leftColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.undoButton}
          onPress={handleUndo}
          disabled={state.history.length === 0}
        >
          <Ionicons
            name="arrow-undo"
            size={24}
            color={state.history.length > 0 ? colors.text : colors.textTertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: rightColor + '20' }]}
          onPress={handleButtonRight}
        >
          <Ionicons
            name={isCleanup ? 'checkmark' : 'phone-portrait-outline'}
            size={32}
            color={rightColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  modeLabel: {
    ...typography.headline,
    color: colors.text,
  },
  reviewBadge: {
    ...typography.caption,
    color: colors.accent,
    marginRight: 4,
    fontWeight: '700',
  },
  cardStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  doneTitle: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.lg,
  },
  doneSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  reviewButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.xl,
  },
  reviewButtonText: {
    ...typography.headline,
    color: '#fff',
  },
  backButton: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  backButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PhotoGrid } from '../components/PhotoGrid';
import { usePhotos } from '../context/PhotoContext';
import { colors, spacing, radius, typography } from '../constants/theme';

type Tab = 'positive' | 'negative';

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode || 'cleanup';
  const isCleanup = mode === 'cleanup';

  const {
    state,
    moveToKeep,
    moveToDelete,
    moveToPhone,
    moveToExport,
    confirmDelete,
    confirmExport,
  } = usePhotos();

  const [activeTab, setActiveTab] = useState<Tab>('negative');
  const [processing, setProcessing] = useState(false);

  const positiveAssets = useMemo(
    () =>
      state.assets.filter((a) =>
        isCleanup ? state.keepIds.includes(a.id) : state.phoneIds.includes(a.id),
      ),
    [state.assets, isCleanup, state.keepIds, state.phoneIds],
  );

  const negativeAssets = useMemo(
    () =>
      state.assets.filter((a) =>
        isCleanup ? state.deleteIds.includes(a.id) : state.exportIds.includes(a.id),
      ),
    [state.assets, isCleanup, state.deleteIds, state.exportIds],
  );

  const handleToggle = useCallback(
    (assetId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isCleanup) {
        if (state.deleteIds.includes(assetId)) {
          moveToKeep(assetId);
        } else {
          moveToDelete(assetId);
        }
      } else {
        if (state.exportIds.includes(assetId)) {
          moveToPhone(assetId);
        } else {
          moveToExport(assetId);
        }
      }
    },
    [isCleanup, state.deleteIds, state.exportIds, moveToKeep, moveToDelete, moveToPhone, moveToExport],
  );

  const handleConfirm = useCallback(async () => {
    if (isCleanup) {
      if (state.deleteIds.length === 0) {
        Alert.alert('Nothing to delete', 'Move some photos to the delete list first.');
        return;
      }
      Alert.alert(
        'Delete Photos',
        `Permanently delete ${state.deleteIds.length} photo${state.deleteIds.length !== 1 ? 's' : ''}?\n\niOS will ask you to confirm.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setProcessing(true);
              const deleted = await confirmDelete(state.deleteIds);
              setProcessing(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Done', `Deleted ${deleted} photo${deleted !== 1 ? 's' : ''}.`, [
                { text: 'OK', onPress: () => router.dismissAll() },
              ]);
            },
          },
        ],
      );
    } else {
      if (state.exportIds.length === 0) {
        Alert.alert('Nothing to export', 'Move some photos to the export list first.');
        return;
      }
      setProcessing(true);
      const success = await confirmExport(state.exportIds);
      setProcessing(false);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Exported',
          `${state.exportIds.length} photo${state.exportIds.length !== 1 ? 's' : ''} added to "To Export" album.\n\nConnect your phone to your Mac and transfer them via Finder.`,
          [{ text: 'OK', onPress: () => router.dismissAll() }],
        );
      } else {
        Alert.alert('Error', 'Failed to export photos. Please try again.');
      }
    }
  }, [isCleanup, state.deleteIds, state.exportIds, confirmDelete, confirmExport, router]);

  const positiveLabel = isCleanup ? 'Keep' : 'Phone';
  const negativeLabel = isCleanup ? 'Delete' : 'Export';
  const positiveColor = isCleanup ? colors.keep : colors.phone;
  const negativeColor = isCleanup ? colors.delete : colors.export;
  const negativeCount = isCleanup ? state.deleteIds.length : state.exportIds.length;
  const confirmLabel = isCleanup
    ? `Delete ${negativeCount} Photo${negativeCount !== 1 ? 's' : ''}`
    : `Export ${negativeCount} Photo${negativeCount !== 1 ? 's' : ''}`;
  const confirmColor = isCleanup ? colors.delete : colors.export;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Review</Text>
        <View style={styles.topButton} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'positive' && { borderBottomColor: positiveColor }]}
          onPress={() => setActiveTab('positive')}
        >
          <Text style={[styles.tabText, activeTab === 'positive' && { color: positiveColor }]}>
            {positiveLabel} ({positiveAssets.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'negative' && { borderBottomColor: negativeColor }]}
          onPress={() => setActiveTab('negative')}
        >
          <Text style={[styles.tabText, activeTab === 'negative' && { color: negativeColor }]}>
            {negativeLabel} ({negativeAssets.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        {activeTab === 'positive' ? (
          <PhotoGrid
            assets={positiveAssets}
            onToggle={handleToggle}
            emptyMessage={`No photos in ${positiveLabel}`}
          />
        ) : (
          <PhotoGrid
            assets={negativeAssets}
            onToggle={handleToggle}
            emptyMessage={`No photos in ${negativeLabel}`}
          />
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        {processing ? (
          <View style={[styles.confirmButton, { backgroundColor: confirmColor, opacity: 0.7 }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: confirmColor }]}
            onPress={handleConfirm}
            disabled={negativeCount === 0}
          >
            <Ionicons
              name={isCleanup ? 'trash' : 'folder-outline'}
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.hint}>Tap a photo to move it between categories</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    ...typography.headline,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    ...typography.headline,
    color: colors.textSecondary,
  },
  gridContainer: {
    flex: 1,
  },
  bottomBar: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    width: '100%',
    minHeight: 50,
  },
  confirmText: {
    ...typography.headline,
    color: '#fff',
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});

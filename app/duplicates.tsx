import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DuplicateGroupCard } from '../components/DuplicateGroup';
import { useDuplicateScanner } from '../hooks/useDuplicateScanner';
import { colors, spacing, radius, typography } from '../constants/theme';

export default function DuplicatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    groups,
    scanning,
    scanProgress,
    totalScanned,
    totalDuplicates,
    allDeleteIds,
    scan,
    cancelScan,
    toggleKeep,
    deleteDuplicates,
  } = useDuplicateScanner();

  const handleDelete = useCallback(async () => {
    if (allDeleteIds.length === 0) {
      Alert.alert('Nothing to delete', 'No duplicates selected for deletion.');
      return;
    }

    Alert.alert(
      'Delete Duplicates',
      `Delete ${allDeleteIds.length} duplicate photo${allDeleteIds.length !== 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = await deleteDuplicates();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Done', `Deleted ${deleted} duplicate${deleted !== 1 ? 's' : ''}.`, [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ],
    );
  }, [allDeleteIds, deleteDuplicates, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Duplicates</Text>
        <View style={styles.topButton} />
      </View>

      {!scanning && groups.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="copy-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Find Duplicate Photos</Text>
          <Text style={styles.emptyText}>
            Scan your library to find duplicate photos. The app checks filenames, dimensions, and
            creation dates to identify copies.
          </Text>
          <TouchableOpacity style={styles.scanButton} onPress={scan}>
            <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.scanButtonText}>Start Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {scanning && (
        <View style={styles.scanningState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.scanningText}>Scanning photos...</Text>
          <Text style={styles.scanningCount}>{totalScanned.toLocaleString()} scanned</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${scanProgress * 100}%` }]} />
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelScan}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {!scanning && groups.length > 0 && (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Found {groups.length} group{groups.length !== 1 ? 's' : ''} with {totalDuplicates}{' '}
              duplicate{totalDuplicates !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryHint}>
              Tap a photo to select it as the one to keep
            </Text>
          </View>
          <ScrollView
            style={styles.groupList}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          >
            {groups.map((group) => (
              <DuplicateGroupCard
                key={group.key}
                group={group}
                onToggleKeep={toggleKeep}
              />
            ))}
          </ScrollView>
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
            <TouchableOpacity
              style={[styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.deleteText}>
                Delete {allDeleteIds.length} Duplicate{allDeleteIds.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  scanButtonText: {
    ...typography.headline,
    color: '#fff',
  },
  scanningState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  scanningText: {
    ...typography.title3,
    color: colors.text,
    marginTop: spacing.lg,
  },
  scanningCount: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  progressTrack: {
    width: '80%',
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  cancelButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summary: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryText: {
    ...typography.headline,
    color: colors.text,
  },
  summaryHint: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  groupList: {
    flex: 1,
    padding: spacing.md,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.delete,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  deleteText: {
    ...typography.headline,
    color: '#fff',
  },
});

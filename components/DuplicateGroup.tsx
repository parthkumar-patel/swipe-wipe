import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { DuplicateGroup as DuplicateGroupType } from '../hooks/useDuplicateScanner';
import { colors, spacing, radius, typography } from '../constants/theme';

interface DuplicateGroupProps {
  group: DuplicateGroupType;
  onToggleKeep: (groupKey: string, assetId: string) => void;
}

export function DuplicateGroupCard({ group, onToggleKeep }: DuplicateGroupProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {group.assets.length} duplicates
        {group.key.startsWith('possible_') ? ' (possible)' : ''}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {group.assets.map((asset) => {
          const isKeep = group.keepId === asset.id;
          const isDelete = group.deleteIds.includes(asset.id);

          return (
            <TouchableOpacity
              key={asset.id}
              style={[
                styles.thumbnail,
                isKeep && styles.keepBorder,
                isDelete && styles.deleteBorder,
              ]}
              onPress={() => onToggleKeep(group.key, asset.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: asset.uri }} style={styles.image} contentFit="cover" />
              <View style={[styles.badge, isKeep ? styles.keepBadge : styles.deleteBadge]}>
                <Ionicons
                  name={isKeep ? 'checkmark-circle' : 'trash'}
                  size={16}
                  color="#fff"
                />
              </View>
              <Text style={styles.filename} numberOfLines={1}>
                {asset.filename}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const THUMB_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumbnail: {
    width: THUMB_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  keepBorder: {
    borderColor: colors.keep,
  },
  deleteBorder: {
    borderColor: colors.delete,
  },
  image: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepBadge: {
    backgroundColor: colors.keep,
  },
  deleteBadge: {
    backgroundColor: colors.delete,
  },
  filename: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
});

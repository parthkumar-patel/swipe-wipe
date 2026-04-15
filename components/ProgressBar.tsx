import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const progress = total > 0 ? Math.min(current / total, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.counter}>
          {current} <Text style={styles.separator}>/</Text> {total}
        </Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  counter: {
    ...typography.headline,
    color: colors.text,
  },
  separator: {
    color: colors.textTertiary,
  },
  label: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  track: {
    height: 3,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});

import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet, Dimensions, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { colors, spacing, radius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface PhotoGridProps {
  assets: MediaLibrary.Asset[];
  selectedIds?: string[];
  onToggle?: (assetId: string) => void;
  showCheckmarks?: boolean;
  emptyMessage?: string;
}

export function PhotoGrid({ assets, selectedIds, onToggle, showCheckmarks = false, emptyMessage = 'No photos' }: PhotoGridProps) {
  if (assets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selectedIds?.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onToggle?.(item.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.uri }} style={styles.image} contentFit="cover" />
        {showCheckmarks && (
          <View style={[styles.checkmark, isSelected && styles.checkmarkActive]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={assets}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: GAP / 2,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GAP / 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 16,
    marginTop: spacing.md,
  },
});

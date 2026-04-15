import { useState, useCallback, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';

export interface DuplicateGroup {
  key: string;
  assets: MediaLibrary.Asset[];
  keepId: string;
  deleteIds: string[];
}

export function useDuplicateScanner() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [totalScanned, setTotalScanned] = useState(0);
  const cancelRef = useRef(false);

  const scan = useCallback(async () => {
    setScanning(true);
    setScanProgress(0);
    setTotalScanned(0);
    setGroups([]);
    cancelRef.current = false;

    const allAssets: MediaLibrary.Asset[] = [];
    let endCursor: string | undefined;
    let hasNext = true;

    while (hasNext && !cancelRef.current) {
      const result = await MediaLibrary.getAssetsAsync({
        first: 500,
        after: endCursor,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.photo],
      });

      allAssets.push(...result.assets);
      endCursor = result.endCursor;
      hasNext = result.hasNextPage;
      setTotalScanned(allAssets.length);
      setScanProgress(result.totalCount > 0 ? allAssets.length / result.totalCount : 0);
    }

    if (cancelRef.current) {
      setScanning(false);
      return;
    }

    const map = new Map<string, MediaLibrary.Asset[]>();
    for (const asset of allAssets) {
      const key = `${asset.filename}_${asset.width}x${asset.height}_${asset.creationTime}`;
      const existing = map.get(key);
      if (existing) {
        existing.push(asset);
      } else {
        map.set(key, [asset]);
      }
    }

    const dimTimeMap = new Map<string, MediaLibrary.Asset[]>();
    for (const asset of allAssets) {
      const key = `${asset.width}x${asset.height}_${asset.creationTime}`;
      const existing = dimTimeMap.get(key);
      if (existing) {
        existing.push(asset);
      } else {
        dimTimeMap.set(key, [asset]);
      }
    }

    const seenIds = new Set<string>();
    const duplicateGroups: DuplicateGroup[] = [];

    for (const [key, assets] of map) {
      if (assets.length > 1) {
        const sorted = assets.sort((a, b) => a.creationTime - b.creationTime);
        const keepId = sorted[0].id;
        duplicateGroups.push({
          key,
          assets: sorted,
          keepId,
          deleteIds: sorted.slice(1).map((a) => a.id),
        });
        sorted.forEach((a) => seenIds.add(a.id));
      }
    }

    for (const [key, assets] of dimTimeMap) {
      if (assets.length > 1) {
        const unseenAssets = assets.filter((a) => !seenIds.has(a.id));
        if (unseenAssets.length > 1) {
          const sorted = unseenAssets.sort((a, b) => a.creationTime - b.creationTime);
          const keepId = sorted[0].id;
          duplicateGroups.push({
            key: `possible_${key}`,
            assets: sorted,
            keepId,
            deleteIds: sorted.slice(1).map((a) => a.id),
          });
        }
      }
    }

    setGroups(duplicateGroups);
    setScanning(false);
  }, []);

  const toggleKeep = useCallback((groupKey: string, assetId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.key !== groupKey) return g;
        return {
          ...g,
          keepId: assetId,
          deleteIds: g.assets.filter((a) => a.id !== assetId).map((a) => a.id),
        };
      })
    );
  }, []);

  const toggleDeleteInGroup = useCallback((groupKey: string, assetId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.key !== groupKey) return g;
        if (g.keepId === assetId) return g;
        const isMarked = g.deleteIds.includes(assetId);
        return {
          ...g,
          deleteIds: isMarked
            ? g.deleteIds.filter((id) => id !== assetId)
            : [...g.deleteIds, assetId],
        };
      })
    );
  }, []);

  const cancelScan = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const allDeleteIds = groups.flatMap((g) => g.deleteIds);
  const totalDuplicates = groups.reduce((sum, g) => sum + g.assets.length - 1, 0);

  const deleteDuplicates = useCallback(async (): Promise<number> => {
    const ids = groups.flatMap((g) => g.deleteIds);
    let deleted = 0;
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      try {
        const success = await MediaLibrary.deleteAssetsAsync(batch);
        if (success) deleted += batch.length;
      } catch (err) {
        console.error('Delete duplicates batch failed:', err);
      }
    }
    if (deleted > 0) {
      setGroups([]);
    }
    return deleted;
  }, [groups]);

  return {
    groups,
    scanning,
    scanProgress,
    totalScanned,
    totalDuplicates,
    allDeleteIds,
    scan,
    cancelScan,
    toggleKeep,
    toggleDeleteInGroup,
    deleteDuplicates,
  };
}

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../constants/theme';

interface VideoPlayerProps {
  uri: string;
  style?: object;
}

export function VideoPlayer({ uri, style }: VideoPlayerProps) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (uri.startsWith('ph://')) {
          const assetId = uri.replace('ph://', '').split('/')[0];
          const info = await MediaLibrary.getAssetInfoAsync(assetId);
          if (!cancelled && info.localUri) {
            setResolvedUri(info.localUri);
          } else if (!cancelled) {
            setError(true);
          }
        } else {
          setResolvedUri(uri);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [uri]);

  if (error) {
    return (
      <View style={[styles.container, styles.centeredContent, style]}>
        <Ionicons name="videocam-off-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.errorText}>Cannot load video</Text>
      </View>
    );
  }

  if (!resolvedUri) {
    return (
      <View style={[styles.container, styles.centeredContent, style]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  return <VideoPlayerInner uri={resolvedUri} style={style} />;
}

function VideoPlayerInner({ uri, style }: { uri: string; style?: object }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
      />

      {!isPlaying && (
        <View style={styles.videoTag} pointerEvents="none">
          <Ionicons name="videocam" size={12} color="#fff" />
          <Text style={styles.videoTagText}>VIDEO</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    ...typography.footnote,
    color: '#fff',
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.footnote,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  videoTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  videoTagText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
});

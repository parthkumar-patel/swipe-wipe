import React, { useRef, useEffect } from 'react';
import { Dimensions, StyleSheet, View, Text, Animated, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { VideoPlayer } from './VideoPlayer';
import { colors, radius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_ANGLE = 15;

export type SwipeDirection = 'left' | 'right';

interface SwipeCardProps {
  uri: string;
  isTop: boolean;
  isVideo?: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  leftLabel?: string;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
}

export function SwipeCard({
  uri,
  isTop,
  isVideo = false,
  onSwipe,
  leftLabel = 'DELETE',
  rightLabel = 'KEEP',
  leftColor = colors.delete,
  rightColor = colors.keep,
}: SwipeCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(isTop ? 1 : 0.95)).current;
  const cardOpacity = useRef(new Animated.Value(isTop ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: isTop ? 1 : 0.95, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(cardOpacity, { toValue: isTop ? 1 : 0.7, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isTop, scale, cardOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => isTop && Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        pan.setValue({ x: gs.dx, y: gs.dy * 0.3 });
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) > SWIPE_THRESHOLD) {
          const direction: SwipeDirection = gs.dx > 0 ? 'right' : 'left';
          const targetX = gs.dx > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
          Animated.timing(pan, {
            toValue: { x: targetX, y: gs.dy * 0.5 },
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onSwipe(direction);
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          }).start();
        }
      },
    }),
  ).current;

  const rotation = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [`-${ROTATION_ANGLE}deg`, '0deg', `${ROTATION_ANGLE}deg`],
    extrapolate: 'clamp',
  });

  const leftOverlayOpacity = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.5, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rightOverlayOpacity = pan.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: rotation },
            { scale },
          ],
          opacity: cardOpacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {isVideo ? (
        <VideoPlayer uri={uri} />
      ) : (
        <Image source={{ uri }} style={styles.image} contentFit="contain" transition={200} />
      )}
      <Animated.View
        style={[
          styles.overlay,
          styles.leftOverlay,
          { borderColor: leftColor, opacity: leftOverlayOpacity },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.labelContainer, { borderColor: leftColor }]}>
          <Text style={[styles.label, { color: leftColor }]}>{leftLabel}</Text>
        </View>
      </Animated.View>
      <Animated.View
        style={[
          styles.overlay,
          styles.rightOverlay,
          { borderColor: rightColor, opacity: rightOverlayOpacity },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.labelContainer, { borderColor: rightColor }]}>
          <Text style={[styles.label, { color: rightColor }]}>{rightLabel}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderRadius: radius.lg,
    borderColor: 'transparent',
  },
  leftOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rightOverlay: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  labelContainer: {
    borderWidth: 3,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    transform: [{ rotate: '-15deg' }],
  },
  label: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

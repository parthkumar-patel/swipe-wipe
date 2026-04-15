import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { colors } from '../constants/theme';

interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onSlidingStart?: () => void;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

export default function Slider({
  value,
  minimumValue,
  maximumValue,
  onSlidingStart,
  onValueChange,
  onSlidingComplete,
}: SliderProps) {
  const widthRef = useRef(1);
  const valueRef = useRef(value);
  valueRef.current = value;

  const positionToValue = useCallback(
    (x: number) => {
      const clamped = Math.max(0, Math.min(x, widthRef.current));
      const ratio = clamped / widthRef.current;
      return minimumValue + ratio * (maximumValue - minimumValue);
    },
    [minimumValue, maximumValue],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onSlidingStart?.();
        const x = evt.nativeEvent.locationX;
        const val = positionToValue(x);
        onValueChange?.(val);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const val = positionToValue(x);
        onValueChange?.(val);
      },
      onPanResponderRelease: (evt) => {
        const x = evt.nativeEvent.locationX;
        const val = positionToValue(x);
        onSlidingComplete?.(val);
      },
    }),
  ).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  }, []);

  const range = maximumValue - minimumValue;
  const progress = range > 0 ? (value - minimumValue) / range : 0;

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 30,
    justifyContent: 'center',
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginLeft: -7,
  },
});

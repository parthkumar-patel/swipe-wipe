import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SwipeMode = 'cleanup' | 'organize';

export interface PhotoState {
  assets: MediaLibrary.Asset[];
  currentIndex: number;
  keepIds: string[];
  deleteIds: string[];
  phoneIds: string[];
  exportIds: string[];
  history: HistoryEntry[];
  hasNextPage: boolean;
  endCursor: string | undefined;
  totalCount: number;
  loading: boolean;
  mode: SwipeMode;
}

export interface HistoryEntry {
  action: 'keep' | 'delete' | 'phone' | 'export';
  assetId: string;
}

type Action =
  | { type: 'KEEP'; assetId: string }
  | { type: 'DELETE'; assetId: string }
  | { type: 'PHONE'; assetId: string }
  | { type: 'EXPORT'; assetId: string }
  | { type: 'UNDO' }
  | { type: 'MOVE_TO_KEEP'; assetId: string }
  | { type: 'MOVE_TO_DELETE'; assetId: string }
  | { type: 'MOVE_TO_PHONE'; assetId: string }
  | { type: 'MOVE_TO_EXPORT'; assetId: string }
  | { type: 'LOAD_MORE'; assets: MediaLibrary.Asset[]; endCursor: string | undefined; hasNextPage: boolean; totalCount: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_MODE'; mode: SwipeMode }
  | { type: 'REMOVE_DELETED'; ids: string[] }
  | { type: 'RESET' }
  | { type: 'RESTORE_SESSION'; session: SavedSession; assets: MediaLibrary.Asset[]; hasNextPage: boolean; endCursor: string | undefined };

function removeId(arr: string[], id: string): string[] {
  return arr.filter((i) => i !== id);
}

const initialState: PhotoState = {
  assets: [],
  currentIndex: 0,
  keepIds: [],
  deleteIds: [],
  phoneIds: [],
  exportIds: [],
  history: [],
  hasNextPage: true,
  endCursor: undefined,
  totalCount: 0,
  loading: false,
  mode: 'cleanup',
};

function reducer(state: PhotoState, action: Action): PhotoState {
  switch (action.type) {
    case 'KEEP':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        keepIds: [...state.keepIds, action.assetId],
        deleteIds: removeId(state.deleteIds, action.assetId),
        history: [...state.history, { action: 'keep', assetId: action.assetId }],
      };
    case 'DELETE':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        deleteIds: [...state.deleteIds, action.assetId],
        keepIds: removeId(state.keepIds, action.assetId),
        history: [...state.history, { action: 'delete', assetId: action.assetId }],
      };
    case 'PHONE':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        phoneIds: [...state.phoneIds, action.assetId],
        exportIds: removeId(state.exportIds, action.assetId),
        history: [...state.history, { action: 'phone', assetId: action.assetId }],
      };
    case 'EXPORT':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        exportIds: [...state.exportIds, action.assetId],
        phoneIds: removeId(state.phoneIds, action.assetId),
        history: [...state.history, { action: 'export', assetId: action.assetId }],
      };
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const lastEntry = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        ...state,
        currentIndex: Math.max(0, state.currentIndex - 1),
        keepIds: removeId(state.keepIds, lastEntry.assetId),
        deleteIds: removeId(state.deleteIds, lastEntry.assetId),
        phoneIds: removeId(state.phoneIds, lastEntry.assetId),
        exportIds: removeId(state.exportIds, lastEntry.assetId),
        history: newHistory,
      };
    }
    case 'MOVE_TO_KEEP':
      return {
        ...state,
        keepIds: state.keepIds.includes(action.assetId) ? state.keepIds : [...state.keepIds, action.assetId],
        deleteIds: removeId(state.deleteIds, action.assetId),
      };
    case 'MOVE_TO_DELETE':
      return {
        ...state,
        deleteIds: state.deleteIds.includes(action.assetId) ? state.deleteIds : [...state.deleteIds, action.assetId],
        keepIds: removeId(state.keepIds, action.assetId),
      };
    case 'MOVE_TO_PHONE':
      return {
        ...state,
        phoneIds: state.phoneIds.includes(action.assetId) ? state.phoneIds : [...state.phoneIds, action.assetId],
        exportIds: removeId(state.exportIds, action.assetId),
      };
    case 'MOVE_TO_EXPORT':
      return {
        ...state,
        exportIds: state.exportIds.includes(action.assetId) ? state.exportIds : [...state.exportIds, action.assetId],
        phoneIds: removeId(state.phoneIds, action.assetId),
      };
    case 'LOAD_MORE':
      return {
        ...state,
        assets: [...state.assets, ...action.assets],
        endCursor: action.endCursor,
        hasNextPage: action.hasNextPage,
        totalCount: action.totalCount,
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_MODE':
      if (state.mode === action.mode && state.assets.length > 0) return state;
      return { ...initialState, mode: action.mode };
    case 'REMOVE_DELETED':
      return {
        ...state,
        assets: state.assets.filter((a) => !action.ids.includes(a.id)),
        deleteIds: [],
        keepIds: state.keepIds.filter((id) => !action.ids.includes(id)),
      };
    case 'RESET':
      return { ...initialState };
    case 'RESTORE_SESSION':
      return {
        ...initialState,
        mode: action.session.mode,
        currentIndex: action.session.currentIndex,
        keepIds: action.session.keepIds,
        deleteIds: action.session.deleteIds,
        phoneIds: action.session.phoneIds,
        exportIds: action.session.exportIds,
        endCursor: action.endCursor,
        totalCount: action.session.totalCount,
        assets: action.assets,
        hasNextPage: action.hasNextPage,
        history: [
          ...action.session.keepIds.map((id): HistoryEntry => ({ action: 'keep', assetId: id })),
          ...action.session.deleteIds.map((id): HistoryEntry => ({ action: 'delete', assetId: id })),
          ...action.session.phoneIds.map((id): HistoryEntry => ({ action: 'phone', assetId: id })),
          ...action.session.exportIds.map((id): HistoryEntry => ({ action: 'export', assetId: id })),
        ],
        loading: false,
      };
    default:
      return state;
  }
}

const PAGE_SIZE = 50;
const PREFETCH_THRESHOLD = 10;

const SESSION_KEY = 'swipe_wipe_session';

interface SavedSession {
  mode: SwipeMode;
  currentIndex: number;
  keepIds: string[];
  deleteIds: string[];
  phoneIds: string[];
  exportIds: string[];
  endCursor: string | undefined;
  totalCount: number;
}

interface PhotoContextValue {
  state: PhotoState;
  currentAsset: MediaLibrary.Asset | null;
  nextAsset: MediaLibrary.Asset | null;
  progress: number;
  isDone: boolean;
  hasSavedSession: boolean;
  loadMore: () => Promise<void>;
  swipeRight: (assetId: string) => void;
  swipeLeft: (assetId: string) => void;
  undo: () => void;
  setMode: (mode: SwipeMode) => void;
  moveToKeep: (assetId: string) => void;
  moveToDelete: (assetId: string) => void;
  moveToPhone: (assetId: string) => void;
  moveToExport: (assetId: string) => void;
  confirmDelete: (ids: string[]) => Promise<number>;
  confirmExport: (ids: string[]) => Promise<boolean>;
  reset: () => void;
  resumeSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  checkSavedSession: () => Promise<SavedSession | null>;
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const loadingRef = useRef(false);
  const hasStartedRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.hasNextPage) return;
    loadingRef.current = true;
    hasStartedRef.current = true;
    dispatch({ type: 'SET_LOADING', loading: true });

    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        dispatch({ type: 'SET_LOADING', loading: false });
        loadingRef.current = false;
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: state.endCursor,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      });

      dispatch({
        type: 'LOAD_MORE',
        assets: result.assets,
        endCursor: result.endCursor,
        hasNextPage: result.hasNextPage,
        totalCount: result.totalCount,
      });
    } catch (err) {
      console.error('Failed to load photos:', err);
      dispatch({ type: 'SET_LOADING', loading: false });
    } finally {
      loadingRef.current = false;
    }
  }, [state.endCursor, state.hasNextPage]);

  useEffect(() => {
    if (!hasStartedRef.current) return;
    const remaining = state.assets.length - state.currentIndex;
    if (remaining <= PREFETCH_THRESHOLD && state.hasNextPage && !loadingRef.current) {
      loadMore();
    }
  }, [state.currentIndex, state.assets.length, state.hasNextPage, loadMore]);

  const swipeRight = useCallback((assetId: string) => {
    if (state.mode === 'cleanup') {
      dispatch({ type: 'KEEP', assetId });
    } else {
      dispatch({ type: 'PHONE', assetId });
    }
  }, [state.mode]);

  const swipeLeft = useCallback((assetId: string) => {
    if (state.mode === 'cleanup') {
      dispatch({ type: 'DELETE', assetId });
    } else {
      dispatch({ type: 'EXPORT', assetId });
    }
  }, [state.mode]);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);

  const setMode = useCallback((mode: SwipeMode) => dispatch({ type: 'SET_MODE', mode }), []);

  const moveToKeep = useCallback((assetId: string) => dispatch({ type: 'MOVE_TO_KEEP', assetId }), []);
  const moveToDelete = useCallback((assetId: string) => dispatch({ type: 'MOVE_TO_DELETE', assetId }), []);
  const moveToPhone = useCallback((assetId: string) => dispatch({ type: 'MOVE_TO_PHONE', assetId }), []);
  const moveToExport = useCallback((assetId: string) => dispatch({ type: 'MOVE_TO_EXPORT', assetId }), []);

  const confirmDelete = useCallback(async (ids: string[]): Promise<number> => {
    let deleted = 0;
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      try {
        const success = await MediaLibrary.deleteAssetsAsync(batch);
        if (success) deleted += batch.length;
      } catch (err) {
        console.error('Delete batch failed:', err);
      }
    }
    dispatch({ type: 'REMOVE_DELETED', ids: ids.slice(0, deleted) });
    return deleted;
  }, []);

  const confirmExport = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      let album = await MediaLibrary.getAlbumAsync('To Export');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('To Export', ids[0], false);
        if (ids.length > 1) {
          await MediaLibrary.addAssetsToAlbumAsync(ids.slice(1), album, false);
        }
      } else {
        await MediaLibrary.addAssetsToAlbumAsync(ids, album, false);
      }
      return true;
    } catch (err) {
      console.error('Export failed:', err);
      return false;
    }
  }, []);

  const reset = useCallback(async () => {
    dispatch({ type: 'RESET' });
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const [hasSavedSession, setHasSavedSession] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((val) => setHasSavedSession(val !== null));
  }, []);

  useEffect(() => {
    if (!hasStartedRef.current) return;
    if (state.currentIndex === 0 && state.keepIds.length === 0 && state.deleteIds.length === 0) return;

    const session: SavedSession = {
      mode: state.mode,
      currentIndex: state.currentIndex,
      keepIds: state.keepIds,
      deleteIds: state.deleteIds,
      phoneIds: state.phoneIds,
      exportIds: state.exportIds,
      endCursor: state.endCursor,
      totalCount: state.totalCount,
    };
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [state.currentIndex, state.keepIds, state.deleteIds, state.phoneIds, state.exportIds, state.mode, state.endCursor, state.totalCount]);

  const checkSavedSession = useCallback(async (): Promise<SavedSession | null> => {
    const val = await AsyncStorage.getItem(SESSION_KEY);
    return val ? JSON.parse(val) : null;
  }, []);

  const resumeSession = useCallback(async () => {
    const val = await AsyncStorage.getItem(SESSION_KEY);
    if (!val) return;
    const session: SavedSession = JSON.parse(val);

    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status !== 'granted') return;

    const allAssets: MediaLibrary.Asset[] = [];
    let cursor: string | undefined;
    let hasNext = true;

    while (hasNext && allAssets.length < session.currentIndex + PAGE_SIZE) {
      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: cursor,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      });
      allAssets.push(...result.assets);
      cursor = result.endCursor;
      hasNext = result.hasNextPage;
    }

    hasStartedRef.current = true;
    dispatch({
      type: 'RESTORE_SESSION',
      session,
      assets: allAssets,
      hasNextPage: hasNext,
      endCursor: cursor,
    });
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setHasSavedSession(false);
    dispatch({ type: 'RESET' });
  }, []);

  const currentAsset = state.assets[state.currentIndex] ?? null;
  const nextAsset = state.assets[state.currentIndex + 1] ?? null;
  const progress = state.totalCount > 0 ? state.currentIndex / state.totalCount : 0;
  const isDone = state.currentIndex >= state.assets.length && !state.hasNextPage;

  return (
    <PhotoContext.Provider
      value={{
        state,
        currentAsset,
        nextAsset,
        progress,
        isDone,
        hasSavedSession,
        loadMore,
        swipeRight,
        swipeLeft,
        undo,
        setMode,
        moveToKeep,
        moveToDelete,
        moveToPhone,
        moveToExport,
        confirmDelete,
        confirmExport,
        reset,
        resumeSession,
        clearSession,
        checkSavedSession,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error('usePhotos must be used within a PhotoProvider');
  return ctx;
}

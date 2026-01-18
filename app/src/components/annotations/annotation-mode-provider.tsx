'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  Annotation,
  AnnotationMode,
  PendingAnnotation,
  AnnotationListResponse,
} from './types';

type AnnotationContextValue = {
  // State
  mode: AnnotationMode;
  annotations: Annotation[];
  selectedId: string | null;
  pendingAnnotation: PendingAnnotation | null;
  counts: AnnotationListResponse['counts'];
  isLoading: boolean;
  showResolved: boolean;

  // Actions
  setMode: (mode: AnnotationMode) => void;
  selectAnnotation: (id: string | null) => void;
  setPendingAnnotation: (pending: PendingAnnotation | null) => void;
  setShowResolved: (show: boolean) => void;

  // CRUD
  createAnnotation: (content: string) => Promise<Annotation | null>;
  updateAnnotation: (id: string, content: string) => Promise<void>;
  resolveAnnotation: (id: string) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  replyToAnnotation: (parentId: string, content: string) => Promise<void>;

  // Navigation
  selectNext: () => void;
  selectPrevious: () => void;

  // Refresh
  refreshAnnotations: () => Promise<void>;
};

const AnnotationContext = createContext<AnnotationContextValue | null>(null);

export function useAnnotationMode() {
  const ctx = useContext(AnnotationContext);
  if (!ctx) {
    throw new Error('useAnnotationMode must be used within AnnotationModeProvider');
  }
  return ctx;
}

type Props = {
  draftSlug: string;
  children: ReactNode;
};

export function AnnotationModeProvider({ draftSlug, children }: Props) {
  const [mode, setMode] = useState<AnnotationMode>('view');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [counts, setCounts] = useState<AnnotationListResponse['counts']>({
    open: 0,
    resolved: 0,
    archived: 0,
    total: 0,
  });

  // Fetch annotations
  const refreshAnnotations = useCallback(async () => {
    try {
      const res = await fetch(`/api/annotations?draftSlug=${encodeURIComponent(draftSlug)}`);
      if (!res.ok) throw new Error('Failed to fetch annotations');
      const data: AnnotationListResponse = await res.json();
      setAnnotations(data.annotations);
      setCounts(data.counts);
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [draftSlug]);

  // Initial fetch
  useEffect(() => {
    refreshAnnotations();
  }, [refreshAnnotations]);

  // Mode change resets selection
  const handleSetMode = useCallback((newMode: AnnotationMode) => {
    setMode(newMode);
    if (newMode === 'view') {
      setPendingAnnotation(null);
    }
  }, []);

  // Select annotation
  const selectAnnotation = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // Get visible annotations (for navigation)
  const getVisibleAnnotations = useCallback(() => {
    return annotations.filter((a) => showResolved || a.status === 'OPEN');
  }, [annotations, showResolved]);

  // Navigate to next annotation
  const selectNext = useCallback(() => {
    const visible = getVisibleAnnotations();
    if (visible.length === 0) return;

    if (selectedId === null) {
      setSelectedId(visible[0].id);
      return;
    }

    const currentIndex = visible.findIndex((a) => a.id === selectedId);
    const nextIndex = (currentIndex + 1) % visible.length;
    setSelectedId(visible[nextIndex].id);
  }, [getVisibleAnnotations, selectedId]);

  // Navigate to previous annotation
  const selectPrevious = useCallback(() => {
    const visible = getVisibleAnnotations();
    if (visible.length === 0) return;

    if (selectedId === null) {
      setSelectedId(visible.at(-1)?.id ?? null);
      return;
    }

    const currentIndex = visible.findIndex((a) => a.id === selectedId);
    const prevIndex = (currentIndex - 1 + visible.length) % visible.length;
    setSelectedId(visible[prevIndex].id);
  }, [getVisibleAnnotations, selectedId]);

  // Create annotation
  const createAnnotation = useCallback(
    async (content: string): Promise<Annotation | null> => {
      if (!pendingAnnotation) return null;

      try {
        const res = await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftSlug,
            type: pendingAnnotation.type,
            content,
            selectors: pendingAnnotation.selectors,
          }),
        });

        if (!res.ok) throw new Error('Failed to create annotation');
        const created: Annotation = await res.json();

        setPendingAnnotation(null);
        setMode('view');
        await refreshAnnotations();
        setSelectedId(created.id);

        return created;
      } catch (error) {
        console.error('Failed to create annotation:', error);
        return null;
      }
    },
    [draftSlug, pendingAnnotation, refreshAnnotations]
  );

  // Update annotation
  const updateAnnotation = useCallback(
    async (id: string, content: string) => {
      try {
        const res = await fetch(`/api/annotations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!res.ok) throw new Error('Failed to update annotation');
        await refreshAnnotations();
      } catch (error) {
        console.error('Failed to update annotation:', error);
      }
    },
    [refreshAnnotations]
  );

  // Resolve annotation
  const resolveAnnotation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/annotations/${id}/resolve`, {
          method: 'POST',
        });

        if (!res.ok) throw new Error('Failed to resolve annotation');
        await refreshAnnotations();
      } catch (error) {
        console.error('Failed to resolve annotation:', error);
      }
    },
    [refreshAnnotations]
  );

  // Delete annotation
  const deleteAnnotation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/annotations/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete annotation');
        if (selectedId === id) setSelectedId(null);
        await refreshAnnotations();
      } catch (error) {
        console.error('Failed to delete annotation:', error);
      }
    },
    [refreshAnnotations, selectedId]
  );

  // Reply to annotation
  const replyToAnnotation = useCallback(
    async (parentId: string, content: string) => {
      const parent = annotations.find((a) => a.id === parentId);
      if (!parent) return;

      try {
        const res = await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftSlug,
            type: parent.type,
            content,
            selectors: parent.selectors,
            parentId,
          }),
        });

        if (!res.ok) throw new Error('Failed to create reply');
        await refreshAnnotations();
      } catch (error) {
        console.error('Failed to create reply:', error);
      }
    },
    [annotations, draftSlug, refreshAnnotations]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case 'c': {
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handleSetMode(mode === 'comment' ? 'view' : 'comment');
          }
          break;
        }
        case 'd': {
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handleSetMode(mode === 'draw' ? 'view' : 'draw');
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          handleSetMode('view');
          setSelectedId(null);
          break;
        }
        case 'j': {
          e.preventDefault();
          selectNext();
          break;
        }
        case 'k': {
          e.preventDefault();
          selectPrevious();
          break;
        }
        case ' ': {
          if (selectedId) {
            e.preventDefault();
            resolveAnnotation(selectedId);
          }
          break;
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedId, handleSetMode, selectNext, selectPrevious, resolveAnnotation]);

  const value: AnnotationContextValue = {
    mode,
    annotations,
    selectedId,
    pendingAnnotation,
    counts,
    isLoading,
    showResolved,
    setMode: handleSetMode,
    selectAnnotation,
    setPendingAnnotation,
    setShowResolved,
    createAnnotation,
    updateAnnotation,
    resolveAnnotation,
    deleteAnnotation,
    replyToAnnotation,
    selectNext,
    selectPrevious,
    refreshAnnotations,
  };

  return <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>;
}

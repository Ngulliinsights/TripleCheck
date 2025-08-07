import { useCallback, useState } from 'react';

export interface ImageStateHook {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  next: (length: number) => void;
  prev: (length: number) => void;
  selectImage: (index: number) => void;
}

export function useImageState(initialIndex = 0): ImageStateHook {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const next = useCallback((length: number) => {
    setCurrentIndex((prev) => (prev + 1) % length);
  }, []);

  const prev = useCallback((length: number) => {
    setCurrentIndex((prev) => (prev - 1 + length) % length);
  }, []);

  const selectImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return {
    currentIndex,
    setCurrentIndex,
    next,
    prev,
    selectImage,
  };
}
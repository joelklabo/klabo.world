'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('article');
      if (!article) return;

      const { top, height } = article.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollableHeight = height - viewportHeight;

      if (scrollableHeight <= 0) {
        setProgress(100);
        return;
      }

      const scrolled = Math.max(0, -top);
      const percentage = Math.min(100, Math.max(0, (scrolled / scrollableHeight) * 100));
      setProgress(percentage);
    };

    // Initial calculation
    updateProgress();

    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[110] h-1.5 bg-background/50 backdrop-blur-sm"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-secondary to-chart-3 motion-safe:transition-[width] motion-safe:duration-200 ease-out shadow-lg shadow-primary/50"
        style={{
          width: `${progress}%`,
          boxShadow: `0 0 20px oklch(72% 0.16 80deg / ${Math.min(progress / 100, 1) * 0.4})`
        }}
      />
    </div>
  );
}

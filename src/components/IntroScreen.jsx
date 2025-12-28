import React, { useEffect } from 'react';

/**
 * IntroScreen - First screen shown when the app loads
 * Shows game title, subtitle, and Play button(s)
 * If user has saved progress, shows both "New Game" and "Continue" options
 * Temporarily disables body scrolling while visible
 */
export default function IntroScreen({ onPlay, onNewGame, hasProgress }) {
  // Disable scrolling on body while intro screen is visible
  useEffect(() => {
    // Save the original overflow value
    const originalOverflow = document.body.style.overflow;

    // Disable scrolling
    document.body.style.overflow = 'hidden';

    // Cleanup: restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="intro-screen">
      {/* Background layer - fullscreen animated decorations */}
      <div className="intro-decorations">
        <div className="deco-circle deco-1"></div>
        <div className="deco-circle deco-2"></div>
        <div className="deco-circle deco-3"></div>
        <div className="deco-circle deco-4"></div>
        <div className="deco-circle deco-5"></div>
        <div className="deco-circle deco-6"></div>
      </div>

      {/* Content layer - centered text and button */}
      <div className="intro-content">
        <div className="intro-header">
          <h1 className="intro-title">Nail Art Match</h1>
          <p className="intro-subtitle">
            Create beautiful nail designs and match your client's vision
          </p>
        </div>

        {hasProgress ? (
          <div className="intro-buttons-group">
            <button
              className="intro-play-button intro-continue-button"
              onClick={onPlay}
              aria-label="Continue game with saved progress"
            >
              <span className="play-button-icon">▶</span>
              <span className="play-button-text">Pokračovať</span>
            </button>
            <button
              className="intro-play-button intro-new-game-button"
              onClick={onNewGame}
              aria-label="Start new game from beginning"
            >
              <span className="play-button-icon">↻</span>
              <span className="play-button-text">Nová hra</span>
            </button>
          </div>
        ) : (
          <button
            className="intro-play-button"
            onClick={onPlay}
            aria-label="Start playing Nail Art Match"
          >
            <span className="play-button-icon">▶</span>
            <span className="play-button-text">Play</span>
          </button>
        )}
      </div>
    </div>
  );
}

import React from 'react';

/**
 * IntroScreen - First screen shown when the app loads
 * Shows game title, subtitle, and a large Play button
 */
export default function IntroScreen({ onPlay }) {
  return (
    <div className="intro-screen">
      <div className="intro-content">
        <div className="intro-header">
          <h1 className="intro-title">Nail Art Match</h1>
          <p className="intro-subtitle">
            Create beautiful nail designs and match your client's vision
          </p>
        </div>

        <button
          className="intro-play-button"
          onClick={onPlay}
          aria-label="Start playing Nail Art Match"
        >
          <span className="play-button-icon">▶</span>
          <span className="play-button-text">Play</span>
        </button>

        <div className="intro-decorations">
          <div className="deco-circle deco-1"></div>
          <div className="deco-circle deco-2"></div>
          <div className="deco-circle deco-3"></div>
        </div>
      </div>
    </div>
  );
}

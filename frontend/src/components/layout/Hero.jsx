import React, { useState, useEffect } from 'react';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start smooth fade-out after 4.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 4500);

    // Completely close/remove bar after 5 seconds
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`cursive-announcement-bar ${isFadingOut ? 'fade-out' : ''}`}>
      <span className="cursive-text">Just type and AI has outfits lined up for you!</span>
    </div>
  );
}

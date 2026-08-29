import React, { useState, useEffect } from 'react';
import './HeroStatusHUD.css';

/**
 * HeroStatusHUD.jsx
 * 
 * Hearthstone x Dota 2 inspired hero status display with:
 * - Portrait frame with faction-colored border
 * - Segmented health/mana bars with numeric overlay
 * - Status effect icon carousel
 * - Ultimate indicator (pulsing orb when ready)
 * - Level progress XP bar
 * - Floating combat text on damage/heal
 */

const FACTION_COLORS = {
  crystal: '#00d9ff',
  toxic: '#39ff14',
  druid: '#ffd700',
  void: '#9d00ff',
};

const RARITY_GEMS = {
  common: '◆',
  rare: '◇',
  epic: '✦',
  legendary: '★',
};

function HeroStatusHUD({
  hero = {
    name: 'Shadow Fiend',
    faction: 'void',
    rarity: 'legendary',
    level: 12,
    xp: 750,
    xpToNext: 1000,
    health: 1850,
    maxHealth: 2200,
    mana: 450,
    maxMana: 600,
    portrait: '😈',
  },
  statusEffects = [],
  ultimateReady = false,
  onUltimateClick,
  floatingTexts = [],
}) {
  const [healthWidth, setHealthWidth] = useState(100);
  const [manaWidth, setManaWidth] = useState(100);
  const [isLowHealth, setIsLowHealth] = useState(false);
  const [showUltimatePulse, setShowUltimatePulse] = useState(false);

  // Calculate bar widths
  useEffect(() => {
    const healthPercent = (hero.health / hero.maxHealth) * 100;
    const manaPercent = (hero.mana / hero.maxMana) * 100;
    
    setHealthWidth(healthPercent);
    setManaWidth(manaPercent);
    setIsLowHealth(healthPercent < 30);
  }, [hero.health, hero.maxHealth, hero.mana, hero.maxMana]);

  // Ultimate pulse animation
  useEffect(() => {
    if (ultimateReady) {
      setShowUltimatePulse(true);
      const interval = setInterval(() => {
        setShowUltimatePulse(prev => !prev);
      }, 800);
      return () => clearInterval(interval);
    } else {
      setShowUltimatePulse(false);
    }
  }, [ultimateReady]);

  const xpPercent = (hero.xp / hero.xpToNext) * 100;
  const factionColor = FACTION_COLORS[hero.faction] || '#fff';

  return (
    <div className="hero-status-hud">
      {/* Main Portrait Container */}
      <div className="portrait-container">
        {/* Rank Gems */}
        <div className="rank-gems top-left">
          {RARITY_GEMS[hero.rarity]}
        </div>
        <div className="rank-gems top-right">
          {RARITY_GEMS[hero.rarity]}
        </div>
        
        {/* Portrait Frame */}
        <div 
          className="portrait-frame"
          style={{ borderColor: factionColor }}
        >
          <div className="portrait-image">
            {hero.portrait}
          </div>
          
          {/* Level Badge */}
          <div className="level-badge">
            {hero.level}
          </div>
          
          {/* Ultimate Orb */}
          {ultimateReady && (
            <button 
              className={`ultimate-orb ${showUltimatePulse ? 'pulsing' : ''}`}
              onClick={onUltimateClick}
            >
              ⚡
            </button>
          )}
        </div>

        {/* Health Bar */}
        <div className="bar-container health-bar-container">
          <div 
            className={`bar-fill health-fill ${isLowHealth ? 'low' : ''}`}
            style={{ width: `${healthWidth}%` }}
          >
            <span className="bar-text">
              {hero.health.toLocaleString()} / {hero.maxHealth.toLocaleString()}
            </span>
          </div>
          <div className="bar-icon">❤️</div>
        </div>

        {/* Mana Bar */}
        <div className="bar-container mana-bar-container">
          <div 
            className="bar-fill mana-fill"
            style={{ width: `${manaWidth}%` }}
          >
            <span className="bar-text">
              {hero.mana.toLocaleString()} / {hero.maxMana.toLocaleString()}
            </span>
          </div>
          <div className="bar-icon">💎</div>
        </div>

        {/* XP Bar */}
        <div className="xp-bar-container">
          <div 
            className="xp-bar-fill"
            style={{ width: `${xpPercent}%` }}
          />
          <span className="xp-text">
            {hero.xp} / {hero.xpToNext} XP
          </span>
        </div>
      </div>

      {/* Status Effects Carousel */}
      {statusEffects.length > 0 && (
        <div className="status-effects-carousel">
          {statusEffects.map((effect, index) => (
            <div 
              key={`${effect.id}-${index}`}
              className={`status-effect-icon ${effect.type || 'buff'}`}
              title={effect.name}
            >
              {effect.icon}
              {effect.stacks > 1 && (
                <span className="stack-count">{effect.stacks}</span>
              )}
              {effect.duration && (
                <div 
                  className="duration-ring"
                  style={{ '--duration': effect.duration, '--maxDuration': effect.maxDuration }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Combat Text */}
      {floatingTexts.map((text, index) => (
        <div
          key={`${text.id}-${index}`}
          className={`floating-text ${text.type}`}
          style={{
            left: text.x || '50%',
            top: text.y || '50%',
            '--delay': `${index * 0.1}s`,
          }}
        >
          {text.value}
        </div>
      ))}
    </div>
  );
}

export default HeroStatusHUD;

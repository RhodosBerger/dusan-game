import React, { useState, useEffect, useRef } from 'react';
import './ShopNavigator.css';

/**
 * ShopNavigator.jsx
 * 
 * Hearthstone x Dota 2 inspired shop system with:
 * - Tabbed categories (Weapons, Armor, Consumables, Upgrades)
 * - 3D item preview with rotation
 * - Dynamic filtering by cost/rarity/type
 * - Purchase animations with coin burst
 * - Gold counter with animated tally
 * - Stock indicators for limited items
 */

const SHOP_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🛒' },
  { id: 'weapons', label: 'Weapons', icon: '⚔️' },
  { id: 'armor', label: 'Armor', icon: '🛡️' },
  { id: 'consumables', label: 'Consumables', icon: '🧪' },
  { id: 'upgrades', label: 'Upgrades', icon: '⬆️' },
];

const RARITY_COLORS = {
  common: '#b0b0b0',
  rare: '#00a8ff',
  epic: '#a335ee',
  legendary: '#ff8000',
};

const FACTION_COLORS = {
  crystal: '#00d9ff',
  toxic: '#39ff14',
  druid: '#ffd700',
  void: '#9d00ff',
};

// Sample shop data (replace with actual game data)
const SAMPLE_ITEMS = [
  {
    id: 'sword_001',
    name: 'Crystal Blade',
    category: 'weapons',
    cost: 60,
    rarity: 'rare',
    faction: 'crystal',
    description: 'A blade forged from pure crystal shards.',
    stats: { damage: 15, speed: 1.2 },
    image: '🗡️',
    stock: Infinity,
  },
  {
    id: 'shield_001',
    name: 'Toxic Barrier',
    category: 'armor',
    cost: 85,
    rarity: 'epic',
    faction: 'toxic',
    description: 'Absorbs damage and poisons attackers.',
    stats: { armor: 25, poisonDamage: 5 },
    image: '🛡️',
    stock: 3,
  },
  {
    id: 'potion_001',
    name: 'Druid Elixir',
    category: 'consumables',
    cost: 30,
    rarity: 'common',
    faction: 'druid',
    description: 'Restores 50 HP over 10 seconds.',
    stats: { heal: 50, duration: 10 },
    image: '🧪',
    stock: 10,
  },
  {
    id: 'upgrade_001',
    name: 'Void Amplifier',
    category: 'upgrades',
    cost: 150,
    rarity: 'legendary',
    faction: 'void',
    description: 'Increases spell damage by 40%.',
    stats: { spellDamage: 40 },
    image: '⬆️',
    stock: 1,
  },
  {
    id: 'sword_002',
    name: 'Druid Claw',
    category: 'weapons',
    cost: 45,
    rarity: 'common',
    faction: 'druid',
    description: 'Natural weapon with life steal.',
    stats: { damage: 10, lifesteal: 15 },
    image: '🗡️',
    stock: Infinity,
  },
  {
    id: 'armor_002',
    name: 'Crystal Plate',
    category: 'armor',
    cost: 120,
    rarity: 'legendary',
    faction: 'crystal',
    description: 'Reflects 30% of damage taken.',
    stats: { armor: 40, reflect: 30 },
    image: '🛡️',
    stock: 2,
  },
];

function ShopNavigator({ 
  gold = 1000, 
  onPurchase, 
  onClose,
  ownedItems = [],
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewRotation, setPreviewRotation] = useState({ x: -10, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [purchaseAnim, setPurchaseAnim] = useState(null);
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterFaction, setFilterFaction] = useState('all');
  const previewRef = useRef(null);

  // Filter items based on tab and filters
  const filteredItems = SAMPLE_ITEMS.filter(item => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesRarity = filterRarity === 'all' || item.rarity === filterRarity;
    const matchesFaction = filterFaction === 'all' || item.faction === filterFaction;
    const inStock = item.stock > 0;
    return matchesTab && matchesRarity && matchesFaction && inStock;
  });

  // Handle preview rotation
  const handlePreviewMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePreviewMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setPreviewRotation(prev => ({
      x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePreviewMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-rotate when not dragging
  useEffect(() => {
    if (!isDragging && selectedItem) {
      const interval = setInterval(() => {
        setPreviewRotation(prev => ({
          ...prev,
          y: prev.y + 0.5,
        }));
      }, 16);
      return () => clearInterval(interval);
    }
  }, [isDragging, selectedItem]);

  // Handle purchase
  const handlePurchase = (item) => {
    if (gold < item.cost) return;
    
    setPurchaseAnim(item.id);
    setTimeout(() => {
      onPurchase?.(item);
      setPurchaseAnim(null);
      setSelectedItem(null);
    }, 600);
  };

  // Check if item is owned
  const isOwned = (itemId) => ownedItems.includes(itemId);

  return (
    <div className="shop-navigator-overlay">
      <div className="shop-navigator">
        {/* Header */}
        <div className="shop-header">
          <h2>Black Market</h2>
          <div className="gold-counter">
            <span className="coin-icon">🪙</span>
            <span className={`gold-amount ${purchaseAnim ? 'spend' : ''}`}>
              {gold.toLocaleString()}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Main Content */}
        <div className="shop-content">
          {/* Left Panel - Categories & Filters */}
          <div className="shop-sidebar">
            {/* Category Tabs */}
            <div className="category-tabs">
              {SHOP_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`tab-btn ${activeTab === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  <span className="tab-icon">{cat.icon}</span>
                  <span className="tab-label">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="filters-section">
              <h4>Rarity</h4>
              <div className="filter-buttons">
                {['all', 'common', 'rare', 'epic', 'legendary'].map(rarity => (
                  <button
                    key={rarity}
                    className={`filter-btn rarity-${rarity} ${filterRarity === rarity ? 'active' : ''}`}
                    onClick={() => setFilterRarity(rarity)}
                    style={{
                      borderColor: rarity !== 'all' ? RARITY_COLORS[rarity] : undefined,
                    }}
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </button>
                ))}
              </div>

              <h4>Faction</h4>
              <div className="filter-buttons">
                {['all', 'crystal', 'toxic', 'druid', 'void'].map(faction => (
                  <button
                    key={faction}
                    className={`filter-btn faction-${faction} ${filterFaction === faction ? 'active' : ''}`}
                    onClick={() => setFilterFaction(faction)}
                    style={{
                      borderColor: faction !== 'all' ? FACTION_COLORS[faction] : undefined,
                    }}
                  >
                    {faction.charAt(0).toUpperCase() + faction.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Item Grid */}
          <div className="shop-items-grid">
            {filteredItems.length === 0 ? (
              <div className="no-items">
                <p>No items match your filters</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`shop-item-card ${selectedItem?.id === item.id ? 'selected' : ''} ${isOwned(item.id) ? 'owned' : ''}`}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    borderLeft: `4px solid ${RARITY_COLORS[item.rarity]}`,
                  }}
                >
                  <div className="item-icon">{item.image}</div>
                  <div className="item-info">
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-type">{item.category}</p>
                    <div className="item-cost">
                      <span className="coin-icon-small">🪙</span>
                      {item.cost}
                    </div>
                  </div>
                  {item.stock < Infinity && (
                    <div className={`stock-indicator ${item.stock <= 2 ? 'low' : ''}`}>
                      {item.stock} left
                    </div>
                  )}
                  {isOwned(item.id) && (
                    <div className="owned-badge">Owned</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="shop-preview-panel">
            {selectedItem ? (
              <>
                <div 
                  className="preview-3d-container"
                  ref={previewRef}
                  onMouseDown={handlePreviewMouseDown}
                  onMouseMove={handlePreviewMouseMove}
                  onMouseUp={handlePreviewMouseUp}
                  onMouseLeave={handlePreviewMouseUp}
                >
                  <div 
                    className="preview-3d-model"
                    style={{
                      transform: `rotateX(${previewRotation.x}deg) rotateY(${previewRotation.y}deg)`,
                      borderColor: FACTION_COLORS[selectedItem.faction],
                    }}
                  >
                    <span className="preview-model-icon">{selectedItem.image}</span>
                  </div>
                  <div className="preview-hint">Drag to rotate</div>
                </div>

                <div className="preview-details">
                  <h3 className="preview-name">{selectedItem.name}</h3>
                  <p className="preview-description">{selectedItem.description}</p>
                  
                  <div className="preview-stats">
                    {Object.entries(selectedItem.stats).map(([stat, value]) => (
                      <div key={stat} className="stat-row">
                        <span className="stat-name">{stat.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="stat-value">+{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="preview-meta">
                    <span className={`rarity-badge rarity-${selectedItem.rarity}`}>
                      {selectedItem.rarity.toUpperCase()}
                    </span>
                    <span className={`faction-badge faction-${selectedItem.faction}`}>
                      {selectedItem.faction.toUpperCase()}
                    </span>
                  </div>

                  <button
                    className={`purchase-btn ${purchaseAnim === selectedItem.id ? 'purchasing' : ''} ${gold < selectedItem.cost ? 'disabled' : ''} ${isOwned(selectedItem.id) ? 'owned' : ''}`}
                    onClick={() => handlePurchase(selectedItem)}
                    disabled={gold < selectedItem.cost || isOwned(selectedItem.id)}
                  >
                    {isOwned(selectedItem.id) ? (
                      'OWNED'
                    ) : gold < selectedItem.cost ? (
                      'NOT ENOUGH GOLD'
                    ) : (
                      <>
                        <span className="coin-icon-small">🪙</span>
                        {purchaseAnim === selectedItem.id ? 'PURCHASING...' : `BUY (${selectedItem.cost})`}
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="preview-empty">
                <p>Select an item to preview</p>
                <div className="preview-placeholder">🔍</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coin Burst Animation */}
      {purchaseAnim && (
        <div className="coin-burst-overlay">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="coin-particle"
              style={{
                '--i': i,
                '--angle': `${(i / 12) * 360}deg`,
              }}
            >
              🪙
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShopNavigator;

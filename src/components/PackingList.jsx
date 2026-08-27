import React, { useState, useMemo } from 'react';

export const PackingList = () => {
  // Pre-populated with some useful defaults
  const [items, setItems] = useState([
    { id: 1, text: 'Laptop & Power Adapter', checked: false },
    { id: 2, text: 'Running Shoes & Trackers', checked: false },
    { id: 3, text: 'Water Bottle', checked: false },
    { id: 4, text: 'Notepad & Pens', checked: false }
  ]);
  
  const [newItemText, setNewItemText] = useState('');

  // Calculate the packing completion percentage
  const progressPercentage = useMemo(() => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.checked).length;
    return Math.round((completed / items.length) * 100);
  }, [items]);

  const handleToggle = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    
    setItems([
      ...items, 
      { id: Date.now(), text: newItemText.trim(), checked: false }
    ]);
    setNewItemText('');
  };

  const handleRemove = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="control-card" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
      <label style={{ fontWeight: 'bold', marginBottom: '15px', display: 'block', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        🎒 Journey Packing List
      </label>

      {/* Progress Bar Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span className="micro-label" style={{ color: progressPercentage === 100 ? '#10b981' : '#64748b' }}>
            {progressPercentage === 100 ? '🎉 100% Packing Done!' : 'Packing Progress'}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: progressPercentage === 100 ? '#10b981' : '#334155' }}>
            {progressPercentage}%
          </span>
        </div>
        <div style={{ height: '8px', width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${progressPercentage}%`, 
              background: progressPercentage === 100 ? '#10b981' : '#3b82f6',
              transition: 'width 0.4s ease-in-out, background-color 0.4s ease'
            }} 
          />
        </div>
      </div>

      {/* Upgraded Input Section */}
      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '10px', marginBottom: '20px', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          {/* Decorative Icon */}
          <span style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontSize: '1.1rem', pointerEvents: 'none' }}>
            🎒
          </span>
          
          <input 
            type="text" 
            placeholder="What do you need to pack?" 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 36px 12px 38px', 
              border: '2px solid #e2e8f0', 
              borderRadius: '8px', 
              fontSize: '0.95rem',
              color: '#334155', // Bug fix: Forces typed text to be dark gray
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              backgroundColor: '#f8fafc'
            }}
            onFocus={(e) => { 
              e.target.style.borderColor = '#3b82f6'; 
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; 
              e.target.style.backgroundColor = '#ffffff';
            }}
            onBlur={(e) => { 
              e.target.style.borderColor = '#e2e8f0'; 
              e.target.style.boxShadow = 'none'; 
              e.target.style.backgroundColor = '#f8fafc';
            }}
          />
          
          {/* Quick Clear Button */}
          {newItemText && (
            <button 
              type="button"
              onClick={() => setNewItemText('')}
              style={{ 
                position: 'absolute', right: '12px', background: '#e2e8f0', border: 'none', 
                borderRadius: '50%', width: '22px', height: '22px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer',
                fontSize: '0.8rem', padding: 0, transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#cbd5e1'}
              onMouseLeave={(e) => e.target.style.background = '#e2e8f0'}
              title="Clear text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dynamic Add Button */}
        <button 
          type="submit" 
          style={{ 
            padding: '0 20px', 
            background: newItemText.trim() ? '#3b82f6' : '#e2e8f0', 
            color: newItemText.trim() ? 'white' : '#94a3b8', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: newItemText.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            boxShadow: newItemText.trim() ? '0 4px 6px -1px rgba(59, 130, 246, 0.2)' : 'none'
          }}
          disabled={!newItemText.trim()}
        >
          Add Item
        </button>
      </form>

      {/* Checklist Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
        {items.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>Your bag is empty.</p>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '8px', 
                background: item.checked ? '#f8fafc' : '#fff',
                border: '1px solid',
                borderColor: item.checked ? '#e2e8f0' : '#cbd5e1',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                <input 
                  type="checkbox" 
                  checked={item.checked}
                  onChange={() => handleToggle(item.id)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ 
                  fontSize: '0.9rem',
                  textDecoration: item.checked ? 'line-through' : 'none',
                  color: item.checked ? '#94a3b8' : '#334155'
                }}>
                  {item.text}
                </span>
              </label>
              <button 
                onClick={() => handleRemove(item.id)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 5px', fontSize: '1.1rem' }}
                title="Remove item"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
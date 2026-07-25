import React, { memo } from 'react';

export const BudgetPanel = memo(({ totalBudget, setTotalBudget }) => {
  return (
    <div className="control-group budget-filter-group">
      <label>
        4. TOTAL TRIP BUDGET: <span className="budget-value-text">₹{totalBudget.toLocaleString()}</span>
      </label>
      <input 
        type="range" 
        min="500" 
        max="50000" 
        step="500"
        value={totalBudget}
        onChange={(e) => setTotalBudget(Number(e.target.value))}
        className="budget-slider"
      />
      <div className="budget-ticks">
        <span>₹500</span>
        <span>₹25,000</span>
        <span>₹50,000</span>
      </div>
    </div>
  );
});
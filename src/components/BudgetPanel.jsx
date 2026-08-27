import React, { memo, useState, useEffect } from 'react';

export const BudgetPanel = memo(({ totalBudget, setTotalBudget }) => {
  // 1. New state for currency tracking
  const [targetCurrency, setTargetCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState(1);
  
  // Standard currencies to choose from
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'NPR'];
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', NPR: 'रू' };

  // 2. Fetch exchange rates when the selected currency changes
  useEffect(() => {
    if (targetCurrency === 'INR') {
      setExchangeRate(1);
      return;
    }

    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/INR');
        const data = await response.json();
        if (data && data.rates && data.rates[targetCurrency]) {
          setExchangeRate(data.rates[targetCurrency]);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };

    fetchRates();
  }, [targetCurrency]);

  // 3. Calculate the displayed budget based on the live rate
  const convertedBudget = (totalBudget * exchangeRate).toFixed(0);
  const currentSymbol = symbols[targetCurrency] || targetCurrency;

  return (
    <div className="control-group budget-filter-group">
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>4. TOTAL TRIP BUDGET: <span className="budget-value-text">{currentSymbol}{Number(convertedBudget).toLocaleString()}</span></span>
        
        {/* Currency Dropdown */}
        <select 
          value={targetCurrency} 
          onChange={(e) => setTargetCurrency(e.target.value)}
          style={{ padding: '2px 5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}
        >
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      {/* Slider remains mapped to the base INR value */}
      <input 
        type="range" 
        min="500" 
        max="50000" 
        step="500"
        value={totalBudget}
        onChange={(e) => setTotalBudget(Number(e.target.value))}
        className="budget-slider"
        style={{ marginTop: '10px' }}
      />
      <div className="budget-ticks">
        <span>₹500</span>
        <span>₹25,000</span>
        <span>₹50,000</span>
      </div>
    </div>
  );
});
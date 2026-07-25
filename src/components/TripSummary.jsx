import React, { memo } from 'react';

export const TripSummary = memo(({ tripPlan, selectedPlace }) => {
  if (!tripPlan) return null;

  return (
    <div className="bottom-route-panel">
      <h3>📊 Professional Trip Summary</h3>
      <div className="summary-destination-title">{selectedPlace?.name}</div>
      <div className="summary-meta-row">
        <span>🚗 {tripPlan.distance}</span>
        <span>⏱️ {tripPlan.duration}</span>
      </div>

      <div className="summary-cost-breakdown">
        <div className="cost-row">
          <span>⛽ Fuel / Power:</span>
          <span>₹{tripPlan.fuelCost.toLocaleString()}</span>
        </div>
        <div className="cost-row">
          <span>🏨/🍽️ Service Item:</span>
          <span>₹{tripPlan.itemCost.toLocaleString()}</span>
        </div>
        <div className="cost-row">
          <span>🍽️ Food & Meals:</span>
          <span>₹{tripPlan.foodCost.toLocaleString()}</span>
        </div>
        <div className="cost-row">
          <span>🅿️ Parking & Tolls:</span>
          <span>₹{tripPlan.parkingCost.toLocaleString()}</span>
        </div>
        {tripPlan.chargingCost > 0 && (
          <div className="cost-row">
            <span>⚡ EV Charging:</span>
            <span>₹{tripPlan.chargingCost.toLocaleString()}</span>
          </div>
        )}
        <div className="cost-row total-row">
          <span>Total Estimated Spend:</span>
          <span>₹{tripPlan.totalEstimatedSpend.toLocaleString()}</span>
        </div>
        <div className={`cost-row balance-row ${tripPlan.isWithinBudget ? 'positive' : 'negative'}`}>
          <span>Remaining Balance:</span>
          <span>₹{tripPlan.remainingBalance.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
});
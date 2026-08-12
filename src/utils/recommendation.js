export function calculateRecommendationScore(place, userBudget, category) {
  const ratingWeight = (parseFloat(place.rating) || 4.0) * 15; 
  const distancePenalty = (place.distanceValue || 1) * 2;
  
  let budgetScore = 50;
  if (place.estimatedCost <= userBudget) {
    const diff = userBudget - place.estimatedCost;
    budgetScore += Math.min(50, diff / 200);
  } else {
    budgetScore -= 100; 
  }

  const finalScore = Math.max(0, Math.min(100, ratingWeight - distancePenalty + budgetScore / 2));
  return parseFloat(finalScore.toFixed(1));
}
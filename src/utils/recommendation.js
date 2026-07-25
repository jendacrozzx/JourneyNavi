export function calculateRecommendationScore(place, userBudget, category) {
  const ratingWeight = (parseFloat(place.rating) || 4.0) * 15; // Max ~75
  const distancePenalty = (place.distanceValue || 1) * 2; // Lower distance is better
  
  let budgetScore = 50;
  if (place.estimatedCost <= userBudget) {
    const diff = userBudget - place.estimatedCost;
    budgetScore += Math.min(50, diff / 200); // Rewards places well within budget
  } else {
    budgetScore -= 100; // Heavy penalty if exceeding budget
  }

  const finalScore = Math.max(0, Math.min(100, ratingWeight - distancePenalty + budgetScore / 2));
  return parseFloat(finalScore.toFixed(1));
}
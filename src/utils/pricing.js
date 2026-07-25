export function getRealisticHotelPricing(rating, index) {
  const base = parseFloat(rating) || 4.0;
  if (base >= 4.5) {
    return { tier: 'Luxury', min: 9000, max: 18000, text: '₹9,000+' };
  } else if (base >= 4.2) {
    return { tier: 'Premium', min: 5000, max: 8999, text: '₹5,000 – ₹8,999' };
  } else if (base >= 3.9) {
    return { tier: 'Standard', min: 2500, max: 4999, text: '₹2,500 – ₹4,999' };
  } else {
    return { tier: 'Budget', min: 1000, max: 2499, text: '₹1,000 – ₹2,499' };
  }
}

export function estimateServiceCost(category, index, rating) {
  switch (category) {
    case 'lodging':
      return getRealisticHotelPricing(rating, index).min;
    case 'gas':
      return 1500 + (index * 200) % 1500;
    case 'ev':
      return 400 + (index * 50) % 600;
    case 'restaurant':
      return 600 + (index * 150) % 2000;
    case 'attraction':
      return index % 2 === 0 ? 0 : 500;
    default:
      return 500;
  }
}
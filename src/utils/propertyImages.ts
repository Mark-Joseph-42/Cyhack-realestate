import skylinePenthouseImg from '../assets/images/property_skyline_penthouse_1791615612786.jpg';
import urbanLoftImg from '../assets/images/property_urban_loft_1791615628545.jpg';
import gardenTownhouseImg from '../assets/images/property_garden_townhouse_1791615647472.jpg';
import waterfrontVillaImg from '../assets/images/property_waterfront_villa_1791615662424.jpg';
import familyTownhouseImg from '../assets/images/property_family_townhouse_1791615677726.jpg';

export interface PropertyUIMetadata {
  image: string;
  unitAddress: string;
  bathrooms: string;
  sqft: string;
  monthlyEst: string;
  matchScore: number;
  matchBadge: string;
  matchBadgeStyle: 'emerald' | 'amber';
  kickerText: string;
  insightType: 'ai' | 'info' | 'warning';
  insightTitle: string;
  insightText: string;
}

export const PROPERTY_UI_MAP: Record<number, PropertyUIMetadata> = {
  1: {
    image: skylinePenthouseImg,
    unitAddress: 'Unit 3402',
    bathrooms: '3 Baths',
    sqft: '2,450 sqft',
    monthlyEst: 'Est. $4,120 / mo',
    matchScore: 98,
    matchBadge: 'Top Pick',
    matchBadgeStyle: 'emerald',
    kickerText: 'TOP RECOMMENDED DOSSIER',
    insightType: 'ai',
    insightTitle: 'AI Insight:',
    insightText: 'Fits $850k target, 21-day expedited close verified, includes deeded prime parking.',
  },
  6: {
    image: urbanLoftImg,
    unitAddress: '450 Meridian Way',
    bathrooms: '2 Baths',
    sqft: '1,850 sqft',
    monthlyEst: 'Est. $3,940 / mo',
    matchScore: 94,
    matchBadge: 'Under Budget',
    matchBadgeStyle: 'emerald',
    kickerText: 'APPROVED BUDGET SURPLUS',
    insightType: 'info',
    insightTitle: 'Status:',
    insightText: 'Move-in ready in 14 days. Full $30k under approved limit with private balcony.',
  },
  7: {
    image: gardenTownhouseImg,
    unitAddress: '18 Mulberry Lane',
    bathrooms: '2.5 Baths',
    sqft: '2,200 sqft',
    monthlyEst: 'Est. $4,290 / mo',
    matchScore: 91,
    matchBadge: 'High Demand',
    matchBadgeStyle: 'amber',
    kickerText: 'COMPETITIVE LISTING',
    insightType: 'warning',
    insightTitle: 'Status:',
    insightText: 'Multiple offers expected. Private gated courtyard and separate storage cellar.',
  },
  2: {
    image: gardenTownhouseImg,
    unitAddress: 'Unit 4B · Parkside',
    bathrooms: '2 Baths',
    sqft: '1,420 sqft',
    monthlyEst: 'Est. $2,050 / mo',
    matchScore: 92,
    matchBadge: 'Cash Fit',
    matchBadgeStyle: 'emerald',
    kickerText: 'SUBURBAN GARDEN RESIDENCE',
    insightType: 'ai',
    insightTitle: 'AI Insight:',
    insightText: 'Spacious garden-facing apartment close to top-rated schools, parks, and commuter transit.',
  },
  3: {
    image: waterfrontVillaImg,
    unitAddress: 'Waterfront Villa 12B',
    bathrooms: '4.5 Baths',
    sqft: '3,800 sqft',
    monthlyEst: 'Est. $6,180 / mo',
    matchScore: 89,
    matchBadge: 'Negotiable',
    matchBadgeStyle: 'amber',
    kickerText: 'MARINA BAY EXCLUSIVE',
    insightType: 'info',
    insightTitle: 'Status:',
    insightText: 'Exclusive waterfront villa with private jetty, infinity pool, and smart home automation.',
  },
  4: {
    image: urbanLoftImg,
    unitAddress: '88 Mercer Loft 2A',
    bathrooms: '1.5 Baths',
    sqft: '1,150 sqft',
    monthlyEst: 'Est. $1,390 / mo',
    matchScore: 84,
    matchBadge: 'Entry Tier',
    matchBadgeStyle: 'emerald',
    kickerText: 'ART DISTRICT INDUSTRIAL',
    insightType: 'info',
    insightTitle: 'Status:',
    insightText: 'Industrial aesthetic loft with exposed brick walls, 14ft ceilings, ideal for young professionals.',
  },
  5: {
    image: familyTownhouseImg,
    unitAddress: '1428 Northwood Dr',
    bathrooms: '2.5 Baths',
    sqft: '2,180 sqft',
    monthlyEst: 'Est. $2,690 / mo',
    matchScore: 86,
    matchBadge: 'Family Pick',
    matchBadgeStyle: 'emerald',
    kickerText: 'NORTHWOOD ESTATES',
    insightType: 'info',
    insightTitle: 'Status:',
    insightText: 'Contemporary suburban townhouse with attached 2-car garage and community clubhouse access.',
  },
};

export function getPropertyMeta(propertyId: number): PropertyUIMetadata {
  return PROPERTY_UI_MAP[propertyId] || PROPERTY_UI_MAP[1];
}

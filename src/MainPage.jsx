import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Components
import WeatherWidget from './components/WeatherWidget';
import { PackingList } from './components/PackingList';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CITIES = {
  Kathmandu: { lat: 27.6966, lng: 85.3591, name: "Kathmandu" },
  Pokhara: { lat: 28.2096, lng: 83.9856, name: "Pokhara" },
  Chitwan: { lat: 27.6833, lng: 84.3333, name: "Chitwan" },
  Lumbini: { lat: 27.4840, lng: 83.2760, name: "Lumbini" }
};

const CATEGORIES = [
  { id: 'lodging', label: 'Stays & Hotels', singular: 'Stay', icon: '🏨', tags: ['"tourism"="hotel"', '"tourism"="motel"', '"amenity"="hotel"'] },
  { id: 'gas', label: 'Gas Stations', singular: 'Gas Station', icon: '⛽', tags: ['"amenity"="fuel"', '"shop"="fuel"'] },
  { id: 'hospital', label: 'Hospitals', singular: 'Hospital', icon: '🏥', tags: ['"amenity"="hospital"', '"amenity"="clinic"'] },
  { id: 'supermarket', label: 'Supermarkets', singular: 'Supermarket', icon: '🛒', tags: ['"shop"="supermarket"', '"shop"="mall"'] },
  { id: 'cafe', label: 'Cafes', singular: 'Cafe', icon: '☕', tags: ['"amenity"="cafe"', '"amenity"="coffee_shop"'] },
  { id: 'restaurant', label: 'Restaurants', singular: 'Restaurant', icon: '🍽️', tags: ['"amenity"="restaurant"', '"amenity"="fast_food"'] }
];

// Nepal Oil Corporation (NOC) live-price configuration.
// The official NOC site publishes prices by region/depot, not one nationwide rate.
// Browser apps can be blocked by NOC CORS, so production should expose
// VITE_NOC_PRICE_API or a same-origin /api/noc-prices proxy that reads noc.org.np.
const NOC_OFFICIAL_URLS = {
  petrol: 'https://www.noc.org.np/fuel-prices/petrol',
  diesel: 'https://www.noc.org.np/fuel-prices/diesel',
  retail: 'https://www.noc.org.np/fuel-prices/petrol'
};

const NOC_CITY_ZONES = {
  Kathmandu: 'category3',
  Pokhara: 'category3',
  Chitwan: 'category1',
  Lumbini: 'category1'
};

const NOC_ZONE_LABELS = {
  category1: 'NOC Category 1 depots',
  category2: 'NOC Category 2 (Surkhet / Dang)',
  category3: 'NOC Category 3 (Kathmandu / Pokhara / Dipayal)'
};

// Current official NOC values verified from the official price pages.
// These are an offline safety cache only; the UI clearly marks them as cached.
const NOC_OFFLINE_RATES = {
  category1: { petrol: 197.5, diesel: 197.5, effectiveDate: '2026-10-01' },
  category2: { petrol: 199, diesel: 199, effectiveDate: '2026-10-01' },
  category3: { petrol: 200, diesel: 200, effectiveDate: '2026-10-01' }
};

const NOC_CACHE_KEY = 'journeynavi_noc_prices_v2';
const NOC_REFRESH_MS = 30 * 60 * 1000; // refresh every 30 minutes

function getNocOfflineRates(city = 'Kathmandu', requestedZone = null) {
  const zone = requestedZone || NOC_CITY_ZONES[city] || 'category3';
  return {
    ...NOC_OFFLINE_RATES[zone],
    zone,
    zoneLabel: NOC_ZONE_LABELS[zone],
    source: 'NOC official cache',
    sourceUrl: NOC_OFFICIAL_URLS.retail,
    status: 'cached'
  };
}

function normalizePlaceText(value = '') {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function parseNocProductPage(html, zone) {
  if (!html || typeof DOMParser === 'undefined') return null;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = Array.from(doc.querySelectorAll('.pricedet, .price-details, table, .card, .card-body'));
  if (!blocks.length) return null;

  const zoneHints = {
    category1: ['charali', 'biratnagar', 'birgunj', 'amlekhjung', 'bhalbari', 'nepalgunj', 'dhangadhi'],
    category2: ['surkhet', 'dang'],
    category3: ['kathmandu', 'pokhara', 'dipayal']
  };

  const hints = zoneHints[zone] || zoneHints.category3;
  const block = blocks.find((candidate) => {
    const text = normalizePlaceText(candidate.textContent || '');
    return hints.some((hint) => text.includes(hint));
  });

  if (!block) return null;

  const rows = Array.from(block.querySelectorAll('tr'));
  const firstDataRow = rows.find((row) => row.querySelectorAll('td').length >= 2);
  if (!firstDataRow) return null;

  const cells = Array.from(firstDataRow.querySelectorAll('td')).map((cell) =>
    cell.textContent.replace(/\\s+/g, ' ').trim()
  );

  const priceIndex = cells.findIndex((cell) => /\b(?:rs\.?\s*)?\d+(?:\.\d+)?\b/i.test(cell));
  const dateIndex = cells.findIndex((cell) => /\b20\d{2}[-/]\d{2}[-/]\d{2}\b/.test(cell));
  const price = priceIndex >= 0 ? Number.parseFloat(cells[priceIndex].replace(/[^0-9.]/g, '')) : NaN;
  const effectiveDate = dateIndex >= 0 ? cells[dateIndex] : null;
  return Number.isFinite(price) ? { price, effectiveDate } : null;
}

async function fetchJsonWithTimeout(url, timeoutMs = 10000, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchTextWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml' }
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return await response.text();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchNocLiveRates(city, zoneOverride) {
  const zone = zoneOverride || NOC_CITY_ZONES[city] || 'category3';

  // 1) Preferred production path: your own backend/serverless endpoint.
  const configuredApi = (typeof window !== 'undefined' && window.__JOURNEYNAVI_NOC_API__) || '/api/noc-prices';
  const apiCandidates = configuredApi ? [configuredApi] : [];

  for (const baseUrl of apiCandidates) {
    try {
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}city=${encodeURIComponent(city)}&zone=${encodeURIComponent(zone)}`;
      const data = await fetchJsonWithTimeout(url, 8000);
      const petrol = Number(data?.petrol);
      const diesel = Number(data?.diesel);

      if (Number.isFinite(petrol) && Number.isFinite(diesel)) {
        return {
          petrol,
          diesel,
          effectiveDate: data.effectiveDate || data.lastUpdated || null,
          zone: data.zone || zone,
          zoneLabel: data.zoneLabel || NOC_ZONE_LABELS[zone],
          source: data.source || 'NOC official via server',
          sourceUrl: data.sourceUrl || NOC_OFFICIAL_URLS.retail,
          status: 'live'
        };
      }
    } catch (error) {
      // Continue to the official-page proxy fallback below.
    }
  }

  // 2) Official NOC page fallback for browser-only deployments.
  // This still reads NOC's official pages; the proxy only solves browser CORS.
  const proxy = 'https://api.allorigins.win/raw?url=';
  const [petrolHtml, dieselHtml] = await Promise.all([
    fetchTextWithTimeout(`${proxy}${encodeURIComponent(NOC_OFFICIAL_URLS.petrol)}`, 12000),
    fetchTextWithTimeout(`${proxy}${encodeURIComponent(NOC_OFFICIAL_URLS.diesel)}`, 12000)
  ]);

  const petrol = parseNocProductPage(petrolHtml, zone);
  const diesel = parseNocProductPage(dieselHtml, zone);

  if (!petrol || !diesel) {
    throw new Error('NOC pages loaded but no matching regional price rows were found.');
  }

  return {
    petrol: petrol.price,
    diesel: diesel.price,
    effectiveDate: petrol.effectiveDate || diesel.effectiveDate || null,
    zone,
    zoneLabel: NOC_ZONE_LABELS[zone],
    source: 'NOC official via browser proxy',
    sourceUrl: NOC_OFFICIAL_URLS.retail,
    status: 'live'
  };
}

function MapViewController({ center, zoom, activePlace }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      const targetCenter = activePlace ? [center[0], center[1] - 0.01] : center;
      map.flyTo(targetCenter, zoom, { duration: 1.5 });
    }
  }, [center, zoom, activePlace, map]);
  return null;
}

export default function MainPage({ 
  initialRole = 'user', 
  onBackToLanding, 
  onOpenAdminModal, 
  onOpenAuthModal, 
  currentUser, 
  onLogout 
}) {
  const [userRole, setUserRole] = useState(initialRole);
  const [selectedCity, setSelectedCity] = useState('Kathmandu');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  
  const [places, setPlaces] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiError, setApiError] = useState(null); 

  const [mapCenter, setMapCenter] = useState([CITIES.Kathmandu.lat, CITIES.Kathmandu.lng]);
  const [mapZoom, setMapZoom] = useState(13);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Use Current GPS');
  
  // High Budget Allocation State (Increased Upper Limits)
  const [budgets, setBudgets] = useState({ 
    transport: 10000, 
    accommodation: 30000, 
    foodAndActivities: 20000 
  });
  
  // NOC Fuel Rates Auto-Sync State
  const [nocRates, setNocRates] = useState(() => getNocOfflineRates(selectedCity));
  const [nocStatus, setNocStatus] = useState('cached'); // loading | live | cached | error
  const [nocLastChecked, setNocLastChecked] = useState(null);
  const [nocError, setNocError] = useState('');
  const [nocZone, setNocZone] = useState(() => NOC_CITY_ZONES[selectedCity] || 'category3');
  const [fuelType, setFuelType] = useState('petrol'); // 'petrol' | 'diesel'
  const [useManualFuelPrice, setUseManualFuelPrice] = useState(false);
  const [manualFuelPrice, setManualFuelPrice] = useState(0);
  const [vehicleType, setVehicleType] = useState('bike');
  const [rideService, setRideService] = useState('pathao');
  const [fuelEfficiency, setFuelEfficiency] = useState(35);

  const fuelPrice = useManualFuelPrice
    ? manualFuelPrice
    : Number(nocRates?.[fuelType] || 0);

  // Multi-Stop Itinerary State
  const [itinerary, setItinerary] = useState([]);
  const [stopSpend, setStopSpend] = useState({ accommodation: 0, foodAndActivities: 0 });
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const [showTransitModal, setShowTransitModal] = useState(false);
  const [selectedPlaceForTransit, setSelectedPlaceForTransit] = useState(null);
  
  // Admin Add Custom Place Modal & State
  const [showAdminPlaceModal, setShowAdminPlaceModal] = useState(false);
  const [adminFormError, setAdminFormError] = useState('');
  const [adminNewPlace, setAdminNewPlace] = useState({
    name: '',
    address: '',
    category: CATEGORIES[0].id,
    lat: '',
    lng: '',
    googleMapsUrl: ''
  });

  const [routeError, setRouteError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [customPlaces, setCustomPlaces] = useState(() => {
    try {
      const saved = localStorage.getItem('bca_admin_places');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [viewingSaved, setViewingSaved] = useState(false);

  const notify = useCallback((message, type = 'info') => {
    setToast({ message, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadNocPrices = useCallback(async (city = selectedCity, silent = false, zoneOverride = nocZone) => {
    const zone = zoneOverride || NOC_CITY_ZONES[city] || 'category3';
    const cachedForCity = (() => {
      try {
        const raw = localStorage.getItem(NOC_CACHE_KEY);
        const data = raw ? JSON.parse(raw) : {};
        return data?.[city] || null;
      } catch {
        return null;
      }
    })();

    if (cachedForCity && cachedForCity.zone === zone && Number.isFinite(Number(cachedForCity.petrol)) && Number.isFinite(Number(cachedForCity.diesel))) {
      setNocRates((prev) => ({
        ...prev,
        ...cachedForCity,
        zone: cachedForCity.zone || zone,
        zoneLabel: cachedForCity.zoneLabel || NOC_ZONE_LABELS[zone],
        status: 'cached'
      }));
    } else if (!nocRates || nocRates.zone !== zone) {
      setNocRates(getNocOfflineRates(city));
    }

    setNocStatus('loading');
    setNocError('');

    try {
      const live = await fetchNocLiveRates(city, zone);
      setNocRates(live);
      setNocStatus('live');
      setNocLastChecked(new Date().toISOString());
      try {
        const existingRaw = localStorage.getItem(NOC_CACHE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        existing[city] = { ...live, cachedAt: new Date().toISOString() };
        localStorage.setItem(NOC_CACHE_KEY, JSON.stringify(existing));
      } catch {
        // Storage can be disabled/quota-limited; live data still works.
      }
    } catch (error) {
      const offline = cachedForCity
        ? {
            ...cachedForCity,
            status: 'cached',
            source: cachedForCity.source || 'Previously fetched NOC price'
          }
        : getNocOfflineRates(city);

      setNocRates(offline);
      setNocStatus('cached');
      setNocLastChecked(new Date().toISOString());
      setNocError('Live NOC refresh failed. Using the latest available NOC cache.');
      if (!silent) notify('NOC live refresh failed; using cached official pricing.', 'warning');
    }
  }, [selectedCity, nocRates, notify, nocZone]);

  // Load immediately, then keep the displayed NOC rate fresh.
  useEffect(() => {
    loadNocPrices(selectedCity, true, nocZone);
    const intervalId = window.setInterval(() => loadNocPrices(selectedCity, true, nocZone), NOC_REFRESH_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedCity, nocZone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!useManualFuelPrice) {
      setManualFuelPrice(Number(nocRates?.[fuelType] || 0));
    }
  }, [fuelType, nocRates, useManualFuelPrice]);

  const totalBudget = useMemo(() => 
    budgets.transport + budgets.accommodation + budgets.foodAndActivities, 
  [budgets]);

  // Calculate Running Costs
  const totalSpent = useMemo(() => itinerary.reduce((acc, stop) => ({
    transport: acc.transport + (stop.info?.transitCost || 0),
    accommodation: acc.accommodation + (stop.spend?.accommodation || 0),
    foodAndActivities: acc.foodAndActivities + (stop.spend?.foodAndActivities || 0)
  }), { transport: 0, accommodation: 0, foodAndActivities: 0 }), [itinerary]);

  const listToRender = useMemo(() => 
    viewingSaved ? savedPlaces : places, 
  [viewingSaved, savedPlaces, places]);

  const adminMapOnlyPlaces = useMemo(() => {
    if (userRole !== 'admin') return [];
    const renderedIds = new Set(listToRender.map((place) => place.id));
    return customPlaces.filter(
      (place) =>
        Number.isFinite(Number(place.lat)) &&
        Number.isFinite(Number(place.lng)) &&
        !renderedIds.has(place.id)
    );
  }, [userRole, customPlaces, listToRender]);

  useEffect(() => setUserRole(initialRole), [initialRole]);

  useEffect(() => {
    const cityZone = NOC_CITY_ZONES[selectedCity] || 'category3';
    setNocZone(cityZone);
  }, [selectedCity]);
  
  useEffect(() => {
    localStorage.setItem('bca_admin_places', JSON.stringify(customPlaces));
  }, [customPlaces]);

  useEffect(() => {
    if (currentUser) {
      const userKey = `journey_saved_${currentUser.email || currentUser.id || 'user'}`;
      try {
        const saved = localStorage.getItem(userKey);
        setSavedPlaces(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setSavedPlaces([]);
      }
    } else {
      setSavedPlaces([]);
      setViewingSaved(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userKey = `journey_saved_${currentUser.email || currentUser.id || 'user'}`;
      localStorage.setItem(userKey, JSON.stringify(savedPlaces));
    }
  }, [savedPlaces, currentUser]);

  const handleToggleSavePlace = useCallback((place, e) => {
    if (e) e.stopPropagation(); 
    if (!currentUser) return onOpenAuthModal();
    setSavedPlaces(prev => {
      const isSaved = prev.some(p => p.id === place.id);
      return isSaved ? prev.filter(p => p.id !== place.id) : [...prev, place];
    });
  }, [currentUser, onOpenAuthModal]);

  const resetSearchState = useCallback(() => {
    setHasSearched(false);
    setPlaces([]);
    setViewingSaved(false);
    setApiError(null);
  }, []);

  const fetchPlaces = async () => {
    setIsSearching(true);
    resetSearchState();
    setHasSearched(true);
    setApiError(null);

    const origin = userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng];
    setMapCenter(origin);

    const distanceKm = (lat1, lng1, lat2, lng2) => {
      const toRad = (value) => (value * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    try {
      const adminPlaces = customPlaces
        .filter((p) => p.category === activeCategory.id)
        .filter((p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
        .map((p) => ({
          ...p,
          distanceKm: distanceKm(origin[0], origin[1], Number(p.lat), Number(p.lng))
        }))
        .filter((p) => p.distanceKm <= 10);

      const radius = 10000;
      const tagQueries = activeCategory.tags
        .map((tag) => `nwr[${tag}](around:${radius},${origin[0]},${origin[1]});`)
        .join('');
      const overpassQuery = `[out:json][timeout:20];(${tagQueries});out center tags;`;

      let realPlaces = [];
      const apiEndpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
      ];

      let success = false;
      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(`${endpoint}?data=${encodeURIComponent(overpassQuery)}`);
          if (!response.ok) continue;

          const data = await response.json();
          if (Array.isArray(data?.elements)) {
            realPlaces = data.elements
              .map((el) => ({
                id: `osm_${el.type}_${el.id}`,
                name: el.tags?.name || activeCategory.singular || activeCategory.label,
                address:
                  el.tags?.['addr:full'] ||
                  [el.tags?.['addr:housenumber'], el.tags?.['addr:street']]
                    .filter(Boolean)
                    .join(' ') ||
                  `${selectedCity} Area`,
                lat: Number(el.lat ?? el.center?.lat),
                lng: Number(el.lon ?? el.center?.lon)
              }))
              .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
              .map((p) => ({
                ...p,
                distanceKm: distanceKm(origin[0], origin[1], p.lat, p.lng)
              }))
              .filter((p) => p.distanceKm <= 10);

            success = true;
            break;
          }
        } catch (err) {
          console.warn(`Overpass mirror offline: ${endpoint}`, err);
        }
      }

      if (!success) {
        throw new Error('Live place search services are temporarily unavailable.');
      }

      const merged = [...adminPlaces, ...realPlaces].reduce((acc, place) => {
        const duplicate = acc.some((existing) => {
          const sameName =
            normalizePlaceText(existing.name) === normalizePlaceText(place.name) &&
            place.name &&
            existing.name;
          const nearSamePin =
            Number.isFinite(place.lat) &&
            Number.isFinite(existing.lat) &&
            distanceKm(existing.lat, existing.lng, place.lat, place.lng) < 0.08;
          return sameName || nearSamePin;
        });
        if (!duplicate) acc.push(place);
        return acc;
      }, []);

      merged.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
      setPlaces(merged.slice(0, 40));

      if (merged.length === 0) {
        setApiError(`No ${activeCategory.label.toLowerCase()} found within 10 km of ${selectedCity}.`);
      }
    } catch (err) {
      console.error('Place Search Error:', err);
      setApiError(err?.message || 'Unable to load live places right now.');
      setPlaces([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlaceForTransit(place);
    setStopSpend({ accommodation: 0, foodAndActivities: 0 });
    setShowTransitModal(true);
  }, []);

  // Helper: Extract coordinates from Google Maps URLs or raw "lat,lng".
  const parseGoogleMapsInput = (input) => {
    if (!input) return null;

    const patterns = [
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      /[?&](?:q|ll)=(-?\d+(?:\.\d+)?)[, ]+(-?\d+(?:\.\d+)?)/,
      /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const lat = Number.parseFloat(match[1]);
        const lng = Number.parseFloat(match[2]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      }
    }

    return null;
  };

  const handleAddAdminCustomPlace = () => {
    setAdminFormError('');

    let lat = Number.parseFloat(adminNewPlace.lat);
    let lng = Number.parseFloat(adminNewPlace.lng);

    if (adminNewPlace.googleMapsUrl) {
      const parsed = parseGoogleMapsInput(adminNewPlace.googleMapsUrl);
      if (parsed) {
        lat = parsed.lat;
        lng = parsed.lng;
      }
    }

    const trimmedName = adminNewPlace.name.trim();

    if (!trimmedName) {
      setAdminFormError('Place name is required.');
      return;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setAdminFormError('Enter valid latitude and longitude, or paste a valid Google Maps link.');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setAdminFormError('Coordinates are outside the valid latitude/longitude range.');
      return;
    }

    const isDuplicate = customPlaces.some((place) => {
      const sameName = normalizePlaceText(place.name) === normalizePlaceText(trimmedName);
      const closePin =
        Number.isFinite(Number(place.lat)) &&
        Number.isFinite(Number(place.lng)) &&
        Math.abs(Number(place.lat) - lat) < 0.0005 &&
        Math.abs(Number(place.lng) - lng) < 0.0005;
      return sameName || closePin;
    });

    if (isDuplicate) {
      setAdminFormError('A custom place with the same name or nearly identical coordinates already exists.');
      return;
    }

    const newPlace = {
      id: `custom_admin_${Date.now()}`,
      name: trimmedName,
      address: adminNewPlace.address.trim() || `${selectedCity} Area`,
      category: adminNewPlace.category,
      lat,
      lng,
      googleMapsUrl: adminNewPlace.googleMapsUrl.trim(),
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    setCustomPlaces((prev) => [...prev, newPlace]);
    setShowAdminPlaceModal(false);
    setAdminFormError('');
    setAdminNewPlace({
      name: '',
      address: '',
      category: CATEGORIES[0].id,
      lat: '',
      lng: '',
      googleMapsUrl: ''
    });

    setMapCenter([lat, lng]);
    setMapZoom(15);
    notify(`"${newPlace.name}" was added to the admin map.`, 'success');
  };

  const handleDeleteAdminCustomPlace = (placeId) => {
    setCustomPlaces((prev) => prev.filter((place) => place.id !== placeId));
    setPlaces((prev) => prev.filter((place) => place.id !== placeId));
    setSavedPlaces((prev) => prev.filter((place) => place.id !== placeId));
    notify('Custom place removed.', 'success');
  };

  const handleConfirmTransitRoute = async () => {
    if (!selectedPlaceForTransit) return;
    const place = selectedPlaceForTransit;
    setRouteError('');
    setShowTransitModal(false);

    const lastStop = itinerary.length > 0 ? itinerary[itinerary.length - 1].place : null;
    const origin = lastStop ? [lastStop.lat, lastStop.lng] : (userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng]);
    const destination = [place.lat, place.lng];
    
    setMapCenter(destination);
    setMapZoom(15);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const routeGeometry = route.geometry.coordinates.map(c => [c[1], c[0]]);
        const distKm = route.distance / 1000;
        const durationMins = Math.round(route.duration / 60);
        
        let transitCost = 0, transitLabel = '', extraStats = null; 

        if (vehicleType === 'bike') {
          transitCost = Math.round((distKm / (fuelEfficiency || 35)) * fuelPrice);
          transitLabel = `Personal Bike (${fuelType.toUpperCase()} @ Rs.${fuelPrice}/L)`;
        } else if (vehicleType === 'car') {
          transitCost = Math.round((distKm / (fuelEfficiency || 12)) * fuelPrice);
          transitLabel = `Personal Car (${fuelType.toUpperCase()} @ Rs.${fuelPrice}/L)`;
        } else if (vehicleType === 'running') {
          transitLabel = 'Running / Walking Route';
          extraStats = `~${Math.round(distKm * 65)} kcal | ${(6.0 * distKm).toFixed(0)} min run time`;
        } else if (vehicleType === 'cycle') {
          transitLabel = 'Bicycle (Zero Fuel)';
        } else if (vehicleType === 'ride_hailing') {
          transitCost = Math.round((rideService === 'pathao' ? 60 : 70) + (distKm * (rideService === 'pathao' ? 35 : 45)));
          transitLabel = rideService === 'pathao' ? 'Pathao Ride' : 'InDrive Ride';
        }

        setItinerary(prev => [...prev, {
          id: `stop_${Date.now()}`,
          place: place,
          geometry: routeGeometry,
          spend: { ...stopSpend },
          info: {
            distance: `${distKm.toFixed(1)} km`, duration: `${durationMins} min`,
            travelMode: transitLabel, transitCost, extraStats
          }
        }]);
      }
    } catch (err) {
      console.error('OSRM Route Error:', err);
      setRouteError('Unable to calculate the driving route right now. Check your connection and try again.');
      notify('Route calculation failed.', 'warning');
    }
  };

  const removeItineraryStop = (index) => {
    setItinerary(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="brand-container" onClick={onBackToLanding} style={{ cursor: 'pointer' }}>
          <span className="brand-dot"></span>
          <h1>JourneyNavi</h1>
          <span className="badge-pro">BCA IV</span>
        </div>
        
        <div className="header-meta">
          <button className="nav-ghost-btn" onClick={onBackToLanding}>Home</button>
          
          {currentUser && userRole !== 'admin' && (
            <button 
              className={`nav-ghost-btn ${viewingSaved ? 'active' : ''}`} 
              onClick={() => { setViewingSaved(!viewingSaved); setHasSearched(true); }}
              style={{ fontWeight: viewingSaved ? 'bold' : 'normal', color: viewingSaved ? '#2563eb' : 'inherit' }}
            >
              ★ Saved ({savedPlaces.length})
            </button>
          )}

          {userRole === 'admin' ? (
            <div className="admin-status-pill">
              <span className="pulsing-dot"></span>
              <span>Admin Mode</span>
              <button 
                className="inline-exit-btn" 
                style={{ background: '#2563eb', color: '#fff', padding: '3px 8px', borderRadius: '4px', border: 'none', marginLeft: '6px', cursor: 'pointer' }}
                onClick={() => { setAdminFormError(''); setShowAdminPlaceModal(true); }}
              >
                ➕ Add Place
              </button>
              <button className="inline-exit-btn" onClick={() => setUserRole('user')}>Exit</button>
            </div>
          ) : currentUser ? (
            <div className="admin-status-pill" style={{ background: '#f1f5f9', borderColor: '#cbd5e1', color: '#334155' }}>
              <span>👤 {currentUser.name || currentUser.email || 'User'}</span>
              <button className="inline-exit-btn" onClick={onLogout}>Log Out</button>
            </div>
          ) : (
            <>
              <button className="nav-ghost-btn" onClick={onOpenAuthModal}>Sign In / Up</button>
              <button className="admin-access-btn" onClick={onOpenAdminModal}>🛡️ Admin</button>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="sidebar-scroll-content">
            
            <div className="sidebar-title-block">
              <h2>{userRole === 'admin' ? 'Admin Control Panel' : 'Route Planner'}</h2>
              <p>Configure your entire trip budget and select destinations</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <WeatherWidget 
                latitude={CITIES[selectedCity].lat} 
                longitude={CITIES[selectedCity].lng} 
                locationName={CITIES[selectedCity].name} 
              />
            </div>

            {/* 1. ALLOCATE TRIP CAPITAL (INCR. LIMITS + DIRECT CUSTOM INPUTS) */}
            <div className="control-card">
              <label style={{fontWeight: 'bold', marginBottom: '15px', display: 'block', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px'}}>
                1. Allocate Trip Capital (NPR)
              </label>
              
              {[
                { key: 'transport', label: 'Transport', min: 500, max: 200000, step: 1000 },
                { key: 'accommodation', label: 'Accommodation', min: 1000, max: 500000, step: 2000 },
                { key: 'foodAndActivities', label: 'Food & Activities', min: 1000, max: 300000, step: 1000 }
              ].map(cat => (
                <div style={{marginBottom: '16px'}} key={cat.key}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                    <span className="micro-label">{cat.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Rs.</span>
                      <input 
                        type="number" 
                        value={budgets[cat.key]} 
                        min="0"
                        onChange={(e) => setBudgets(prev => ({ ...prev, [cat.key]: Math.max(0, Number(e.target.value) || 0) }))}
                        style={{ width: '90px', padding: '3px 6px', fontWeight: 'bold', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right' }}
                      />
                    </div>
                  </div>
                  <input type="range" className="editorial-slider" 
                    min={cat.min} 
                    max={cat.max} 
                    step={cat.step} 
                    value={budgets[cat.key]} 
                    onChange={(e) => setBudgets(prev => ({ ...prev, [cat.key]: Number(e.target.value) }))} 
                  />
                </div>
              ))}

              <div className="budget-top-row" style={{background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <strong style={{color: '#334155'}}>Total Trip Budget:</strong>
                <span className="budget-numeric" style={{color: '#059669', fontSize: '1.1rem', fontWeight: 'bold'}}>
                  Rs. {totalBudget.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. NOC LIVE FUEL RATE SYNC CONTROL */}
            <div className="control-card" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ color: '#166534', fontWeight: 'bold', margin: 0, display: 'block' }}>
                    ⛽ NOC Fuel Prices
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {nocRates?.zoneLabel || NOC_ZONE_LABELS[NOC_CITY_ZONES[selectedCity]]}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  color: nocStatus === 'live' ? '#166534' : '#92400e',
                  background: nocStatus === 'live' ? '#dcfce7' : '#fef3c7',
                  padding: '3px 7px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  fontWeight: 700
                }}>
                  {nocStatus === 'live' ? 'LIVE' : nocStatus === 'loading' ? 'SYNCING…' : 'CACHED'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: '#fff', padding: '9px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Petrol</span>
                  <strong style={{ color: '#15803d', fontSize: '1.05rem' }}>Rs. {Number(nocRates?.petrol || 0).toFixed(1)}/L</strong>
                </div>
                <div style={{ background: '#fff', padding: '9px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Diesel</span>
                  <strong style={{ color: '#15803d', fontSize: '1.05rem' }}>Rs. {Number(nocRates?.diesel || 0).toFixed(1)}/L</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '9px' }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  NOC price zone
                  <select
                    className="editorial-select"
                    value={nocZone}
                    onChange={(e) => {
                      const nextZone = e.target.value;
                      setNocZone(nextZone);
                      setNocRates({
                        ...NOC_OFFLINE_RATES[nextZone],
                        zone: nextZone,
                        zoneLabel: NOC_ZONE_LABELS[nextZone],
                        source: 'NOC official cache',
                        sourceUrl: NOC_OFFICIAL_URLS.retail,
                        status: 'cached'
                      });
                      loadNocPrices(selectedCity, false, nextZone);
                    }}
                    style={{ width: '100%', marginTop: '4px', padding: '6px 8px' }}
                  >
                    <option value="category1">Category 1 · major Terai depots</option>
                    <option value="category2">Category 2 · Surkhet / Dang</option>
                    <option value="category3">Category 3 · Kathmandu / Pokhara / Dipayal</option>
                  </select>
                </label>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '10px' }}>
                Effective: <strong>{nocRates?.effectiveDate || 'Not available'}</strong>
                {nocLastChecked && <> · Checked {new Date(nocLastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
              </div>

              {nocError && ( 
                <div style={{ padding: '8px 10px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '10px' }}>
                  ⚠️ {nocError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <select
                  className="editorial-select"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  style={{ flex: 1, padding: '6px 8px' }}
                >
                  <option value="petrol">Petrol · Rs. {Number(nocRates?.petrol || 0).toFixed(1)}/L</option>
                  <option value="diesel">Diesel · Rs. {Number(nocRates?.diesel || 0).toFixed(1)}/L</option>
                </select>
                <button
                  type="button"
                  className="nav-ghost-btn"
                  onClick={() => loadNocPrices(selectedCity, false, nocZone)}
                  disabled={nocStatus === 'loading'}
                  style={{ padding: '6px 9px', border: '1px solid #86efac', color: '#166534', background: '#fff' }}
                  title="Refresh NOC price"
                >
                  ↻
                </button>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.78rem', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={useManualFuelPrice}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setUseManualFuelPrice(enabled);
                    if (enabled && !manualFuelPrice) setManualFuelPrice(Number(nocRates?.[fuelType] || 0));
                  }}
                />
                Use manual fuel-rate override
              </label>

              {useManualFuelPrice && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', flex: 1 }}>Costing rate (NPR/L)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={manualFuelPrice}
                    onChange={(e) => setManualFuelPrice(Math.max(0, Number(e.target.value) || 0))}
                    style={{ width: '90px', padding: '5px 6px', border: '1px solid #cbd5e1', borderRadius: '5px', textAlign: 'right' }}
                  />
                </div>
              )}

              <a
                href={NOC_OFFICIAL_URLS.retail}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: '9px', fontSize: '0.72rem', color: '#166534' }}
              >
                View official NOC price page ↗
              </a>
            </div>

            <div className="control-card">
              <label>3. Starting Location</label>
              <div className="origin-row">
                <button className="gps-sync-btn" onClick={() => {
                  if (!navigator.geolocation) return alert('Geolocation not supported.');
                  setLocationStatus('Locating...');
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const coords = [pos.coords.latitude, pos.coords.longitude];
                      setUserLocation(coords); setMapCenter(coords); setMapZoom(14); setLocationStatus('GPS Active');
                    },
                    () => setLocationStatus('Permission Denied')
                  );
                }}>📍 {locationStatus}</button>
                <select value={selectedCity} onChange={(e) => {
                  setSelectedCity(e.target.value); setUserLocation(null); setLocationStatus('Use Current GPS');
                  setMapCenter([CITIES[e.target.value].lat, CITIES[e.target.value].lng]); setMapZoom(13); resetSearchState(); setItinerary([]);
                }} className="editorial-select">
                  {Object.keys(CITIES).map(city => <option key={city} value={city}>{CITIES[city].name}</option>)}
                </select>
              </div>
            </div>

            {!viewingSaved && (
              <div className="control-card">
                <label>4. Select Category</label>
                <div className="taxonomy-grid">
                  {CATEGORIES.map(cat => (
                    <div key={cat.id} className={`taxonomy-chip ${activeCategory.id === cat.id ? 'active' : ''}`} 
                      onClick={() => { setActiveCategory(cat); resetSearchState(); }}>
                      <span>{cat.icon}</span><span>{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="control-card" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ color: '#1e40af', fontWeight: 'bold', margin: 0, display: 'block' }}>Admin Locations</label>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{customPlaces.length} custom map pin{customPlaces.length === 1 ? '' : 's'}</span>
                  </div>
                  <button
                    type="button"
                    className="admin-submit-btn"
                    style={{ background: '#2563eb', color: '#fff', padding: '7px 10px' }}
                    onClick={() => {
                      setAdminFormError('');
                      setShowAdminPlaceModal(true);
                    }}
                  >
                    + Add
                  </button>
                </div>

                {customPlaces.length === 0 ? (
                  <div style={{ padding: '10px', background: '#fff', borderRadius: '6px', border: '1px dashed #bfdbfe', fontSize: '0.78rem', color: '#64748b' }}>
                    No custom locations yet. Add one and it will be saved locally for this browser.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '220px', overflowY: 'auto' }}>
                    {customPlaces.map((place) => (
                      <div key={place.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #dbeafe', borderRadius: '6px', padding: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setMapCenter([place.lat, place.lng]);
                            setMapZoom(16);
                          }}
                          style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                          title="Focus map on this location"
                        >
                          <strong style={{ display: 'block', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>{place.address}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdminCustomPlace(place.id)}
                          style={{ border: 'none', background: '#fef2f2', color: '#b91c1c', borderRadius: '5px', cursor: 'pointer', padding: '5px 8px' }}
                          title="Delete custom location"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
               <PackingList />
            </div>

            {itinerary.length > 0 && (
              <div className="control-card" style={{ background: '#f8fafc', borderColor: '#93c5fd' }}>
                <label style={{ color: '#1e40af' }}>Your Itinerary ({itinerary.length} Stops)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {itinerary.map((stop, i) => (
                    <div key={stop.id} style={{ background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>{i + 1}. {stop.place.name}</span>
                        <button onClick={() => removeItineraryStop(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                      </div>
                      <div style={{ color: '#64748b', marginTop: '4px' }}>
                        Drive: {stop.info.transitCost} Rs | Stay: {stop.spend.accommodation} Rs | Food: {stop.spend.foodAndActivities} Rs
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className="admin-submit-btn" 
                  style={{ width: '100%', marginTop: '15px', background: '#10b981', color: 'white' }} 
                  onClick={() => setShowFinalizeModal(true)}
                >
                  Finalize Journey & Budget ➔
                </button>
              </div>
            )}

            {hasSearched && (
              <div className="places-stack">
                <span className="micro-label">
                  {viewingSaved ? `Your Saved Places (${savedPlaces.length})` : `Results (${places.length}) - Add to Itinerary`}
                </span>
                
                {apiError && !viewingSaved && (
                   <div style={{ padding: '10px', color: '#b91c1c', background: '#fef2f2', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '10px' }}>
                     ⚠️ {apiError}
                   </div>
                )}

                {listToRender.map((place) => {
                  const isSaved = savedPlaces.some(p => p.id === place.id);
                  return (
                    <div key={place.id} className="place-node-card" onClick={() => handleSelectPlace(place)} style={{ position: 'relative' }}>
                      {place.isCustom && <span className="custom-tag" style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', position: 'absolute', right: '40px', top: '12px' }}>Custom Admin</span>}
                      <button className="save-star-btn" onClick={(e) => handleToggleSavePlace(place, e)}
                        style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: isSaved ? '#fbbf24' : '#cbd5e1' }}
                        title={isSaved ? "Remove from saved" : "Save place"}>
                        {isSaved ? '★' : '☆'}
                      </button>
                      <div className="node-title" style={{ paddingRight: '75px' }}>{place.name}</div>
                      <div className="node-address">{place.address}</div>
                      {Number.isFinite(Number(place.distanceKm)) && (
                        <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
                          {Number(place.distanceKm).toFixed(1)} km away
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            {!viewingSaved && (
              <button className="execute-scan-btn" onClick={fetchPlaces} disabled={isSearching}>
                {isSearching ? 'Searching...' : `Search ${activeCategory.label}`}
              </button>
            )}
          </div>
        </aside>

        <section className="map-wrapper">
          <MapContainer center={mapCenter} zoom={mapZoom} zoomControl={false}>
            <MapViewController center={mapCenter} zoom={mapZoom} />
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userLocation || [CITIES[selectedCity].lat, CITIES[selectedCity].lng]} icon={originIcon} />
            
            {listToRender.map(place => (
              <Marker key={`search_${place.id}`} position={[place.lat, place.lng]} eventHandlers={{ click: () => handleSelectPlace(place) }}>
                <Popup>
                  <div className="map-popup-card">
                    <strong>{place.name}</strong>
                    <span>{place.address}</span>
                    {place.isCustom && place.googleMapsUrl && (
                      <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                        Open source map link ↗
                      </a>
                    )}
                    <button className="popup-route-trigger" onClick={() => handleSelectPlace(place)}>Add to Itinerary</button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {adminMapOnlyPlaces.map((place) => (
              <Marker key={`admin_map_${place.id}`} position={[Number(place.lat), Number(place.lng)]}>
                <Popup>
                  <div className="map-popup-card">
                    <strong>{place.name}</strong>
                    <span>{place.address}</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Admin custom location</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button
                        className="popup-route-trigger"
                        onClick={() => handleSelectPlace(place)}
                        style={{ flex: 1 }}
                      >
                        Add to Itinerary
                      </button>
                      <button
                        onClick={() => handleDeleteAdminCustomPlace(place.id)}
                        style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: '4px', padding: '5px 7px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {itinerary.map((stop, index) => (
              <React.Fragment key={stop.id}>
                <Marker position={[stop.place.lat, stop.place.lng]}>
                  <Popup>
                    <strong>Stop {index + 1}: {stop.place.name}</strong><br/>
                    {stop.info.distance} • {stop.info.duration}
                  </Popup>
                </Marker>
                {stop.geometry && <Polyline color="#2563eb" opacity={0.85} positions={stop.geometry} weight={5} />}
              </React.Fragment>
            ))}
          </MapContainer>
        </section>
      </main>

      {/* ADMIN ADD CUSTOM PLACE MODAL */}
      {showAdminPlaceModal && (
        <div className="modal-backdrop" onClick={() => setShowAdminPlaceModal(false)}>
          <div className="clean-modal-card" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="clean-modal-header">
              <div>
                <span className="clean-modal-tag" style={{ background: '#2563eb', color: '#fff' }}>ADMIN CONSOLE</span>
                <h3>Add Custom Place / Pin</h3>
                <p className="clean-modal-sub">Add custom destinations directly to JourneyNavi maps</p>
              </div>
              <button className="close-x-btn" onClick={() => { setAdminFormError(''); setShowAdminPlaceModal(false); }}>&times;</button>
            </div>
            
            <div className="clean-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div>
                <label className="micro-label">Place Name *</label>
                <input 
                  type="text" 
                  className="editorial-input" 
                  placeholder="e.g. Annapurna View Resort" 
                  value={adminNewPlace.name}
                  onChange={e => setAdminNewPlace({ ...adminNewPlace, name: e.target.value })}
                />
              </div>

              <div>
                <label className="micro-label">Category *</label>
                <select 
                  className="editorial-select"
                  value={adminNewPlace.category}
                  onChange={e => setAdminNewPlace({ ...adminNewPlace, category: e.target.value })}
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="micro-label">Address / Area</label>
                <input 
                  type="text" 
                  className="editorial-input" 
                  placeholder="e.g. Lakeside, Pokhara" 
                  value={adminNewPlace.address}
                  onChange={e => setAdminNewPlace({ ...adminNewPlace, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="nav-ghost-btn"
                  style={{ flex: 1, minWidth: '150px' }}
                  onClick={() => {
                    setAdminNewPlace((prev) => ({
                      ...prev,
                      lat: mapCenter[0].toFixed(6),
                      lng: mapCenter[1].toFixed(6)
                    }));
                    setAdminFormError('');
                  }}
                >
                  Use Map Center
                </button>
                <button
                  type="button"
                  className="nav-ghost-btn"
                  style={{ flex: 1, minWidth: '150px' }}
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setAdminFormError('Geolocation is not supported by this browser.');
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setAdminNewPlace((prev) => ({
                          ...prev,
                          lat: pos.coords.latitude.toFixed(6),
                          lng: pos.coords.longitude.toFixed(6)
                        }));
                        setAdminFormError('');
                      },
                      () => setAdminFormError('Unable to read your current location. Check browser permission.')
                    );
                  }}
                >
                  Use GPS
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <label className="micro-label" style={{ color: '#2563eb' }}>Option A: Paste Google Maps Link or Coordinates</label>
                <input 
                  type="text" 
                  className="editorial-input" 
                  placeholder="e.g. https://maps.google.com/.../@27.7172,85.3240 or 27.7172,85.3240" 
                  value={adminNewPlace.googleMapsUrl}
                  onChange={e => {
                    const val = e.target.value;
                    const parsed = parseGoogleMapsInput(val);
                    setAdminNewPlace({ 
                      ...adminNewPlace, 
                      googleMapsUrl: val,
                      lat: parsed ? parsed.lat : adminNewPlace.lat,
                      lng: parsed ? parsed.lng : adminNewPlace.lng
                    });
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="micro-label">Latitude *</label>
                  <input 
                    type="number" 
                    step="any"
                    className="editorial-input" 
                    placeholder="27.6966" 
                    value={adminNewPlace.lat}
                    onChange={e => setAdminNewPlace({ ...adminNewPlace, lat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="micro-label">Longitude *</label>
                  <input 
                    type="number" 
                    step="any"
                    className="editorial-input" 
                    placeholder="85.3591" 
                    value={adminNewPlace.lng}
                    onChange={e => setAdminNewPlace({ ...adminNewPlace, lng: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {adminFormError && (
              <div style={{ marginTop: '12px', padding: '9px 10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', fontSize: '0.8rem' }}>
                ⚠️ {adminFormError}
              </div>
            )}

            <div className="clean-modal-footer" style={{ marginTop: '15px' }}>
              <button className="nav-ghost-btn" onClick={() => { setAdminFormError(''); setShowAdminPlaceModal(false); }}>Cancel</button>
              <button className="admin-submit-btn" style={{ background: '#2563eb', color: '#fff' }} onClick={handleAddAdminCustomPlace}>
                Save Place to Map ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransitModal && (
        <div className="modal-backdrop" onClick={() => setShowTransitModal(false)}>
          <div className="clean-modal-card" onClick={e => e.stopPropagation()}>
            <div className="clean-modal-header">
              <div>
                <span className="clean-modal-tag">ADD TO ITINERARY</span>
                <h3>{selectedPlaceForTransit?.name}</h3>
                <p className="clean-modal-sub">{selectedPlaceForTransit?.address}</p>
              </div>
              <button className="close-x-btn" onClick={() => setShowTransitModal(false)}>&times;</button>
            </div>
            
            <div className="clean-modal-body">
              <label className="micro-label">1. Choose Route Transport</label>
              <div className="clean-tiers-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '15px' }}>
                {['bike', 'car', 'cycle', 'running', 'ride_hailing'].map(type => (
                  <div key={type} className={`clean-tier-card ${vehicleType === type ? 'active-tier' : ''}`} 
                    onClick={() => {
                      setVehicleType(type);
                      if (type === 'bike') setFuelEfficiency(35);
                      else if (type === 'car') setFuelEfficiency(12);
                      else setFuelEfficiency(0);
                    }}>
                    <span className="tier-icon">
                      {type === 'bike' ? '🏍️' : type === 'car' ? '🚗' : type === 'cycle' ? '🚲' : type === 'running' ? '👟' : '📱'}
                    </span>
                    <strong>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                  </div>
                ))}
              </div>

              {(vehicleType === 'bike' || vehicleType === 'car') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <span className="micro-label" style={{ display: 'block' }}>Fuel efficiency</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {vehicleType === 'bike' ? 'km per litre for your bike' : 'km per litre for your car'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={fuelEfficiency}
                    onChange={(e) => setFuelEfficiency(Math.max(1, Number(e.target.value) || 1))}
                    className="editorial-input"
                    style={{ width: '90px' }}
                  />
                </div>
              )}

              <label className="micro-label">2. Estimated Spending at Stop (NPR)</label>
              <div className="clean-metrics-row" style={{ marginTop: '5px' }}>
                <div>
                  <label className="micro-label" style={{ color: '#64748b' }}>Accommodation</label>
                  <input type="number" className="editorial-input" value={stopSpend.accommodation} 
                    onChange={e => setStopSpend({...stopSpend, accommodation: Number(e.target.value) || 0})} placeholder="e.g. 1500" />
                </div>
                <div>
                  <label className="micro-label" style={{ color: '#64748b' }}>Food / Entry Fees</label>
                  <input type="number" className="editorial-input" value={stopSpend.foodAndActivities} 
                    onChange={e => setStopSpend({...stopSpend, foodAndActivities: Number(e.target.value) || 0})} placeholder="e.g. 500" />
                </div>
              </div>
            </div>

            <div className="clean-modal-footer">
              <button className="nav-ghost-btn" onClick={() => setShowTransitModal(false)}>Cancel</button>
              <button className="admin-submit-btn" onClick={handleConfirmTransitRoute}>Add to Journey ➔</button>
            </div>
          </div>
        </div>
      )}

      {showFinalizeModal && (
        <div className="modal-backdrop" onClick={() => setShowFinalizeModal(false)}>
          <div className="clean-modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="clean-modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
              <div>
                <span className="clean-modal-tag" style={{ background: '#10b981', color: 'white' }}>CHECKOUT SUMMARY</span>
                <h3 style={{ fontSize: '1.5rem', marginTop: '5px' }}>Journey Financial Report</h3>
              </div>
              <button className="close-x-btn" onClick={() => setShowFinalizeModal(false)}>&times;</button>
            </div>
            
            <div className="clean-modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span className="micro-label">Total Allocated Capital</span>
                  <h2 style={{ color: '#1e293b', margin: '5px 0' }}>Rs. {totalBudget.toLocaleString()}</h2>
                </div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span className="micro-label">Total Estimated Cost</span>
                  <h2 style={{ color: '#b91c1c', margin: '5px 0' }}>Rs. {(totalSpent.transport + totalSpent.accommodation + totalSpent.foodAndActivities).toLocaleString()}</h2>
                </div>
              </div>

              <label className="micro-label" style={{ marginBottom: '10px', display: 'block' }}>Category Breakdown</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Transport', budget: budgets.transport, spent: totalSpent.transport },
                  { label: 'Accommodation', budget: budgets.accommodation, spent: totalSpent.accommodation },
                  { label: 'Food & Activities', budget: budgets.foodAndActivities, spent: totalSpent.foodAndActivities }
                ].map(cat => {
                  const balance = cat.budget - cat.spent;
                  return (
                    <div key={cat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <strong style={{ width: '120px' }}>{cat.label}</strong>
                      <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: '#64748b' }}>Budget: </span>Rs. {cat.budget.toLocaleString()}<br/>
                        <span style={{ color: '#b91c1c' }}>Spent: </span>Rs. {cat.spent.toLocaleString()}
                      </div>
                      <div style={{ width: '100px', textAlign: 'right', fontWeight: 'bold', color: balance >= 0 ? '#10b981' : '#ef4444' }}>
                        {balance >= 0 ? 'Left: ' : 'Over: '} Rs. {Math.abs(balance).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="clean-modal-footer" style={{ justifyContent: 'center', paddingTop: '20px' }}>
              <button className="admin-submit-btn" style={{ width: '100%', fontSize: '1.1rem', padding: '12px' }} onClick={() => setShowFinalizeModal(false)}>
                Confirm & Close Itinerary
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            zIndex: 3000,
            maxWidth: '360px',
            padding: '11px 14px',
            borderRadius: '8px',
            background: toast.type === 'warning' ? '#fffbeb' : '#0f172a',
            color: toast.type === 'warning' ? '#92400e' : '#fff',
            border: toast.type === 'warning' ? '1px solid #fde68a' : '1px solid #334155',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
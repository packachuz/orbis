/**
 * ORBIS — Global city registry & pre-loaded chart presets.
 * Offsets are standard-time fallbacks; the engine resolves the exact
 * historical (DST-aware) offset from the IANA zone at calculation time.
 */

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  utcOffset: number;
}

export const CITIES: City[] = [
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, timezone: 'Asia/Bangkok', utcOffset: 7 },
  { id: 'london', name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London', utcOffset: 0 },
  { id: 'new-york', name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, timezone: 'America/New_York', utcOffset: -5 },
  { id: 'perth', name: 'Perth', country: 'Australia', lat: -31.9505, lng: 115.8605, timezone: 'Australia/Perth', utcOffset: 8 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris', utcOffset: 1 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405, timezone: 'Europe/Berlin', utcOffset: 1 },
  { id: 'zurich', name: 'Zürich', country: 'Switzerland', lat: 47.3769, lng: 8.5417, timezone: 'Europe/Zurich', utcOffset: 1 },
  { id: 'rome', name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, timezone: 'Europe/Rome', utcOffset: 1 },
  { id: 'madrid', name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, timezone: 'Europe/Madrid', utcOffset: 1 },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lng: -21.9426, timezone: 'Atlantic/Reykjavik', utcOffset: 0 },
  { id: 'istanbul', name: 'Istanbul', country: 'Türkiye', lat: 41.0082, lng: 28.9784, timezone: 'Europe/Istanbul', utcOffset: 3 },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo', utcOffset: 2 },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, timezone: 'Africa/Lagos', utcOffset: 1 },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, timezone: 'Africa/Nairobi', utcOffset: 3 },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, timezone: 'Africa/Johannesburg', utcOffset: 2 },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai', utcOffset: 4 },
  { id: 'mumbai', name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { id: 'delhi', name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.209, timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { id: 'kathmandu', name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lng: 85.324, timezone: 'Asia/Kathmandu', utcOffset: 5.75 },
  { id: 'chiang-mai', name: 'Chiang Mai', country: 'Thailand', lat: 18.7883, lng: 98.9853, timezone: 'Asia/Bangkok', utcOffset: 7 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore', utcOffset: 8 },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694, timezone: 'Asia/Hong_Kong', utcOffset: 8 },
  { id: 'shanghai', name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, timezone: 'Asia/Shanghai', utcOffset: 8 },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978, timezone: 'Asia/Seoul', utcOffset: 9 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney', utcOffset: 10 },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633, timezone: 'Pacific/Auckland', utcOffset: 12 },
  { id: 'honolulu', name: 'Honolulu', country: 'United States', lat: 21.3069, lng: -157.8583, timezone: 'Pacific/Honolulu', utcOffset: -10 },
  { id: 'los-angeles', name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles', utcOffset: -8 },
  { id: 'chicago', name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298, timezone: 'America/Chicago', utcOffset: -6 },
  { id: 'toronto', name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto', utcOffset: -5 },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, timezone: 'America/Mexico_City', utcOffset: -6 },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, timezone: 'America/Sao_Paulo', utcOffset: -3 },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, timezone: 'America/Argentina/Buenos_Aires', utcOffset: -3 },
];

export const cityById = (id: string) => CITIES.find((c) => c.id === id);

export interface ChartPreset {
  id: string;
  label: string;
  name: string;
  date: string;
  time: string;
  cityId: string;
}

/** Realistic sample birth data so the wheel renders immediately on first load. */
export const PRESETS: ChartPreset[] = [
  { id: 'bangkok', label: 'Bangkok', name: 'Arin Siriwat', date: '1994-03-21', time: '06:15', cityId: 'bangkok' },
  { id: 'london', label: 'London', name: 'Eleanor Hale', date: '1988-07-14', time: '14:30', cityId: 'london' },
  { id: 'new-york', label: 'New York', name: 'Julian Reyes', date: '1991-11-02', time: '21:45', cityId: 'new-york' },
  { id: 'perth', label: 'Perth', name: 'Mia Calloway', date: '1996-01-28', time: '04:20', cityId: 'perth' },
  { id: 'tokyo', label: 'Tokyo', name: 'Haruto Sato', date: '1985-09-09', time: '11:10', cityId: 'tokyo' },
];

// Firebase Functions URL - will be automatically set by Firebase Hosting
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/ballroom-score-finder/us-central1';

export const fetchCompetitors = async (query: string): Promise<string[]> => {
  const sanitizedQuery = encodeURIComponent(query.trim());
  if (!sanitizedQuery) return [];

  const response = await fetch(`${BASE_URL}/fetchCompetitors?competitor=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch competitors');
  }

  const result = await response.json();
  const data = typeof result.body === 'string' ? JSON.parse(result.body) : result;

  if (!Array.isArray(data)) return [];
  return data.map((d: any) => d.name);
};

export const fetchCompetitions = async (): Promise<{ id: number; name: string }[]> => {
  const response = await fetch(`${BASE_URL}/fetchCompetitions`);
  if (!response.ok) {
    throw new Error('Failed to fetch competitions');
  }
  return response.json();
};

export const fetchData = async (filters: {
  competitor?: string;
  style?: string;
  judge?: string;
  competition?: string;
  score?: number;
  overall_score?: number;
}): Promise<any[]> => {
  const url = new URL(`${BASE_URL}/fetchData`);
  
  (Object.keys(filters) as (keyof typeof filters)[]).forEach((key) => {
    if (filters[key]) {
      url.searchParams.append(key, String(filters[key]));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};


export const fetchJudges = async (query: string): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/fetchJudges?${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch judges');
  }
  return response.json();
};

export const fetchStyles = async (query: string): Promise<string[]> => {
  const sanitizedQuery = encodeURIComponent(query.trim());
  if (!sanitizedQuery) return [];

  const response = await fetch(`${BASE_URL}/fetchStyles?style=${sanitizedQuery}`);
  if (!response.ok) {
    throw new Error('Failed to fetch styles');
  }

  const result = await response.json();
  // Firebase Functions return data directly
  if (!Array.isArray(result)) return [];
  return result.map((d: any) => d.name);
};

export const fetchTotalPlacements = async (): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/fetchTotalPlacements`);
  if (!response.ok) {
    throw new Error('Failed to fetch total placements');
  }
  return response.json();
};

export const getAnalytics = async (competitor: string): Promise<any[]> => {
  const response = await fetch(
    `${BASE_URL}/fetchAnalytics?competitor=${encodeURIComponent(competitor.trim())}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  const result = await response.json();

  // Firebase Functions return data directly
  if (Array.isArray(result)) {
    return result;
  } else if (result.error || result.message) {
    throw new Error(result.error || result.message || 'Unexpected API response format');
  } else {
    return [];
  }
};

export const fetchAveragePlacements = async (competitor: string): Promise<any[]> => {
  const response = await fetch(
    `${BASE_URL}/fetchAveragePlacements?competitor=${encodeURIComponent(competitor.trim())}`
  );
  if (!response.ok) throw new Error('Failed to fetch average placements');

  const result = await response.json();
  return result;
};

export const fetchCompetitionHistory = async (competitor: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/fetchCompetitionHistory?competitor=${encodeURIComponent(competitor.trim())}`
    );
    
    if (!response.ok) {
      console.warn('Competition history endpoint not available, returning empty array');
      return [];
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching competition history:', error);
    return [];
  }
};

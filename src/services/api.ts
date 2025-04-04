const BASE_URL = process.env.REACT_APP_BACKEND_URL;

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

export const fetchJudgeRatings = async (competitorId: number, styleId: number, competitionId: number): Promise<any[]> => {
  const response = await fetch(
    `${BASE_URL}/fetchJudgeRatings?competitor_id=${competitorId}&style_id=${styleId}&competition_id=${competitionId}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch judge ratings');
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
  // Handle both direct arrays and Lambda proxy responses
  const data = typeof result.body === 'string' ? JSON.parse(result.body) : result;

  if (!Array.isArray(data)) return [];
  return data.map((d: any) => d.name);
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

  // 🔧 FIX: Parse result.body as JSON if it's a string
  const data = typeof result.body === "string"
    ? JSON.parse(result.body)
    : result.body;

  if (Array.isArray(data)) {
    return data;
  } else if (data.error || data.message) {
    throw new Error(data.error || data.message || 'Unexpected API response format');
  } else {
    return [];
  }
};

export const fetchAveragePlacements = async (competitor: string): Promise<any[]> => {
  const url = new URL(`${BASE_URL}/fetchAveragePlacements`);
  url.searchParams.append('competitor', competitor);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch average placements');

  const result = await response.json();
  return typeof result.body === 'string' ? JSON.parse(result.body) : result;
};

const BASE_URL = process.env.REACT_APP_BACKEND_URL

export const fetchCompetitors = async (query: string): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/fetchCompetitors?${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch competitors');
  }
  return response.json();
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
  const response = await fetch(`${BASE_URL}/fetchStyles?${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch styles');
  }
  return response.json();
};

export const fetchTotalPlacements = async (): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/fetchTotalPlacements`);
  if (!response.ok) {
    throw new Error('Failed to fetch total placements');
  }
  return response.json();
};

export const getAnalytics = async (competitorId: number): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/fetchAnalytics?competitor_id=${competitorId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  const result = await response.json();

  // Ensure the response is always an array
  if (Array.isArray(result)) {
    return result;
  } else if (result.error || result.message) {
    throw new Error(result.error || result.message || 'Unexpected API response format');
  } else {
    return []; // Fallback to an empty array if the response is not an array
  }
};

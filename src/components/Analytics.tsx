import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../services/api'; // Adjusted path for the API

interface AnalyticsRow {
  judgeName: string;
  averageScore: string;
  styleCount: string;
}

interface AnalyticsProps {
  competitor: string; // Competitor's name
  onDataLoad: (data: { judgeName: string; averageScore: number; styleCount: number }[]) => void;
  onError: (error: string) => void; // Callback to handle errors in the parent
}

const Analytics: React.FC<AnalyticsProps> = ({ competitor, onDataLoad, onError }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!competitor) {
      onError('No competitor selected');
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);

      try {
        const competitorId = parseInt(competitor, 10); // Assuming competitor is numeric; adjust if needed
        if (isNaN(competitorId)) {
          throw new Error('Invalid competitor ID');
        }

        const data = await getAnalytics(competitorId);
        onDataLoad(
          data.map((row: AnalyticsRow) => ({
            judgeName: row.judgeName,
            averageScore: parseFloat(row.averageScore), // Convert to a number
            styleCount: parseInt(row.styleCount, 10), // Convert to a number
          }))
        );
      } catch (err) {
        onError((err as Error).message);
        onDataLoad([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [competitor, onDataLoad, onError]);

  if (loading) return <p className="text-center text-gray-400">Loading analytics...</p>;

  return null; // This component only handles fetching and state management
};

export default Analytics;

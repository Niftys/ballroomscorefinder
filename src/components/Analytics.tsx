import React, { useEffect, useState } from 'react';
import { getAnalytics, fetchAveragePlacements } from '../services/api';
import AnalyticsTable from './AnalyticsTable';

interface AnalyticsProps {
  competitor: string; // instead of name
  onDataLoad: (data: any[]) => void;
  onError: (error: string) => void;
}

interface JudgeRow {
  judgeName: string;
  averageScore: number;
  styleCount: number;
}

interface StyleRow {
  styleName: string;
  averagePlacement: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ competitor, onDataLoad, onError }) => {
  const [loading, setLoading] = useState(false);
  const [judgeData, setJudgeData] = useState<JudgeRow[]>([]);
  const [styleData, setStyleData] = useState<StyleRow[]>([]);
  const [activeTab, setActiveTab] = useState<'judges' | 'styles'>('judges');

  useEffect(() => {
    if (!competitor || typeof competitor !== 'string') return;
  
    const fetchData = async () => {
      setLoading(true);
      console.log("Running analytics for:", competitor);
      try {
        const analytics = await getAnalytics(competitor);
        const placements = await fetchAveragePlacements(competitor);
  
        const judgeResults = analytics.map((row) => ({
          judgeName: row.judgeName,
          averageScore: parseFloat(row.averageScore),
          styleCount: parseInt(row.styleCount, 10),
        }));
  
        const styleResults = placements.map((row) => ({
          styleName: row.style_name,
          averagePlacement: parseFloat(row.average_placement),
        }));
  
        setJudgeData(judgeResults);
        setStyleData(styleResults);
        onDataLoad(judgeResults);
      } catch (err) {
        onError((err as Error).message);
        setJudgeData([]);
        setStyleData([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [competitor, onDataLoad, onError]);

  if (loading) return <p className="text-center text-gray-400">Loading analytics...</p>;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex justify-center mb-4 space-x-4">
        <button
          className={`px-4 py-2 rounded-md font-bold ${
            activeTab === 'judges' ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('judges')}
        >
          Judge Analysis
        </button>
        <button
          className={`px-4 py-2 rounded-md font-bold ${
            activeTab === 'styles' ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('styles')}
        >
          Style Analysis
        </button>
      </div>

      {/* Content */}
      {activeTab === 'judges' && <AnalyticsTable data={judgeData} />}
      {activeTab === 'styles' && <AnalyticsTable data={styleData} />}
    </div>
  );
};

export default Analytics;

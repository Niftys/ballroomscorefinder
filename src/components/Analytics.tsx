import React, { useEffect, useState } from 'react';
import { getAnalytics, fetchAveragePlacements, fetchCompetitionHistory } from '../services/api';
import AnalyticsTable from './AnalyticsTable';
import CompetitionHistoryTable from './CompetitionHistoryTable';

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

interface CompetitionHistoryRow {
  competition_name: string;
  placements: { placement: number; count: number }[];
  total_entries: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ competitor, onDataLoad, onError }) => {
  const [loading, setLoading] = useState(false);
  const [judgeData, setJudgeData] = useState<JudgeRow[]>([]);
  const [styleData, setStyleData] = useState<StyleRow[]>([]);
  const [competitionHistoryData, setCompetitionHistoryData] = useState<CompetitionHistoryRow[]>([]);
  const [activeTab, setActiveTab] = useState<'judges' | 'styles' | 'competitions'>('judges');

  useEffect(() => {
    if (!competitor || typeof competitor !== 'string') return;
  
    const fetchData = async () => {
      setLoading(true);
      console.log("Running analytics for:", competitor);
      try {
        const [analytics, placements, competitionHistory] = await Promise.all([
          getAnalytics(competitor),
          fetchAveragePlacements(competitor),
          fetchCompetitionHistory(competitor).catch(() => []) // Fallback to empty array if endpoint not deployed
        ]);
  
        console.log('Analytics data received:', analytics);
        console.log('Placements data received:', placements);
        console.log('Competition history data received:', competitionHistory);
  
        const judgeResults = analytics.map((row) => {
          console.log('Processing judge row:', row);
          return {
            judgeName: row.judgeName || 'Unknown Judge',
            averageScore: parseFloat(row.averageScore) || 0,
            styleCount: parseInt(row.styleCount, 10) || 0,
          };
        });
  
        const styleResults = placements.map((row) => ({
          styleName: row.style_name,
          averagePlacement: parseFloat(row.average_placement),
        }));

        const competitionHistoryResults = competitionHistory.map((row) => ({
          competition_name: row.competition_name,
          placements: row.placements,
          total_entries: row.total_entries
        }));
  
        setJudgeData(judgeResults);
        setStyleData(styleResults);
        setCompetitionHistoryData(competitionHistoryResults);
        onDataLoad(judgeResults);
      } catch (err) {
        onError((err as Error).message);
        setJudgeData([]);
        setStyleData([]);
        setCompetitionHistoryData([]);
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
        <button
          className={`px-4 py-2 rounded-md font-bold ${
            activeTab === 'competitions' ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('competitions')}
        >
          Competition History
        </button>
      </div>

      {/* Content */}
      {activeTab === 'judges' && <AnalyticsTable data={judgeData} />}
      {activeTab === 'styles' && <AnalyticsTable data={styleData} />}
      {activeTab === 'competitions' && <CompetitionHistoryTable data={competitionHistoryData} />}
    </div>
  );
};

export default Analytics;

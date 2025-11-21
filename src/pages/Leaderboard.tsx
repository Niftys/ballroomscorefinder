import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Loader, Trophy, Medal, Star, LogIn, User } from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

// Firebase Functions URL - will be automatically set by Firebase Hosting
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/ballroom-score-finder/us-central1';

interface CompetitorData {
  competitor: string;
  place_count: number;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const { currentUser } = useAuth();
  const [data, setData] = useState<CompetitorData[]>([]);
  const [placement, setPlacement] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  
  // Search optimization refs
  const searchTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  
  // Use the optimized API cache hook
  const { fetchWithCache, abort } = useApiCache({
    cacheDuration: 2 * 60 * 1000, // 2 minutes cache for leaderboard data
    enableDeduplication: true
  });

  // Track page view on mount and load initial data
  useEffect(() => {
    analytics.trackPageView('leaderboard', 'Ballroom Score Finder - Leaderboard');
    // Load initial data on mount
    fetchLeaderboardData(placement, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Check if the device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Simple fetch function - just get top 10
  const fetchLeaderboardData = useCallback(async (placementValue: string, showLoading: boolean = true) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      return;
    }
    
    // Track leaderboard view
    analytics.trackLeaderboardView(1, 10);
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    isLoadingRef.current = true;

    const startTime = Date.now();
    const minLoadingTime = 300; // Minimum loading time to prevent flickering

    try {
      // Only show loading if requested (prevents flickering when switching placements)
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Fetch only first page with 10 items
      const result = await fetchWithCache(
        `${BASE_URL}/fetchTotalPlacements?placement=${placementValue}&page=1&limit=10`,
        {
          signal: abortControllerRef.current.signal
        }
      );

      // Handle response format
      const responseData = result.data || result;
      const items = Array.isArray(responseData) ? responseData : [];
      
      // Ensure minimum loading time to prevent flickering
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      setData(items);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again.');
      
      // Track error
      analytics.trackError('leaderboard_error', err instanceof Error ? err.message : 'Unknown error', 'leaderboard_fetch');
      
      setData([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchWithCache, analytics]);

  // Debounced fetch with proper cleanup - only trigger on placement change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Use a longer debounce to reduce flickering and only show loading if request takes time
    searchTimeoutRef.current = window.setTimeout(() => {
      fetchLeaderboardData(placement, true);
    }, 300); // Longer debounce to reduce flickering

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]); // Only depend on placement to prevent unnecessary re-runs

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Get placement icon
  const getPlacementIcon = (place: number) => {
    switch (place) {
      case 1: return <Trophy className="text-yellow-400" size={20} />;
      case 2: return <Medal className="text-gray-300" size={20} />;
      case 3: return <Medal className="text-amber-600" size={20} />;
      default: return <Star className="text-purple-400" size={20} />;
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <motion.div
          key={index}
          className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="w-8 h-8 bg-gray-700/50 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-700/30 rounded animate-pulse w-1/4" />
          </div>
        </motion.div>
      ))}
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100">
      {/* Header */}
      <header className="w-full bg-black/40 py-4 border-b border-purple-600/50 shadow-2xl">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="text-gold-200" size={18} />
            <span className="text-gold-100">Back to Search</span>
          </motion.button>
          
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-serif font-bold">
              <span className="text-gold-400">Ballroom</span>
              <span className="text-purple-400/90">Scores</span>
            </h1>
            <p className="text-xs md:text-sm text-purple-300/80 font-light">
              Competitive Dance Analysis
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <motion.button
                onClick={() => navigate(`/profile/${currentUser.uid}`)}
                className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="text-gold-200" size={18} />
                <span className="text-gold-100 hidden sm:inline">Profile</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn className="text-gold-200" size={18} />
                <span className="text-gold-100 hidden sm:inline">Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="max-w-6xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-2xl border border-purple-600/30 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header Section */}
          <div className="p-6 border-b border-purple-600/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Award className="text-gold-400" size={isMobile ? 24 : 32} />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gold-300">
                    Placements Leaderboard
                  </h2>
                  <p className="text-purple-300/80 text-sm md:text-base">
                    Top performers by placement count
                  </p>
                </div>
              </div>
              
            </div>
          </div>

          {/* Placement Filter Buttons */}
          <div className="p-6 border-b border-purple-600/20">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((place) => (
                <motion.button
                  key={place}
                  onClick={() => setPlacement(String(place))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 ${
                    placement === String(place)
                      ? 'bg-gradient-to-r from-gold-600 to-gold-700 text-purple-900'
                      : 'bg-gray-800/50 text-gold-100 hover:bg-gray-700/50'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {getPlacementIcon(place)}
                  <span className="hidden sm:inline">
                    {place}{place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} Place
                  </span>
                  <span className="sm:hidden">{place}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 text-lg mb-4">{error}</div>
                <motion.button
                  onClick={() => fetchLeaderboardData(placement)}
                  className="bg-purple-800 hover:bg-purple-900 px-6 py-3 rounded-lg font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12">
                <Award className="text-purple-400/50 mx-auto mb-4" size={48} />
                <div className="text-purple-300/80 text-lg">
                  No data found for {placement}{placement === '1' ? 'st' : placement === '2' ? 'nd' : placement === '3' ? 'rd' : 'th'} place
                </div>
              </div>
            ) : (
              <div className="border border-purple-600/20 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-900/95 backdrop-blur-sm">
                    <tr className="border-b border-purple-600/20">
                      <th className="text-left py-4 px-2 text-gold-300 font-semibold">Rank</th>
                      <th className="text-left py-4 px-2 text-gold-300 font-semibold">Competitor</th>
                      <th className="text-left py-4 px-2 text-gold-300 font-semibold">Placements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((competitor, index) => (
                      <motion.tr
                        key={`${competitor.competitor}-${index}`}
                        className="hover:bg-purple-900/10 border-b border-purple-600/10 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-purple-600 text-white'
                            }`}>
                              {index + 1}
                            </span>
                            {index < 3 && getPlacementIcon(parseInt(placement))}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-gold-100 font-medium">
                          {competitor.competitor}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gold-300 font-bold text-lg">
                              {competitor.place_count}
                            </span>
                            <span className="text-purple-300/80 text-sm">
                              {competitor.place_count === 1 ? 'placement' : 'placements'}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default Leaderboard;

import React, { useEffect, useState, useRef, useCallback } from 'react';
import CompetitionSelector from '../components/CompetitionSelector';
import SearchFields from '../components/SearchFields';
import ResultsTable from '../components/ResultsTable';
import AnalyticsTable from '../components/AnalyticsTable';
import Analytics from '../components/Analytics';
import AuthModal from '../components/AuthModal';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BarChart2, Award, Loader, ChevronLeft, ChevronRight, Menu, X, LogIn, User } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../contexts/AuthContext';

// Firebase Functions URL - will be automatically set by Firebase Hosting
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/ballroom-score-finder/us-central1';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({
    competitor: '',
    style: '',
    score: '',
  });
  const [viewAnalytics, setViewAnalytics] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);

  // Check if user needs to complete profile setup
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (userProfile) {
        // Show setup modal if user has no first name or last name
        // This ensures all users must complete their profile, even if Google provided a name
        const needsSetup = !userProfile.firstName || !userProfile.lastName;
        setShowProfileSetup(needsSetup);
      } else {
        // User just signed up but profile hasn't loaded yet, wait a bit
        // The profile should be created by AuthContext, so we'll check again when it loads
        const timer = setTimeout(() => {
          if (!userProfile) {
            setShowProfileSetup(true);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, userProfile, authLoading]);
  
  // Search optimization refs
  const searchTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchParamsRef = useRef<string>('');

  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('home', 'Ballroom Score Finder - Home');
  }, [analytics]);

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

  // Competition selection handler
  const handleCompetitionChange = (selected: string[]) => {
    setSelectedCompetitions(selected);
    // Track competition selection
    analytics.trackCompetitionSelection(selected);
  };

  // Optimized search execution handler with debouncing and request cancellation
  const executeSearch = useCallback(async (params: URLSearchParams) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BASE_URL}/fetchData?${params}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Handle different response formats
      let parsedData;
      if (data.body) {
        // If response is wrapped in a body property
        parsedData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      } else {
        // If response is direct
        parsedData = data;
      }
      
      setResults(Array.isArray(parsedData) ? parsedData : []);
      setSearchError(parsedData.length === 0 ? 'No results found.' : null);
      setViewAnalytics(false);
      
      // Auto-collapse sidebar on mobile after search
      if (isMobile) {
        setSidebarCollapsed(true);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setResults([]);
      
      // Track error
      analytics.trackError('search_error', err instanceof Error ? err.message : 'Unknown error', 'home_search');
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  const handleSearch = useCallback(() => {
    if (selectedCompetitions.length === 0) {
      alert('Please select at least one competition.');
      return;
    }

    // Track search event
    analytics.trackSearch('main_search', {
      competitor: searchParams.competitor || '',
      style: searchParams.style || '',
      score: searchParams.score || '',
      competition_count: selectedCompetitions.length
    });

    // Build query params
    const params = new URLSearchParams();
    
    // Add competitions
    if (selectedCompetitions.length > 0) {
      params.append('competition', selectedCompetitions.join(','));
    }
    
    // Add other search params if they exist
    if (searchParams.competitor?.trim()) {
      params.append('competitor', searchParams.competitor.trim());
    }
    
    if (searchParams.style?.trim()) {
      params.append('style', searchParams.style.trim());
    }
    
    if (searchParams.score?.trim()) {
      params.append('score', searchParams.score.trim());
    }

    const searchKey = params.toString();
    
    // Prevent duplicate searches
    if (searchKey === lastSearchParamsRef.current) {
      return;
    }
    
    lastSearchParamsRef.current = searchKey;

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search execution
    searchTimeoutRef.current = window.setTimeout(() => {
      executeSearch(params);
    }, 200);
  }, [selectedCompetitions, searchParams, executeSearch]);

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

  // Analytics handler
  const handleAnalyticsClick = async () => {
    const competitorInput = document.querySelector<HTMLInputElement>('input[placeholder="Enter Name"]')?.value.trim();

    if (!competitorInput) {
      alert('Please select a competitor to view analytics.');
      return;
    }

    // Track analytics view
    analytics.trackAnalyticsView(competitorInput);

    // First validate that it looks like a complete couple name
    const hasCoupleIndicator = competitorInput.includes('&') || 
                              competitorInput.toLowerCase().includes(' and ') ||
                              competitorInput.split(' ').length >= 2;

    if (!hasCoupleIndicator) {
      alert('Please enter the complete couple\'s name (e.g., "Seth Lowery & Natalie Chavez") to view analytics.');
      return;
    }

    // Check if this exact couple name exists in the database
    try {
      const response = await fetch(`${BASE_URL}/fetchAnalytics?competitor=${encodeURIComponent(competitorInput)}`);
      
      if (response.status === 404) {
        const errorData = await response.json();
        alert(errorData.error || 'No exact match found. Please enter the exact couple\'s name as it appears in the database.');
        return;
      }
      
      if (!response.ok) {
        alert('Error validating couple name. Please try again.');
        return;
      }
    } catch (error) {
      alert('Error validating couple name. Please try again.');
      return;
    }

    setSearchParams((prev) => ({ ...prev, competitor: competitorInput }));
    setViewAnalytics(false);
    setTimeout(() => setViewAnalytics(true), 0);
  };  

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-black/40 py-3 md:py-4 border-b border-purple-600/50 shadow-2xl">
        <div className="container mx-auto px-3 md:px-4 flex justify-between items-center">
          {/* Title Section */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-4xl font-serif font-bold mb-0 md:mb-1">
              <span className="text-gold-400">Ballroom</span>
              <span className="text-purple-400/90">Scores</span>
            </h1>
            <p className="text-xs md:text-sm text-purple-300/80 font-light mb-2">
              Competitive Dance Analysis
            </p>
            <p className="text-xs md:text-sm text-purple-300/80 font-light">
              Designed & Developed by{" "}
              <a 
                href="https://sethlowery.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                Seth Lowery
              </a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <motion.button
                onClick={() => navigate(`/profile/${currentUser.uid}`)}
                className="flex items-center gap-1 md:gap-2 bg-purple-800 hover:bg-purple-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-lg text-sm md:text-base font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="text-gold-200" size={isMobile ? 16 : 18} />
                <span className="text-gold-100 hidden sm:inline">Profile</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1 md:gap-2 bg-purple-800 hover:bg-purple-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-lg text-sm md:text-base font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn className="text-gold-200" size={isMobile ? 16 : 18} />
                <span className="text-gold-100 hidden sm:inline">Sign In</span>
              </motion.button>
            )}
            <motion.button
              onClick={() => navigate('/leaderboard')}
              className="flex items-center gap-1 md:gap-2 bg-purple-800 hover:bg-purple-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-lg text-sm md:text-base font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Award className="text-gold-200" size={isMobile ? 16 : 18} />
              <span className="text-gold-100">Leaderboard</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Search Bar Section */}
      <div className="bg-gray-900/70 border-b border-purple-600/30 py-3 md:py-4">
        <div className="container mx-auto px-3 md:px-4">
          <div className="bg-gray-900/80 rounded-xl p-3 md:p-4 shadow-xl border border-purple-600/30">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search Fields Row */}
              <div className="w-full px-0 md:px-4">
                <SearchFields
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  selectedCompetitions={selectedCompetitions}
                  onSearch={handleSearch}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 md:gap-3 justify-center md:justify-end">
                <motion.button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-1 md:gap-2 bg-gold-600 hover:bg-gold-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium shadow-lg flex-1 md:flex-initial"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Search className="text-purple-50" size={isMobile ? 16 : 18} />
                  <span className="text-purple-50">Search</span>
                </motion.button>

                <motion.button
                  onClick={handleAnalyticsClick}
                  className="flex items-center justify-center gap-1 md:gap-2 bg-purple-800 hover:bg-purple-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium shadow-lg flex-1 md:flex-initial"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BarChart2 className="text-gold-200" size={isMobile ? 16 : 18} />
                  <span className="text-gold-100">Analytics</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Flexible Layout */}
      <div className="flex-grow flex relative">
        {/* Mobile Overlay */}
        {!sidebarCollapsed && isMobile && (
          <div 
            className="fixed inset-0 bg-black/60 z-10"
            onClick={toggleSidebar}
          />
        )}
        
        {/* Sidebar Toggle Button for Mobile */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden fixed bottom-4 right-4 z-30 p-3 bg-purple-800 rounded-full shadow-lg"
        >
          {sidebarCollapsed ? <Menu size={24} /> : <X size={24} />}
        </button>

        {/* Collapsible Sidebar */}
        <div 
          className={`bg-gray-900/80 border-r border-purple-600/30 flex flex-col transition-all duration-300 z-[100]
            ${sidebarCollapsed ? 
              'w-0 md:w-12 overflow-hidden' : 
              'fixed md:relative inset-y-0 left-0 w-4/5 md:w-64 overflow-auto'}`}
        >
          {/* Sidebar Toggle Button for Desktop */}
          <div className="hidden md:flex justify-end p-2">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-purple-800/40"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          
          {/* Competition Selector Content */}
          {!sidebarCollapsed && (
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gold-300 mb-4 text-center">Event Selection</h2>
              <CompetitionSelector onSelectionChange={handleCompetitionChange} />
              
              {/* Extra close button for mobile */}
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="mt-4 w-full bg-purple-900/50 hover:bg-purple-900/70 py-2 rounded-lg text-gold-100 md:hidden"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-grow p-2 md:p-4 overflow-hidden">
          <div className="bg-gray-900/80 rounded-xl p-3 md:p-4 shadow-2xl border border-purple-600/30 h-full overflow-hidden flex flex-col">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-3 md:mb-4 pb-2 border-b border-purple-600/20">
              <h2 className="text-lg md:text-xl font-semibold text-gold-300">
                {viewAnalytics ? 'Performance Analytics' : 'Competition Results'}
              </h2>
              {viewAnalytics && (
                <motion.button
                  onClick={() => setViewAnalytics(false)}
                  className="bg-red-800 hover:bg-red-900 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-gold-100 shadow-md text-xs md:text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back to Results
                </motion.button>
              )}
            </div>

            {/* Results Content */}
            <div className="flex-grow overflow-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader className="text-gold-400" size={isMobile ? 32 : 40} />
                  </motion.div>
                  <p className="text-purple-300/80 animate-pulse text-sm md:text-base">Loading results...</p>
                </div>
              ) : error ? (
                <div className="p-3 md:p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                  <p className="text-red-300 text-sm md:text-base">{error}</p>
                </div>
              ) : searchError ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-purple-300/80 text-sm md:text-base">{searchError}</p>
                </div>
              ) : viewAnalytics ? (
                <>
                  <Analytics
                    key={searchParams.competitor}
                    competitor={searchParams.competitor}
                    onDataLoad={setAnalyticsData}
                    onError={setError}
                  />
                </>
              ) : results.length > 0 ? (
                <div className="rounded-lg overflow-hidden">
                  <ResultsTable results={results} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-purple-300/80 text-center text-sm md:text-base px-4">
                    {isMobile && sidebarCollapsed ? 
                      "Tap the menu button to select competitions, then enter search criteria." : 
                      "Enter search criteria and click Search to find results."}
                  </p>
                </div>
              )}                
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {/* Profile Setup Modal */}
      <ProfileSetupModal 
        isOpen={showProfileSetup} 
        onComplete={() => {
          setShowProfileSetup(false);
        }} 
      />
    </div>
  );
};

export default Home;

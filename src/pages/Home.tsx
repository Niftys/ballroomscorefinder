import React, { useEffect, useState } from 'react';
import CompetitionSelector from '../components/CompetitionSelector';
import SearchFields from '../components/SearchFields';
import ResultsTable from '../components/ResultsTable';
import AnalyticsTable from '../components/AnalyticsTable';
import Analytics from '../components/Analytics';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BarChart2, Award, Loader, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Home: React.FC = () => {
  const navigate = useNavigate();
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
  };

  // Search execution handler
  const handleSearch = async () => {
    if (selectedCompetitions.length === 0) {
      alert('Please select at least one competition.');
      return;
    }
  
    setLoading(true);
    setError(null);
    try {
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
  
      const response = await fetch(`${BASE_URL}/fetchData?${params}`);
      
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
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Analytics handler
  const handleAnalyticsClick = () => {
    const competitorInput = document.querySelector<HTMLInputElement>('input[placeholder="Enter Name"]')?.value.trim();

    if (competitorInput) {
      setSearchParams((prev) => ({ ...prev, competitor: competitorInput }));
      setViewAnalytics(false);
      setTimeout(() => setViewAnalytics(true), 0);
    } else {
      alert('Please select a competitor to view analytics.');
    }    
  };  

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-black/40 py-3 md:py-4 border-b border-purple-600/50 shadow-2xl">
        <motion.div 
          className="container mx-auto px-3 md:px-4 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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

          {/* Leaderboard Link */}
          <motion.button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-purple-700/80 to-purple-800/90 hover:from-purple-800 hover:to-purple-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-lg text-sm md:text-base font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Award className="text-gold-200" size={isMobile ? 16 : 18} />
            <span className="text-gold-100">Leaderboard</span>
          </motion.button>
        </motion.div>
      </header>

      {/* Search Bar Section */}
      <div className="bg-gray-900/70 border-b border-purple-600/30 py-3 md:py-4">
        <div className="container mx-auto px-3 md:px-4">
          <motion.div 
            className="bg-gray-900/80 rounded-xl p-3 md:p-4 shadow-xl border border-purple-600/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
                  className="flex items-center justify-center gap-1 md:gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium shadow-lg flex-1 md:flex-initial"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BarChart2 className="text-gold-200" size={isMobile ? 16 : 18} />
                  <span className="text-gold-100">Analytics</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
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
        <motion.div 
          className={`bg-gray-900/80 border-r border-purple-600/30 flex flex-col transition-all duration-300 z-[100]
            ${sidebarCollapsed ? 
              'w-0 md:w-12 overflow-hidden' : 
              'fixed md:relative inset-y-0 left-0 w-4/5 md:w-64 overflow-auto'}`}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
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
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-grow p-2 md:p-4 overflow-hidden">
          <motion.div 
            className="bg-gray-900/80 rounded-xl p-3 md:p-4 shadow-2xl border border-purple-600/30 h-full overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Results Header */}
            <div className="flex justify-between items-center mb-3 md:mb-4 pb-2 border-b border-purple-600/20">
              <h2 className="text-lg md:text-xl font-semibold text-gold-300">
                {viewAnalytics ? 'Performance Analytics' : 'Competition Results'}
              </h2>
              {viewAnalytics && (
                <motion.button
                  onClick={() => setViewAnalytics(false)}
                  className="bg-gradient-to-r from-red-700/80 to-red-800/90 hover:from-red-800 hover:to-red-900 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-gold-100 shadow-md text-xs md:text-sm"
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;

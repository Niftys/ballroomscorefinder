import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, User, Edit, ChevronDown, ChevronUp, Loader, Award, Building, X, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ResultsTable from '../components/ResultsTable';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/ballroom-score-finder/us-central1';

interface UserProfile {
  firstName: string;
  lastName: string;
  affiliation: string;
  aliases: string[];
  createdAt?: any;
  updatedAt?: any;
}

interface CompetitionData {
  competition_name: string;
  placements: { placement: number; count: number }[];
  total_entries: number;
}

interface ScoreData {
  placement: number;
  person_name: string;
  style_name: string;
  comp_name: string;
}

interface ExpandedCompetition {
  name: string;
  scores: ScoreData[];
  loading: boolean;
}

const Profile: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [competitionHistory, setCompetitionHistory] = useState<CompetitionData[]>([]);
  const [competitionHistoryLoading, setCompetitionHistoryLoading] = useState(false);
  const [expandedCompetitions, setExpandedCompetitions] = useState<Map<string, ExpandedCompetition>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile | null>(null);
  const [newAlias, setNewAlias] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (!uid) return;
    fetchProfile();
  }, [uid]);

  useEffect(() => {
    if (profile) {
      fetchCompetitionHistory();
    }
  }, [profile]);

  const fetchProfile = async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
        setEditForm(data);
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitionHistoryFallback = async () => {
    if (!profile) return;
    
    // Fallback: use the old fetchCompetitionHistory endpoint with individual searches
    const searchTerms: string[] = [];
    
    if (profile.firstName && profile.lastName) {
      searchTerms.push(`${profile.firstName} & ${profile.lastName}`);
      searchTerms.push(`${profile.lastName} & ${profile.firstName}`);
    }
    
    profile.aliases.forEach(alias => {
      searchTerms.push(alias);
    });

    const allCompetitions = new Map<string, CompetitionData>();
    
    for (const competitor of searchTerms) {
      try {
        const response = await fetch(
          `${BASE_URL}/fetchCompetitionHistory?competitor=${encodeURIComponent(competitor)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            data.forEach((comp: CompetitionData) => {
              if (allCompetitions.has(comp.competition_name)) {
                const existing = allCompetitions.get(comp.competition_name)!;
                const placementMap = new Map<number, number>();
                
                existing.placements.forEach(p => {
                  placementMap.set(p.placement, p.count);
                });
                
                comp.placements.forEach(p => {
                  placementMap.set(p.placement, (placementMap.get(p.placement) || 0) + p.count);
                });
                
                allCompetitions.set(comp.competition_name, {
                  ...existing,
                  placements: Array.from(placementMap.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([placement, count]) => ({ placement, count })),
                  total_entries: existing.total_entries + comp.total_entries
                });
              } else {
                allCompetitions.set(comp.competition_name, comp);
              }
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching for ${competitor}:`, err);
      }
    }
    
    setCompetitionHistory(Array.from(allCompetitions.values()));
    setCompetitionHistoryLoading(false);
  };

  const fetchCompetitionHistory = async () => {
    if (!profile) return;
    
    setCompetitionHistoryLoading(true);
    
    try {
      // Use the new user-specific endpoint that searches comprehensively
      const params = new URLSearchParams();
      if (profile.firstName) params.append('firstName', profile.firstName);
      if (profile.lastName) params.append('lastName', profile.lastName);
      if (profile.aliases.length > 0) {
        params.append('aliases', encodeURIComponent(JSON.stringify(profile.aliases)));
      }

      let response: Response;
      try {
        response = await fetch(
          `${BASE_URL}/fetchUserCompetitionHistory?${params.toString()}`
        );
      } catch (fetchError) {
        console.error('Network error fetching competition history:', fetchError);
        // Fallback to old method if new endpoint doesn't exist
        await fetchCompetitionHistoryFallback();
        return;
      }
      
      if (!response.ok) {
        console.error('Failed to fetch competition history:', response.status, response.statusText);
        // Fallback to old method
        await fetchCompetitionHistoryFallback();
        return;
      }

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Non-JSON response received, using fallback method');
        // Fallback to old method
        await fetchCompetitionHistoryFallback();
        return;
      }

      // Also check if the text starts with HTML (common error case)
      if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
        console.warn('HTML response received (endpoint may not be deployed), using fallback method');
        await fetchCompetitionHistoryFallback();
        return;
      }

      try {
        const data = JSON.parse(text);
        setCompetitionHistory(Array.isArray(data) ? data : []);
        setCompetitionHistoryLoading(false);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        console.error('Response text:', text.substring(0, 500));
        // Fallback to old method
        await fetchCompetitionHistoryFallback();
      }
    } catch (err) {
      console.error('Error fetching competition history:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
      }
      // Try fallback before giving up
      await fetchCompetitionHistoryFallback();
    }
  };

  const toggleCompetition = async (competitionName: string) => {
    const isExpanded = expandedCompetitions.has(competitionName);
    
    if (isExpanded) {
      // Collapse
      const newMap = new Map(expandedCompetitions);
      newMap.delete(competitionName);
      setExpandedCompetitions(newMap);
    } else {
      // Expand - fetch scores
      const newMap = new Map(expandedCompetitions);
      newMap.set(competitionName, { name: competitionName, scores: [], loading: true });
      setExpandedCompetitions(newMap);

      try {
        // Build search terms
        const searchTerms: string[] = [];
        if (profile?.firstName && profile?.lastName) {
          searchTerms.push(`${profile.firstName} & ${profile.lastName}`);
          searchTerms.push(`${profile.lastName} & ${profile.firstName}`);
        }
        profile?.aliases.forEach(alias => searchTerms.push(alias));

        // Fetch scores for this competition using user profile search
        if (profile) {
          try {
            const params = new URLSearchParams();
            if (profile.firstName) params.append('firstName', profile.firstName);
            if (profile.lastName) params.append('lastName', profile.lastName);
            if (profile.aliases.length > 0) {
              params.append('aliases', JSON.stringify(profile.aliases));
            }
            params.append('competition', competitionName);

            const response = await fetch(
              `${BASE_URL}/fetchUserScores?${params.toString()}`
            );
            
            if (response.ok) {
              const data = await response.json();
              const scores = Array.isArray(data) ? data : [];
              newMap.set(competitionName, { name: competitionName, scores, loading: false });
            } else {
              // Fallback to regular fetchData if new endpoint doesn't exist yet
              const searchTerms: string[] = [];
              if (profile.firstName && profile.lastName) {
                searchTerms.push(`${profile.firstName} & ${profile.lastName}`);
                searchTerms.push(`${profile.lastName} & ${profile.firstName}`);
              }
              profile.aliases.forEach(alias => searchTerms.push(alias));

              const allScores: ScoreData[] = [];
              const seenScores = new Set<string>();
              
              for (const competitor of searchTerms) {
                try {
                  const fallbackResponse = await fetch(
                    `${BASE_URL}/fetchData?competitor=${encodeURIComponent(competitor)}&competition=${encodeURIComponent(competitionName)}`
                  );
                  
                  if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (Array.isArray(fallbackData)) {
                      fallbackData.forEach((score: ScoreData) => {
                        const key = `${score.person_name}_${score.style_name}_${score.comp_name}_${score.placement}`;
                        if (!seenScores.has(key)) {
                          seenScores.add(key);
                          allScores.push(score);
                        }
                      });
                    }
                  }
                } catch (err) {
                  console.error(`Error fetching scores for ${competitor}:`, err);
                }
              }
              
              newMap.set(competitionName, { name: competitionName, scores: allScores, loading: false });
            }
            setExpandedCompetitions(new Map(newMap));
          } catch (err) {
            console.error('Error fetching scores:', err);
            newMap.set(competitionName, { name: competitionName, scores: [], loading: false });
            setExpandedCompetitions(new Map(newMap));
          }
        } else {
          newMap.set(competitionName, { name: competitionName, scores: [], loading: false });
          setExpandedCompetitions(new Map(newMap));
        }
      } catch (err) {
        console.error('Error fetching scores:', err);
        const newMap = new Map(expandedCompetitions);
        newMap.set(competitionName, { name: competitionName, scores: [], loading: false });
        setExpandedCompetitions(new Map(newMap));
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!uid || !editForm || !currentUser || currentUser.uid !== uid) return;
    
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...editForm,
        updatedAt: Timestamp.now()
      });
      
      setProfile(editForm);
      setIsEditing(false);
      // Refresh competition history with new name/aliases
      await fetchCompetitionHistory();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
  };

  const addAlias = () => {
    if (!newAlias.trim() || !editForm) return;
    setEditForm({
      ...editForm,
      aliases: [...editForm.aliases, newAlias.trim()]
    });
    setNewAlias('');
  };

  const removeAlias = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      aliases: editForm.aliases.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="text-gold-400 animate-spin" size={48} />
          <p className="text-purple-300/80">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Profile not found'}</p>
          <motion.button
            onClick={() => navigate('/')}
            className="bg-purple-800 hover:bg-purple-900 px-6 py-3 rounded-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Home
          </motion.button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === uid;
  const displayName = profile.firstName && profile.lastName 
    ? `${profile.firstName} ${profile.lastName}` 
    : profile.firstName || profile.lastName || 'User';

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
            <span className="text-gold-100">Back</span>
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
          {/* Profile Header */}
          <div className="p-6 border-b border-purple-600/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-600 to-purple-700 flex items-center justify-center">
                  <User className="text-white" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gold-300">
                    {displayName}
                  </h2>
                  {profile.affiliation && (
                    <div className="flex items-center gap-2 mt-1 text-purple-300/80">
                      <Building size={16} />
                      <span>{profile.affiliation}</span>
                    </div>
                  )}
                  {profile.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.aliases.map((alias, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-800/50 text-purple-200 rounded text-xs"
                        >
                          {alias}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {isOwnProfile && (
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveProfile();
                      } else {
                        setIsEditing(true);
                        setEditForm(profile);
                      }
                    }}
                    className="flex items-center gap-2 bg-gold-700 hover:bg-gold-800 text-purple-900 px-4 py-2 rounded-lg font-semibold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit size={18} />
                    {isEditing ? 'Save' : 'Edit Profile'}
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      await signOut();
                      navigate('/');
                    }}
                    className="flex items-center gap-2 bg-red-800 hover:bg-red-900 text-gold-100 px-4 py-2 rounded-lg font-semibold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogOut size={18} />
                    Log Out
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && editForm && isOwnProfile && (
            <motion.div
              className="p-6 border-b border-purple-600/20 bg-gray-800/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gold-300 text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gold-300 text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gold-300 text-sm font-medium mb-2">
                    Affiliation
                  </label>
                  <input
                    type="text"
                    value={editForm.affiliation}
                    onChange={(e) => setEditForm({ ...editForm, affiliation: e.target.value })}
                    placeholder="e.g., UT Austin, BYU"
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-gold-300 text-sm font-medium mb-2">
                    Aliases (for name variations)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAlias()}
                      placeholder="e.g., John & Jane Doe"
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-500"
                    />
                    <motion.button
                      onClick={addAlias}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus size={20} />
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editForm.aliases.map((alias, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-800/50 text-purple-200 rounded-lg text-sm flex items-center gap-2"
                      >
                        {alias}
                        <button
                          onClick={() => removeAlias(idx)}
                          className="hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    onClick={handleSaveProfile}
                    className="px-6 py-2 bg-gold-600 hover:bg-gold-700 text-purple-900 font-semibold rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Save Changes
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(profile);
                    }}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gold-100 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Competition History */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="text-gold-400" size={isMobile ? 24 : 32} />
              <h3 className="text-2xl font-bold text-gold-300">Competition History</h3>
            </div>

            {competitionHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="text-gold-400 animate-spin" size={48} />
                <p className="text-purple-300/80 text-lg mt-4">
                  Loading competition history...
                </p>
              </div>
            ) : competitionHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-purple-300/80 text-lg">
                  No competition history found. Make sure your name and aliases match your competition records.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {competitionHistory.map((comp, idx) => {
                  const isExpanded = expandedCompetitions.has(comp.competition_name);
                  const expandedData = expandedCompetitions.get(comp.competition_name);

                  return (
                    <motion.div
                      key={idx}
                      className="bg-gray-800/30 border border-purple-600/30 rounded-lg overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <button
                        onClick={() => toggleCompetition(comp.competition_name)}
                        className="w-full p-4 flex items-center justify-between hover:bg-purple-900/10 transition-colors"
                      >
                        <div className="flex-1 text-left">
                          <h4 className="text-lg font-semibold text-gold-200">
                            {comp.competition_name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {comp.placements.map((placement, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-2 py-1 bg-purple-600/80 text-white rounded text-sm"
                              >
                                {placement.placement}
                                {placement.placement === 1 ? 'st' : placement.placement === 2 ? 'nd' : placement.placement === 3 ? 'rd' : 'th'} × {placement.count}
                              </span>
                            ))}
                            <span className="px-2 py-1 bg-gray-700/50 text-purple-200 rounded text-sm">
                              {comp.total_entries} total entries
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="text-gold-400" size={24} />
                        ) : (
                          <ChevronDown className="text-purple-300/80" size={24} />
                        )}
                      </button>

                      {isExpanded && expandedData && (
                        <motion.div
                          className="border-t border-purple-600/30 p-4"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {expandedData.loading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader className="text-gold-400 animate-spin" size={32} />
                            </div>
                          ) : expandedData.scores.length > 0 ? (
                            <ResultsTable results={expandedData.scores} />
                          ) : (
                            <p className="text-center text-purple-300/80 py-4">
                              No scores found for this competition.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;


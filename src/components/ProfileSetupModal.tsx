import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building, Tag, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onComplete }) => {
  const { currentUser, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addAlias = () => {
    if (newAlias.trim() && !aliases.includes(newAlias.trim())) {
      setAliases([...aliases, newAlias.trim()]);
      setNewAlias('');
    }
  };

  const removeAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name');
      return;
    }

    if (!currentUser) {
      setError('User not found. Please try signing in again.');
      return;
    }

    setLoading(true);
    try {
      // Update the auth context profile (which will also update Firestore)
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        affiliation: affiliation.trim(),
        aliases: aliases
      });

      onComplete();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping, but they can fill it out later
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-purple-600/50 p-6 md:p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-600 to-purple-700 flex items-center justify-center mx-auto mb-4">
              <User className="text-white" size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gold-300 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-purple-300/80 text-sm md:text-base">
              Help us match your competition records by adding your information
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gold-300 text-sm font-medium mb-2">
                  <User size={16} className="inline mr-2" />
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 placeholder-purple-300/50 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-gold-300 text-sm font-medium mb-2">
                  <User size={16} className="inline mr-2" />
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 placeholder-purple-300/50 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Affiliation */}
            <div>
              <label className="block text-gold-300 text-sm font-medium mb-2">
                <Building size={16} className="inline mr-2" />
                Affiliation
              </label>
              <input
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 placeholder-purple-300/50 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                placeholder="e.g., UT Austin, BYU, Stanford"
              />
            </div>

            {/* Aliases */}
            <div>
              <label className="block text-gold-300 text-sm font-medium mb-2">
                <Tag size={16} className="inline mr-2" />
                Aliases (for name variations)
              </label>
              <p className="text-purple-300/60 text-xs mb-2">
                Add any name variations you might have used in competitions (e.g., "John & Jane Doe", "Johnny Doe")
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                  placeholder="e.g., John & Jane Doe"
                  className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-purple-600/30 rounded-lg text-gold-100 placeholder-purple-300/50 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                />
                <motion.button
                  type="button"
                  onClick={addAlias}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 rounded-lg text-gold-100 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add
                </motion.button>
              </div>
              {aliases.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {aliases.map((alias, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-purple-800/50 text-purple-200 rounded-lg text-sm flex items-center gap-2"
                    >
                      {alias}
                      <button
                        type="button"
                        onClick={() => removeAlias(idx)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gold-700 hover:bg-gold-800 text-purple-900 font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Profile'}
              </motion.button>
              <motion.button
                type="button"
                onClick={handleSkip}
                className="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-gold-100 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Skip for Now
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileSetupModal;


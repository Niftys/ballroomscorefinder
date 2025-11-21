import { useCallback } from 'react';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../firebase';

// Custom hook for Firebase Analytics
export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, parameters?: { [key: string]: any }) => {
    if (analytics) {
      logEvent(analytics, eventName, parameters);
    }
  }, []);

  const trackPageView = useCallback((pageName: string, pageTitle?: string) => {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_title: pageTitle || pageName,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  }, []);

  const trackSearch = useCallback((searchTerm: string, filters?: { [key: string]: any }) => {
    if (analytics) {
      logEvent(analytics, 'search', {
        search_term: searchTerm,
        ...filters
      });
    }
  }, []);

  const trackCompetitorSearch = useCallback((competitorName: string, resultCount: number) => {
    if (analytics) {
      logEvent(analytics, 'competitor_search', {
        competitor_name: competitorName,
        result_count: resultCount
      });
    }
  }, []);

  const trackCompetitionSelection = useCallback((competitionNames: string[]) => {
    if (analytics) {
      logEvent(analytics, 'competition_selection', {
        competition_count: competitionNames.length,
        competitions: competitionNames.join(', ')
      });
    }
  }, []);

  const trackAnalyticsView = useCallback((competitorName: string) => {
    if (analytics) {
      logEvent(analytics, 'analytics_view', {
        competitor_name: competitorName
      });
    }
  }, []);

  const trackLeaderboardView = useCallback((page: number, limit: number) => {
    if (analytics) {
      logEvent(analytics, 'leaderboard_view', {
        page_number: page,
        items_per_page: limit
      });
    }
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string, context?: string) => {
    if (analytics) {
      logEvent(analytics, 'error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        context: context || 'unknown'
      });
    }
  }, []);

  const setUser = useCallback((userId: string, properties?: { [key: string]: any }) => {
    if (analytics) {
      setUserId(analytics, userId);
      if (properties) {
        setUserProperties(analytics, properties);
      }
    }
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackSearch,
    trackCompetitorSearch,
    trackCompetitionSelection,
    trackAnalyticsView,
    trackLeaderboardView,
    trackError,
    setUser
  };
};

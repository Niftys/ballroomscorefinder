"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUserScores = exports.fetchUserCompetitionHistory = exports.fetchCompetitionHistory = exports.fetchAveragePlacements = exports.fetchAnalytics = exports.fetchTotalPlacements = exports.fetchStyles = exports.fetchJudges = exports.fetchData = exports.fetchCompetitions = exports.fetchCompetitors = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
admin.initializeApp();
// Initialize CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// In-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Limit cache size
// Request deduplication - prevents multiple identical requests
const pendingRequests = new Map();
// Cache management
const getFromCache = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
    }
    if (cached) {
        cache.delete(key); // Remove expired entry
    }
    return null;
};
const setCache = (key, data, ttl = CACHE_TTL) => {
    // Simple LRU: remove oldest entries if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) {
            cache.delete(oldestKey);
        }
    }
    cache.set(key, { data, timestamp: Date.now(), ttl });
};
// Request deduplication helper
const executeWithDeduplication = async (cacheKey, operation, ttl = CACHE_TTL) => {
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
        return cached;
    }
    // Check for pending request
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
    }
    // Execute operation and store promise
    const operationPromise = operation().then(result => {
        // Cache the result
        setCache(cacheKey, result, ttl);
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
        return result;
    }).catch(error => {
        // Remove from pending requests on error
        pendingRequests.delete(cacheKey);
        throw error;
    });
    pendingRequests.set(cacheKey, operationPromise);
    return operationPromise;
};
// Cache warming function - call this periodically to pre-populate cache
const warmCache = async () => {
    try {
        const db = admin.firestore();
        // Pre-populate judges, styles, and competitions maps
        const [judgesSnapshot, stylesSnapshot, compsSnapshot] = await Promise.all([
            db.collection('judges').limit(100).get(),
            db.collection('styles').limit(50).get(),
            db.collection('competitions').limit(50).get()
        ]);
        const judgesMap = new Map();
        const stylesMap = new Map();
        const compsMap = new Map();
        judgesSnapshot.docs.forEach(doc => {
            judgesMap.set(doc.id, doc.data().name);
        });
        stylesSnapshot.docs.forEach(doc => {
            stylesMap.set(doc.id, doc.data().name);
        });
        compsSnapshot.docs.forEach(doc => {
            compsMap.set(doc.id, doc.data().name);
        });
        // Cache for 1 hour
        setCache('judges_map', judgesMap, 60 * 60 * 1000);
        setCache('styles_map', stylesMap, 60 * 60 * 1000);
        setCache('comps_map', compsMap, 60 * 60 * 1000);
        console.log('Cache warmed successfully');
    }
    catch (error) {
        console.error('Error warming cache:', error);
    }
};
// Warm cache on function startup
warmCache();
// Helper function to handle CORS
const handleCors = (req, res, handler) => {
    corsHandler(req, res, () => {
        handler();
    });
};
// Fetch competitors with autocomplete
exports.fetchCompetitors = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const competitor = req.query.competitor;
            if (!competitor) {
                res.json([]);
                return;
            }
            const cacheKey = `competitors_${competitor}`;
            const result = await executeWithDeduplication(cacheKey, async () => {
                const db = admin.firestore();
                const peopleRef = db.collection('people');
                // Simplified approach: just get a broad range and filter
                const searchTerm = competitor.toLowerCase();
                console.log('Searching for:', searchTerm);
                // Get a broad range of people data
                const snapshot = await peopleRef
                    .limit(500)
                    .get();
                console.log('Total docs fetched:', snapshot.docs.length);
                let competitors = snapshot.docs
                    .map((doc) => ({
                    name: doc.data().name,
                    id: doc.id
                }))
                    .filter((person) => person.name.toLowerCase().includes(searchTerm));
                console.log('Filtered competitors:', competitors.length);
                const result = competitors.slice(0, 10); // Limit to 10 results
                console.log('Found competitors:', result.length, 'for query:', competitor);
                console.log('Sample results:', result.slice(0, 3).map(r => r.name));
                console.log('Full result:', result);
                return result;
            }, 10 * 60 * 1000); // 10 minutes TTL
            res.json(result);
        }
        catch (error) {
            console.error('Error fetching competitors:', error);
            console.error('Error details:', error);
            res.status(500).json({ error: 'Failed to fetch competitors' });
        }
    });
});
// Fetch competitions
exports.fetchCompetitions = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const db = admin.firestore();
            const competitionsRef = db.collection('competitions');
            const snapshot = await competitionsRef.get();
            const competitions = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            // Sort competitions by year (most recent first) and alphabetically within each year
            competitions.sort((a, b) => {
                // Extract year from competition name (assuming format like "Competition Name 2024")
                const getYear = (name) => {
                    const yearMatch = name.match(/\b(19|20)\d{2}\b/);
                    return yearMatch ? parseInt(yearMatch[0]) : 0;
                };
                const yearA = getYear(a.name);
                const yearB = getYear(b.name);
                // If years are different, sort by year (descending - most recent first)
                if (yearA !== yearB) {
                    return yearB - yearA;
                }
                // If years are the same, sort alphabetically by name
                return a.name.localeCompare(b.name);
            });
            res.json(competitions);
        }
        catch (error) {
            console.error('Error fetching competitions:', error);
            res.status(500).json({ error: 'Failed to fetch competitions' });
        }
    });
});
// Fetch data with filters
exports.fetchData = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const { competitor, style, judge, competition, score, overall_score } = req.query;
            console.log('Search parameters:', { competitor, style, judge, competition, score, overall_score });
            // Create cache key from search parameters
            const cacheKey = `search_${JSON.stringify({ competitor, style, judge, competition, score, overall_score })}`;
            const results = await executeWithDeduplication(cacheKey, async () => {
                const db = admin.firestore();
                let query = db.collection('scores');
                if (competition) {
                    // Convert competition names to IDs
                    const compNames = competition.split(',');
                    const competitionsRef = db.collection('competitions');
                    const competitionsSnapshot = await competitionsRef.get();
                    const compIds = competitionsSnapshot.docs
                        .filter(doc => compNames.includes(doc.data().name))
                        .map(doc => doc.id);
                    console.log(`Found ${compIds.length} matching competitions for names: ${compNames.join(', ')}`);
                    if (compIds.length > 0) {
                        query = query.where('comp_id', 'in', compIds);
                    }
                    else {
                        console.log('No matching competitions found, returning empty results');
                        res.json([]);
                        return;
                    }
                }
                // Store search criteria for post-processing
                let competitorSearchTerm = null;
                let styleSearchTerm = null;
                if (competitor) {
                    competitorSearchTerm = competitor.toLowerCase();
                    console.log('Main search - Will filter for competitor:', competitorSearchTerm);
                }
                if (style) {
                    styleSearchTerm = style.toLowerCase();
                    console.log('Main search - Will filter for style:', styleSearchTerm);
                }
                if (judge) {
                    const judgesRef = db.collection('judges');
                    // Try prefix search first
                    let judgesSnapshot = await judgesRef
                        .where('name', '>=', judge)
                        .where('name', '<=', judge + '\uf8ff')
                        .limit(50)
                        .get();
                    const searchTerm = judge.toLowerCase();
                    let matchingJudges = judgesSnapshot.docs
                        .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
                    // If no results, try broader search
                    if (matchingJudges.length === 0 && judge.length >= 2) {
                        const broaderSnapshot = await judgesRef
                            .where('name', '>=', judge.charAt(0))
                            .where('name', '<=', judge.charAt(0) + '\uf8ff')
                            .limit(100)
                            .get();
                        matchingJudges = broaderSnapshot.docs
                            .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
                    }
                    const judgeIds = matchingJudges.map(doc => doc.id);
                    if (judgeIds.length > 0) {
                        query = query.where('judge_id', 'in', judgeIds);
                    }
                    else {
                        res.json([]);
                        return;
                    }
                }
                if (score) {
                    query = query.where('score', '==', parseInt(score));
                }
                if (overall_score) {
                    query = query.where('overall_score', '==', parseInt(overall_score));
                }
                console.log('Executing final query with all applied filters');
                const snapshot = await query.get();
                console.log(`Found ${snapshot.docs.length} score documents`);
                // If no results, return empty array
                if (snapshot.docs.length === 0) {
                    console.log('No score documents found, returning empty results');
                    const emptyResult = [];
                    setCache(cacheKey, emptyResult, 2 * 60 * 1000);
                    res.json(emptyResult);
                    return;
                }
                // Apply post-processing filters for competitor and style if needed
                let filteredDocs = snapshot.docs;
                if (competitorSearchTerm || styleSearchTerm) {
                    console.log('Applying post-processing filters...');
                    // Get all people and styles for filtering
                    const [peopleSnapshot, stylesSnapshot] = await Promise.all([
                        db.collection('people').get(),
                        db.collection('styles').get()
                    ]);
                    // Create lookup maps
                    const peopleMap = new Map();
                    const stylesMap = new Map();
                    peopleSnapshot.docs.forEach(doc => {
                        peopleMap.set(doc.id, doc.data().name);
                    });
                    stylesSnapshot.docs.forEach(doc => {
                        stylesMap.set(doc.id, doc.data().name);
                    });
                    // Filter scores based on search terms
                    filteredDocs = snapshot.docs.filter((doc) => {
                        const scoreData = doc.data();
                        let matches = true;
                        if (competitorSearchTerm) {
                            const personName = peopleMap.get(scoreData.people_id);
                            if (!personName || !personName.toLowerCase().includes(competitorSearchTerm)) {
                                matches = false;
                            }
                        }
                        if (styleSearchTerm && matches) {
                            const styleName = stylesMap.get(scoreData.style_id);
                            if (!styleName || !styleName.toLowerCase().includes(styleSearchTerm)) {
                                matches = false;
                            }
                        }
                        return matches;
                    });
                    console.log(`Post-processing: ${snapshot.docs.length} -> ${filteredDocs.length} documents`);
                }
                // Collect all unique IDs for batch fetching
                const personIds = new Set();
                const styleIds = new Set();
                const compIds = new Set();
                for (const doc of filteredDocs) {
                    const scoreData = doc.data();
                    personIds.add(scoreData.people_id);
                    styleIds.add(scoreData.style_id);
                    compIds.add(scoreData.comp_id);
                }
                // Only fetch the specific people, styles, and competitions we need
                // Split into chunks of 10 to avoid Firestore 'in' query limit
                const fetchInChunks = async (collection, ids) => {
                    if (ids.length === 0)
                        return { docs: [] };
                    try {
                        const chunks = [];
                        for (let i = 0; i < ids.length; i += 10) {
                            chunks.push(ids.slice(i, i + 10));
                        }
                        const results = await Promise.all(chunks.map(chunk => db.collection(collection).where(admin.firestore.FieldPath.documentId(), 'in', chunk).get()));
                        return { docs: results.flatMap(result => result.docs) };
                    }
                    catch (error) {
                        console.error(`Error fetching ${collection}:`, error);
                        return { docs: [] };
                    }
                };
                const [peopleSnapshot, stylesSnapshot, compsSnapshot] = await Promise.all([
                    fetchInChunks('people', Array.from(personIds)),
                    fetchInChunks('styles', Array.from(styleIds)),
                    fetchInChunks('competitions', Array.from(compIds))
                ]);
                // Create lookup maps
                const peopleMap = new Map();
                const stylesMap = new Map();
                const compsMap = new Map();
                peopleSnapshot.docs.forEach(doc => {
                    peopleMap.set(doc.id, doc.data().name);
                });
                stylesSnapshot.docs.forEach(doc => {
                    stylesMap.set(doc.id, doc.data().name);
                });
                compsSnapshot.docs.forEach(doc => {
                    compsMap.set(doc.id, doc.data().name);
                });
                // Group results by competitor/style/competition to avoid duplicates
                const groupedResults = new Map();
                for (const doc of filteredDocs) {
                    const scoreData = doc.data();
                    const personName = peopleMap.get(scoreData.people_id) || 'Unknown';
                    const styleName = stylesMap.get(scoreData.style_id) || 'Unknown';
                    const compName = compsMap.get(scoreData.comp_id) || 'Unknown';
                    // Create a unique key for this competitor/style/competition combination
                    const uniqueKey = `${personName}_${styleName}_${compName}`;
                    if (groupedResults.has(uniqueKey)) {
                        // Add judge score to existing entry
                        groupedResults.get(uniqueKey).judge_scores.push(scoreData.score);
                    }
                    else {
                        // Create new entry
                        groupedResults.set(uniqueKey, {
                            placement: scoreData.overall_score,
                            person_name: personName,
                            style_name: styleName,
                            comp_name: compName,
                            judge_scores: [scoreData.score]
                        });
                    }
                }
                // Convert grouped results to array format expected by frontend
                const results = Array.from(groupedResults.values()).map(result => ({
                    placement: result.placement,
                    person_name: result.person_name,
                    style_name: result.style_name,
                    comp_name: result.comp_name
                }));
                console.log(`Returning ${results.length} unique results (deduplicated from ${filteredDocs.length} score documents)`);
                console.log(`Search completed: Found ${results.length} results for query with competitor="${competitor}", style="${style}"`);
                return results;
            }, 2 * 60 * 1000); // 2 minutes TTL
            res.json(results);
        }
        catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    });
});
// Fetch judges
exports.fetchJudges = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const judge = req.query.judge;
            if (!judge) {
                res.json([]);
                return;
            }
            const db = admin.firestore();
            const judgesRef = db.collection('judges');
            // Try prefix search first
            let snapshot = await judgesRef
                .where('name', '>=', judge)
                .where('name', '<=', judge + '\uf8ff')
                .limit(20)
                .get();
            const searchTerm = judge.toLowerCase();
            let matchingJudges = snapshot.docs
                .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
            // If not enough results, try broader search
            if (matchingJudges.length < 5 && judge.length >= 2) {
                const broaderSnapshot = await judgesRef
                    .where('name', '>=', judge.charAt(0))
                    .where('name', '<=', judge.charAt(0) + '\uf8ff')
                    .limit(50)
                    .get();
                const broaderResults = broaderSnapshot.docs
                    .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
                // Combine and deduplicate
                const combined = [...matchingJudges, ...broaderResults];
                const unique = combined.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
                matchingJudges = unique;
            }
            const judges = matchingJudges.slice(0, 10).map(doc => doc.data().name);
            res.json(judges);
        }
        catch (error) {
            console.error('Error fetching judges:', error);
            res.status(500).json({ error: 'Failed to fetch judges' });
        }
    });
});
// Fetch styles
exports.fetchStyles = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const style = req.query.style;
            if (!style) {
                res.json([]);
                return;
            }
            const db = admin.firestore();
            const stylesRef = db.collection('styles');
            // Simplified approach: just get a broad range and filter
            const searchTerm = style.toLowerCase();
            console.log('Searching for style:', searchTerm);
            // Get a broad range of styles data
            const snapshot = await stylesRef
                .limit(200)
                .get();
            console.log('Total style docs fetched:', snapshot.docs.length);
            let matchingStyles = snapshot.docs
                .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
            console.log('Filtered styles:', matchingStyles.length);
            const styles = matchingStyles.slice(0, 10).map(doc => ({
                name: doc.data().name
            }));
            console.log('Found styles:', styles.length, 'for query:', style);
            console.log('Sample results:', styles.slice(0, 3).map(s => s.name));
            res.json(styles);
        }
        catch (error) {
            console.error('Error fetching styles:', error);
            res.status(500).json({ error: 'Failed to fetch styles' });
        }
    });
});
// Fetch total placements for leaderboard with pagination
exports.fetchTotalPlacements = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const placement = req.query.placement || '1';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const db = admin.firestore();
            const query = db.collection('scores')
                .where('overall_score', '==', parseInt(placement));
            const snapshot = await query.get();
            console.log(`Found ${snapshot.docs.length} score documents for placement ${placement}`);
            // Group results by competitor/style/competition to avoid duplicates
            const uniqueResults = new Map();
            for (const doc of snapshot.docs) {
                const scoreData = doc.data();
                // Create unique key for this competitor/style/competition combination
                const uniqueKey = `${scoreData.people_id}_${scoreData.style_id}_${scoreData.comp_id}`;
                if (!uniqueResults.has(uniqueKey)) {
                    uniqueResults.set(uniqueKey, {
                        person_name: scoreData.people_id,
                        style_id: scoreData.style_id,
                        comp_id: scoreData.comp_id
                    });
                }
            }
            console.log(`Deduplicated to ${uniqueResults.size} unique results`);
            // Batch fetch all people names
            const peopleSnapshot = await db.collection('people').get();
            const peopleMap = new Map();
            peopleSnapshot.docs.forEach(doc => {
                peopleMap.set(doc.id, doc.data().name);
            });
            // Count unique placements per competitor
            const competitorCounts = {};
            for (const result of uniqueResults.values()) {
                const personName = peopleMap.get(result.person_name) || 'Unknown';
                competitorCounts[personName] = (competitorCounts[personName] || 0) + 1;
            }
            const allResults = Object.entries(competitorCounts)
                .map(([competitor, place_count]) => ({ competitor, place_count }))
                .sort((a, b) => b.place_count - a.place_count);
            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = allResults.slice(startIndex, endIndex);
            const totalPages = Math.ceil(allResults.length / limit);
            const hasMore = page < totalPages;
            console.log(`Returning page ${page}/${totalPages} with ${paginatedResults.length} competitors`);
            res.json({
                data: paginatedResults,
                pagination: {
                    page,
                    limit,
                    total: allResults.length,
                    totalPages,
                    hasMore
                }
            });
        }
        catch (error) {
            console.error('Error fetching total placements:', error);
            res.status(500).json({ error: 'Failed to fetch total placements' });
        }
    });
});
// Fetch analytics for a competitor
exports.fetchAnalytics = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const competitor = req.query.competitor;
            if (!competitor) {
                res.json([]);
                return;
            }
            const cacheKey = `analytics_${competitor}`;
            const results = await executeWithDeduplication(cacheKey, async () => {
                const db = admin.firestore();
                // Try to get person ID from cache first
                const personCacheKey = `person_${competitor}`;
                let personIds = getFromCache(personCacheKey);
                if (!personIds) {
                    const peopleRef = db.collection('people');
                    // Try prefix match first with range query
                    let peopleSnapshot = await peopleRef
                        .where('name', '>=', competitor)
                        .where('name', '<=', competitor + '\uf8ff')
                        .limit(10)
                        .get();
                    const searchTerm = competitor.toLowerCase();
                    let matchingPeople = peopleSnapshot.docs
                        .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
                    // If no prefix match found, try broader search
                    if (matchingPeople.length === 0 && competitor.length >= 2) {
                        const broaderSnapshot = await peopleRef
                            .where('name', '>=', competitor.charAt(0))
                            .where('name', '<=', competitor.charAt(0) + '\uf8ff')
                            .limit(50)
                            .get();
                        matchingPeople = broaderSnapshot.docs
                            .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
                    }
                    if (matchingPeople.length === 0) {
                        res.status(404).json({
                            error: 'No matching competitors found. Please try a different search term.'
                        });
                        return;
                    }
                    personIds = matchingPeople.map(doc => doc.id);
                    // Cache person IDs for 10 minutes
                    setCache(personCacheKey, personIds, 10 * 60 * 1000);
                }
                const scoresQuery = db.collection('scores')
                    .where('people_id', 'in', personIds)
                    .limit(1000); // Limit to prevent excessive reads
                const scoresSnapshot = await scoresQuery.get();
                // Collect all unique IDs for batch fetching
                const judgeIds = new Set();
                const styleIds = new Set();
                const compIds = new Set();
                for (const doc of scoresSnapshot.docs) {
                    const scoreData = doc.data();
                    judgeIds.add(scoreData.judge_id);
                    styleIds.add(scoreData.style_id);
                    compIds.add(scoreData.comp_id);
                }
                // Try to get cached lookup maps
                const judgesMap = getFromCache('judges_map') || new Map();
                const stylesMap = getFromCache('styles_map') || new Map();
                const compsMap = getFromCache('comps_map') || new Map();
                // Only fetch missing data
                const missingJudgeIds = Array.from(judgeIds).filter(id => !judgesMap.has(id));
                const missingStyleIds = Array.from(styleIds).filter(id => !stylesMap.has(id));
                const missingCompIds = Array.from(compIds).filter(id => !compsMap.has(id));
                const fetchPromises = [];
                // Helper function to fetch in chunks to avoid Firestore 'in' query limit
                const fetchInChunks = async (collection, ids, map, cacheKey) => {
                    if (ids.length === 0)
                        return;
                    try {
                        const chunks = [];
                        for (let i = 0; i < ids.length; i += 10) {
                            chunks.push(ids.slice(i, i + 10));
                        }
                        const results = await Promise.all(chunks.map(chunk => db.collection(collection).where(admin.firestore.FieldPath.documentId(), 'in', chunk).get()));
                        results.forEach(snapshot => {
                            snapshot.docs.forEach(doc => {
                                map.set(doc.id, doc.data().name);
                            });
                        });
                        // Update cache
                        setCache(cacheKey, map, 30 * 60 * 1000);
                    }
                    catch (error) {
                        console.error(`Error fetching ${collection}:`, error);
                    }
                };
                if (missingJudgeIds.length > 0) {
                    fetchPromises.push(fetchInChunks('judges', missingJudgeIds, judgesMap, 'judges_map'));
                }
                if (missingStyleIds.length > 0) {
                    fetchPromises.push(fetchInChunks('styles', missingStyleIds, stylesMap, 'styles_map'));
                }
                if (missingCompIds.length > 0) {
                    fetchPromises.push(fetchInChunks('competitions', missingCompIds, compsMap, 'comps_map'));
                }
                await Promise.all(fetchPromises);
                // Group results by judge to calculate analytics
                const judgeAnalytics = new Map();
                console.log('Processing scores for analytics...');
                console.log('Number of score documents:', scoresSnapshot.docs.length);
                console.log('Judges map size:', judgesMap.size);
                console.log('Styles map size:', stylesMap.size);
                for (const doc of scoresSnapshot.docs) {
                    const scoreData = doc.data();
                    const judgeName = judgesMap.get(scoreData.judge_id) || 'Unknown Judge';
                    const styleName = stylesMap.get(scoreData.style_id) || 'Unknown Style';
                    console.log('Processing score:', {
                        judge_id: scoreData.judge_id,
                        judgeName: judgeName,
                        score: scoreData.score,
                        style_id: scoreData.style_id,
                        styleName: styleName
                    });
                    if (!judgeAnalytics.has(scoreData.judge_id)) {
                        judgeAnalytics.set(scoreData.judge_id, {
                            judgeName: judgeName,
                            totalScore: 0,
                            scoreCount: 0,
                            styles: new Set()
                        });
                    }
                    const judgeData = judgeAnalytics.get(scoreData.judge_id);
                    judgeData.totalScore += scoreData.score;
                    judgeData.scoreCount += 1;
                    judgeData.styles.add(styleName);
                }
                // Convert to array format expected by frontend
                const results = Array.from(judgeAnalytics.values()).map(judge => ({
                    judgeName: judge.judgeName,
                    averageScore: judge.totalScore / judge.scoreCount,
                    styleCount: judge.styles.size
                }));
                console.log('Judge analytics results:', results);
                console.log('Number of judges found:', results.length);
                return results;
            }, 5 * 60 * 1000); // 5 minutes TTL
            res.json(results);
        }
        catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    });
});
// Fetch average placements
exports.fetchAveragePlacements = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const competitor = req.query.competitor;
            if (!competitor) {
                res.json([]);
                return;
            }
            const db = admin.firestore();
            const peopleRef = db.collection('people');
            // Try prefix search first
            let peopleSnapshot = await peopleRef
                .where('name', '>=', competitor)
                .where('name', '<=', competitor + '\uf8ff')
                .limit(50)
                .get();
            const searchTerm = competitor.toLowerCase();
            let matchingPeople = peopleSnapshot.docs
                .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
            // If no results, try broader search
            if (matchingPeople.length === 0 && competitor.length >= 2) {
                const broaderSnapshot = await peopleRef
                    .where('name', '>=', competitor.charAt(0))
                    .where('name', '<=', competitor.charAt(0) + '\uf8ff')
                    .limit(100)
                    .get();
                matchingPeople = broaderSnapshot.docs
                    .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
            }
            if (matchingPeople.length === 0) {
                res.json([]);
                return;
            }
            const personIds = matchingPeople.map(doc => doc.id);
            const scoresQuery = db.collection('scores')
                .where('people_id', 'in', personIds);
            const scoresSnapshot = await scoresQuery.get();
            const styleStats = {};
            // Collect all unique style IDs for batch fetching
            const styleIds = new Set();
            for (const doc of scoresSnapshot.docs) {
                const scoreData = doc.data();
                styleIds.add(scoreData.style_id);
            }
            // Batch fetch all styles
            const stylesSnapshot = await db.collection('styles').get();
            const stylesMap = new Map();
            stylesSnapshot.docs.forEach(doc => {
                stylesMap.set(doc.id, doc.data().name);
            });
            // Group by style/competition to avoid counting multiple judge scores for same result
            const groupedResults = new Map();
            for (const doc of scoresSnapshot.docs) {
                const scoreData = doc.data();
                const styleName = stylesMap.get(scoreData.style_id) || 'Unknown';
                // Create unique key for style/competition combination
                const uniqueKey = `${styleName}_${scoreData.comp_id}`;
                // Only count each unique result once
                if (!groupedResults.has(uniqueKey)) {
                    groupedResults.set(uniqueKey, scoreData.overall_score);
                    if (!styleStats[styleName]) {
                        styleStats[styleName] = { total: 0, count: 0 };
                    }
                    styleStats[styleName].total += scoreData.overall_score;
                    styleStats[styleName].count += 1;
                }
            }
            const results = Object.entries(styleStats).map(([style_name, stats]) => ({
                style_name,
                average_placement: stats.total / stats.count,
                total_competitions: stats.count
            }));
            res.json(results);
        }
        catch (error) {
            console.error('Error fetching average placements:', error);
            res.status(500).json({ error: 'Failed to fetch average placements' });
        }
    });
});
// Fetch competition history for a competitor
exports.fetchCompetitionHistory = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const competitor = req.query.competitor;
            if (!competitor) {
                res.json([]);
                return;
            }
            // Check cache first
            const cacheKey = `competition_history_${competitor}`;
            const cachedResult = getFromCache(cacheKey);
            if (cachedResult) {
                console.log('Returning cached competition history for:', competitor);
                res.json(cachedResult);
                return;
            }
            const db = admin.firestore();
            const peopleRef = db.collection('people');
            // Try prefix search first
            let peopleSnapshot = await peopleRef
                .where('name', '>=', competitor)
                .where('name', '<=', competitor + '\uf8ff')
                .limit(50)
                .get();
            const searchTerm = competitor.toLowerCase();
            let matchingPeople = peopleSnapshot.docs
                .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
            // If no results, try broader search
            if (matchingPeople.length === 0 && competitor.length >= 2) {
                const broaderSnapshot = await peopleRef
                    .where('name', '>=', competitor.charAt(0))
                    .where('name', '<=', competitor.charAt(0) + '\uf8ff')
                    .limit(100)
                    .get();
                matchingPeople = broaderSnapshot.docs
                    .filter(doc => doc.data().name.toLowerCase().includes(searchTerm));
            }
            if (matchingPeople.length === 0) {
                res.json([]);
                return;
            }
            const personIds = matchingPeople.map(doc => doc.id);
            const scoresQuery = db.collection('scores')
                .where('people_id', 'in', personIds)
                .limit(1000);
            const scoresSnapshot = await scoresQuery.get();
            // Collect all unique competition IDs
            const compIds = new Set();
            for (const doc of scoresSnapshot.docs) {
                const scoreData = doc.data();
                compIds.add(scoreData.comp_id);
            }
            // Fetch competitions
            const compsSnapshot = compIds.size > 0
                ? await db.collection('competitions').where(admin.firestore.FieldPath.documentId(), 'in', Array.from(compIds)).get()
                : { docs: [] };
            // Create lookup map
            const compsMap = new Map();
            compsSnapshot.docs.forEach(doc => {
                compsMap.set(doc.id, doc.data().name);
            });
            // Group by competition and count placements
            // First, group by unique dance entries (people_id + style_id + comp_id)
            const uniqueEntries = new Map();
            for (const doc of scoresSnapshot.docs) {
                const scoreData = doc.data();
                const compName = compsMap.get(scoreData.comp_id) || 'Unknown Competition';
                const placement = scoreData.overall_score; // Use overall_score as placement
                // Create unique key for this dance entry
                const entryKey = `${scoreData.people_id}_${scoreData.style_id}_${scoreData.comp_id}`;
                // Only count each unique dance entry once
                if (!uniqueEntries.has(entryKey)) {
                    uniqueEntries.set(entryKey, { compName, placement });
                }
            }
            // Now group by competition and count unique placements
            const competitionGroups = new Map();
            for (const entry of uniqueEntries.values()) {
                if (!competitionGroups.has(entry.compName)) {
                    competitionGroups.set(entry.compName, new Map());
                }
                const placementCounts = competitionGroups.get(entry.compName);
                placementCounts.set(entry.placement, (placementCounts.get(entry.placement) || 0) + 1);
            }
            // Convert to array format
            const result = Array.from(competitionGroups.entries()).map(([competition_name, placementCounts]) => {
                const placements = Array.from(placementCounts.entries())
                    .sort(([a], [b]) => a - b) // Sort by placement number
                    .map(([placement, count]) => ({ placement, count }));
                return {
                    competition_name,
                    placements,
                    total_entries: Array.from(placementCounts.values()).reduce((sum, count) => sum + count, 0)
                };
            });
            // Sort competitions by year (most recent first) and alphabetically within each year
            result.sort((a, b) => {
                // Extract year from competition name (assuming format like "Competition Name 2024")
                const getYear = (name) => {
                    const yearMatch = name.match(/\b(19|20)\d{2}\b/);
                    return yearMatch ? parseInt(yearMatch[0]) : 0;
                };
                const yearA = getYear(a.competition_name);
                const yearB = getYear(b.competition_name);
                // If years are different, sort by year (descending - most recent first)
                if (yearA !== yearB) {
                    return yearB - yearA;
                }
                // If years are the same, sort alphabetically by name
                return a.competition_name.localeCompare(b.competition_name);
            });
            // Cache for 10 minutes
            setCache(cacheKey, result, 10 * 60 * 1000);
            res.json(result);
        }
        catch (error) {
            console.error('Error fetching competition history:', error);
            res.status(500).json({ error: 'Failed to fetch competition history' });
        }
    });
});
// Fetch competition history for a user profile (searches by name and aliases)
exports.fetchUserCompetitionHistory = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const firstName = req.query.firstName || '';
            const lastName = req.query.lastName || '';
            let aliases = [];
            // Safely parse aliases
            if (req.query.aliases) {
                try {
                    const aliasesStr = decodeURIComponent(req.query.aliases);
                    aliases = JSON.parse(aliasesStr);
                    if (!Array.isArray(aliases)) {
                        aliases = [];
                    }
                }
                catch (parseError) {
                    console.error('Error parsing aliases:', parseError);
                    aliases = [];
                }
            }
            if (!firstName && !lastName && aliases.length === 0) {
                res.json([]);
                return;
            }
            // Build cache key from all search terms
            const cacheKey = `user_competition_history_${firstName}_${lastName}_${JSON.stringify(aliases)}`;
            const cachedResult = getFromCache(cacheKey);
            if (cachedResult) {
                console.log('Returning cached user competition history');
                res.json(cachedResult);
                return;
            }
            const db = admin.firestore();
            const peopleRef = db.collection('people');
            // Build all possible search terms (only full name combinations, not individual names)
            const searchTerms = [];
            // Add name combinations (only full names, not individual first/last names)
            if (firstName && lastName) {
                searchTerms.push(`${firstName} & ${lastName}`);
                searchTerms.push(`${lastName} & ${firstName}`);
            }
            else if (firstName && !lastName) {
                // If only first name provided, don't search (too broad)
                // User should provide both first and last name or use aliases
            }
            else if (lastName && !firstName) {
                // If only last name provided, don't search (too broad)
                // User should provide both first and last name or use aliases
            }
            // Add all aliases (these should be full names like "Sam & Jane" or "John & Jane Doe")
            aliases.forEach((alias) => {
                if (alias && alias.trim()) {
                    searchTerms.push(alias.trim());
                }
            });
            if (searchTerms.length === 0) {
                res.json([]);
                return;
            }
            // Search for all matching people records
            const allPersonIds = new Set();
            // Since Firestore has limitations on 'in' queries (max 10 items) and we need to search broadly,
            // we'll fetch a larger set and filter in memory
            const allPeopleSnapshot = await peopleRef.limit(5000).get();
            const searchTermsLower = searchTerms.map(term => term.toLowerCase().trim());
            allPeopleSnapshot.docs.forEach(doc => {
                const personName = doc.data().name.toLowerCase();
                // Check if any search term matches this person's name
                for (const searchTerm of searchTermsLower) {
                    // Exact match
                    if (personName === searchTerm) {
                        allPersonIds.add(doc.id);
                        break;
                    }
                    // Check if search term is a couple name (contains " & ")
                    if (searchTerm.includes(' & ')) {
                        const [termFirst, termLast] = searchTerm.split(' & ').map((s) => s.trim());
                        // Check if personName contains this couple (could be "Sam Moran & Partner" or "Partner & Sam Moran")
                        if (personName.includes(' & ')) {
                            const [personFirst, personLast] = personName.split(' & ').map((s) => s.trim());
                            // Match if both names from search term appear in the person's name
                            // This handles cases like:
                            // - searchTerm: "Sam & Moran" matches "Sam Moran & Jane Doe" (both "Sam" and "Moran" appear in personFirst)
                            // - searchTerm: "Sam & Moran" matches "Jane Doe & Sam Moran" (both appear in personLast)
                            // - searchTerm: "Sam & Moran" matches "Sam & Moran" (exact)
                            if (personFirst && personLast && termFirst && termLast) {
                                // Check if both "Sam" and "Moran" appear together in one part of the couple
                                // e.g., "Sam Moran & Jane" - both names are in personFirst
                                const bothInFirst = personFirst.includes(termFirst) && personFirst.includes(termLast);
                                const bothInLast = personLast.includes(termFirst) && personLast.includes(termLast);
                                // Or check if it's stored as "Sam & Moran" (exact couple match)
                                const exactMatch = (personFirst === termFirst && personLast === termLast) ||
                                    (personFirst === termLast && personLast === termFirst);
                                if (bothInFirst || bothInLast || exactMatch) {
                                    allPersonIds.add(doc.id);
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        // For aliases without " & ", check if it's a full name that appears in a couple
                        // e.g., alias "Sam Moran" should match "Sam Moran & Jane" or "Jane & Sam Moran"
                        if (personName.includes(' & ')) {
                            const [personFirst, personLast] = personName.split(' & ').map((s) => s.trim());
                            // Check if the alias (which might be "Sam Moran" or "Sam & Moran") matches
                            if (searchTerm.includes(' ')) {
                                // Alias is like "Sam Moran" - check if both parts appear in the couple
                                const aliasParts = searchTerm.split(' ').filter(s => s.trim().length > 0);
                                if (aliasParts.length >= 2) {
                                    const aliasFirst = aliasParts[0];
                                    const aliasLast = aliasParts[aliasParts.length - 1];
                                    const hasAliasFirst = personFirst === aliasFirst || personLast === aliasFirst;
                                    const hasAliasLast = personFirst === aliasLast || personLast === aliasLast;
                                    if (hasAliasFirst && hasAliasLast) {
                                        allPersonIds.add(doc.id);
                                        break;
                                    }
                                }
                            }
                            else {
                                // Single word alias - exact match only
                                if (personName === searchTerm) {
                                    allPersonIds.add(doc.id);
                                    break;
                                }
                            }
                        }
                        else {
                            // Person name doesn't have " & ", do exact match
                            if (personName === searchTerm) {
                                allPersonIds.add(doc.id);
                                break;
                            }
                        }
                    }
                }
            });
            if (allPersonIds.size === 0) {
                res.json([]);
                return;
            }
            // Convert Set to Array and handle Firestore 'in' query limit (max 10 items per query)
            const personIdsArray = Array.from(allPersonIds);
            const allScores = [];
            // Process in batches of 10 (Firestore 'in' query limit)
            for (let i = 0; i < personIdsArray.length; i += 10) {
                const batch = personIdsArray.slice(i, i + 10);
                const scoresSnapshot = await db.collection('scores')
                    .where('people_id', 'in', batch)
                    .get();
                allScores.push(...scoresSnapshot.docs);
            }
            if (allScores.length === 0) {
                res.json([]);
                return;
            }
            // Collect all unique competition IDs
            const compIds = new Set();
            for (const doc of allScores) {
                const scoreData = doc.data();
                compIds.add(scoreData.comp_id);
            }
            // Fetch competitions
            const compIdsArray = Array.from(compIds);
            const compsMap = new Map();
            // Process competitions in batches of 10
            for (let i = 0; i < compIdsArray.length; i += 10) {
                const batch = compIdsArray.slice(i, i + 10);
                const compsSnapshot = await db.collection('competitions')
                    .where(admin.firestore.FieldPath.documentId(), 'in', batch)
                    .get();
                compsSnapshot.docs.forEach(doc => {
                    compsMap.set(doc.id, doc.data().name);
                });
            }
            // Group by competition and count placements
            const uniqueEntries = new Map();
            for (const doc of allScores) {
                const scoreData = doc.data();
                const compName = compsMap.get(scoreData.comp_id) || 'Unknown Competition';
                const placement = scoreData.overall_score;
                // Create unique key for this dance entry
                const entryKey = `${scoreData.people_id}_${scoreData.style_id}_${scoreData.comp_id}`;
                // Only count each unique dance entry once
                if (!uniqueEntries.has(entryKey)) {
                    uniqueEntries.set(entryKey, { compName, placement });
                }
            }
            // Now group by competition and count unique placements
            const competitionGroups = new Map();
            for (const entry of uniqueEntries.values()) {
                if (!competitionGroups.has(entry.compName)) {
                    competitionGroups.set(entry.compName, new Map());
                }
                const placementCounts = competitionGroups.get(entry.compName);
                placementCounts.set(entry.placement, (placementCounts.get(entry.placement) || 0) + 1);
            }
            // Convert to array format
            const result = Array.from(competitionGroups.entries()).map(([competition_name, placementCounts]) => {
                const placements = Array.from(placementCounts.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([placement, count]) => ({ placement, count }));
                return {
                    competition_name,
                    placements,
                    total_entries: Array.from(placementCounts.values()).reduce((sum, count) => sum + count, 0)
                };
            });
            // Sort competitions by year (most recent first) and alphabetically within each year
            result.sort((a, b) => {
                // Extract year from competition name (assuming format like "Competition Name 2024")
                const getYear = (name) => {
                    const yearMatch = name.match(/\b(19|20)\d{2}\b/);
                    return yearMatch ? parseInt(yearMatch[0]) : 0;
                };
                const yearA = getYear(a.competition_name);
                const yearB = getYear(b.competition_name);
                // If years are different, sort by year (descending - most recent first)
                if (yearA !== yearB) {
                    return yearB - yearA;
                }
                // If years are the same, sort alphabetically by name
                return a.competition_name.localeCompare(b.competition_name);
            });
            // Cache for 10 minutes
            setCache(cacheKey, result, 10 * 60 * 1000);
            res.json(result);
        }
        catch (error) {
            console.error('Error fetching user competition history:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            res.status(500).json({
                error: 'Failed to fetch user competition history',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
});
// Fetch scores for a user profile filtered by competition
exports.fetchUserScores = functions.https.onRequest((req, res) => {
    handleCors(req, res, async () => {
        try {
            const firstName = req.query.firstName;
            const lastName = req.query.lastName;
            const aliases = req.query.aliases ? JSON.parse(req.query.aliases) : [];
            const competition = req.query.competition;
            if (!competition) {
                res.status(400).json({ error: 'Competition parameter is required' });
                return;
            }
            if (!firstName && !lastName && aliases.length === 0) {
                res.json([]);
                return;
            }
            // Build cache key
            const cacheKey = `user_scores_${firstName}_${lastName}_${JSON.stringify(aliases)}_${competition}`;
            const cachedResult = getFromCache(cacheKey);
            if (cachedResult) {
                res.json(cachedResult);
                return;
            }
            const db = admin.firestore();
            // Get competition ID
            const competitionsRef = db.collection('competitions');
            const competitionsSnapshot = await competitionsRef
                .where('name', '==', competition)
                .limit(1)
                .get();
            if (competitionsSnapshot.empty) {
                res.json([]);
                return;
            }
            const compId = competitionsSnapshot.docs[0].id;
            // Build search terms (only full name combinations, not individual names)
            const searchTerms = [];
            if (firstName && lastName) {
                searchTerms.push(`${firstName} & ${lastName}`);
                searchTerms.push(`${lastName} & ${firstName}`);
            }
            aliases.forEach((alias) => {
                if (alias && alias.trim()) {
                    searchTerms.push(alias.trim());
                }
            });
            if (searchTerms.length === 0) {
                res.json([]);
                return;
            }
            // Find matching people
            const peopleRef = db.collection('people');
            const allPeopleSnapshot = await peopleRef.limit(5000).get();
            const searchTermsLower = searchTerms.map(term => term.toLowerCase().trim());
            const allPersonIds = new Set();
            allPeopleSnapshot.docs.forEach(doc => {
                const personName = doc.data().name.toLowerCase();
                // Check if any search term matches this person's name
                for (const searchTerm of searchTermsLower) {
                    // Exact match
                    if (personName === searchTerm) {
                        allPersonIds.add(doc.id);
                        break;
                    }
                    // Check if search term is a couple name (contains " & ")
                    if (searchTerm.includes(' & ')) {
                        const [termFirst, termLast] = searchTerm.split(' & ').map((s) => s.trim());
                        // Check if personName contains this couple (could be "Sam Moran & Partner" or "Partner & Sam Moran")
                        if (personName.includes(' & ')) {
                            const [personFirst, personLast] = personName.split(' & ').map((s) => s.trim());
                            // Match if both names from search term appear in the person's name
                            // This handles cases like:
                            // - searchTerm: "Sam & Moran" matches "Sam Moran & Jane Doe" (both "Sam" and "Moran" appear in personFirst)
                            // - searchTerm: "Sam & Moran" matches "Jane Doe & Sam Moran" (both appear in personLast)
                            // - searchTerm: "Sam & Moran" matches "Sam & Moran" (exact)
                            if (personFirst && personLast && termFirst && termLast) {
                                // Check if both "Sam" and "Moran" appear together in one part of the couple
                                // e.g., "Sam Moran & Jane" - both names are in personFirst
                                const bothInFirst = personFirst.includes(termFirst) && personFirst.includes(termLast);
                                const bothInLast = personLast.includes(termFirst) && personLast.includes(termLast);
                                // Or check if it's stored as "Sam & Moran" (exact couple match)
                                const exactMatch = (personFirst === termFirst && personLast === termLast) ||
                                    (personFirst === termLast && personLast === termFirst);
                                if (bothInFirst || bothInLast || exactMatch) {
                                    allPersonIds.add(doc.id);
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        // For aliases without " & ", check if it's a full name that appears in a couple
                        // e.g., alias "Sam Moran" should match "Sam Moran & Jane" or "Jane & Sam Moran"
                        if (personName.includes(' & ')) {
                            const [personFirst, personLast] = personName.split(' & ').map((s) => s.trim());
                            // Check if the alias (which might be "Sam Moran" or "Sam & Moran") matches
                            if (searchTerm.includes(' ')) {
                                // Alias is like "Sam Moran" - check if both parts appear in the couple
                                const aliasParts = searchTerm.split(' ').filter(s => s.trim().length > 0);
                                if (aliasParts.length >= 2) {
                                    const aliasFirst = aliasParts[0];
                                    const aliasLast = aliasParts[aliasParts.length - 1];
                                    const hasAliasFirst = personFirst === aliasFirst || personLast === aliasFirst;
                                    const hasAliasLast = personFirst === aliasLast || personLast === aliasLast;
                                    if (hasAliasFirst && hasAliasLast) {
                                        allPersonIds.add(doc.id);
                                        break;
                                    }
                                }
                            }
                            else {
                                // Single word alias - exact match only
                                if (personName === searchTerm) {
                                    allPersonIds.add(doc.id);
                                    break;
                                }
                            }
                        }
                        else {
                            // Person name doesn't have " & ", do exact match
                            if (personName === searchTerm) {
                                allPersonIds.add(doc.id);
                                break;
                            }
                        }
                    }
                }
            });
            if (allPersonIds.size === 0) {
                res.json([]);
                return;
            }
            // Fetch scores for this competition and matching people
            const personIdsArray = Array.from(allPersonIds);
            const allScores = [];
            // Process in batches of 10
            for (let i = 0; i < personIdsArray.length; i += 10) {
                const batch = personIdsArray.slice(i, i + 10);
                const scoresSnapshot = await db.collection('scores')
                    .where('people_id', 'in', batch)
                    .where('comp_id', '==', compId)
                    .get();
                allScores.push(...scoresSnapshot.docs);
            }
            if (allScores.length === 0) {
                res.json([]);
                return;
            }
            // Get people, styles, and judges data
            const peopleIds = new Set();
            const styleIds = new Set();
            const judgeIds = new Set();
            allScores.forEach(doc => {
                const data = doc.data();
                peopleIds.add(data.people_id);
                styleIds.add(data.style_id);
                judgeIds.add(data.judge_id);
            });
            // Fetch all related data
            const peopleMap = new Map();
            const stylesMap = new Map();
            // Fetch people in batches
            const peopleIdsArray = Array.from(peopleIds);
            for (let i = 0; i < peopleIdsArray.length; i += 10) {
                const batch = peopleIdsArray.slice(i, i + 10);
                const peopleSnapshot = await db.collection('people')
                    .where(admin.firestore.FieldPath.documentId(), 'in', batch)
                    .get();
                peopleSnapshot.docs.forEach(doc => {
                    peopleMap.set(doc.id, doc.data().name);
                });
            }
            // Fetch styles in batches
            const styleIdsArray = Array.from(styleIds);
            for (let i = 0; i < styleIdsArray.length; i += 10) {
                const batch = styleIdsArray.slice(i, i + 10);
                const stylesSnapshot = await db.collection('styles')
                    .where(admin.firestore.FieldPath.documentId(), 'in', batch)
                    .get();
                stylesSnapshot.docs.forEach(doc => {
                    stylesMap.set(doc.id, doc.data().name);
                });
            }
            // Group results by competitor/style/competition (same logic as fetchData)
            const groupedResults = new Map();
            for (const doc of allScores) {
                const scoreData = doc.data();
                const personName = peopleMap.get(scoreData.people_id) || 'Unknown';
                const styleName = stylesMap.get(scoreData.style_id) || 'Unknown';
                const compName = competition;
                // Create a unique key for this competitor/style/competition combination
                const uniqueKey = `${personName}_${styleName}_${compName}`;
                if (!groupedResults.has(uniqueKey)) {
                    groupedResults.set(uniqueKey, {
                        placement: scoreData.overall_score,
                        person_name: personName,
                        style_name: styleName,
                        comp_name: compName
                    });
                }
            }
            // Convert to array format
            const results = Array.from(groupedResults.values());
            // Cache for 10 minutes
            setCache(cacheKey, results, 10 * 60 * 1000);
            res.json(results);
        }
        catch (error) {
            console.error('Error fetching user scores:', error);
            res.status(500).json({ error: 'Failed to fetch user scores' });
        }
    });
});
//# sourceMappingURL=index.js.map
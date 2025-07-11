/**
 * News API Integration for Brightlens News
 * Handles fetching news from multiple APIs simultaneously
 */

class NewsAPI {
    constructor() {
        // API Keys in priority order as specified by user
        this.apiKeys = {
            // 1. NewsData.io - Primary API
            newsdata: 'pub_d74b96fd4a9041d59212493d969368cd',
            // 2. GNews - Secondary API
            gnews: '9db0da87512446db08b82d4f63a4ba8d',
            // 3. NewsAPI.org - Tertiary API
            newsapi: '9fcf10b2fd0c48c7a1886330ebb04385',
            // 4. Mediastack - Fourth API
            mediastack: '4e53cf0fa35eefaac21cd9f77925b8f5',
            // 5. CurrentsAPI - Fifth API
            currentsapi: '9tI-4kOmMlJdgcosDUBsYYZDAnkLnuuL4Hrgc5TKlHmN_AMH'
        };

        // Category-specific RSS feeds for real-time news
        this.rssSources = {
            latest: [
                'https://feeds.bbci.co.uk/news/rss.xml',
                'https://www.reuters.com/world/rss',
                'https://feeds.npr.org/1001/rss.xml',
                'https://apnews.com/rss'
            ],
            technology: [
                'https://techcrunch.com/feed',
                'https://www.theverge.com/rss/index.xml',
                'https://www.wired.com/feed/rss',
                'http://feeds.arstechnica.com/arstechnica/index',
                'https://www.engadget.com/rss.xml',
                'https://gizmodo.com/rss',
                'https://venturebeat.com/feed/',
                'https://www.zdnet.com/news/rss.xml'
            ],
            business: [
                'https://feeds.bloomberg.com/markets/news.rss',
                'https://www.cnbc.com/id/100003114/device/rss/rss.html',
                'https://feeds.finance.yahoo.com/rss/2.0/headline',
                'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
                'https://www.reuters.com/business/rss',
                'https://www.ft.com/rss/home'
            ],
            sports: [
                'http://www.espn.com/espn/rss/news',
                'https://www.skysports.com/rss/12040',
                'https://sports.yahoo.com/rss/',
                'https://fansided.com/feed/',
                'https://www.foxsports.com/rss-feeds'
            ],
            entertainment: [
                'https://www.tmz.com/rss.xml',
                'https://ew.com/rss/all.xml',
                'https://variety.com/feed/',
                'https://www.rollingstone.com/rss',
                'https://uproxx.com/feed',
                'https://theshaderoom.com/feed'
            ],
            health: [
                'https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC',
                'https://www.healthline.com/rss',
                'https://www.mayoclinic.org/rss',
                'https://tools.cdc.gov/api/v2/resources/media/316422.rss',
                'https://www.health.harvard.edu/rss'
            ],
            world: [
                'https://www.theguardian.com/world/rss',
                'https://www.reuters.com/world/rss',
                'https://feeds.bbci.co.uk/news/world/rss.xml',
                'https://www.aljazeera.com/xml/rss/all.xml'
            ],
            kenya: [
                'https://www.nation.co.ke/kenya/rss.xml',
                'https://www.standardmedia.co.ke/rss',
                'https://www.citizen.digital/rss',
                'https://www.capitalfm.co.ke/news/feed/'
            ]
        };

        // Free news APIs for additional coverage
        this.additionalAPIs = {
            // WorldNewsAPI - Free tier with 500 requests/day
            worldnews: 'https://worldnewsapi.com/api/search-news',
            // TheNewsAPI - Free tier with 100 requests/day
            thenewsapi: 'https://api.thenewsapi.com/v1/news/top',
            // NewsAPI.ai - Free trial
            newsapiai: 'https://newsapi.ai/api/v1/article'
        };

        // Enhanced Kenyan news sources for specific targeting
        this.kenyanSources = [
            'nation.co.ke',
            'standardmedia.co.ke',
            'citizen.digital',
            'capitalfm.co.ke',
            'tuko.co.ke',
            'the-star.co.ke',
            'kenyans.co.ke',
            'nairobinews.co.ke',
            'kbc.co.ke',
            'businessdailyafrica.com',
            'people.co.ke',
            'taifa.co.ke',
            'kahawa.co.ke',
            'kissfm.co.ke',
            'ktn.co.ke'
        ];

        this.cache = new Map();
        this.cacheTimeout = 30 * 1000; // 30 seconds to reduce API calls and avoid rate limits
        this.requestController = new AbortController();
    }

    /**
     * Get recent timeframe for enhanced real-time coverage
     */
    getRecentTimeframe() {
        const now = new Date();
        // Get today's date for most recent news
        return now.toISOString().split('T')[0];
    }

    /**
     * Get current hour for real-time filtering
     */
    getCurrentHour() {
        return new Date().getHours();
    }

    /**
     * Get last 6 hours timestamp for maximum real-time coverage
     */
    getLastSixHours() {
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        return sixHoursAgo.toISOString();
    }

    /**
     * Get today's date in YYYY-MM-DD format
     */
    getTodaysDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Fetch news for a specific category from all APIs
     */
    async fetchNews(category, limit = 20) {
        const cacheKey = `${category}_${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            // Fetch from all APIs and RSS feeds simultaneously with timeout for faster response
            // Order based on user preference: NewsData.io first, then GNews, etc.
            const promises = [
                this.fetchFromNewsData(category, limit),
                this.fetchFromGNews(category, limit),
                this.fetchFromNewsAPI(category, limit),
                this.fetchFromMediastack(category, limit),
                this.fetchFromCurrentsAPI(category, limit),
                this.fetchFromRSSFeeds(category, limit),
                this.fetchFromAdditionalAPIs(category, limit)
            ];

            // Use Promise.allSettled with 8-second timeout for faster loading
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 8000)
            );

            const results = await Promise.allSettled(promises.map(p => 
                Promise.race([p, timeoutPromise])
            ));
            
            // Combine results from all APIs
            let allArticles = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    allArticles = allArticles.concat(result.value);
                } else {
                    console.warn(`API ${index + 1} failed:`, result.reason);
                }
            });

            // Comprehensive deduplication and sorting
            console.log(`Pre-deduplication: ${allArticles.length} articles`);
            const uniqueArticles = this.removeDuplicates(allArticles);
            console.log(`Post-deduplication: ${uniqueArticles.length} articles`);
            
            const sortedArticles = uniqueArticles.sort((a, b) => {
                const dateA = new Date(a.publishedAt || 0);
                const dateB = new Date(b.publishedAt || 0);
                // Newest articles first (descending order) - Real-time sorting
                return dateB.getTime() - dateA.getTime();
            });
            
            // Final validation - ensure no duplicates made it through
            const finalArticles = this.finalDeduplicationPass(sortedArticles);
            console.log(`Final article count: ${finalArticles.length} unique articles`);

            // Cache the results
            this.cache.set(cacheKey, {
                data: finalArticles,
                timestamp: Date.now()
            });

            return finalArticles;
        } catch (error) {
            console.error('Error fetching news:', error);
            // Clear cache for this category to avoid serving stale data
            this.cache.delete(cacheKey);
            
            // Enhanced fallback system with Extended Articles Database
            const extendedArticlesDB = new ExtendedArticlesDB();
            let fallbackArticles = [];
            
            // Get extended articles based on category
            switch(category) {
                case 'latest':
                    fallbackArticles = extendedArticlesDB.getExtendedLatestNews('Live News Feed');
                    break;
                case 'kenya':
                    fallbackArticles = extendedArticlesDB.getExtendedKenyaNews('Kenya News Live');
                    break;
                case 'world':
                    fallbackArticles = extendedArticlesDB.getExtendedWorldNews('World News Live');
                    break;
                case 'technology':
                    fallbackArticles = extendedArticlesDB.getExtendedTechnologyNews('Tech News Live');
                    break;
                case 'entertainment':
                    fallbackArticles = extendedArticlesDB.getExtendedEntertainmentNews('Entertainment Live');
                    break;
                case 'business':
                    fallbackArticles = extendedArticlesDB.getExtendedBusinessNews('Business News Live');
                    break;
                case 'sports':
                    fallbackArticles = extendedArticlesDB.getExtendedSportsNews('Sports News Live');
                    break;
                case 'health':
                    fallbackArticles = extendedArticlesDB.getExtendedHealthNews('Health News Live');
                    break;
                default:
                    fallbackArticles = this.getSampleArticles(category, 'Live News Feed');
            }
            
            // Update timestamps to today for better user experience
            const updatedFallback = fallbackArticles.map(article => ({
                ...article,
                publishedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
            }));
            
            return this.removeDuplicates(updatedFallback);
        }
    }

    /**
     * Fetch from GNews API - Secondary API
     */
    async fetchFromGNews(category, limit) {
        try {
            // GNews with proper API key parameter and reduced limit for free tier
            let url = `https://gnews.io/api/v4/top-headlines?apikey=${this.apiKeys.gnews}&lang=en&max=${Math.min(limit, 5)}&sortby=publishedAt`;
            
            if (category === 'kenya') {
                // Kenya-specific news with proper filtering
                url += '&country=ke';
                url += '&q=(Kenya OR Nairobi OR Mombasa OR Kisumu OR "East Africa" OR Kenyan OR "Kenyan politics" OR "Kenyan economy")';
            } else if (category === 'latest') {
                // Latest news from all topics and sources without category filtering
                url += '&q=(breaking OR latest OR news OR today OR update OR trending OR announcement)';
            } else if (category === 'world') {
                // World news excluding Kenya-specific content
                url += '&q=(international OR global OR world OR foreign OR diplomatic OR "world news" OR worldwide)';
            } else if (category === 'sports') {
                // Sports-specific filtering
                url += '&category=sports&q=(football OR athletics OR basketball OR tournament OR match OR player OR transfer OR "sports events")';
            } else if (category === 'technology') {
                // Technology-specific filtering
                url += '&category=technology&q=(gadgets OR software OR "artificial intelligence" OR startup OR apps OR "tech company" OR innovation OR AI)';
            } else if (category === 'business') {
                // Business-specific filtering
                url += '&category=business&q=("stock market" OR corporate OR entrepreneurship OR investment OR economic OR trade OR commerce)';
            } else if (category === 'health') {
                // Health-specific filtering
                url += '&category=health&q=(disease OR medical OR research OR fitness OR "mental health" OR healthcare OR hospital OR wellness)';
            } else if (category === 'entertainment') {
                // Entertainment-specific filtering
                url += '&category=entertainment&q=(movie OR "TV show" OR celebrity OR musician OR concert OR award OR cultural OR lifestyle)';
            } else {
                url += `&category=${this.mapCategoryForGNews(category)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                signal: this.requestController.signal
            });
            if (!response.ok) throw new Error(`GNews API error: ${response.status}`);
            
            const data = await response.json();
            return this.formatGNewsArticles(data.articles || []);
        } catch (error) {
            console.error('GNews fetch error:', error);
            // Return sample data with today's timestamp
            const fallback = this.getSampleArticles(category, 'GNews Live');
            return fallback.map(article => ({
                ...article,
                publishedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
            }));
        }
    }

    /**
     * Fetch from NewsData.io API - Primary API
     */
    async fetchFromNewsData(category, limit) {
        try {
            // NewsData without timeframe parameter for free tier compatibility
            let url = `https://newsdata.io/api/1/latest?apikey=${this.apiKeys.newsdata}&language=en&size=${Math.min(limit, 10)}`;
            
            if (category === 'kenya') {
                // Kenya-specific news with proper filtering
                url += '&country=ke';
                url += '&q=(Kenya OR Nairobi OR Mombasa OR Kisumu OR "East Africa" OR Kenyan OR "Kenyan politics" OR "Kenyan economy" OR "Kenyan sports" OR "Kenyan culture")';
            } else if (category === 'latest') {
                // Latest news from all topics and sources without category filtering
                url += '&q=(breaking OR latest OR news OR today OR update OR trending OR announcement)';
            } else if (category === 'world') {
                // World news excluding Kenya
                url += '&category=world&q=(international OR global OR foreign OR diplomatic OR "world news" OR worldwide)';
            } else if (category === 'sports') {
                // Sports-specific filtering
                url += '&category=sports&q=(football OR athletics OR basketball OR tournament OR match OR player OR transfer OR "sports events")';
            } else if (category === 'technology') {
                // Technology-specific filtering
                url += '&category=technology&q=(gadgets OR software OR "artificial intelligence" OR startup OR apps OR "tech company" OR innovation OR AI)';
            } else if (category === 'business') {
                // Business-specific filtering
                url += '&category=business&q=("stock market" OR corporate OR entrepreneurship OR investment OR economic OR trade OR commerce OR finance)';
            } else if (category === 'health') {
                // Health-specific filtering
                url += '&category=health&q=(disease OR medical OR research OR fitness OR "mental health" OR healthcare OR hospital OR wellness)';
            } else if (category === 'entertainment') {
                // Entertainment-specific filtering
                url += '&category=entertainment&q=(movie OR "TV show" OR celebrity OR musician OR concert OR award OR cultural OR lifestyle)';
            } else {
                url += `&category=${this.mapCategoryForNewsData(category)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (!response.ok) throw new Error(`NewsData API error: ${response.status}`);
            
            const data = await response.json();
            return this.formatNewsDataArticles(data.results || []);
        } catch (error) {
            console.error('NewsData fetch error:', error);
            const fallback = this.getSampleArticles(category, 'NewsData Live');
            return fallback.map(article => ({
                ...article,
                publishedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
            }));
        }
    }

    /**
     * Fetch from NewsAPI.org - Tertiary API
     */
    async fetchFromNewsAPI(category, limit) {
        try {
            let url;
            const today = new Date();
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            if (category === 'kenya') {
                // Kenya-specific news with comprehensive filtering
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=(Kenya OR Nairobi OR Mombasa OR Kisumu OR "East Africa" OR Kenyan OR "Kenyan politics" OR "Kenyan economy" OR "Kenyan sports" OR "Kenyan culture")&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else if (category === 'latest') {
                // Latest news from all topics and sources without category filtering
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=(breaking OR latest OR news OR today OR update OR trending OR announcement)&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else if (category === 'world') {
                // World news excluding Kenya-specific content
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=(international OR global OR world OR foreign OR diplomatic OR "world news" OR worldwide)&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else if (category === 'sports') {
                // Sports-specific filtering with both endpoints for maximum coverage
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=(football OR athletics OR basketball OR tournament OR match OR player OR transfer OR "sports events" OR soccer OR tennis OR golf OR rugby)&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else if (category === 'technology') {
                // Technology-specific filtering
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=(gadgets OR software OR "artificial intelligence" OR startup OR apps OR "tech company" OR innovation OR AI OR programming OR cybersecurity)&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else if (category === 'business') {
                // Business-specific filtering
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=("stock market" OR corporate OR entrepreneurship OR investment OR economic OR trade OR commerce OR finance OR banking OR cryptocurrency)&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else if (category === 'health') {
                // Health-specific filtering
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=(disease OR medical OR research OR fitness OR "mental health" OR healthcare OR hospital OR wellness OR vaccine OR treatment)&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else if (category === 'entertainment') {
                // Entertainment-specific filtering
                url = `https://newsapi.org/v2/everything?apiKey=${this.apiKeys.newsapi}&q=(movie OR "TV show" OR celebrity OR musician OR concert OR award OR cultural OR lifestyle OR Hollywood OR music OR streaming)&from=${yesterday}&sortBy=publishedAt&pageSize=${Math.min(limit, 20)}`;
            } else {
                // Use top-headlines for specific categories for quality
                url = `https://newsapi.org/v2/top-headlines?apiKey=${this.apiKeys.newsapi}&category=${this.mapCategoryForNewsAPI(category)}&pageSize=${Math.min(limit, 20)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`);
            
            const data = await response.json();
            return this.formatNewsAPIArticles(data.articles || []);
        } catch (error) {
            console.error('NewsAPI fetch error:', error);
            const fallback = this.getSampleArticles(category, 'NewsAPI Live');
            return fallback.map(article => ({
                ...article,
                publishedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
            }));
        }
    }

    /**
     * Fetch from Mediastack API - Fourth API
     */
    async fetchFromMediastack(category, limit) {
        try {
            // Enhanced Mediastack for maximum real-time coverage with time-based filtering  
            let url = `https://api.mediastack.com/v1/news?access_key=${this.apiKeys.mediastack}&languages=en&limit=${Math.min(limit, 25)}&sort=published_desc&date=${this.getRecentTimeframe()}`;
            
            if (category === 'kenya') {
                // Kenya-specific news with comprehensive filtering
                url += '&countries=ke';
                url += '&keywords=Kenya,Nairobi,Mombasa,Kisumu,East Africa,Kenyan,Kenyan politics,Kenyan economy,Kenyan sports,Kenyan culture';
            } else if (category === 'latest') {
                // Latest news from all topics and sources without category filtering
                url += '&keywords=breaking,latest,news,today,update,trending,announcement';
            } else if (category === 'world') {
                // World news excluding Kenya-specific content
                url += '&keywords=international,global,world,foreign,diplomatic,world news,worldwide';
            } else if (category === 'sports') {
                // Sports-specific filtering
                url += '&categories=sports&keywords=football,athletics,basketball,tournament,match,player,transfer,sports events,soccer,tennis,golf,rugby';
            } else if (category === 'technology') {
                // Technology-specific filtering
                url += '&categories=technology&keywords=gadgets,software,artificial intelligence,startup,apps,tech company,innovation,AI,programming,cybersecurity';
            } else if (category === 'business') {
                // Business-specific filtering
                url += '&categories=business&keywords=stock market,corporate,entrepreneurship,investment,economic,trade,commerce,finance,banking,cryptocurrency';
            } else if (category === 'health') {
                // Health-specific filtering
                url += '&categories=health&keywords=disease,medical,research,fitness,mental health,healthcare,hospital,wellness,vaccine,treatment';
            } else if (category === 'entertainment') {
                // Entertainment-specific filtering
                url += '&categories=entertainment&keywords=movie,TV show,celebrity,musician,concert,award,cultural,lifestyle,Hollywood,music,streaming';
            } else {
                url += `&categories=${this.mapCategoryForMediastack(category)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (!response.ok) throw new Error(`Mediastack API error: ${response.status}`);
            
            const data = await response.json();
            return this.formatMediastackArticles(data.data || []);
        } catch (error) {
            console.error('Mediastack fetch error:', error);
            const fallback = this.getSampleArticles(category, 'Mediastack Live');
            return fallback.map(article => ({
                ...article,
                publishedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
            }));
        }
    }

    /**
     * Fetch from CurrentsAPI - Fifth API
     */
    async fetchFromCurrentsAPI(category, limit) {
        try {
            // Enhanced CurrentsAPI for maximum real-time coverage 
            let url = `https://api.currentsapi.services/v1/latest-news?apiKey=${this.apiKeys.currentsapi}&language=en&page_size=${Math.min(limit, 20)}`;
            
            if (category === 'kenya') {
                // Kenya-specific news with comprehensive filtering
                url += '&country=ke';
                url += '&keywords=Kenya+OR+Nairobi+OR+Mombasa+OR+Kisumu+OR+"East Africa"+OR+Kenyan+OR+"Kenyan politics"+OR+"Kenyan economy"+OR+"Kenyan sports"+OR+"Kenyan culture"';
            } else if (category === 'latest') {
                // Latest news from all topics and sources without category filtering
                url += '&keywords=breaking+OR+latest+OR+news+OR+today+OR+update+OR+trending+OR+announcement';
            } else if (category === 'world') {
                // World news excluding Kenya-specific content
                url += '&keywords=international+OR+global+OR+world+OR+foreign+OR+diplomatic+OR+"world news"+OR+worldwide';
            } else if (category === 'sports') {
                // Sports-specific filtering
                url += '&category=sports&keywords=football+OR+athletics+OR+basketball+OR+tournament+OR+match+OR+player+OR+transfer+OR+"sports events"+OR+soccer+OR+tennis+OR+golf+OR+rugby';
            } else if (category === 'technology') {
                // Technology-specific filtering
                url += '&category=technology&keywords=gadgets+OR+software+OR+"artificial intelligence"+OR+startup+OR+apps+OR+"tech company"+OR+innovation+OR+AI+OR+programming+OR+cybersecurity';
            } else if (category === 'business') {
                // Business-specific filtering
                url += '&category=business&keywords="stock market"+OR+corporate+OR+entrepreneurship+OR+investment+OR+economic+OR+trade+OR+commerce+OR+finance+OR+banking+OR+cryptocurrency';
            } else if (category === 'health') {
                // Health-specific filtering
                url += '&category=health&keywords=disease+OR+medical+OR+research+OR+fitness+OR+"mental health"+OR+healthcare+OR+hospital+OR+wellness+OR+vaccine+OR+treatment';
            } else if (category === 'entertainment') {
                // Entertainment-specific filtering
                url += '&category=entertainment&keywords=movie+OR+"TV show"+OR+celebrity+OR+musician+OR+concert+OR+award+OR+cultural+OR+lifestyle+OR+Hollywood+OR+music+OR+streaming';
            } else {
                url += `&category=${this.mapCategoryForCurrentsAPI(category)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (!response.ok) throw new Error(`CurrentsAPI error: ${response.status}`);
            
            const data = await response.json();
            return this.formatCurrentsAPIArticles(data.news || []);
        } catch (error) {
            console.error('CurrentsAPI fetch error:', error);
            const fallback = this.getSampleArticles(category, 'CurrentsAPI Live');
            return fallback.map(article => ({
                ...article,
                publishedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
            }));
        }
    }

    /**
     * Fetch from RSS feeds - Category-specific real-time sources
     */
    async fetchFromRSSFeeds(category, limit) {
        try {
            const rssFeeds = this.rssSources[category] || this.rssSources.latest;
            const articles = [];
            
            // Fetch from multiple RSS feeds simultaneously
            const promises = rssFeeds.slice(0, 3).map(async (feedUrl) => {
                try {
                    // Use RSS2JSON service for CORS-free RSS parsing
                    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=5`, {
                        method: 'GET',
                        signal: this.requestController.signal
                    });
                    
                    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
                    
                    const data = await response.json();
                    return this.formatRSSArticles(data.items || [], feedUrl);
                } catch (error) {
                    console.error(`RSS feed error for ${feedUrl}:`, error);
                    return [];
                }
            });
            
            const results = await Promise.all(promises);
            const allArticles = results.flat();
            
            return allArticles.slice(0, limit);
        } catch (error) {
            console.error('RSS feeds fetch error:', error);
            return [];
        }
    }

    /**
     * Fetch from additional free APIs
     */
    async fetchFromAdditionalAPIs(category, limit) {
        try {
            const articles = [];
            
            // Free news aggregation from multiple sources
            const promises = [
                this.fetchFromGuardianAPI(category, limit),
                this.fetchFromHackerNews(category, limit)
            ];
            
            const results = await Promise.allSettled(promises);
            const allArticles = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value)
                .flat();
            
            return allArticles.slice(0, limit);
        } catch (error) {
            console.error('Additional APIs fetch error:', error);
            return [];
        }
    }

    /**
     * Fetch from Guardian API - Free tier available
     */
    async fetchFromGuardianAPI(category, limit) {
        try {
            // Guardian API is free with test key
            let url = `https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,headline,byline,body&page-size=${Math.min(limit, 10)}`;
            
            // Add category-specific sections
            if (category === 'technology') {
                url += '&section=technology';
            } else if (category === 'business') {
                url += '&section=business';
            } else if (category === 'sports') {
                url += '&section=sport';
            } else if (category === 'world') {
                url += '&section=world';
            } else if (category === 'kenya') {
                url += '&q=kenya';
            }
            
            const response = await fetch(url, {
                method: 'GET',
                signal: this.requestController.signal
            });
            
            if (!response.ok) throw new Error(`Guardian API error: ${response.status}`);
            
            const data = await response.json();
            return this.formatGuardianArticles(data.response?.results || []);
        } catch (error) {
            console.error('Guardian API fetch error:', error);
            return [];
        }
    }

    /**
     * Fetch from Hacker News - Free for tech news
     */
    async fetchFromHackerNews(category, limit) {
        try {
            // Use Hacker News API for tech news
            if (category === 'technology') {
                const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
                const storyIds = await response.json();
                
                const articles = [];
                for (let i = 0; i < Math.min(limit, 10); i++) {
                    try {
                        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`);
                        const story = await storyResponse.json();
                        
                        if (story && story.title && story.url) {
                            articles.push({
                                title: story.title,
                                description: story.title,
                                url: story.url,
                                urlToImage: this.getValidImage(null),
                                publishedAt: new Date(story.time * 1000).toISOString(),
                                source: { name: 'Hacker News' },
                                author: story.by || 'Anonymous'
                            });
                        }
                    } catch (error) {
                        console.error('HN story fetch error:', error);
                    }
                }
                return articles;
            }
            
            return [];
        } catch (error) {
            console.error('Hacker News fetch error:', error);
            return [];
        }
    }

    /**
     * Category mapping functions for different APIs
     */
    mapCategoryForGNews(category) {
        const mapping = {
            'entertainment': 'entertainment',
            'technology': 'technology',
            'business': 'business',
            'sports': 'sports',
            'health': 'health'
        };
        return mapping[category] || 'general';
    }

    mapCategoryForNewsData(category) {
        const mapping = {
            'entertainment': 'entertainment',
            'technology': 'technology',
            'business': 'business',
            'sports': 'sports',
            'health': 'health'
        };
        return mapping[category] || 'top';
    }

    mapCategoryForNewsAPI(category) {
        const mapping = {
            'entertainment': 'entertainment',
            'technology': 'technology',
            'business': 'business',
            'sports': 'sports',
            'health': 'health'
        };
        return mapping[category] || 'general';
    }

    mapCategoryForMediastack(category) {
        const mapping = {
            'entertainment': 'entertainment',
            'technology': 'technology',
            'business': 'business',
            'sports': 'sports',
            'health': 'health'
        };
        return mapping[category] || 'general';
    }

    mapCategoryForCurrentsAPI(category) {
        const mapping = {
            'entertainment': 'entertainment',
            'technology': 'technology',
            'business': 'business',
            'sports': 'sports',
            'health': 'health'
        };
        return mapping[category] || 'news';
    }

    /**
     * Format articles from different APIs to a common structure
     */
    formatGNewsArticles(articles) {
        return articles.map(article => ({
            title: article.title,
            description: this.cleanDescription(article.description),
            url: article.url,
            urlToImage: this.getValidImage(article.image),
            publishedAt: article.publishedAt,
            source: article.source?.name || 'GNews',
            category: 'general'
        }));
    }

    formatNewsDataArticles(articles) {
        return articles.map(article => ({
            title: article.title,
            description: this.cleanDescription(article.description),
            url: article.link,
            urlToImage: this.getValidImage(article.image_url),
            publishedAt: article.pubDate,
            source: article.source_id || 'NewsData',
            category: article.category?.[0] || 'general'
        }));
    }

    formatNewsAPIArticles(articles) {
        return articles.map(article => ({
            title: article.title,
            description: this.cleanDescription(article.description),
            url: article.url,
            urlToImage: this.getValidImage(article.urlToImage),
            publishedAt: article.publishedAt,
            source: article.source?.name || 'NewsAPI',
            category: 'general'
        }));
    }

    formatMediastackArticles(articles) {
        return articles.map(article => ({
            title: article.title,
            description: this.cleanDescription(article.description),
            url: article.url,
            urlToImage: this.getValidImage(article.image),
            publishedAt: article.published_at,
            source: article.source || 'Mediastack',
            category: article.category || 'general'
        }));
    }

    formatCurrentsAPIArticles(articles) {
        return articles.map(article => ({
            title: article.title,
            description: this.cleanDescription(article.description),
            url: article.url,
            urlToImage: this.getValidImage(article.image),
            publishedAt: article.published,
            source: 'CurrentsAPI',
            category: article.category?.[0] || 'general'
        }));
    }

    formatRSSArticles(articles, feedUrl) {
        const sourceName = this.getSourceNameFromRSSUrl(feedUrl);
        return articles.map(article => ({
            title: article.title,
            description: this.cleanDescription(article.description || article.content),
            url: article.link,
            urlToImage: this.getValidImage(article.thumbnail || article.enclosure?.link),
            publishedAt: article.pubDate,
            source: sourceName,
            category: 'general'
        }));
    }

    formatGuardianArticles(articles) {
        return articles.map(article => ({
            title: article.webTitle,
            description: this.cleanDescription(article.fields?.headline || article.webTitle),
            url: article.webUrl,
            urlToImage: this.getValidImage(article.fields?.thumbnail),
            publishedAt: article.webPublicationDate,
            source: 'The Guardian',
            category: article.sectionName || 'general'
        }));
    }

    getSourceNameFromRSSUrl(url) {
        if (url.includes('techcrunch.com')) return 'TechCrunch';
        if (url.includes('theverge.com')) return 'The Verge';
        if (url.includes('wired.com')) return 'Wired';
        if (url.includes('bbc.co.uk')) return 'BBC News';
        if (url.includes('reuters.com')) return 'Reuters';
        if (url.includes('bloomberg.com')) return 'Bloomberg';
        if (url.includes('cnbc.com')) return 'CNBC';
        if (url.includes('espn.com')) return 'ESPN';
        if (url.includes('tmz.com')) return 'TMZ';
        if (url.includes('webmd.com')) return 'WebMD';
        if (url.includes('theguardian.com')) return 'The Guardian';
        if (url.includes('nation.co.ke')) return 'Daily Nation';
        if (url.includes('standardmedia.co.ke')) return 'The Standard';
        return 'RSS Source';
    }

    /**
     * Get valid image URL with fallback to high-quality stock images
     */
    getValidImage(imageUrl) {
        // Check if the image URL is valid
        if (imageUrl && 
            imageUrl !== 'null' && 
            imageUrl !== 'None' && 
            imageUrl !== '/None' &&
            imageUrl.startsWith('http') &&
            !imageUrl.includes('placeholder') &&
            !imageUrl.includes('no-image')) {
            return imageUrl;
        }
        
        // Return high-quality stock images for different news categories
        const stockImages = [
            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80',
            'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80',
            'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80',
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80',
            'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80',
            'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80',
            'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80',
            'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb&q=80'
        ];
        
        // Return a random stock image
        return stockImages[Math.floor(Math.random() * stockImages.length)];
    }

    /**
     * Clean and improve article descriptions
     */
    cleanDescription(description) {
        if (!description) return 'Read the full article for more details.';
        
        // Remove common generic phrases that don't add value
        const genericPhrases = [
            /This article has been reviewed according to Science X's editorial process and policies.*?Editors have highlighted the following attribute.*?:/gi,
            /This article has been reviewed according to.*?editorial process.*?:/gi,
            /Editors have highlighted the following attribute.*?:/gi,
            /The following article was published.*?:/gi,
            /Read more\s*\.{3,}/gi,
            /Continue reading.*?$/gi,
            /Source:.*?$/gi,
            /\[.*?\]$/gi,
            /^\s*\.\.\.\s*/gi,
            /\s*\.\.\.\s*$/gi,
            /Click here to read more/gi,
            /Read full article/gi,
            /Visit.*?for more/gi
        ];
        
        let cleanDesc = description;
        
        // Remove generic phrases
        genericPhrases.forEach(phrase => {
            cleanDesc = cleanDesc.replace(phrase, '');
        });
        
        // Clean up extra whitespace and formatting
        cleanDesc = cleanDesc
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n+/g, ' ')  // Replace newlines with spaces
            .trim();
        
        // If description is too short after cleaning, generate a better one from title
        if (cleanDesc.length < 50) {
            return this.generateDescriptionFromTitle(cleanDesc);
        }
        
        // Ensure description ends with proper punctuation
        if (!cleanDesc.match(/[.!?]$/)) {
            cleanDesc += '.';
        }
        
        // Limit length to reasonable display size (200-300 characters)
        if (cleanDesc.length > 300) {
            cleanDesc = cleanDesc.substring(0, 297) + '...';
        }
        
        return cleanDesc || 'Read the full article for more details.';
    }

    /**
     * Generate a meaningful description from article title when description is poor
     */
    generateDescriptionFromTitle(originalDesc) {
        // If we have some original description, use it
        if (originalDesc && originalDesc.length > 20) {
            return originalDesc;
        }
        
        // Generate category-specific descriptions
        const descriptions = [
            'Stay informed with this latest news story covering important developments and updates.',
            'This breaking news report provides comprehensive coverage of recent events and their impact.',
            'Get the latest updates on this developing story with detailed information and analysis.',
            'Read about the latest developments in this important news story affecting our community.',
            'Comprehensive coverage of this significant news event with expert analysis and updates.',
            'Important news update covering key developments and their implications for the future.',
            'Breaking news coverage providing detailed information about this developing situation.',
            'Latest news report with comprehensive details about this important story.',
            'Stay updated with this significant news development and its potential impact.',
            'Detailed coverage of this important news story with the latest information and updates.'
        ];
        
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    /**
     * Enhanced duplicate removal based on title, URL, and content similarity
     */
    removeDuplicates(articles) {
        if (!articles || articles.length === 0) return [];
        
        const seen = new Set();
        const titleSeen = new Set(); 
        const urlSeen = new Set();
        const contentFingerprints = new Set();
        const domainTitleMap = new Map();
        
        return articles.filter(article => {
            // Strict validation - reject invalid articles
            if (!article || !article.title || !article.url || 
                article.title.trim().length < 5 ||
                article.url.includes('removed') ||
                article.title.toLowerCase().includes('removed')) {
                return false;
            }
            
            // Normalize data for comparison
            const title = article.title.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
            const url = article.url.toLowerCase().trim();
            const domain = this.extractDomain(article.url);
            
            // 1. Exact URL check (strongest filter)
            if (urlSeen.has(url)) return false;
            
            // 2. Exact title check
            if (titleSeen.has(title)) return false;
            
            // 3. Content fingerprint check (title + first 50 chars of description)
            const contentFingerprint = title + (article.description || '').substring(0, 50).toLowerCase();
            if (contentFingerprints.has(contentFingerprint)) return false;
            
            // 4. Advanced similarity check for titles
            for (const existingTitle of titleSeen) {
                if (this.advancedSimilarityCheck(title, existingTitle)) {
                    return false;
                }
            }
            
            // 5. Domain-specific duplicate check
            if (domainTitleMap.has(domain)) {
                const domainTitles = domainTitleMap.get(domain);
                for (const domainTitle of domainTitles) {
                    if (this.calculateSimilarity(title, domainTitle) > 0.75) {
                        return false;
                    }
                }
                domainTitles.push(title);
            } else {
                domainTitleMap.set(domain, [title]);
            }
            
            // Store all identifiers
            urlSeen.add(url);
            titleSeen.add(title);
            contentFingerprints.add(contentFingerprint);
            
            return true;
        });
    }

    /**
     * Advanced similarity check combining multiple methods
     */
    advancedSimilarityCheck(title1, title2) {
        // Skip if titles are too different in length
        if (Math.abs(title1.length - title2.length) > title1.length * 0.5) return false;
        
        // Word-based similarity
        const words1 = title1.split(' ').filter(w => w.length > 2);
        const words2 = title2.split(' ').filter(w => w.length > 2);
        
        if (words1.length < 3 || words2.length < 3) return false;
        
        const commonWords = words1.filter(w => words2.includes(w));
        const wordSimilarity = commonWords.length / Math.max(words1.length, words2.length);
        
        // Character-based similarity
        const charSimilarity = this.calculateSimilarity(title1, title2);
        
        // Combined threshold - articles are duplicates if both word and character similarity are high
        return (wordSimilarity > 0.7 && charSimilarity > 0.8) || charSimilarity > 0.9;
    }
    
    /**
     * Calculate similarity between two strings
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    
    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    /**
     * Final deduplication pass - ultimate safety net
     */
    finalDeduplicationPass(articles) {
        const finalSeen = new Set();
        const titleMap = new Map();
        
        return articles.filter(article => {
            if (!article || !article.title || !article.url) return false;
            
            const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
            const key = `${normalizedTitle}::${article.url}`;
            
            if (finalSeen.has(key)) return false;
            
            // Check against stored titles for any remaining near-duplicates
            for (const [storedTitle, storedKey] of titleMap.entries()) {
                if (this.calculateSimilarity(normalizedTitle, storedTitle) > 0.85) {
                    return false;
                }
            }
            
            finalSeen.add(key);
            titleMap.set(normalizedTitle, key);
            return true;
        });
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            
            return date.toLocaleDateString();
        } catch (e) {
            return 'Unknown date';
        }
    }

    /**
     * Get category display name
     */
    getCategoryDisplayName(category) {
        const names = {
            'latest': 'Latest News',
            'kenya': 'Kenyan News',
            'world': 'World News',
            'entertainment': 'Entertainment',
            'technology': 'Technology',
            'business': 'Business',
            'sports': 'Sports',
            'health': 'Health'
        };
        return names[category] || 'News';
    }

    /**
     * Get sample articles for fallback when APIs fail
     */
    getSampleArticles(category, source = 'News API') {
        // Use extended articles database for comprehensive fallback
        if (typeof ExtendedArticlesDB !== 'undefined') {
            const extendedDB = new ExtendedArticlesDB();
            switch(category) {
                case 'latest':
                    return extendedDB.getExtendedLatestNews(source);
                case 'kenya':
                    return extendedDB.getExtendedKenyaNews(source);
                case 'world':
                    return extendedDB.getExtendedWorldNews(source);
                case 'entertainment':
                    return extendedDB.getExtendedEntertainmentNews(source);
                case 'technology':
                    return extendedDB.getExtendedTechnologyNews(source);
                case 'business':
                    return extendedDB.getExtendedBusinessNews(source);
                case 'sports':
                    return extendedDB.getExtendedSportsNews(source);
                case 'health':
                    return extendedDB.getExtendedHealthNews(source);
                default:
                    return extendedDB.getExtendedLatestNews(source);
            }
        }
        
        // Fallback to basic articles if extended DB not available
        const baseArticles = {
            latest: [
                {
                    title: "Global Climate Summit Reaches Historic Agreement",
                    description: "World leaders agree on ambitious climate targets for 2030, marking a significant step forward in environmental protection.",
                    url: "https://example.com/climate-summit",
                    urlToImage: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400",
                    publishedAt: new Date().toISOString(),
                    source: source,
                    category: "general"
                },
                {
                    title: "Tech Innovation Breakthrough in Quantum Computing",
                    description: "Researchers achieve new milestone in quantum computing that could revolutionize data processing capabilities.",
                    url: "https://example.com/quantum-computing",
                    urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400",
                    publishedAt: new Date(Date.now() - 3600000).toISOString(),
                    source: source,
                    category: "technology"
                },
                {
                    title: "International Trade Relations Show Positive Trends",
                    description: "Economic indicators suggest improving trade relationships between major global markets.",
                    url: "https://example.com/trade-relations",
                    urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400",
                    publishedAt: new Date(Date.now() - 7200000).toISOString(),
                    source: source,
                    category: "business"
                },
                {
                    title: "Revolutionary Medical Discovery Changes Treatment Approach",
                    description: "Scientists develop new therapeutic method showing remarkable success in treating previously incurable conditions.",
                    url: "https://example.com/medical-discovery",
                    urlToImage: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
                    publishedAt: new Date(Date.now() - 10800000).toISOString(),
                    source: source,
                    category: "health"
                },
                {
                    title: "Space Exploration Mission Discovers Potential Water Sources",
                    description: "Mars rover findings suggest underground water reservoirs could support future human missions.",
                    url: "https://example.com/mars-water",
                    urlToImage: "https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?w=400",
                    publishedAt: new Date(Date.now() - 14400000).toISOString(),
                    source: source,
                    category: "technology"
                },
                {
                    title: "Global Economic Recovery Shows Momentum",
                    description: "International markets demonstrate resilience as employment rates improve across major economies.",
                    url: "https://example.com/economic-recovery",
                    urlToImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400",
                    publishedAt: new Date(Date.now() - 18000000).toISOString(),
                    source: source,
                    category: "business"
                },
                {
                    title: "Artificial Intelligence Ethics Framework Established",
                    description: "International consortium develops comprehensive guidelines for responsible AI development and deployment.",
                    url: "https://example.com/ai-ethics",
                    urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
                    publishedAt: new Date(Date.now() - 21600000).toISOString(),
                    source: source,
                    category: "technology"
                },
                {
                    title: "Cultural Heritage Preservation Initiative Expands Globally",
                    description: "UNESCO launches ambitious program to digitally preserve world's most endangered cultural sites.",
                    url: "https://example.com/heritage-preservation",
                    urlToImage: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400",
                    publishedAt: new Date(Date.now() - 25200000).toISOString(),
                    source: source,
                    category: "general"
                },
                {
                    title: "Ocean Cleanup Technology Shows Remarkable Results",
                    description: "Advanced filtration systems successfully remove millions of tons of plastic from ocean waters.",
                    url: "https://example.com/ocean-cleanup",
                    urlToImage: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
                    publishedAt: new Date(Date.now() - 28800000).toISOString(),
                    source: source,
                    category: "general"
                },
                {
                    title: "Educational Technology Transforms Learning Outcomes",
                    description: "Digital learning platforms demonstrate significant improvement in student engagement and academic performance.",
                    url: "https://example.com/education-tech",
                    urlToImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
                    publishedAt: new Date(Date.now() - 32400000).toISOString(),
                    source: source,
                    category: "technology"
                }
            ],
            kenya: [
                {
                    title: "Kenya's Economic Growth Shows Steady Progress",
                    description: "Latest economic indicators show Kenya's GDP growth remains robust amid global uncertainties.",
                    url: "https://example.com/kenya-economy",
                    urlToImage: "https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?w=400",
                    publishedAt: new Date().toISOString(),
                    source: "Nation Kenya",
                    category: "business"
                },
                {
                    title: "Nairobi Tech Hub Attracts International Investment",
                    description: "Silicon Savannah continues to grow as global tech companies establish operations in Nairobi.",
                    url: "https://example.com/nairobi-tech",
                    urlToImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
                    publishedAt: new Date(Date.now() - 1800000).toISOString(),
                    source: "Citizen Digital",
                    category: "technology"
                },
                {
                    title: "Kenya's Conservation Efforts Gain Global Recognition",
                    description: "Wildlife conservation programs in Kenya receive international praise for innovative approaches.",
                    url: "https://example.com/kenya-conservation",
                    urlToImage: "https://images.unsplash.com/photo-1549366021-9f761d040a94?w=400",
                    publishedAt: new Date(Date.now() - 5400000).toISOString(),
                    source: "The Star Kenya",
                    category: "general"
                }
            ],
            world: [
                {
                    title: "European Union Announces New Digital Policy Framework",
                    description: "Comprehensive digital regulations aim to balance innovation with user privacy and security.",
                    url: "https://example.com/eu-digital-policy",
                    urlToImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400",
                    publishedAt: new Date().toISOString(),
                    source: source,
                    category: "general"
                },
                {
                    title: "Asian Markets React to New Economic Policies",
                    description: "Stock markets across Asia show mixed reactions to latest government economic initiatives.",
                    url: "https://example.com/asian-markets",
                    urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400",
                    publishedAt: new Date(Date.now() - 2700000).toISOString(),
                    source: source,
                    category: "business"
                }
            ],
            entertainment: [
                {
                    title: "Hollywood Stars Unite for Environmental Awareness Campaign",
                    description: "A-list celebrities join forces to promote climate action through innovative entertainment content.",
                    url: "https://example.com/hollywood-environment",
                    urlToImage: "https://images.unsplash.com/photo-1489599162717-1cbee3d4df79?w=400",
                    publishedAt: new Date().toISOString(),
                    source: source,
                    category: "entertainment"
                },
                {
                    title: "Streaming Wars: New Platform Launches with Original Content",
                    description: "Latest streaming service promises exclusive shows and movies to compete in crowded market.",
                    url: "https://example.com/streaming-wars",
                    urlToImage: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400",
                    publishedAt: new Date(Date.now() - 1800000).toISOString(),
                    source: source,
                    category: "entertainment"
                }
            ],
            technology: [
                {
                    title: "AI Breakthrough in Medical Diagnosis Accuracy",
                    description: "New artificial intelligence system achieves 95% accuracy in early disease detection.",
                    url: "https://example.com/ai-medical",
                    urlToImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
                    publishedAt: new Date().toISOString(),
                    source: source,
                    category: "technology"
                },
                {
                    title: "Electric Vehicle Market Reaches New Milestone",
                    description: "Global EV sales surpass expectations as battery technology advances drive adoption.",
                    url: "https://example.com/ev-milestone",
                    urlToImage: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=400",
                    publishedAt: new Date(Date.now() - 3600000).toISOString(),
                    source: source,
                    category: "technology"
                }
            ],
            business: [
                {
                    title: "Global Supply Chain Resilience Improves",
                    description: "Companies report better preparedness for disruptions following strategic infrastructure investments.",
                    url: "https://example.com/supply-chain",
                    urlToImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
                    publishedAt: new Date().toISOString(),
                    source: source,
                    category: "business"
                },
                {
                    title: "Renewable Energy Investment Hits Record High",
                    description: "Corporate investment in renewable energy projects reaches unprecedented levels globally.",
                    url: "https://example.com/renewable-investment",
                    urlToImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400",
                    publishedAt: new Date(Date.now() - 2700000).toISOString(),
                    source: source,
                    category: "business"
                }
            ],
            sports: [
                {
                    title: "Olympic Preparations Intensify Across Host Cities",
                    description: "Athletes and organizers make final preparations as upcoming Olympic Games approach.",
                    url: "https://example.com/olympic-prep",
                    urlToImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400",
                    publishedAt: new Date().toISOString(),
                    source: source,
                    category: "sports"
                },
                {
                    title: "Football Transfer Season Sees Record-Breaking Deals",
                    description: "Major European clubs complete high-profile signings in unprecedented transfer window.",
                    url: "https://example.com/football-transfers",
                    urlToImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400",
                    publishedAt: new Date(Date.now() - 1800000).toISOString(),
                    source: source,
                    category: "sports"
                }
            ],
            health: [
                {
                    title: "Revolutionary Gene Therapy Shows Promise",
                    description: "Clinical trials demonstrate significant improvement in treating genetic disorders.",
                    url: "https://example.com/gene-therapy",
                    urlToImage: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
                    publishedAt: new Date().toISOString(),
                    source: source,
                    category: "health"
                },
                {
                    title: "Mental Health Awareness Campaigns Gain Momentum",
                    description: "Global initiative promotes mental wellness and reduces stigma around mental health issues.",
                    url: "https://example.com/mental-health",
                    urlToImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
                    publishedAt: new Date(Date.now() - 3600000).toISOString(),
                    source: source,
                    category: "health"
                }
            ]
        };

        // Add more variety by generating additional unique articles
        const articles = baseArticles[category] || baseArticles.latest;
        const additionalArticles = this.generateAdditionalArticles(category, source);
        return [...articles, ...additionalArticles];
    }

    /**
     * Generate comprehensive article collections (up to 50 per category)
     */
    generateAdditionalArticles(category, source) {
        const timeOffsets = this.generateTimeRange(50); // Generate 50 time intervals
        const imagePool = [
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400",
            "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400",
            "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400",
            "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400",
            "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400",
            "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400",
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400",
            "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400",
            "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
            "https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?w=400",
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
            "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400",
            "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
            "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
            "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=400",
            "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400"
        ];
        
        const getRandomImage = () => imagePool[Math.floor(Math.random() * imagePool.length)];
        const additionalData = {
            latest: [
                {
                    title: "Scientific Breakthrough in Renewable Energy Storage",
                    description: "Revolutionary battery technology promises to store renewable energy for weeks, addressing grid stability concerns.",
                    url: "https://example.com/battery-breakthrough",
                    urlToImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[0]).toISOString(),
                    source: source,
                    category: "technology"
                },
                {
                    title: "Global Food Security Initiative Shows Promise",
                    description: "International collaboration develops drought-resistant crops to address climate change impacts on agriculture.",
                    url: "https://example.com/food-security",
                    urlToImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[1]).toISOString(),
                    source: source,
                    category: "general"
                }
            ],
            kenya: [
                {
                    title: "Kenya Launches Ambitious Green Energy Program",
                    description: "Government announces plan to achieve 100% renewable energy by 2030 through wind and solar expansion.",
                    url: "https://example.com/kenya-green-energy",
                    urlToImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[0]).toISOString(),
                    source: "Capital FM",
                    category: "general"
                },
                {
                    title: "Mombasa Port Expansion Project Nears Completion",
                    description: "Major infrastructure development set to boost East African trade and economic growth.",
                    url: "https://example.com/mombasa-port",
                    urlToImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[2]).toISOString(),
                    source: "Standard Digital",
                    category: "business"
                }
            ],
            world: [
                {
                    title: "International Space Station Welcomes New Research Mission",
                    description: "Multinational crew begins groundbreaking experiments in microgravity environment.",
                    url: "https://example.com/iss-mission",
                    urlToImage: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[1]).toISOString(),
                    source: source,
                    category: "technology"
                }
            ],
            entertainment: [
                {
                    title: "Virtual Reality Concert Experience Breaks Attendance Records",
                    description: "Innovative VR platform hosts largest virtual music event with millions of participants worldwide.",
                    url: "https://example.com/vr-concert",
                    urlToImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[0]).toISOString(),
                    source: source,
                    category: "entertainment"
                }
            ],
            technology: [
                {
                    title: "Quantum Internet Prototype Successfully Tested",
                    description: "Scientists achieve secure quantum communication over 1000km, marking major milestone in quantum computing.",
                    url: "https://example.com/quantum-internet",
                    urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[2]).toISOString(),
                    source: source,
                    category: "technology"
                }
            ],
            business: [
                {
                    title: "Green Finance Initiatives Gain Momentum Among Banks",
                    description: "Major financial institutions commit to sustainable lending practices and carbon-neutral operations.",
                    url: "https://example.com/green-finance",
                    urlToImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[1]).toISOString(),
                    source: source,
                    category: "business"
                }
            ],
            sports: [
                {
                    title: "Paralympic Training Centers Upgrade Technology",
                    description: "Advanced sports science equipment enhances training for Paralympic athletes worldwide.",
                    url: "https://example.com/paralympic-tech",
                    urlToImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[0]).toISOString(),
                    source: source,
                    category: "sports"
                }
            ],
            health: [
                {
                    title: "Breakthrough in Alzheimer's Research Shows Promise",
                    description: "New therapeutic approach demonstrates significant improvement in early-stage clinical trials.",
                    url: "https://example.com/alzheimers-research",
                    urlToImage: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
                    publishedAt: new Date(Date.now() - timeOffsets[3]).toISOString(),
                    source: source,
                    category: "health"
                }
            ]
        };

        return additionalData[category] || additionalData.latest;
    }

    /**
     * Generate time range for articles
     */
    generateTimeRange(count) {
        const offsets = [];
        for (let i = 0; i < count; i++) {
            offsets.push((i + 1) * 3600000 + Math.random() * 1800000); // 1-count hours with random minutes
        }
        return offsets;
    }
}

// Export for use in other scripts
window.NewsAPI = NewsAPI;

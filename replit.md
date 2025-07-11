# Brightlens News - Architecture Documentation

## Overview

Brightlens News is a comprehensive multi-page web application that serves as a modern news aggregation platform. The application provides users with the latest news articles from multiple sources, weather information, and live TV streaming capabilities. Built with vanilla JavaScript and modern web technologies, it features a responsive design, dynamic theming system, and professional user interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

### Real-Time News Enhancement
- **Enhanced API Configuration**: Updated news API integration with user-provided API keys in priority order
- **Real-Time Filtering**: Reduced cache timeout to 10 seconds for maximum freshness
- **Category-Specific Filtering**: Implemented precise category filtering for each of the 8 categories
- **Sorting Optimization**: Ensured newest articles appear first in all categories
- **Path Corrections**: Fixed all relative paths for proper GitHub Pages deployment

### API Priority Order (as requested)
1. **NewsData.io** - Primary API (pub_d74b96fd4a9041d59212493d969368cd)
2. **GNews** - Secondary API (9db0da87512446db08b82d4f63a4ba8d)
3. **NewsAPI.org** - Tertiary API (9fcf10b2fd0c48c7a1886330ebb04385)
4. **Mediastack** - Fourth API (4e53cf0fa35eefaac21cd9f77925b8f5)
5. **CurrentsAPI** - Fifth API (9tI-4kOmMlJdgcosDUBsYYZDAnkLnuuL4Hrgc5TKlHmN_AMH)

### Category-Specific Improvements
- **Latest News**: Fetches most recent trending articles from all topics without category filtering
- **Kenya News**: Specifically targets Kenyan politics, economy, sports, culture, and society
- **Sports**: Covers football, athletics, basketball, tournaments, and global sports events
- **Technology**: Focuses on gadgets, AI, startups, tech companies, and innovations
- **Business**: Includes stock markets, corporate news, investments, and economic trends
- **Health**: Covers diseases, medical research, fitness, mental health, and healthcare policies
- **Entertainment**: Features movies, TV shows, celebrities, music, and cultural events
- **World News**: International and global news excluding Kenya-specific content

## Recent Changes

**July 11, 2025**
✓ **Multi-Page Architecture Implementation**: Transformed from single-page to multi-page application
✓ **Category Pages**: Created 8 independent category pages in `/categories/` directory
✓ **Homepage Redesign**: Converted main page to landing page with category navigation cards
✓ **Real-time News Integration**: Each category page fetches news using 5 different APIs with provided API keys
✓ **Navigation Updates**: Updated all navigation links throughout the site for multi-page compatibility
✓ **Enhanced Styling**: Added homepage-specific CSS and JavaScript for better user experience
✓ **API Keys Integration**: Successfully integrated provided API keys for GNews, NewsData.io, NewsAPI.org, Mediastack, and CurrentsAPI
✓ **Weather & Live TV**: Updated existing pages with proper navigation back to homepage

**July 10, 2025**
- Fixed critical JavaScript error in news loading functionality
- Corrected `getExtendedArticles()` method call to use `generateAdditionalArticles()`
- Improved image handling with proper fallback system
- Added service worker (sw.js) for offline functionality and caching
- Reorganized all website files properly in root directory for GitHub deployment
- Enhanced error handling for API calls and CORS issues
- Cleaned up directory structure and removed duplicate files
- Created comprehensive README.md for GitHub deployment
- Verified all files are correctly arranged in root directory

## System Architecture

### Frontend Architecture
- **Client-Side Framework**: Vanilla JavaScript with ES6+ class-based architecture
- **UI Pattern**: Multi-page application with shared components and unified styling
- **Responsive Design**: Mobile-first approach with adaptive layouts and collapsible navigation
- **State Management**: Class-based state management with browser localStorage for persistence
- **Theme System**: Dynamic theme switching with 12+ color schemes and localStorage persistence
- **Progressive Web App**: Includes manifest.json for PWA capabilities

### File Structure
```
/
├── index.html              # Main news aggregation page
├── weather.html           # Weather information page with city search
├── live-tv.html          # Professional Kenyan Live TV streaming page
├── manifest.json         # PWA manifest configuration
├── css/
│   ├── styles.css        # Main stylesheet with CSS custom properties
│   ├── themes.css        # Theme definitions and color schemes
│   ├── live-tv.css       # Live TV specific styling
│   └── weather.css       # Weather page specific styling
├── js/
│   ├── main.js           # Main news application logic
│   ├── news-api.js       # News API integration and data handling
│   ├── themes.js         # Theme management system
│   ├── weather.js        # Weather application with OpenWeather API
│   ├── live-tv.js        # Live TV streaming functionality
│   └── extended-articles.js # Fallback news data
├── assets/
│   └── default.svg       # Default image placeholder
├── package.json          # Node.js dependencies
└── server.py            # Python HTTP server for development
```

## Key Components

### News Application (main.js, news-api.js)
- **Multi-API Integration**: Fetches news from multiple APIs (GNews, NewsData, NewsAPI, MediaStack, CurrentsAPI)
- **Category System**: Latest, Kenya, World, Entertainment, Technology, Business, Sports, Health
- **Automatic Sorting**: Articles sorted by publication date (newest first)
- **Caching System**: Client-side caching with configurable timeout
- **Error Handling**: Robust error handling with fallback content
- **Loading States**: Professional loading screens and progress indicators

### Weather Application (weather.js)
- **OpenWeather API Integration**: Real-time weather data with API key authentication
- **City Search**: Geographic location search with coordinates
- **Temperature Units**: Celsius/Fahrenheit conversion
- **Weather Visualization**: Charts and graphs for weather data
- **Responsive Design**: Mobile-optimized weather interface

### Live TV Streaming (live-tv.js)
- **Kenyan TV Channels**: Professional streaming service with verified YouTube/Twitch sources
- **Video Player**: Supports YouTube embeds, Twitch streams, and HLS playback
- **Channel Categories**: News, Entertainment, Religious, Regional
- **Viewer Statistics**: Live viewer counts and channel status
- **Fullscreen Support**: Keyboard shortcuts (ESC, F, M) and fullscreen API

### Theme Management (themes.js)
- **12 Color Schemes**: Default, Dark, Ocean Blue, Forest Green, Royal Purple, Sunset Orange, Rose Pink, Emerald, Indigo, Amber, Teal, Crimson
- **CSS Custom Properties**: Dynamic theme switching using CSS variables
- **localStorage Persistence**: Theme preferences saved across sessions
- **Cross-Page Consistency**: Unified theming across all pages

## Data Flow

### News Data Flow
1. **API Requests**: Parallel requests to multiple news APIs
2. **Data Aggregation**: Combine and deduplicate articles from different sources
3. **Sorting & Filtering**: Sort by date, filter by category
4. **Caching**: Store results in memory cache with timestamp
5. **UI Rendering**: Display articles in responsive grid layout

### Weather Data Flow
1. **Location Input**: User enters city name or uses geolocation
2. **Geocoding**: Convert city name to coordinates using OpenWeather API
3. **Weather Request**: Fetch current weather and forecast data
4. **Data Processing**: Parse weather data and convert units
5. **UI Update**: Display weather information with charts and animations

### Live TV Data Flow
1. **Channel Loading**: Load predefined channel list with streaming URLs
2. **Stream Validation**: Check channel availability and viewer counts
3. **Video Player**: Initialize appropriate player (YouTube/Twitch/HLS)
4. **Statistics Update**: Periodic updates of viewer counts and status

## External Dependencies

### API Services
- **News APIs**: GNews, NewsData, NewsAPI, MediaStack, CurrentsAPI
- **Weather API**: OpenWeather API (current weather and forecasts)
- **Streaming Sources**: YouTube live streams, Twitch channels

### Frontend Libraries
- **Font Awesome**: Icons and UI elements
- **Google Fonts**: Inter font family for typography
- **HLS.js**: HTTP Live Streaming support for video playback

### Development Dependencies
- **Node.js Packages**: React, Vite, TypeScript, Tailwind CSS, Axios, Express, CORS
- **Build Tools**: Autoprefixer, PostCSS, Vite bundler
- **Type Definitions**: TypeScript definitions for React and React DOM

## Deployment Strategy

### Static Hosting
- **GitHub Pages**: Primary deployment target (philipkilonzoke.github.io)
- **Progressive Web App**: Service worker capabilities through manifest.json
- **CDN Assets**: External CSS/JS libraries loaded from CDN

### Development Environment
- **Python Server**: Simple HTTP server for local development
- **CORS Handling**: Custom request handler for API calls
- **Hot Reload**: Vite development server for modern workflow

### Performance Optimizations
- **Critical CSS**: Inline critical styles in HTML head
- **Resource Preloading**: Preload fonts and essential CSS
- **Lazy Loading**: Deferred loading of non-critical resources
- **Image Optimization**: Placeholder images and responsive sizing
- **Caching Strategy**: Browser caching with appropriate cache headers

### Security Considerations
- **API Key Management**: Environment variables for sensitive keys
- **CORS Policy**: Proper cross-origin resource sharing configuration
- **Content Security**: External resource validation and sanitization
- **XSS Prevention**: Proper HTML escaping and content validation

The application is designed to be highly maintainable with clear separation of concerns, robust error handling, and scalable architecture that can easily accommodate new features and API integrations.
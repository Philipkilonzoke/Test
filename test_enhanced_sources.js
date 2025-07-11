/**
 * Test Enhanced News Sources
 * Tests RSS feeds and additional APIs
 */

async function testEnhancedSources() {
    console.log('Testing Enhanced News Sources...\n');
    
    // Test RSS2JSON service
    console.log('1. Testing RSS2JSON service...');
    try {
        const rssResponse = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://techcrunch.com/feed&count=3');
        const rssData = await rssResponse.json();
        console.log('✓ RSS2JSON working:', rssData.items?.length || 0, 'articles');
        if (rssData.items && rssData.items.length > 0) {
            console.log('  Sample article:', rssData.items[0].title);
        }
    } catch (error) {
        console.log('✗ RSS2JSON error:', error.message);
    }
    
    // Test Guardian API
    console.log('\n2. Testing Guardian API...');
    try {
        const guardianResponse = await fetch('https://content.guardianapis.com/search?api-key=test&show-fields=thumbnail,headline&page-size=3&section=technology');
        const guardianData = await guardianResponse.json();
        console.log('✓ Guardian API working:', guardianData.response?.results?.length || 0, 'articles');
        if (guardianData.response?.results && guardianData.response.results.length > 0) {
            console.log('  Sample article:', guardianData.response.results[0].webTitle);
        }
    } catch (error) {
        console.log('✗ Guardian API error:', error.message);
    }
    
    // Test Hacker News API
    console.log('\n3. Testing Hacker News API...');
    try {
        const hnResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = await hnResponse.json();
        console.log('✓ Hacker News API working:', storyIds.length, 'stories available');
        
        // Test fetching one story
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyIds[0]}.json`);
        const story = await storyResponse.json();
        console.log('  Sample story:', story.title);
    } catch (error) {
        console.log('✗ Hacker News API error:', error.message);
    }
    
    // Test NewsAPI working status
    console.log('\n4. Testing NewsAPI status...');
    try {
        const newsResponse = await fetch('https://newsapi.org/v2/top-headlines?country=us&pageSize=3&apiKey=9fcf10b2fd0c48c7a1886330ebb04385');
        const newsData = await newsResponse.json();
        if (newsData.status === 'ok') {
            console.log('✓ NewsAPI working:', newsData.articles?.length || 0, 'articles');
        } else {
            console.log('✗ NewsAPI issue:', newsData.message);
        }
    } catch (error) {
        console.log('✗ NewsAPI error:', error.message);
    }
    
    console.log('\n=== Enhanced Sources Test Complete ===');
}

// Run the test
testEnhancedSources();
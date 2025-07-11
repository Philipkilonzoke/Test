// Simple API test for all categories
const https = require('https');

// API Keys from your configuration
const API_KEYS = {
    newsdata: 'pub_d74b96fd4a9041d59212493d969368cd',
    gnews: '9db0da87512446db08b82d4f63a4ba8d',
    newsapi: '9fcf10b2fd0c48c7a1886330ebb04385',
    mediastack: '4e53cf0fa35eefaac21cd9f77925b8f5',
    currentsapi: '9tI-4kOmMlJdgcosDUBsYYZDAnkLnuuL4Hrgc5TKlHmN_AMH'
};

const categories = ['latest', 'kenya', 'sports', 'technology', 'business', 'health', 'entertainment', 'world'];

function testAPI(url, apiName) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        success: true,
                        api: apiName,
                        status: res.statusCode,
                        data: json
                    });
                } catch (e) {
                    reject({
                        success: false,
                        api: apiName,
                        error: 'Invalid JSON response',
                        status: res.statusCode
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            reject({
                success: false,
                api: apiName,
                error: err.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.abort();
            reject({
                success: false,
                api: apiName,
                error: 'Request timeout'
            });
        });
    });
}

async function testAllCategories() {
    console.log('🔍 Testing API connectivity for all categories...\n');
    
    const results = {};
    
    for (const category of categories) {
        console.log(`📰 Testing ${category.toUpperCase()} category...`);
        
        // Test NewsData.io API (Primary)
        const newsdataUrl = `https://newsdata.io/api/1/news?apikey=${API_KEYS.newsdata}&language=en&size=3&category=${category === 'latest' ? 'top' : category}`;
        
        try {
            const result = await testAPI(newsdataUrl, 'NewsData.io');
            
            if (result.success && result.data && result.data.results) {
                const articles = result.data.results;
                const articlesWithImages = articles.filter(article => 
                    article.image_url && 
                    article.image_url.startsWith('http')
                );
                
                results[category] = {
                    success: true,
                    totalArticles: articles.length,
                    articlesWithImages: articlesWithImages.length,
                    imagePercentage: Math.round((articlesWithImages.length / articles.length) * 100),
                    sampleTitle: articles[0] ? articles[0].title : 'No title',
                    sampleImage: articles[0] ? !!articles[0].image_url : false,
                    api: 'NewsData.io'
                };
                
                console.log(`✅ ${category}: ${articles.length} articles loaded, ${articlesWithImages.length} with images (${results[category].imagePercentage}%)`);
                
            } else {
                results[category] = {
                    success: false,
                    error: 'No articles in API response',
                    api: 'NewsData.io'
                };
                console.log(`❌ ${category}: No articles in API response`);
            }
            
        } catch (error) {
            results[category] = {
                success: false,
                error: error.error || error.message,
                api: 'NewsData.io'
            };
            console.log(`❌ ${category}: API Error - ${error.error || error.message}`);
        }
    }
    
    // Summary
    console.log('\n📊 FINAL RESULTS SUMMARY:');
    console.log('='.repeat(60));
    
    let successCount = 0;
    let totalArticles = 0;
    let totalWithImages = 0;
    
    for (const [category, result] of Object.entries(results)) {
        if (result.success) {
            successCount++;
            totalArticles += result.totalArticles;
            totalWithImages += result.articlesWithImages;
            console.log(`✅ ${category.toUpperCase().padEnd(12)}: ${result.totalArticles} articles, ${result.articlesWithImages} with images (${result.imagePercentage}%)`);
        } else {
            console.log(`❌ ${category.toUpperCase().padEnd(12)}: Failed - ${result.error}`);
        }
    }
    
    console.log('='.repeat(60));
    console.log(`🎯 SUCCESS RATE: ${successCount}/${categories.length} categories (${Math.round((successCount/categories.length)*100)}%)`);
    console.log(`📰 TOTAL ARTICLES: ${totalArticles}`);
    console.log(`🖼️  ARTICLES WITH IMAGES: ${totalWithImages}/${totalArticles} (${totalArticles > 0 ? Math.round((totalWithImages/totalArticles)*100) : 0}%)`);
    
    if (successCount === categories.length) {
        console.log('🎉 ALL CATEGORIES WORKING PERFECTLY!');
        console.log('✅ All 8 categories are properly loading articles with images');
    } else {
        console.log('⚠️  Some categories may need attention');
    }
    
    return results;
}

// Run the test
testAllCategories().catch(console.error);
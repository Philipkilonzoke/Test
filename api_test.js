/**
 * Direct API Test for All 8 Categories
 * Tests news loading with images for each category
 */

// Test configuration
const TEST_CONFIG = {
    timeout: 15000, // 15 seconds timeout
    maxRetries: 3,
    categoriesPerTest: 2 // Test 2 articles per category
};

// Load required classes
const newsAPI = new NewsAPI();
const categories = ['latest', 'kenya', 'sports', 'technology', 'business', 'health', 'entertainment', 'world'];

async function testAllCategories() {
    console.log('🔍 Starting comprehensive API test for all 8 categories...');
    
    const results = {};
    
    for (const category of categories) {
        console.log(`\n📰 Testing ${category.toUpperCase()} category...`);
        
        try {
            const articles = await newsAPI.fetchNews(category, TEST_CONFIG.categoriesPerTest);
            
            if (articles && articles.length > 0) {
                // Check if articles have images
                const articlesWithImages = articles.filter(article => 
                    article.image && 
                    article.image !== 'null' && 
                    article.image !== null &&
                    article.image.startsWith('http')
                );
                
                results[category] = {
                    success: true,
                    totalArticles: articles.length,
                    articlesWithImages: articlesWithImages.length,
                    imagePercentage: Math.round((articlesWithImages.length / articles.length) * 100),
                    sample: articles[0] ? {
                        title: articles[0].title,
                        hasImage: !!articles[0].image,
                        imageUrl: articles[0].image,
                        source: articles[0].source,
                        publishedAt: articles[0].publishedAt
                    } : null
                };
                
                console.log(`✅ ${category}: ${articles.length} articles loaded, ${articlesWithImages.length} with images (${results[category].imagePercentage}%)`);
                
                if (articles[0]) {
                    console.log(`   📝 Sample: "${articles[0].title.substring(0, 50)}..."`);
                    console.log(`   🖼️  Image: ${articles[0].image ? 'Yes' : 'No'}`);
                }
            } else {
                results[category] = {
                    success: false,
                    error: 'No articles returned'
                };
                console.log(`❌ ${category}: No articles loaded`);
            }
        } catch (error) {
            results[category] = {
                success: false,
                error: error.message
            };
            console.log(`❌ ${category}: Error - ${error.message}`);
        }
    }
    
    // Summary
    console.log('\n📊 FINAL RESULTS SUMMARY:');
    console.log('='.repeat(50));
    
    let successCount = 0;
    let totalArticles = 0;
    let totalWithImages = 0;
    
    for (const [category, result] of Object.entries(results)) {
        if (result.success) {
            successCount++;
            totalArticles += result.totalArticles;
            totalWithImages += result.articlesWithImages;
            console.log(`✅ ${category.toUpperCase()}: ${result.totalArticles} articles, ${result.articlesWithImages} with images (${result.imagePercentage}%)`);
        } else {
            console.log(`❌ ${category.toUpperCase()}: Failed - ${result.error}`);
        }
    }
    
    console.log('='.repeat(50));
    console.log(`🎯 SUCCESS RATE: ${successCount}/${categories.length} categories (${Math.round((successCount/categories.length)*100)}%)`);
    console.log(`📰 TOTAL ARTICLES: ${totalArticles}`);
    console.log(`🖼️  TOTAL WITH IMAGES: ${totalWithImages} (${Math.round((totalWithImages/totalArticles)*100)}%)`);
    
    if (successCount === categories.length) {
        console.log('🎉 ALL CATEGORIES WORKING PERFECTLY!');
    } else {
        console.log('⚠️  Some categories need attention');
    }
    
    return results;
}

// Run the test
testAllCategories().then(results => {
    console.log('\n✅ Test completed successfully!');
}).catch(error => {
    console.error('\n❌ Test failed:', error);
});
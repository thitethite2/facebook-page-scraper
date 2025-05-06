const puppeteer = require('puppeteer');
const { getPage } = require('./browswer_service');
const prompt = require('prompt-sync')({ sigint: true });
const { Parser } = require('json2csv');
const fs = require('fs').promises;
const path = require('path');

class FacebookPageScraper {
    static async getFollowers(page, pageId) {
        const followersRefLink = `https://www.facebook.com/profile.php?id=${pageId}&sk=followers`;
        const followersElement = await page.$(`a[href*="${followersRefLink}"]`);
        return followersElement ? await page.evaluate(el => el.innerText, followersElement) : null;
    }

    static async getLikes(page, pageId) {
        const likesRefLink = `https://www.facebook.com/profile.php?id=${pageId}&sk=friends_likes`;
        const likesElement = await page.$(`a[href*="${likesRefLink}"]`);
        return likesElement ? await page.evaluate(el => el.innerText, likesElement) : null;
    }

    static async getPageType(page) {
        const pageTypeElements = await page.$$('span');
        for (const span of pageTypeElements) {
            const strong = await span.$('strong');
            if (strong) {
                return await page.evaluate(el => el.innerText, span);
            }
        }
        return null;
    }

    static async scrapePageInfo(page, pageId) {
        const data = {};

        try {
            data.page_type = await this.getPageType(page);
            if (data.page_type === null || data.page_type.includes('Profile')) {
                return null;
            }

            data.page_id = pageId;
            data.title = await page.title();
            data.url = page.url();
            data.followers = await this.getFollowers(page, pageId);
            data.likes = await this.getLikes(page, pageId);

            return data;
        } catch (error) {
            console.error('Error while scraping page info:', error);
            return null;
        }
    }

    static async getFacebookPage(pageId) {
        const url = `https://www.facebook.com/profile.php?id=${pageId}`;
        const page = await getPage();
        
        try {
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });
            return await this.scrapePageInfo(page, pageId);
        } finally {
            await page.close();
        }
    }
}

class GoogleSearchAPI {
    static API_KEY = 'AIzaSyD1SR64ROmx7pjTcAnC9RbR82Zu3jnyn-Q';
    static SEARCH_ENGINE_ID = '41e2d0a9a86bd4100';
    static BASE_URL = 'https://www.googleapis.com/customsearch/v1';

    static async search(query, start = 1) {
        const url = `${this.BASE_URL}?key=${this.API_KEY}&cx=${this.SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&start=${start}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }
        
        return await response.json();
    }

    static extractPageId(link) {
        return link.split('id=')[1].split('&')[0];
    }
}

class DataManager {
    static async saveToCSV(data) {
        try {
            if (!data || data.length === 0) {
                console.log('No data to save');
                return;
            }

            
            const fields = ['page_id', 'title', 'url', 'page_type', 'followers', 'likes'];
        
            const json2csvParser = new Parser({ fields });
            
            // Convert JSON to CSV
            const csv = json2csvParser.parse(data);
            
            // Create output directory if it doesn't exist
            const outputDir = path.join(__dirname, 'output');
            await fs.mkdir(outputDir, { recursive: true });
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `facebook_pages_${timestamp}.csv`;
            const filePath = path.join(outputDir, filename);
            
            // Write CSV to file
            await fs.writeFile(filePath, csv, 'utf8');
            
            console.log(`Data successfully saved to ${filePath}`);
            console.log(`Total records saved: ${data.length}`);
        } catch (error) {
            console.error('Error saving CSV file:', error);
            throw error;
        } finally {
            process.exit(0);
        }
    }
}

class MainApp {
    static async run() {
        const scrapedData = [];
        
        // Get data limit from user
        const dataLimit = parseInt(prompt('Enter the number of Facebook pages to scrape: '));
        if (isNaN(dataLimit) || dataLimit <= 0) {
            console.log('Invalid data limit. Please enter a positive number.');
            return;
        }

        console.log(`Starting to scrape up to ${dataLimit} Facebook pages. Type "exit" to stop and save CSV file.`);

        while (scrapedData.length < dataLimit) {
            console.log(`\nTotal scraped pages: ${scrapedData.length}/${dataLimit}`);
            const searchQuery = prompt('Enter search query for FbPages: ');

            if (searchQuery === 'exit') {
                await DataManager.saveToCSV(scrapedData);
                break;
            }

            let currentStartIndex = 1;
            let hasMoreResults = true;

            while (hasMoreResults && scrapedData.length < dataLimit) {
                try {
                    const searchResults = await GoogleSearchAPI.search(searchQuery, currentStartIndex);
                    
                    if (!searchResults.items || searchResults.items.length === 0) {
                        console.log('No more results found for the query:', searchQuery);
                        hasMoreResults = false;
                        break;
                    }

                    for (const item of searchResults.items) {
                        if (scrapedData.length >= dataLimit) {
                            break;
                        }

                        const pageId = GoogleSearchAPI.extractPageId(item.link);
                        const pageData = await FacebookPageScraper.getFacebookPage(pageId);
                        
                        if (pageData !== null) {
                            scrapedData.push(pageData);
                            console.log(`Scraped page ${scrapedData.length}/${dataLimit}: ${pageData.title}`);
                        }
                    }

                    // Check if there are more results available
                    if (searchResults.queries && searchResults.queries.nextPage) {
                        currentStartIndex = searchResults.queries.nextPage[0].startIndex;
                    } else {
                        hasMoreResults = false;
                    }

                } catch (error) {
                    console.log('No More result for this query ....');
                    hasMoreResults = false;
                    break;
                }
            }

            if (scrapedData.length >= dataLimit) {
                console.log('\nReached the data limit! Saving results...');
                await DataManager.saveToCSV(scrapedData);
                break;
            }
        }
    }
}

// Start the application

MainApp.run().catch(error => {
    console.error('Application error:', error);
    process.exit(1);
});



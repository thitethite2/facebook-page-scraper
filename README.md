# Facebook Page Scraper

A powerful command-line tool that scrapes Facebook page information using Google Custom Search Engine and Puppeteer. This tool helps you collect data about Facebook pages including followers, likes, and other metadata.

## Features

- Search Facebook pages using Google Custom Search Engine
- Scrape page information including:
  - Page title
  - URL
  - Page type
  - Followers count
  - Likes count
- Pagination support for Google Search results
- Save results to CSV file
- Customizable data collection limit

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Google Custom Search Engine API key
- Google Custom Search Engine ID

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd facebook-page-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Google API credentials:
```env
GOOGLE_API_KEY=your_api_key_here
GOOGLE_CSE_ID=your_cse_id_here
```

## Usage

1. Start the scraper:
```bash
node pageInfo/main.js
```

2. Enter the number of Facebook pages you want to scrape when prompted.

3. Enter your search query when prompted. The scraper will:
   - Search for Facebook pages using Google CSE
   - Scrape information from each page
   - Continue until it reaches your specified limit or you type "exit"

4. The results will be automatically saved to a CSV file in the `output` directory when:
   - You reach your specified data limit
   - You type "exit"
   - The program completes all available searches

## Output

The scraper generates CSV files in the `output` directory with the following columns:
- page_id
- title
- url
- page_type
- followers
- likes

Files are named with a timestamp: `facebook_pages_YYYY-MM-DDTHH-MM-SS-ZZZZ.csv`

## Error Handling

The scraper includes error handling for:
- Invalid API responses
- Network issues
- Missing or invalid Facebook page data
- Rate limiting

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes only. Please ensure you comply with:
- Facebook's Terms of Service
- Google's API Terms of Service
- Any applicable data protection laws

## Support

For support, please open an issue in the repository. 
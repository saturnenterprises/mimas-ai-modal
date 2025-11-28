# Fake News Detector - Browser Extension

A Chrome/Edge browser extension that helps detect potentially false or misleading information on individual tweets on X.com (Twitter). Similar to how Grammarly adds inline suggestions, this extension adds a "Check" button to each tweet for instant credibility analysis.

## Features

- **Inline Tweet Buttons**: A "Check" button appears on every tweet's action bar (next to like, retweet, share)
- **Individual Tweet Analysis**: Analyzes each tweet separately, not the whole page
- **One-Click Check**: Tap the button on any tweet to analyze just that tweet's content
- **Credibility Score**: Get a 0-100 credibility score based on content analysis
- **Visual Feedback**: Color-coded results (green for reliable, yellow for uncertain, red for potentially misleading)
- **Detailed Breakdown**: See suspicious words, reliable indicators, clickbait phrases, and more
- **Auto-Detection**: Automatically adds buttons to new tweets as you scroll (works with infinite scroll)

## Installation Instructions

### For Chrome/Edge:

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (toggle in the top right corner)
3. Click **Load unpacked**
4. Select the folder containing this extension (`mumbai` folder)
5. The extension should now appear in your extensions list
6. Navigate to **X.com (Twitter)** and you'll see a "Check" button on each tweet's action bar

## How to Use

1. Navigate to **x.com** (or **twitter.com**)
2. Look for the purple "Check" button on each tweet (appears in the action bar with like/retweet/share buttons)
3. Click the "Check" button on any tweet you want to verify
4. Wait for the analysis to complete (~1 second)
5. Review the credibility score, status, and detailed analysis in the popup modal
6. Click outside the modal or the X button to close it
7. The button automatically appears on new tweets as you scroll

## Current Analysis Method (Dummy)

The extension currently uses a **dummy analysis algorithm** for demonstration purposes. It analyzes individual tweet content based on:

- **Suspicious words**: "shocking", "unbelievable", "miracle", "secret", "they don't want you to know", "must see", "you won't believe"
- **Reliable indicators**: "source:", "according to", "study shows", "research", "data", "report", "official", "confirmed"
- **Clickbait phrases**: "click here", "link in bio", "dm for", "follow for more"

The credibility score starts at 60 (neutral) and:
- Adds 8 points for each reliable indicator
- Subtracts 12 points for each suspicious word
- Subtracts 10 points for each clickbait phrase
- Penalizes very short tweets (less context)

**⚠️ Important**: This is a demonstration version. For production use, you should integrate with a real fact-checking API or machine learning model.

## File Structure

```
mumbai/
├── manifest.json       # Extension configuration
├── content.js          # Main script that runs on web pages
├── styles.css          # Styling for the floating button and modal
├── popup.html          # Extension popup (shown when clicking extension icon)
├── icon.svg           # Source icon file
├── icon16.png         # 16x16 extension icon
├── icon48.png         # 48x48 extension icon
├── icon128.png        # 128x128 extension icon
└── README.md          # This file
```

## Customization Ideas

### Enhance Twitter/X.com Features:

1. **Account Verification**: Check if the tweeting account is verified ✓ (badge status)
2. **Link Checking**: Analyze URLs in tweets for domain reputation
3. **Image Analysis**: Check for manipulated or AI-generated images
4. **Fact-Check Integration**: Connect to fact-checking APIs (FactCheck.org, Snopes, Google Fact Check)
5. **Tweet Thread Analysis**: Analyze entire thread context, not just individual tweets
6. **Engagement Analysis**: Consider likes/retweets ratio as credibility signal
7. **Account Age/History**: Check account creation date and posting patterns

### Enhance Detection Logic:

Replace the dummy analysis in `content.js` with:
- **API Integration**: Connect to fact-checking APIs (FactCheck.org, Snopes, etc.)
- **NLP Models**: Use natural language processing for sentiment analysis
- **Source Credibility**: Check domain reputation
- **Cross-Reference**: Verify claims against multiple sources

## Next Steps

1. Replace placeholder icons with actual PNG icons
2. Integrate with a real fact-checking API
3. Add Twitter/X.com specific analysis features
4. Implement user settings and preferences
5. Add reporting functionality
6. Create a backend service for more complex analysis

## Notes

- The extension requests permission to run on all URLs (`<all_urls>`)
- It uses Manifest V3 for Chrome/Edge compatibility
- Icons are currently placeholders - you can replace them with custom designs
- The extension is purely client-side (no data is sent to external servers)

## License

Free to use and modify for educational purposes.

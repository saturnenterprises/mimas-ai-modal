// Content script for X.com (Twitter) - Adds fact-check button to individual tweets
(function () {
  'use strict';

  // Only run on X.com/Twitter.com
  if (!window.location.hostname.includes('x.com') && !window.location.hostname.includes('twitter.com')) {
    return;
  }

  // Track which tweets already have buttons
  const processedTweets = new WeakSet();

  // Typing Effect Function
  function typeWriter(element, text, speed = 20) {
    element.textContent = '';
    let i = 0;
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    type();
  }

  // Create the result modal (shared for all tweets)
  const createResultModal = () => {
    const modal = document.createElement('div');
    modal.id = 'fake-news-detector-modal';
    // Add styles for gauge and modal
    const style = document.createElement('style');
    style.textContent = `
      #fake-news-detector-modal {
        display: none;
        position: fixed;
        z-index: 9999;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .modal-content {
        background-color: #fff;
        color: #1f2937; /* Enforce dark text */
        padding: 0;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .modal-header {
        padding: 16px 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
        border-radius: 16px 16px 0 0;
        color: #1f2937; /* Enforce dark text */
      }
      .modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #111827; }
      .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
      .modal-body { padding: 24px; color: #1f2937; } /* Enforce dark text */
      
      /* Gauge Styles */
      .score-container {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        position: relative;
      }
      .score-gauge {
        width: 120px;
        height: 120px;
        transform: rotate(-90deg);
      }
      .score-circle-bg {
        fill: none;
        stroke: #e5e7eb;
        stroke-width: 8;
      }
      .score-circle-fg {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        stroke-dasharray: 339.292;
        stroke-dashoffset: 339.292;
        transition: stroke-dashoffset 1s ease-out, stroke 0.3s;
      }
      .score-text-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #1f2937; /* Enforce dark text */
      }
      .score-value { font-size: 32px; font-weight: 700; line-height: 1; }
      .score-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }

      .status { text-align: center; font-size: 18px; margin-bottom: 12px; font-weight: 600; }
      .message { text-align: center; color: #4b5563; margin-bottom: 20px; line-height: 1.5; }
      
      .tweet-media { margin-bottom: 15px; border-radius: 8px; overflow: hidden; max-height: 200px; }
      .tweet-media img, .tweet-media video { width: 100%; height: 100%; object-fit: cover; }

      /* Buttons */
      .tweet-fact-check-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(29, 155, 240, 0.1);
        color: #1d9bf0;
        border: none;
        padding: 6px 12px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .tweet-fact-check-btn:hover { background: rgba(29, 155, 240, 0.2); }
      
      .details ul { list-style: none; padding: 0; margin: 0; }
      .details li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
      .details li:last-child { border-bottom: none; }
      
      /* Agent Result Box */
      #agent-result {
        color: #1f2937 !important; /* Force dark text */
      }
      .agent-content {
        color: #1f2937 !important;
      }
    `;
    document.head.appendChild(style);

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Tweet Credibility Check</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="loading">
            <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            <p style="text-align: center; color: #6b7280;">Analyzing tweet content...</p>
          </div>
          <div class="result" style="display: none;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close button handler
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    return modal;
    return modal;
  };

  // Extract author info from tweet
  const getTweetAuthor = (tweetElement) => {
    try {
      const userElement = tweetElement.querySelector('[data-testid="User-Name"]');
      if (!userElement) return { handle: 'unknown', verified: false, name: 'Unknown' };

      const text = userElement.innerText;
      const lines = text.split('\n');
      const name = lines[0] || 'Unknown';
      const handle = lines.find(l => l.startsWith('@')) || 'unknown';

      // Check for verified icon (SVG path usually contains "Verified" in aria-label or specific path data)
      // Simpler check: look for the SVG that usually denotes verification in the User-Name block
      const verifiedIcon = userElement.querySelector('svg[data-testid="icon-verified"]');
      const verified = !!verifiedIcon;

      return { name, handle, verified };
    } catch (e) {
      return { handle: 'unknown', verified: false, name: 'Unknown' };
    }
  };

  // Analyze individual tweet content using AI backend (Direct Agent Call)
  const analyzeTweetContent = async (tweetText, tweetMedia = null, authorInfo = null) => {
    try {
      // Send message to background script for AGENT verification
      const response = await chrome.runtime.sendMessage({
        type: 'VERIFY_WITH_AGENT',
        payload: {
          text: tweetText,
          author: authorInfo
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response;

    } catch (error) {
      console.error('Analysis failed:', error);
      return { error: error.message };
    }
  };

  // Map Agent Verdict to UI Colors
  const mapAgentVerdictToUI = (verdict) => {
    const v = verdict ? verdict.toLowerCase() : "";
    let color = '#9ca3af'; // Default Grey
    let score = 50; // Default middle

    if (v.includes('true') && !v.includes('likely')) {
      color = '#22c55e'; // Green
      score = 100;
    } else if (v.includes('likely true')) {
      color = '#eab308'; // Yellow
      score = 75;
    } else if (v.includes('likely false')) {
      color = '#f97316'; // Orange
      score = 25;
    } else if (v.includes('false')) {
      color = '#ef4444'; // Red
      score = 0;
    } else {
      // Unverified or Mixed
      color = '#9ca3af'; // Grey
      score = 50;
    }
    return { color, score };
  };

  // Display results in modal (Direct Agent Version)
  const showResults = (agentResponse, media = null, originalText = "") => {
    const modal = document.getElementById('fake-news-detector-modal');
    const loading = modal.querySelector('.loading');
    const resultDiv = modal.querySelector('.result');

    loading.style.display = 'none';
    resultDiv.style.display = 'block';

    if (agentResponse.error) {
      resultDiv.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Error: ${agentResponse.error}</div>`;
      return;
    }

    // Map verdict to color
    const { color, score } = mapAgentVerdictToUI(agentResponse.verdict);

    // Build media thumbnail HTML
    let mediaHTML = '';
    if (media && (media.images.length > 0 || media.videos.length > 0)) {
      if (media.images.length > 0) {
        mediaHTML = `<div class="tweet-media"><img src="${media.images[0]}" style="width:100%; height:150px; object-fit:cover; border-radius:8px;"></div>`;
      }
    }

    resultDiv.innerHTML = `
      <div class="score-container">
        <svg class="score-gauge" viewBox="0 0 120 120">
          <circle class="score-circle-bg" cx="60" cy="60" r="54"></circle>
          <circle id="modal-score-circle-fg" class="score-circle-fg" cx="60" cy="60" r="54"></circle>
        </svg>
        <div class="score-text-center">
          <!-- Numeric score hidden as requested -->
          <div class="score-label" style="font-size: 14px; color: ${color}; font-weight: bold;">${agentResponse.verdict}</div>
        </div>
      </div>
      
      ${mediaHTML}
      
      <div class="status" style="color: ${color}">
        <strong>${agentResponse.verdict}</strong>
      </div>
      
      <div id="agent-content" style="margin-top: 15px; background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 14px; border: 1px solid #e5e7eb; color: #1f2937;">
      </div>
    `;

    // Animate Gauge
    const scoreCircleFg = document.getElementById('modal-score-circle-fg');
    scoreCircleFg.style.stroke = color;
    const circumference = 339.292;
    const offset = circumference - (score / 100) * circumference;
    setTimeout(() => {
      scoreCircleFg.style.strokeDashoffset = offset;
    }, 50);

    // Type the summary
    const agentContent = document.getElementById('agent-content');
    typeWriter(agentContent, agentResponse.summary, 20);
  };

  // Create check button for individual tweet
  const createTweetButton = () => {
    const button = document.createElement('button');
    button.className = 'tweet-fact-check-btn';
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Check</span>
    `;
    button.title = 'Check tweet credibility';
    return button;
  };

  // Extract tweet text from tweet element
  const getTweetText = (tweetElement) => {
    const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
    if (tweetTextElement) {
      return tweetTextElement.innerText;
    }
    return tweetElement.innerText || 'No text found';
  };

  // Extract media from tweet
  const getTweetMedia = (tweetElement) => {
    const media = { images: [], videos: [], tweetUrl: '' };
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    if (tweetLink) media.tweetUrl = tweetLink.href;

    const videoElement = tweetElement.querySelector('video');
    if (!videoElement) {
      const images = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img');
      images.forEach(img => {
        if (img.src && !img.src.includes('profile_images')) media.images.push(img.src);
      });
    }

    if (videoElement) {
      const sources = Array.from(videoElement.querySelectorAll('source'));
      const videoSrc = videoElement.src || videoElement.currentSrc || (sources.length > 0 ? sources[0].src : '');
      media.videos.push({ poster: videoElement.poster || '', src: videoSrc });
    }
    return media;
  };

  // Add button to a tweet
  const addButtonToTweet = (tweetElement) => {
    if (processedTweets.has(tweetElement)) return;

    const actionBar = tweetElement.querySelector('[role="group"]');
    if (!actionBar) return;

    const checkButton = createTweetButton();
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'tweet-check-wrapper';
    buttonWrapper.appendChild(checkButton);

    checkButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const tweetText = getTweetText(tweetElement);
      const tweetMedia = getTweetMedia(tweetElement);
      const authorInfo = getTweetAuthor(tweetElement);

      const modal = document.getElementById('fake-news-detector-modal');
      const loading = modal.querySelector('.loading');
      const resultDiv = modal.querySelector('.result');

      modal.style.display = 'flex';
      loading.style.display = 'block';
      resultDiv.style.display = 'none';

      const results = await analyzeTweetContent(tweetText, tweetMedia, authorInfo);
      showResults(results, tweetMedia, tweetText);
    });

    actionBar.appendChild(buttonWrapper);
    processedTweets.add(tweetElement);
  };

  // Find and process all tweets on the page
  const processTweets = () => {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(tweet => addButtonToTweet(tweet));
  };

  // Observe for new tweets
  const observeNewTweets = () => {
    const observer = new MutationObserver(() => processTweets());
    const timeline = document.querySelector('main');
    if (timeline) observer.observe(timeline, { childList: true, subtree: true });
  };

  // Initialize
  const init = () => {
    createResultModal();
    processTweets();
    observeNewTweets();
    setInterval(processTweets, 2000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

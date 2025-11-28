import { analyzeText } from './src/analyzer.js';
import { verifyClaim } from './src/agent.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_TEXT') {
    // Perform analysis
    analyzeText(request.payload)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Analysis error:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.type === 'VERIFY_WITH_AGENT') {
    verifyClaim(request.payload.text)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Agent error:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (request.type === 'CHAT_WITH_AGENT') {
    import('./src/agent.js').then(module => {
      module.chatWithAgent(request.payload.question, request.payload.context)
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          console.error('Chat error:', error);
          sendResponse({ error: error.message });
        });
    });
    return true;
  }
});

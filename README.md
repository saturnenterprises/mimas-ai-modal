# MimasAI - AI-Powered Tweet Verification

MimasAI is a powerful tool designed to detect potentially false or misleading information on X.com (Twitter) using advanced LLM analysis (Google Gemini). It is available as both a **Browser Extension** and a **Mobile App**.

## Features

- **Direct AI Analysis**: Uses Google's Gemini 1.5 Flash model to analyze tweet content, context, and author credibility.
- **Categorical Verdicts**: Provides clear verdicts: **True**, **Likely True**, **Unverified**, **Likely False**, or **False**.
- **Visual Gauge**: Easy-to-read color-coded gauge representing the credibility score.
- **Author Context**: Checks for verified status to flag suspicious unverified accounts.
- **Privacy Focused**: Your API key is stored locally on your device.

---

## 1. Getting Started: Get Your API Key

To use MimasAI, you need a free Google Gemini API Key.

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Click **Create API Key**.
3.  Copy the key (starts with `AIza...`).

---

## 2. Browser Extension (Chrome/Edge/Brave)

The extension adds a "Check" button directly to tweets on X.com.

### Installation

1.  **Download/Clone** this repository to your computer.
2.  Open your browser and go to the Extensions page:
    *   Chrome: `chrome://extensions`
    *   Edge: `edge://extensions`
3.  Enable **Developer Mode** (toggle in the top-right corner).
4.  Click **Load Unpacked**.
5.  Select the **root folder** of this project (where `manifest.json` is located).

### Configuration

1.  Click the **MimasAI icon** in your browser toolbar.
2.  Click **"Open Options to Configure API Key"**.
3.  Paste your **Gemini API Key** and click **Save**.

### Usage

1.  Go to [x.com](https://x.com).
2.  You will see a **"Check"** button on every tweet (next to the share icon).
3.  Click it to instantly verify the tweet.

---

## 3. Mobile App (iOS/Android)

The mobile app allows you to verify X.com links on the go.

### Prerequisites

-   [Node.js](https://nodejs.org/) installed.
-   [Expo Go](https://expo.dev/client) app installed on your phone.

### Installation & Running

1.  Open a terminal in the project folder.
2.  Navigate to the mobile directory:
    ```bash
    cd mobile
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the app:
    ```bash
    npx expo start
    ```
5.  Scan the **QR Code** with your phone's camera (iOS) or the Expo Go app (Android).

### Usage

1.  **First Run**: Enter your **Gemini API Key** when prompted.
2.  **Verify**:
    *   **Paste**: Copy a tweet link and tap "Paste".
    *   **Type**: Manually enter an X.com link.
    *   Tap **"Verify Tweet"**.
3.  The app will load the tweet in the background and display the analysis result.

---

## Troubleshooting

-   **API Error 404/400**: Ensure your API key is valid and has access to the `gemini-1.5-flash` model.
-   **"Fetching Tweet" Stuck**: Ensure you are logged in to X.com if prompted (the app handles this in the background usually, but may require a one-time login).
-   **Extension Button Not Showing**: Refresh the X.com page.

## License

MIT License. Free to use and modify.

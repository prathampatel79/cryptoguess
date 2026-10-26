# CryptoGuess // Crack the Clue

> **Encrypted Word Protocol — MGM SYNERGY 2026 Exhibition Project**  
> *Live Exhibit Date: 28 October 2026*

CryptoGuess is a fast-paced, cybersecurity-themed browser word game built with vanilla web technologies. It fuses clue-based cryptographic deduction with Wordle-style letter-position feedback, dynamic time pressure, difficulty clearance levels, a persistent badge system, and local/cloud leaderboards.

---

## Key Highlights

- **Pure Vanilla Stack**: Zero frameworks, zero compilers, zero dependencies. Runs instantly via `file://`, any static web server, or GitHub Pages.
- **Offline-First & Local-First**: Full offline support after initial load. Personal bests, win streaks, 10 unlockable operative badges, and top-10 difficulty leaderboards are saved directly in browser `localStorage`.
- **Wordle-Accurate Evaluation**: Multi-pass letter frequency matching correctly handles repeated letters without phantom green or amber highlights.
- **Strict Guess Validation**: Non-dictionary words shake the active row with audio feedback and **do not consume attempts**.
- **Four Clearance Levels + UTC Daily Cipher**:
  - **Easy**: 4–5 letter words, 6 attempts, 120-second timer.
  - **Medium**: 5–6 letter words, 6 attempts, 100-second timer.
  - **Hard**: 6–7 letter words, 5 attempts, 80-second timer.
  - **Expert**: 7–9 letter words, 5 attempts, 65-second timer.
  - **Daily Cipher**: Synchronized UTC date hash ensuring all operatives globally solve the same encrypted target each day.
- **Decryption Aids (Hints)**: Two hint tokens per case. Reveal the starting letter or unlock a secondary clue at the cost of a score penalty and forfeiting the pristine "no-hint" bonus.
- **Live Synthesized Sound FX**: Dynamic audio generated in-browser via the Web Audio API (no external sound file downloads, with a persistent mute toggle).
- **Responsive Cyberpunk UI**: Handcrafted dark navy/cyan visual theme optimized down to 320px mobile screens with full keyboard accessibility and reduced-motion support.
- **Optional Firebase Cloud Leaderboard**: Ready-to-connect Realtime Database integration with graceful offline fallback when unconfigured.

---

## File Structure

```text
cryptoguess/
├── assets/
│   └── favicon.svg           # Cyberpunk neon brand vector icon
├── js/
│   ├── app.js                # Core controller, DOM binding, timers, storage, sound & dialog flows
│   ├── cloud.js              # Optional Firebase Realtime DB adapter with local fallback
│   ├── firebase-config.js    # Public Firebase configuration (disabled by default)
│   ├── game-logic.js         # Pure deterministic game engine (scoring, feedback, dictionary, pools)
│   └── words.js              # Curated 300-word vault + 1,462 extra valid guess vocabulary
├── scripts/
│   ├── test-logic.js         # Automated regression test suite for rules, scoring & feedback
│   └── validate-content.js   # Vocabulary validation (unique answers, clue safety, difficulty distributions)
├── styles.css                # Complete responsive styling, custom properties, animations & media queries
├── index.html                # Semantic HTML5 application shell and accessible modal dialogs
└── README.md                 # Complete project documentation and configuration guide
```

---

## Quick Start / Running Locally

### Option 1: Direct File Launch
Double-click `index.html` or open it directly in any modern desktop or mobile browser (`file:///path/to/cryptoguess/index.html`). All scripts use standard UMD module wrappers and load cleanly without requiring a local web server.

### Option 2: Python 3 Static Server
From the project directory:
```bash
python3 -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 3: Node.js Static Server
```bash
npx serve .
# or
npx http-server -p 8000
```

---

## Deploying to GitHub Pages

CryptoGuess is structured for immediate deployment to GitHub Pages without any build steps:

1. Create a repository on GitHub (e.g. `cryptoguess`).
2. Push this folder to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial release of CryptoGuess: Crack the Clue"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cryptoguess.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`.
   - Click **Save**.
4. Your site will be published at `https://<your-username>.github.io/cryptoguess/`. All stylesheet and script references are relative, guaranteeing seamless hosting on any subpath.

---

## Rules of Engagement

1. **Read the Intercepted Clue**: Each case displays a cryptic clue describing the secret keyword, along with the required letter count.
2. **Submit Words via Keyboard**: Type using your physical keyboard or the on-screen cyberpunk key deck. Press <kbd>ENTER</kbd> to transmit your guess.
3. **Decipher the Signals**:
   - <span style="color: #1fd18b; font-weight: bold;">Green</span>: Correct letter in the exact slot.
   - <span style="color: #ffb020; font-weight: bold;">Amber</span>: The letter exists in the secret key, but belongs in another slot.
   - <span style="color: #e23e5c; font-weight: bold;">Red</span>: The letter does not exist in the secret key (or all instances have already been accounted for).
4. **Dictionary Verification**: Guesses must be recognizable English words contained within the 1,762-word dictionary. Gibberish or incomplete submissions are rejected without penalty.
5. **Score Optimization**: Clearance score is calculated upon solving:
   $$\text{Score} = \text{Base} + (\text{Unused Attempts} \times \text{Bonus}) + \left(\left\lfloor\frac{\text{Seconds Left}}{10}\right\rfloor \times \text{Time Rate}\right) + \text{No-Hint Bonus} - (\text{Hints} \times \text{Penalty})$$
   *Unsuccessful cases (exhausted attempts or clock expiration) award 0 points.*

### Clearance Parameters

| Clearance | Word Length | Attempts | Time Limit | Base Pts | Try Bonus | 10s Rate | No-Hint | Hint Penalty | Max Possible |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Easy** | 4–5 | 6 | 120s | 100 | +12 | +2 | +20 | -10 | 216 |
| **Medium** | 5–6 | 6 | 100s | 160 | +18 | +3 | +35 | -15 | 333 |
| **Hard** | 6–7 | 5 | 80s | 240 | +25 | +4 | +60 | -25 | 457 |
| **Expert** | 7–9 | 5 | 65s | 340 | +35 | +5 | +90 | -40 | 635 |
| **Daily** | 4–9 | 6 | 110s | 180 | +15 | +3 | +40 | -15 | 343 |

---

## Operative Badges (Achievements)

Achievements are checked and unlocked dynamically upon solving cases:

1. **FIRST CONTACT** (`01`): Clear your first case.
2. **CLEAN SIGNAL** (`02`): Clear a case without using any hint tokens.
3. **SHARP EYE** (`03`): Solve a case within two attempts.
4. **SPEED RUN** (`04`): Finish a case with 45 seconds or more remaining.
5. **TRIPLE LOCK** (`05`): Win 3 cases in a row.
6. **CHAIN REACTION** (`06`): Win 5 cases in a row.
7. **DEEP COVER** (`07`): Clear a case on Expert clearance.
8. **DAILY DECRYPT** (`08`): Clear today's UTC Daily Cipher.
9. **HIGH VOLTAGE** (`09`): Score 500 or more points in a single case.
10. **FIELD VETERAN** (`10`): Clear 10 cases in total.

---

## Word Vault & Content Specification

- **Total Secret Answers**: 300 unique words. (60% easy, 38.3% intermediate, 1.7% advanced)
- **Difficulty Distribution**:
  - Easy (4–5 letters): 180 words (60.0%)
  - Intermediate / Medium (5–8 letters): 115 words (38.3%)
  - Advanced / Expert (8–9 letters): 5 words (1.7%)
- **Length Breakdown**: 95 4-letter, 115 5-letter, 45 6-letter, 35 7-letter, 8 8-letter, 2 9-letter words.
- **Playable Clearance Pools**:
  - Easy: 210 words (all 4–5 letter answers)
  - Medium: 160 words (all 5–6 letter answers)
  - Hard: 80 words (all 6–7 letter answers)
  - Expert: 45 words (all 7–9 letter answers)
  - Daily: 300 words (full vault)
- **Combined Guess Dictionary**: 1,762 valid words (300 secret words + 1,462 auxiliary guess words).

---

## Automated Validation & Testing

Run the included automated verification scripts using Node.js:

```bash
# 1. Run core logic & Wordle algorithm tests
node scripts/test-logic.js

# 2. Run content & word bank integrity validation
node scripts/validate-content.js

# 3. Syntax check all application source files
node --check js/app.js
node --check js/cloud.js
node --check js/firebase-config.js
node --check js/game-logic.js
node --check js/words.js
```

### What `validate-content.js` Checks:
- Exact 300 answer count with zero duplicates.
- Strict uppercase alphabet filtering (`^[A-Z]{4,9}$`).
- Target vocabulary proportions: 60% easy, 38.3% medium, 1.7% advanced.
- Minimum 30 playable words available in every clearance pool.
- Full grammatical sentence verification for all clues and hints (punctuation checks).
- Security assertion verifying clues/hints never contain the secret keyword as a whole word.
- Zero duplicate entries in the auxiliary guess dictionary.

---

## Optional: Configuring Shared Cloud Leaderboard (Firebase)

By default, CryptoGuess runs in **Local Archive** mode with `localStorage`. To enable a live shared leaderboard across multiple devices during the MGM SYNERGY exhibition:

### Step 1: Create a Firebase Project
1. Visit the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In the project dashboard, click **Build** > **Realtime Database** > **Create Database**.
3. Choose your nearest database region and start in **Locked mode**.
4. In the left navigation, click **Build** > **Authentication** > **Get Started**. Enable the **Anonymous** sign-in provider.

### Step 2: Configure Realtime Database Security Rules
In your Firebase Realtime Database tab, select **Rules** and paste the following rules:

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".indexOn": ["score", "difficulty", "createdAt"],
      "$entry_id": {
        ".write": "auth != null && !data.exists()",
        ".validate": "newData.hasChildren(['name', 'score', 'difficulty', 'time', 'attempts', 'createdAt']) &&
                      newData.child('name').isString() &&
                      newData.child('name').val().length >= 2 &&
                      newData.child('name').val().length <= 16 &&
                      newData.child('score').isNumber() &&
                      newData.child('score').val() >= 0 &&
                      newData.child('score').val() <= 99999 &&
                      newData.child('difficulty').isString() &&
                      (newData.child('difficulty').val() == 'easy' ||
                       newData.child('difficulty').val() == 'medium' ||
                       newData.child('difficulty').val() == 'hard' ||
                       newData.child('difficulty').val() == 'expert' ||
                       newData.child('difficulty').val() == 'daily') &&
                      newData.child('time').isNumber() &&
                      newData.child('time').val() >= 0 &&
                      newData.child('attempts').isNumber() &&
                      newData.child('attempts').val() >= 1 &&
                      newData.child('attempts').val() <= 20 &&
                      newData.child('createdAt').isNumber()"
      }
    }
  }
}
```

### Step 3: Add Credentials to `js/firebase-config.js`
In your Firebase project settings, under **Your apps**, create a Web App (`</>`). Copy the web configuration object into `js/firebase-config.js` and set `enabled: true`:

```javascript
window.CRYPTOGUESS_FIREBASE = {
  enabled: true,
  apiKey: "AIzaSyYourActualApiKeyHere",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  appId: "1:1234567890:web:abcdef123456",
  sdkVersion: "10.12.5",
  requireAnonymousAuth: true
};
```

> **Security Note**: Firebase Web Configuration values (`apiKey`, `databaseURL`, etc.) are public identifiers used by client browsers to locate your project. Your database is secured by the **Security Rules** defined above, which mandate schema conformance, prohibit overwriting existing scores, enforce data lengths, and require valid anonymous tokens.

---

## Known Boundaries & Disclaimers

1. **Clue Curation**: Word bank validation tests sentence punctuation, length, and ensures clues do not accidentally give away the solution. While every clue has been reviewed, automated validation checks syntactic integrity rather than deep semantic difficulty across every single clue.
2. **Cloud Dependency**: If Firebase is left unconfigured (`enabled: false`), the application seamlessly uses the local archive without attempting network requests or displaying console errors.

---

*Crafted for the MGM SYNERGY 2026 Innovation Showcase.*

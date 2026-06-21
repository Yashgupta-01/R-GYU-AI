# AI Courtroom Debate Simulator 🏛️

An interactive, real-time debate simulation platform powered by Google's Gemini API. Watch AI personas argue opposing sides of contentious topics with judicial scoring, fallacy detection, and coach injection mechanics.

## Features

### Core Debate Engine
- **Multi-Round Debates**: Configurable 2-5 round debates with real-time argument generation
- **Dynamic Persona System**: Choose from diverse argumentative archetypes (Plaintiff vs Defendant)
  - Each persona has unique ideological grounding and memory capacity
  - System prompts tailored for ideological consistency and debate style
- **Live Judicial Scoring**: Judge AI evaluates arguments on logic, evidence, and persuasiveness after each round
- **Interactive Coach System**: Whisper tactical instructions to debaters between their turns to influence strategy

### Advanced Features
- **Fallacy Detection Engine**: Automated logical fallacy audit runs after debate completion
  - Identifies ad hominem, straw man, appeal to authority, and 10+ fallacy types
  - Generates reasoning for each detected fallacy
- **Multi-Model Support**: 
  - Gemini 1.5 Flash (recommended, fastest)
  - Gemini 1.5 Flash 8B, 1.5 Pro, 2.0 Flash, 2.0 Flash Lite
- **Debate Record System**: Complete transcript capture with live feed indicator
- **Text-to-Speech Integration**: Read arguments aloud with toggleable speech synthesis
- **Export Capabilities**: Download full debate records in Markdown format
- **Random Topic Generator**: 🎲 Generate debate topics from 50+ pre-seeded prompts

### UI/UX
- **Courtroom Theater**: Animated character avatars (Judge, Plaintiff, Defendant)
- **Scoreboard Display**: Real-time score visualization with round counter
- **Tabbed Interface**: Separate panels for Debate Record, Fallacy Audit, and Judicial Opinions
- **Responsive Design**: Works seamlessly across desktop and tablet devices

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **APIs**: Google Gemini API (streaming)
- **Architecture**: Browser-native (no backend required)
- **Storage**: Browser LocalStorage for API key management
- **Styling**: Custom CSS with semantic HTML

## Project Structure

R-GYU-AI/

├── index.html              # Main application shell (354 lines)

├── style.css              # Courtroom theming & responsive design

├── package.json           # Dependencies (Google fonts, utilities)

├── js/

│   ├── app.js             # Main application controller

│   ├── debate-engine.js   # Debate flow & round management

│   ├── judge.js           # Judicial scoring logic

│   ├── fallacy.js         # Fallacy detection system

│   ├── transcript.js      # Transcript capture & formatting

│   ├── personas.js        # Persona definitions & prompts

│   └── topic-gen.js       # Topic generation & curation

└── node_modules/          # Package dependencies

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google Gemini API key

### Setup

1. **Clone the repository**
```bash
   git clone https://github.com/Yashgupta-01/R-GYU-AI.git
   cd R-GYU-AI
```

2. **Install dependencies**
```bash
   npm install
```

3. **Obtain API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key for Gemini API
   - Keep it secure—never commit it to version control

4. **Run the Application**
```bash
   # Simple HTTP server
   python -m http.server 8000
   # or
   npx http-server
```
   Open `http://localhost:8000` in your browser

5. **Configure API**
   - Click **🔑 API Key Settings** in the top-right
   - Paste your Gemini API key
   - Click **Save Changes**

## Usage

### Basic Workflow

1. **Set Debate Topic**
   - Enter a topic manually (e.g., "Universal Basic Income")
   - Or click 🎲 to generate a random topic from the curated list

2. **Select Personas**
   - Choose Plaintiff (left podium) and Defendant (right podium)
   - Preview each persona's ideological stance below the dropdown

3. **Configure Debate Parameters**
   - Set number of rounds (2-5)
   - Select AI model (Gemini 1.5 Flash recommended for speed/quality balance)

4. **Convene Courtroom**
   - Click **🏛️ Convene Courtroom** to begin
   - Judge animates to attention; debaters stream arguments in real-time
   - Live feed indicator shows who is speaking

5. **Coach Debaters (Optional)**
   - While a debater is waiting, click **🤫 Whisper Instruction**
   - Enter tactical guidance (e.g., "Focus on cost-benefit analysis")
   - Send—the instruction is injected into their next turn's prompt

6. **Review Judicial Opinions**
   - After each round, Justice AI provides scoring and reasoning
   - View scores in the scoreboard or detailed opinions in the **⚖️ Judicial Opinions** tab

7. **Fallacy Audit** (After Debate)
   - Click **🔍 Run Fallacy Analysis** to execute post-debate audit
   - Review detected fallacies in the **🔍 Fallacy Audit** tab
   - Download full transcript as Markdown

### Advanced Features

#### Text-to-Speech
- Click **🔊 Speech: Off** to toggle audio playback of arguments
- Useful for hands-free debate review

#### Export Options
- **Markdown Transcript**: Full debate record with structure, scores, and timestamps
- **Fallacy Report**: Detailed analysis of logical fallacies per argument

## Persona Reference

Personas are pre-defined argumentative archetypes. Each has:
- Unique ideological perspective
- Characteristic debate style (aggressive, evidential, emotional, etc.)
- Memory of prior round arguments for consistency
- Custom system prompt ensuring coherence

See `js/personas.js` for full persona definitions.

## Model Selection Guide

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| Gemini 1.5 Flash | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $ | **Recommended**: Fast, high-quality |
| Gemini 1.5 Flash 8B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $ | Speed-critical, simple debates |
| Gemini 1.5 Pro | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $$ | Deep philosophical topics |
| Gemini 2.0 Flash | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $ | Newer model, experimental |

## API Costs & Rate Limits

- **Gemini API**: Free tier includes 15 RPM / 1M TPD
- **Per-Debate Cost**: ~5-15k tokens (variable by model, rounds, argument length)
- **Rate Limits**: Applies per API key; use different keys for high-frequency runs

## Troubleshooting

### "API Key Error" or 403 Unauthorized
- Verify API key is valid and not expired
- Check that Gemini API is enabled in your Google Cloud project
- Ensure no whitespace in pasted key

### Debate Freezes / No Arguments Appear
- Check browser console for JS errors (F12 → Console)
- Verify API key and internet connection
- Try refreshing and restarting debate

### Persona Not Found
- Clear browser LocalStorage: DevTools → Application → Local Storage → Clear All
- Reload page and re-enter API key

## Limitations & Roadmap

### Current Limitations
- Browser-based only (no persistent history across sessions)
- Real-time streaming introduces minor latency
- Fallacy detection is heuristic-based (not 100% accurate)
- Persona consistency depends on context window size

### Future Enhancements
- Backend persistence (debate history DB)
- Multi-language debate support
- Audience voting system
- Custom persona creation UI
- Debate replay with playback controls
- Integration with debate datasets for benchmarking

## Contributing

Contributions welcome! Areas of interest:
- Additional persona archetypes
- Fallacy detection improvements
- UI/UX refinements
- Performance optimizations

To contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License—see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini API for LLM backbone
- Inspired by Oxford debate format and competitive argumentation
- Built as a portfolio project for AI engineering roles

## Contact & Support

For issues, questions, or collaboration:
- Open an [Issue](https://github.com/Yashgupta-01/R-GYU-AI/issues)
- Email: yashgupta01.dev@gmail.com
- LinkedIn: [Yash Gupta](https://linkedin.com/in/yashgupta-dev)

---

**Enjoy the courtroom! May the best argument win.** ⚖️

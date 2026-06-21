// Debate Orchestration Engine for the AI Courtroom Debate Simulator

class DebateEngine {
  constructor() {
    this.apiKey = "";
    this.topic = "";
    this.model = "gemini-2.0-flash";
    this.totalRounds = 3;
    this.currentRound = 0;
    
    this.leftPersona = null;
    this.rightPersona = null;
    
    // History logs
    this.roundsData = []; // Array of { round: N, leftText: "", rightText: "", judgeScore: {...} }
    this.coachNotesLeft = "";  // Next coach instruction for left
    this.coachNotesRight = ""; // Next coach instruction for right
    
    // Status states
    this.isDebateRunning = false;
    this.isPaused = false;
    
    // Callback Hooks
    this.onStateChange = () => {};     // (statusText, speakerId, animationClass)
    this.onTextStream = () => {};      // (speakerId, textChunk)
    this.onSpeakerFinished = () => {}; // (speakerId, fullText)
    this.onRoundComplete = () => {};   // (roundNumber, leftArg, rightArg, judgeRuling)
    this.onDebateComplete = () => {};  // (winnerId, finalLeftScore, finalRightScore)
    this.onError = () => {};           // (errorMessage)
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  configure(config) {
    this.topic = config.topic || this.topic;
    this.model = config.model || this.model;
    this.totalRounds = parseInt(config.rounds) || this.totalRounds;
    this.leftPersona = config.leftPersona;
    this.rightPersona = config.rightPersona;
    this.reset();
  }

  reset() {
    this.currentRound = 0;
    this.roundsData = [];
    this.coachNotesLeft = "";
    this.coachNotesRight = "";
    this.isDebateRunning = false;
    this.isPaused = false;
  }

  // Inject coach note privately
  injectCoachNote(side, note) {
    if (side === "left") {
      this.coachNotesLeft = note;
    } else {
      this.coachNotesRight = note;
    }
  }

  // Retrieve formatted chat transcript for Gemini context
  getFormattedHistory() {
    let historyStr = "";
    this.roundsData.forEach((r, idx) => {
      historyStr += `ROUND ${idx + 1}:\n`;
      historyStr += `${this.leftPersona.name} (Plaintiff):\n"${r.leftText}"\n\n`;
      if (r.rightText) {
        historyStr += `${this.rightPersona.name} (Defendant):\n"${r.rightText}"\n\n`;
      }
      if (r.judgeScore) {
        historyStr += `JUDGE REVIEW (Round ${idx + 1}):\n`;
        historyStr += `Scores: ${this.leftPersona.name}: ${r.judgeScore.left.total}/10 | ${this.rightPersona.name}: ${r.judgeScore.right.total}/10\n`;
        historyStr += `Commentary: "${r.judgeScore.commentary}"\n\n`;
      }
      historyStr += `--------------------------------------------------\n\n`;
    });
    return historyStr;
  }

  // Persona memory: compile summaries of previous turns
  getPersonaMemory(side) {
    const isLeft = side === "left";
    const myName = isLeft ? this.leftPersona.name : this.rightPersona.name;
    const turns = this.roundsData.map((r, idx) => {
      const text = isLeft ? r.leftText : r.rightText;
      if (!text) return null;
      // Get first 120 chars as summary
      return `Round ${idx + 1}: "${text.substring(0, 120)}..."`;
    }).filter(t => t !== null);

    if (turns.length === 0) return "";
    return `\nMEMORY PREVIEW - You previously argued:\n` + turns.join("\n") + `\nAlways refer back to these points using "As I argued in Round..." or "To expand on my earlier point..." to show continuity.\n`;
  }

  // Call Gemini API with Streaming support
  async callGeminiStream(systemInstruction, prompt, onChunk) {
    const apiVersion = this.model.startsWith("gemini-2.0") ? "v1beta" : "v1";
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;
    
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (HTTP ${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Parse streaming chunks
      // Gemini stream returns JSON objects that might look like:
      // [{"candidates": [...]}, {"candidates": [...]}]
      // We clean outer brackets and commas to process individual objects
      let cleaned = buffer.trim();
      if (cleaned.startsWith("[")) cleaned = cleaned.substring(1);
      if (cleaned.endsWith("]")) cleaned = cleaned.substring(0, cleaned.length - 1);
      
      const parts = cleaned.split(/\n\s*,\s*\n|\n\s*,\s*|,\s*\n/);
      
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim();
        if (part.startsWith(",")) part = part.substring(1).trim();
        if (!part) continue;
        
        try {
          const json = JSON.parse(part);
          if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
            const text = json.candidates[0].content.parts[0].text;
            if (text) {
              onChunk(text);
              // Remove parsed part from buffer to prevent reprocessing
              const index = buffer.indexOf(part);
              if (index !== -1) {
                buffer = buffer.substring(index + part.length);
              }
            }
          }
        } catch (e) {
          // JSON is incomplete (mid-chunk), wait for more data
        }
      }
    }
  }

  // Execute the entire debate cycle round by round
  async startDebateLoop() {
    if (!this.apiKey) {
      this.onError("Gemini API Key is missing! Set it in API Settings.");
      return;
    }
    
    this.isDebateRunning = true;
    this.isPaused = false;
    
    try {
      while (this.currentRound < this.totalRounds && this.isDebateRunning) {
        if (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        this.currentRound++;
        this.onStateChange(`Round ${this.currentRound} Commencing`, null, "state-idle");
        
        // Initialize Round Data
        const roundItem = { round: this.currentRound, leftText: "", rightText: "", judgeScore: null };
        this.roundsData.push(roundItem);

        // --- Step 1: Plaintiff (Left) Turn ---
        await this.runDebaterTurn("left", roundItem);
        if (!this.isDebateRunning) break;
        
        // Short pause between speakers
        await new Promise(resolve => setTimeout(resolve, 1500));

        // --- Step 2: Defendant (Right) Turn ---
        await this.runDebaterTurn("right", roundItem);
        if (!this.isDebateRunning) break;

        // Short pause before judge scores
        await new Promise(resolve => setTimeout(resolve, 1500));

        // --- Step 3: Judge Review & Score ---
        await this.runJudgeTurn(roundItem);
        if (!this.isDebateRunning) break;

        // Dispatch completed round data
        this.onRoundComplete(this.currentRound, roundItem.leftText, roundItem.rightText, roundItem.judgeScore);
        
        // Pause briefly after round results
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      if (this.isDebateRunning) {
        // Conclude debate and declare winner
        this.concludeDebate();
      }
    } catch (error) {
      this.onError(error.message);
      this.isDebateRunning = false;
    }
  }

  async runDebaterTurn(side, roundItem) {
    const isLeft = side === "left";
    const speakerId = isLeft ? "left" : "right";
    const activePersona = isLeft ? this.leftPersona : this.rightPersona;
    const opponentPersona = isLeft ? this.rightPersona : this.leftPersona;
    const roleName = isLeft ? "Plaintiff" : "Defendant";
    
    // UI state updates: speaking/listening classes
    this.onStateChange(`${activePersona.name} is presenting arguments...`, speakerId, "state-arguing");
    
    // Check for whisper coach notes
    let coachInstruction = "";
    if (isLeft && this.coachNotesLeft) {
      coachInstruction = `\n[PRIVATE COACH ADVICE]: ${this.coachNotesLeft}\n`;
      this.coachNotesLeft = ""; // consume
    } else if (!isLeft && this.coachNotesRight) {
      coachInstruction = `\n[PRIVATE COACH ADVICE]: ${this.coachNotesRight}\n`;
      this.coachNotesRight = ""; // consume
    }

    // Assemble Prompt
    const memoryBlock = this.getPersonaMemory(side);
    const historyText = this.getFormattedHistory();
    
    const systemInstruction = activePersona.systemPrompt;
    
    const userPrompt = `
You are the ${roleName} in a formal courtroom debate.
Your opponent is: ${opponentPersona.name} (${isLeft ? 'Defendant' : 'Plaintiff'})
Debate Topic: ${this.topic}

Current Round: ${this.currentRound} of ${this.totalRounds}

${historyText ? `--- DEBATE RECORD SO FAR ---\n${historyText}` : "This is the first round of the debate. You must lay out your opening arguments."}
${memoryBlock}
${coachInstruction}

Deliver your speech for Round ${this.currentRound}. Keep your response within 2-3 paragraphs. Directly address the topic and respond to your opponent's points if they have spoken. Do not write intros like "Your Honor..." every single sentence, write a structured, powerful, persuasive courtroom speech.
`;

    let fullOutput = "";
    await this.callGeminiStream(systemInstruction, userPrompt, (chunk) => {
      fullOutput += chunk;
      this.onTextStream(speakerId, fullOutput);
    });

    if (isLeft) {
      roundItem.leftText = fullOutput;
    } else {
      roundItem.rightText = fullOutput;
    }
    this.onSpeakerFinished(speakerId, fullOutput);
  }

  async runJudgeTurn(roundItem) {
    this.onStateChange("Justice AI is deliberating and scoring...", "judge", "state-ruling");
    
    // Judge uses a separate helper
    const judgeModule = new JudgeModule(this.apiKey, this.model);
    const scoreResult = await judgeModule.scoreRound(
      this.topic,
      this.currentRound,
      this.leftPersona,
      roundItem.leftText,
      this.rightPersona,
      roundItem.rightText
    );
    
    roundItem.judgeScore = scoreResult;
  }

  concludeDebate() {
    this.isDebateRunning = false;
    this.onStateChange("Debate has concluded. Winner announced!", null, "state-idle");
    
    // Calculate final scores
    let leftTotal = 0;
    let rightTotal = 0;
    
    this.roundsData.forEach(r => {
      if (r.judgeScore) {
        leftTotal += r.judgeScore.left.total;
        rightTotal += r.judgeScore.right.total;
      }
    });

    const leftAvg = (leftTotal / this.roundsData.length).toFixed(1);
    const rightAvg = (rightTotal / this.roundsData.length).toFixed(1);
    
    let winnerId = "draw";
    if (parseFloat(leftAvg) > parseFloat(rightAvg)) {
      winnerId = "left";
    } else if (parseFloat(rightAvg) > parseFloat(leftAvg)) {
      winnerId = "right";
    }

    this.onDebateComplete(winnerId, leftAvg, rightAvg);
  }

  pause() {
    this.isPaused = true;
    this.onStateChange("Court is in brief recess...", null, "state-idle");
  }

  resume() {
    this.isPaused = false;
    this.onStateChange("Court is back in session", null, "state-idle");
  }

  stop() {
    this.isDebateRunning = false;
    this.onStateChange("Debate ended prematurely", null, "state-idle");
  }
}

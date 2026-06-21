// Main Controller & DOM Orchestration for the AI Courtroom Debate Simulator

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  
  // API Key Settings Elements
  const btnToggleVoice = document.getElementById("btn-toggle-voice");
  const btnSettings = document.getElementById("btn-api-settings");
  const modalSettings = document.getElementById("modal-settings");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const btnCancelSettings = document.getElementById("btn-cancel-settings");
  const btnSaveSettings = document.getElementById("btn-save-settings");
  const inputApiKey = document.getElementById("input-api-key");
  
  // Help Modal Elements
  const btnShowHelp = document.getElementById("btn-show-help");
  const modalHelp = document.getElementById("modal-help");
  const btnCloseHelp = document.getElementById("btn-close-help");
  const btnCloseHelpOk = document.getElementById("btn-close-help-ok");

  // Controls Elements
  const inputTopic = document.getElementById("input-topic");
  const btnSurprise = document.getElementById("btn-surprise-topic");
  const selectRounds = document.getElementById("select-rounds");
  const selectModel = document.getElementById("select-model");
  const selectLeftPersona = document.getElementById("select-persona-left");
  const selectRightPersona = document.getElementById("select-persona-right");
  const btnStart = document.getElementById("btn-start-debate");
  const btnReset = document.getElementById("btn-reset-debate");

  // Courtroom Dashboard Elements
  const currentRoundNumEl = document.getElementById("current-round-number");
  const valLeftScore = document.getElementById("val-left");
  const valRightScore = document.getElementById("val-right");
  const barLeftScore = document.getElementById("bar-left");
  const barRightScore = document.getElementById("bar-right");
  const statusLabel = document.getElementById("debate-status");
  
  // Characters Visual Elements
  const judgeChar = document.getElementById("judge-character");
  const gavelVisual = document.getElementById("gavel-visual");
  const charLeft = document.getElementById("character-left");
  const charRight = document.getElementById("character-right");
  const bubbleLeft = document.getElementById("bubble-left");
  const bubbleRight = document.getElementById("bubble-right");
  const textLeft = document.getElementById("text-left");
  const textRight = document.getElementById("text-right");
  const whisperLeftBadge = document.getElementById("whisper-left-badge");
  const whisperRightBadge = document.getElementById("whisper-right-badge");

  // Coach Whisper Drawers
  const btnCoachLeft = document.getElementById("btn-coach-left");
  const btnCoachRight = document.getElementById("btn-coach-right");
  const containerWhisperLeft = document.getElementById("container-whisper-left");
  const containerWhisperRight = document.getElementById("container-whisper-right");
  const inputWhisperLeft = document.getElementById("input-whisper-left");
  const inputWhisperRight = document.getElementById("input-whisper-right");
  const btnSendWhisperLeft = document.getElementById("btn-send-whisper-left");
  const btnSendWhisperRight = document.getElementById("btn-send-whisper-right");

  // Records Panels Tabs Elements
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const transcriptContainer = document.getElementById("transcript-container");
  const fallacyContainer = document.getElementById("fallacy-container");
  const rulingsContainer = document.getElementById("rulings-container");
  const tabBtnFallacies = document.getElementById("tab-btn-fallacies");
  
  // Export Elements
  const exportPanel = document.getElementById("export-panel");
  const winnerBanner = document.getElementById("winner-banner");
  const winnerText = document.getElementById("winner-text");
  const btnRunFallacy = document.getElementById("btn-run-fallacy");
  const btnExportMarkdown = document.getElementById("btn-export-markdown");

  // --- State Instances ---
  const engine = new DebateEngine();
  let fallacyReports = []; // Cache fallacy report data
  let isVoiceEnabled = false;

  // Text-To-Speech Speaker Helper
  const speakText = (text, side) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any active speech first
    window.speechSynthesis.cancel();

    // Clean text by stripping HTML tags
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();

    // Try to configure distinct voice attributes
    if (side === "left") {
      utterance.pitch = 0.95;
      utterance.rate = 1.05;
      if (voices.length > 0) utterance.voice = voices.find(v => v.name.includes("David") || v.name.includes("Male") || v.lang.startsWith("en-US")) || voices[0];
    } else if (side === "right") {
      utterance.pitch = 1.15;
      utterance.rate = 1.05;
      if (voices.length > 1) utterance.voice = voices.find(v => v.name.includes("Zira") || v.name.includes("Female") || v.lang.startsWith("en-GB")) || voices[1] || voices[0];
    } else if (side === "judge") {
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
      if (voices.length > 2) utterance.voice = voices.find(v => v.name.includes("Hazel") || v.name.includes("Google") || v.name.includes("Natural")) || voices[2] || voices[0];
    }

    window.speechSynthesis.speak(utterance);
  };

  // --- Setup & Initializations ---
  
  // Load Saved API Key
  const savedKey = localStorage.getItem("gemini_api_key");
  if (savedKey) {
    inputApiKey.value = savedKey;
    engine.setApiKey(savedKey);
  } else {
    // Show welcome modal if no API Key saved
    modalHelp.classList.remove("hide");
  }

  // Init Topic Generator
  initTopicGenerator("input-topic", "btn-surprise-topic", "topic-tags");

  // Populate Personas Select Boxes
  populatePersonaSelects(
    "select-persona-left",
    "select-persona-right",
    "preview-left",
    "preview-right"
  );

  // --- Modal Logic ---
  const toggleModal = (modalEl, show) => {
    if (show) {
      modalEl.classList.remove("hide");
    } else {
      modalEl.classList.add("hide");
    }
  };

  // Toggle voice settings
  btnToggleVoice.addEventListener("click", () => {
    isVoiceEnabled = !isVoiceEnabled;
    if (isVoiceEnabled) {
      btnToggleVoice.innerHTML = `<span class="icon">🔊</span> Speech: On`;
      btnToggleVoice.classList.remove("btn-secondary");
      btnToggleVoice.classList.add("btn-accent", "voice-on");
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices(); // warm up
      }
    } else {
      btnToggleVoice.innerHTML = `<span class="icon">🔇</span> Speech: Off`;
      btnToggleVoice.classList.remove("btn-accent", "voice-on");
      btnToggleVoice.classList.add("btn-secondary");
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  });

  btnSettings.addEventListener("click", () => toggleModal(modalSettings, true));
  btnCloseSettings.addEventListener("click", () => toggleModal(modalSettings, false));
  btnCancelSettings.addEventListener("click", () => toggleModal(modalSettings, false));
  
  btnSaveSettings.addEventListener("click", () => {
    const key = inputApiKey.value.trim();
    if (key) {
      localStorage.setItem("gemini_api_key", key);
      engine.setApiKey(key);
      alert("API Credentials Saved Safely!");
    } else {
      localStorage.removeItem("gemini_api_key");
      engine.setApiKey("");
      alert("API Key cleared.");
    }
    toggleModal(modalSettings, false);
  });

  btnShowHelp.addEventListener("click", () => toggleModal(modalHelp, true));
  btnCloseHelp.addEventListener("click", () => toggleModal(modalHelp, false));
  btnCloseHelpOk.addEventListener("click", () => toggleModal(modalHelp, false));

  // --- Tab Switcher Logic ---
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      const targetContent = document.getElementById(tabId);
      if (targetContent) targetContent.classList.add("active");
    });
  });

  // --- Coach Whispering Interaction ---
  const toggleWhisperDrawer = (drawerContainer, button) => {
    drawerContainer.classList.toggle("hide");
    if (!drawerContainer.classList.contains("hide")) {
      button.innerHTML = "❌ Close Whisper";
    } else {
      button.innerHTML = "🤫 Whisper Instruction";
    }
  };

  btnCoachLeft.addEventListener("click", () => toggleWhisperDrawer(containerWhisperLeft, btnCoachLeft));
  btnCoachRight.addEventListener("click", () => toggleWhisperDrawer(containerWhisperRight, btnCoachRight));

  const sendCoachWhisper = (side, inputEl, containerEl, buttonEl) => {
    const note = inputEl.value.trim();
    if (!note) return;

    engine.injectCoachNote(side, note);
    inputEl.value = "";
    
    // Hide input container and reset button text
    containerEl.classList.add("hide");
    buttonEl.innerHTML = "🤫 Whisper Instruction";

    // Play visual nod animation on the character
    const charEl = side === "left" ? charLeft : charRight;
    const badgeEl = side === "left" ? whisperLeftBadge : whisperRightBadge;

    const originalClass = charEl.className;
    charEl.className = "debater-character state-coached";
    badgeEl.classList.remove("hide"); // Show coached tag on bubble

    setTimeout(() => {
      charEl.className = originalClass;
    }, 2500);

    alert(`Whispered to ${side === "left" ? "Plaintiff" : "Defendant"} coach! Instruction applied to next round.`);
  };

  btnSendWhisperLeft.addEventListener("click", () => {
    sendCoachWhisper("left", inputWhisperLeft, containerWhisperLeft, btnCoachLeft);
  });

  btnSendWhisperRight.addEventListener("click", () => {
    sendCoachWhisper("right", inputWhisperRight, containerWhisperRight, btnCoachRight);
  });

  // Key press listener for coach input
  inputWhisperLeft.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btnSendWhisperLeft.click();
  });
  inputWhisperRight.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btnSendWhisperRight.click();
  });

  // --- Engine Signals Wiring ---

  // Handle character state and title status modifications
  const liveFeedStrip = document.getElementById("live-feed-strip");
  const liveFeedLabel = document.getElementById("live-feed-label");

  engine.onStateChange = (statusText, speakerId, animationClass) => {
    // Update status indicator
    statusLabel.textContent = statusText;
    
    // Reset status label styles
    statusLabel.className = "pill-val";
    
    if (engine.isPaused) {
      statusLabel.classList.add("idle");
    } else if (engine.isDebateRunning) {
      statusLabel.classList.add("active");
    } else {
      statusLabel.classList.add("idle");
    }

    // Update live-feed strip visibility and colour
    if (speakerId === "left") {
      liveFeedStrip.classList.remove("hide", "right-speaking", "judge-speaking");
      liveFeedLabel.textContent = `${engine.leftPersona ? engine.leftPersona.name : "Plaintiff"} is presenting argument...`;
    } else if (speakerId === "right") {
      liveFeedStrip.classList.remove("hide", "judge-speaking");
      liveFeedStrip.classList.add("right-speaking");
      liveFeedLabel.textContent = `${engine.rightPersona ? engine.rightPersona.name : "Defendant"} is presenting argument...`;
    } else if (speakerId === "judge") {
      liveFeedStrip.classList.remove("hide", "right-speaking");
      liveFeedStrip.classList.add("judge-speaking");
      liveFeedLabel.textContent = "Justice AI is deliberating and scoring...";
    } else {
      liveFeedStrip.classList.add("hide");
    }


    // Set characters classes
    if (speakerId === "left") {
      charLeft.className = `debater-character ${animationClass}`;
      charRight.className = "debater-character state-listening";
      judgeChar.className = "judge-avatar-container state-idle";
      
      bubbleLeft.classList.remove("hide");
      bubbleRight.classList.add("hide");
    } else if (speakerId === "right") {
      charRight.className = `debater-character ${animationClass}`;
      charLeft.className = "debater-character state-listening";
      judgeChar.className = "judge-avatar-container state-idle";
      
      bubbleRight.classList.remove("hide");
      bubbleLeft.classList.add("hide");
    } else if (speakerId === "judge") {
      judgeChar.className = `judge-avatar-container ${animationClass}`;
      charLeft.className = "debater-character state-listening";
      charRight.className = "debater-character state-listening";
      
      bubbleLeft.classList.add("hide");
      bubbleRight.classList.add("hide");
    } else {
      // General reset/idle
      charLeft.className = "debater-character state-idle";
      charRight.className = "debater-character state-idle";
      judgeChar.className = "judge-avatar-container state-idle";
    }

    // Gavel bang trigger
    if (animationClass === "state-ruling") {
      gavelVisual.style.display = "block";
    } else {
      gavelVisual.style.display = "none";
    }
  };

  // Called when one debater finishes their full speech — fires TTS
  engine.onSpeakerFinished = (speakerId, fullText) => {
    speakText(fullText, speakerId);
  };

  // Streaming text updates in debater bubbles
  engine.onTextStream = (speakerId, textContent) => {
    const textEl = speakerId === "left" ? textLeft : textRight;
    const bubbleEl = speakerId === "left" ? bubbleLeft : bubbleRight;
    
    bubbleEl.classList.remove("hide");
    textEl.innerHTML = textContent.split("\n\n").map(p => `<p>${p}</p>`).join("");
    
    // Auto-scroll bubbles
    textEl.scrollTop = textEl.scrollHeight;

    // Auto-switch to transcript tab during live streaming so user can follow along
    const transcriptTabBtn = document.querySelector(".tab-btn[data-tab='tab-transcript']");
    const isTranscriptActive = document.getElementById("tab-transcript").classList.contains("active");
    if (!isTranscriptActive && transcriptTabBtn) {
      transcriptTabBtn.click();
    }
  };

  // Turn or round completed, append results
  engine.onRoundComplete = (roundNum, leftTextVal, rightTextVal, judgeRuling) => {
    // 1. Update scoreboard numbers
    currentRoundNumEl.textContent = `${roundNum} / ${engine.totalRounds}`;
    
    // Update score averages on board
    const scores = calculateRunningAverages();
    valLeftScore.textContent = scores.left;
    valRightScore.textContent = scores.right;
    
    // Update score bars widths
    const leftWidth = scores.left * 10;
    const rightWidth = scores.right * 10;
    barLeftScore.style.width = `${leftWidth}%`;
    barRightScore.style.width = `${rightWidth}%`;

    // Remove coached visual badges
    whisperLeftBadge.classList.add("hide");
    whisperRightBadge.classList.add("hide");

    // 2. Append dialogs to Case Transcript container
    const isFirstRound = roundNum === 1;
    if (isFirstRound) {
      transcriptContainer.innerHTML = ""; // Clear placeholder
      rulingsContainer.innerHTML = "";
    }

    // Append Left Speech
    const leftItem = document.createElement("div");
    leftItem.className = "dialogue-item plaintiff-item";
    leftItem.innerHTML = `
      <div class="item-meta">
        <span class="speaker">Plaintiff: ${engine.leftPersona.name}</span>
        <span class="round-indicator">Round ${roundNum}</span>
      </div>
      <div class="item-content" id="dialogue-left-r${roundNum}">
        ${leftTextVal.split("\n\n").map(p => `<p>${p}</p>`).join("")}
      </div>
    `;
    transcriptContainer.appendChild(leftItem);

    // Append Right Speech
    const rightItem = document.createElement("div");
    rightItem.className = "dialogue-item defendant-item";
    rightItem.innerHTML = `
      <div class="item-meta">
        <span class="speaker">Defendant: ${engine.rightPersona.name}</span>
        <span class="round-indicator">Round ${roundNum}</span>
      </div>
      <div class="item-content" id="dialogue-right-r${roundNum}">
        ${rightTextVal.split("\n\n").map(p => `<p>${p}</p>`).join("")}
      </div>
    `;
    transcriptContainer.appendChild(rightItem);

    // Auto Scroll transcript
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;

    // 3. Append judge scores in Judicial Opinions tab
    if (judgeRuling) {
      const judgeItem = document.createElement("div");
      judgeItem.className = "dialogue-item judge-item";
      judgeItem.innerHTML = `
        <div class="item-meta">
          <span class="speaker">Justice AI Scoring</span>
          <span class="round-indicator">Round ${roundNum} Review</span>
        </div>
        <div class="item-content">
          <p><strong>Plaintiff (${engine.leftPersona.name}):</strong> Logic: ${judgeRuling.left.logic}/10 | Evidence: ${judgeRuling.left.evidence}/10 | Persuasion: ${judgeRuling.left.persuasion}/10 (Total: ${judgeRuling.left.total}/10)</p>
          <p><strong>Defendant (${engine.rightPersona.name}):</strong> Logic: ${judgeRuling.right.logic}/10 | Evidence: ${judgeRuling.right.evidence}/10 | Persuasion: ${judgeRuling.right.persuasion}/10 (Total: ${judgeRuling.right.total}/10)</p>
          <p style="margin-top: 0.5rem; font-style: italic;">"${judgeRuling.commentary}"</p>
        </div>
      `;
      transcriptContainer.appendChild(judgeItem);
      
      const rulingCard = document.createElement("div");
      rulingCard.className = "ruling-card";
      rulingCard.innerHTML = `
        <div class="ruling-card-header">Round ${roundNum} Verdict</div>
        <div class="ruling-scores-summary">
          <div class="ruling-score-block">
            <div class="score-side-title left">${engine.leftPersona.name}</div>
            <div class="scores-grid">
              <div class="score-metric"><span class="metric-val">${judgeRuling.left.logic}</span><span class="metric-lbl">Log</span></div>
              <div class="score-metric"><span class="metric-val">${judgeRuling.left.evidence}</span><span class="metric-lbl">Evid</span></div>
              <div class="score-metric"><span class="metric-val">${judgeRuling.left.persuasion}</span><span class="metric-lbl">Pers</span></div>
            </div>
          </div>
          <div class="ruling-score-block">
            <div class="score-side-title right">${engine.rightPersona.name}</div>
            <div class="scores-grid">
              <div class="score-metric"><span class="metric-val">${judgeRuling.right.logic}</span><span class="metric-lbl">Log</span></div>
              <div class="score-metric"><span class="metric-val">${judgeRuling.right.evidence}</span><span class="metric-lbl">Evid</span></div>
              <div class="score-metric"><span class="metric-val">${judgeRuling.right.persuasion}</span><span class="metric-lbl">Pers</span></div>
            </div>
          </div>
        </div>
        <div class="ruling-commentary">"${judgeRuling.commentary}"</div>
      `;
      rulingsContainer.appendChild(rulingCard);
      rulingsContainer.scrollTop = rulingsContainer.scrollHeight;
    }
  };

  // Calculate moving score averages
  const calculateRunningAverages = () => {
    let leftSum = 0;
    let rightSum = 0;
    let count = 0;

    engine.roundsData.forEach(r => {
      if (r.judgeScore) {
        leftSum += r.judgeScore.left.total;
        rightSum += r.judgeScore.right.total;
        count++;
      }
    });

    if (count === 0) return { left: "5.0", right: "5.0" };
    return {
      left: (leftSum / count).toFixed(1),
      right: (rightSum / count).toFixed(1)
    };
  };

  // Debate finished
  engine.onDebateComplete = (winnerId, leftAvg, rightAvg) => {
    // Enable Reset buttons and reveal export drawers
    btnStart.disabled = true;
    btnReset.disabled = false;
    exportPanel.classList.remove("hide");
    tabBtnFallacies.disabled = false; // Enable fallacy tab

    // Hide live-feed strip and stop any ongoing speech
    liveFeedStrip.classList.add("hide");
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Setup Winner Banner Details
    const winnerName = winnerId === "left" ? engine.leftPersona.name : (winnerId === "right" ? engine.rightPersona.name : "Draw Decision");
    winnerText.textContent = winnerName;

    // Announce winner via TTS
    speakText(`Debate concluded. The winner is: ${winnerName}!`, "judge");

    // Apply Winner/Loser animation states
    if (winnerId === "left") {
      charLeft.className = "debater-character state-winner";
      charRight.className = "debater-character state-loser";
    } else if (winnerId === "right") {
      charRight.className = "debater-character state-winner";
      charLeft.className = "debater-character state-loser";
    } else {
      charLeft.className = "debater-character state-idle";
      charRight.className = "debater-character state-idle";
    }
  };

  engine.onError = (errorMessage) => {
    alert(`Courtroom Error: ${errorMessage}`);
    console.error(errorMessage);
    resetUIAfterStop();
  };

  const resetUIAfterStop = () => {
    btnStart.disabled = false;
    btnStart.innerHTML = "🏛️ Convene Courtroom";
    btnReset.disabled = true;
    
    charLeft.className = "debater-character state-idle";
    charRight.className = "debater-character state-idle";
    judgeChar.className = "judge-avatar-container state-idle";

    bubbleLeft.classList.add("hide");
    bubbleRight.classList.add("hide");
  };

  // --- Main Controls Interaction ---

  btnStart.addEventListener("click", () => {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      alert("Please configure your Gemini API Key in the settings first!");
      toggleModal(modalSettings, true);
      return;
    }

    if (engine.isDebateRunning) {
      if (engine.isPaused) {
        engine.resume();
        btnStart.innerHTML = "⏸️ Recess (Pause)";
      } else {
        engine.pause();
        btnStart.innerHTML = "▶️ Resume Court";
      }
    } else {
      // Check input fields
      const topic = inputTopic.value.trim();
      if (!topic) {
        alert("Please specify a debate topic.");
        return;
      }

      // Configure engine
      const leftPersona = getPersonaById(selectLeftPersona.value);
      const rightPersona = getPersonaById(selectRightPersona.value);
      
      if (leftPersona.id === rightPersona.id) {
        alert("Litigants must have different personas to debate opposing views!");
        return;
      }

      engine.configure({
        topic: topic,
        model: selectModel.value,
        rounds: selectRounds.value,
        leftPersona: leftPersona,
        rightPersona: rightPersona
      });

      // Clear Fallacies state
      fallacyReports = [];
      fallacyContainer.innerHTML = `
        <div class="fallacy-placeholder">
          <p>Please wait for the debate to conclude. The Fallacy Detector audit runs automatically at the end of the session.</p>
        </div>
      `;
      tabBtnFallacies.disabled = true;

      // Update UI Controls
      btnStart.innerHTML = "⏸️ Recess (Pause)";
      btnReset.disabled = true;
      exportPanel.classList.add("hide");
      
      // Update UI Counters
      currentRoundNumEl.textContent = `0 / ${engine.totalRounds}`;
      valLeftScore.textContent = "5.0";
      valRightScore.textContent = "5.0";
      barLeftScore.style.width = "50%";
      barRightScore.style.width = "50%";

      // Start the core orchestration loop
      engine.startDebateLoop();
    }
  });

  btnReset.addEventListener("click", () => {
    engine.stop();
    engine.reset();
    resetUIAfterStop();
    
    // Clear tabs placeholders
    transcriptContainer.innerHTML = `
      <div class="transcript-placeholder">
        <span class="icon">🏛️</span>
        <p>The court has not convened. Select characters, set a topic, and press "Convene Courtroom" to begin.</p>
      </div>
    `;
    rulingsContainer.innerHTML = `
      <div class="rulings-placeholder">
        <p>Rounds scores and judicial reasoning will appear here as the trial progresses.</p>
      </div>
    `;
    fallacyContainer.innerHTML = `
      <div class="fallacy-placeholder">
        <p>Please wait for the debate to conclude. The Fallacy Detector audit runs automatically at the end of the session.</p>
      </div>
    `;
  });

  // --- Fallacy Detection Execution ---
  btnRunFallacy.addEventListener("click", async () => {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return;

    btnRunFallacy.disabled = true;
    btnRunFallacy.innerHTML = "<span>⏳</span> Analyzing...";
    
    statusLabel.textContent = "Auditing logical fallacies...";
    
    const detector = new FallacyDetector(apiKey, selectModel.value);
    const fallacies = await detector.auditTranscript(
      engine.topic,
      engine.leftPersona,
      engine.rightPersona,
      engine.roundsData
    );

    fallacyReports = fallacies; // cache results

    // Clear and build fallacy container view
    fallacyContainer.innerHTML = "";

    if (fallacies.length === 0) {
      fallacyContainer.innerHTML = `
        <div class="fallacy-placeholder" style="color: #10b981;">
          <span style="font-size: 2rem;">🏆</span>
          <p>Intellectual Clean Sheet! No strawmans, ad hominems, or circular logic detected.</p>
        </div>
      `;
    } else {
      fallacies.forEach(f => {
        const speaker = f.side === "left" ? engine.leftPersona.name : engine.rightPersona.name;
        
        const card = document.createElement("div");
        card.className = "fallacy-audit-card flagged";
        card.innerHTML = `
          <div class="audit-header">
            <strong>${speaker}</strong>
            <span class="fallacy-type-badge ${f.type}">${f.type}</span>
          </div>
          <div class="audit-quote">"${f.quote}"</div>
          <div class="audit-reason"><strong>Reason:</strong> ${f.explanation}</div>
        `;
        fallacyContainer.appendChild(card);
      });

      // Highlight in the transcript tab
      engine.roundsData.forEach((r, idx) => {
        const roundNum = idx + 1;
        
        const leftEl = document.getElementById(`dialogue-left-r${roundNum}`);
        if (leftEl) {
          leftEl.innerHTML = detector.highlightFallaciesInText(leftEl.innerHTML, fallacies, "left", roundNum);
        }

        const rightEl = document.getElementById(`dialogue-right-r${roundNum}`);
        if (rightEl) {
          rightEl.innerHTML = detector.highlightFallaciesInText(rightEl.innerHTML, fallacies, "right", roundNum);
        }
      });
    }

    statusLabel.textContent = "Fallacy audit complete!";
    btnRunFallacy.disabled = false;
    btnRunFallacy.innerHTML = "✨ Audit Complete";
    
    // Switch to fallacy tab
    const fallacyTabBtn = document.getElementById("tab-btn-fallacies");
    if (fallacyTabBtn) fallacyTabBtn.click();
  });

  // --- Export Markdown Download ---
  btnExportMarkdown.addEventListener("click", () => {
    if (engine.roundsData.length === 0) return;
    
    // Get score averages
    const scores = calculateRunningAverages();

    TranscriptExporter.downloadMarkdown(
      engine.topic,
      engine.model,
      engine.leftPersona,
      engine.rightPersona,
      engine.roundsData,
      charLeft.classList.contains("state-winner") ? "left" : (charRight.classList.contains("state-winner") ? "right" : "draw"),
      scores.left,
      scores.right,
      fallacyReports
    );
  });
});

// Fallacy Detection Post-Debate Pass for the AI Courtroom Debate Simulator

class FallacyDetector {
  constructor(apiKey, model = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async auditTranscript(topic, leftPersona, rightPersona, roundsData) {
    const apiVersion = this.model.startsWith("gemini-2.0") ? "v1beta" : "v1";
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Format transcript for auditing
    let transcriptText = `Debate Topic: ${topic}\n\n`;
    roundsData.forEach((r, idx) => {
      transcriptText += `[ROUND ${idx + 1}]\n`;
      transcriptText += `Plaintiff (${leftPersona.name}): "${r.leftText}"\n\n`;
      transcriptText += `Defendant (${rightPersona.name}): "${r.rightText}"\n\n`;
    });

    const systemInstruction = `You are a critical thinking scholar and logical fallacy analyst.
Your job is to audit a debate transcript and flag three specific types of logical fallacies:
1. "strawman": Distorting, exaggerating, or misrepresenting the opponent's argument to make it easier to attack.
2. "adhominem": Attacking the opponent's character, credentials, or personal traits instead of their argument.
3. "circular": Attempting to prove a point by repeating the claim in different words as if it were evidence (begging the question).

You must analyze all rounds. For any fallacy found, you must return:
- side: whether it was said by "left" (Plaintiff) or "right" (Defendant).
- round: the round number (integer).
- type: the fallacy type ("strawman", "adhominem", or "circular").
- quote: the exact, literal sentence or phrase containing the fallacy. This must match the transcript text EXACTLY.
- explanation: a concise sentence explaining why this quote constitutes the specified fallacy.

You must respond ONLY with a JSON array of objects. Do not include markdown code block styling.
Schema:
[
  {
    "side": "left" | "right",
    "round": number,
    "type": "strawman" | "adhominem" | "circular",
    "quote": "string",
    "explanation": "string"
  }
]`;

    const prompt = `
Debate Transcript:
${transcriptText}

Perform the logical fallacy audit. Return ONLY the JSON array matching the schema. If no fallacies are detected, return an empty array [].`;

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
        responseMimeType: "application/json",
        temperature: 0.1
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Fallacy audit API call failed: HTTP ${response.status}`);
      }

      const resJson = await response.json();
      const rawText = resJson.candidates[0].content.parts[0].text;
      
      return this.parseAuditResponse(rawText);
    } catch (e) {
      console.error("Fallacy detector audit failed:", e);
      return []; // Return empty list on failure
    }
  }

  parseAuditResponse(text) {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    
    return JSON.parse(cleaned);
  }

  // Resilient replacement helper to inject HTML spans around quotes in dialogue texts
  highlightFallaciesInText(originalText, fallacies, side, roundNum) {
    let result = originalText;
    const sideFilter = side;
    
    // Filter fallacies for this specific text
    const relevant = fallacies.filter(f => f.side === sideFilter && parseInt(f.round) === parseInt(roundNum));
    
    relevant.forEach(f => {
      const quote = f.quote.trim();
      if (!quote) return;

      // Escape HTML entities to match potential safe render in DOM
      const escapedQuote = this.escapeHtml(quote);
      
      // Let's check direct substring match first
      const index = result.indexOf(quote);
      if (index !== -1) {
        const replacement = `<span class="fallacy-highlight ${f.type}" data-tooltip="${this.capitalize(f.type)}: ${f.explanation.replace(/"/g, '&quot;')}">${quote}</span>`;
        result = result.substring(0, index) + replacement + result.substring(index + quote.length);
      } else {
        // Try to match ignoring minor punctuation/case variations
        const escapedRegex = this.escapeRegex(quote);
        try {
          const regex = new RegExp(escapedRegex, "i");
          const match = result.match(regex);
          if (match) {
            const matchedText = match[0];
            const replacement = `<span class="fallacy-highlight ${f.type}" data-tooltip="${this.capitalize(f.type)}: ${f.explanation.replace(/"/g, '&quot;')}">${matchedText}</span>`;
            result = result.replace(regex, replacement);
          }
        } catch (err) {
          // Fallback to simple replacements if regex compiling fails
        }
      }
    });

    return result;
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

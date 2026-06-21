// Judicial Scoring and Structured Output Module for the AI Courtroom Debate Simulator

class JudgeModule {
  constructor(apiKey, model = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async scoreRound(topic, roundNum, leftPersona, leftText, rightPersona, rightText) {
    const apiVersion = this.model.startsWith("gemini-2.0") ? "v1beta" : "v1";
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const systemInstruction = `You are a neutral, highly objective supreme court judge scoring an intellectual debate.
Your job is to read both arguments and return a structured JSON evaluation scoring each side from 1 to 10 on three parameters:
1. Logic: Coherency, structure, and validity of arguments. Avoidance of logical leaps.
2. Evidence: Grounding, citation of data/facts/principles, and support for assertions.
3. Persuasion: Rhetoric, delivery, engagement, and rebuttals of the opponent's arguments.

You must calculate the 'total' score for each side as the mathematical average of these three scores (rounded to one decimal place).
You must also provide a concise 'commentary' explaining your judicial reasoning.

You must respond ONLY with a JSON object matching this schema:
{
  "left": {
    "logic": number,
    "evidence": number,
    "persuasion": number,
    "total": number
  },
  "right": {
    "logic": number,
    "evidence": number,
    "persuasion": number,
    "total": number
  },
  "commentary": "string"
}`;

    const prompt = `
Debate Topic: ${topic}
Round: ${roundNum}

Plaintiff: ${leftPersona.name}
Plaintiff Speech:
"${leftText}"

Defendant: ${rightPersona.name}
Defendant Speech:
"${rightText}"

Conduct your review. Score both Plaintiff (left) and Defendant (right). Return ONLY the valid JSON object. Do not include markdown code block formatting like \`\`\`json. Just the raw JSON string.`;

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
        temperature: 0.2
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
        const errText = await response.text();
        throw new Error(`Judge call failed (HTTP ${response.status}): ${errText}`);
      }

      const resJson = await response.json();
      const rawText = resJson.candidates[0].content.parts[0].text;
      
      return this.parseJudgeResponse(rawText);
    } catch (e) {
      console.error("Error evaluating with judge:", e);
      return this.getFallbackScores(leftText, rightText);
    }
  }

  // Robustly parse JSON even if wrapped in markdown formatting
  parseJudgeResponse(text) {
    let cleaned = text.trim();
    
    // Remove markdown codeblock wrapper if present
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    cleaned = cleaned.trim();
    
    const parsed = JSON.parse(cleaned);
    
    // Validate properties exist, or patch them
    if (!parsed.left || !parsed.right || !parsed.commentary) {
      throw new Error("Missing structural fields in Judge response JSON");
    }
    
    // Ensure numbers are correct
    parsed.left.logic = parseFloat(parsed.left.logic) || 5.0;
    parsed.left.evidence = parseFloat(parsed.left.evidence) || 5.0;
    parsed.left.persuasion = parseFloat(parsed.left.persuasion) || 5.0;
    parsed.left.total = parseFloat(((parsed.left.logic + parsed.left.evidence + parsed.left.persuasion) / 3).toFixed(1));

    parsed.right.logic = parseFloat(parsed.right.logic) || 5.0;
    parsed.right.evidence = parseFloat(parsed.right.evidence) || 5.0;
    parsed.right.persuasion = parseFloat(parsed.right.persuasion) || 5.0;
    parsed.right.total = parseFloat(((parsed.right.logic + parsed.right.evidence + parsed.right.persuasion) / 3).toFixed(1));

    return parsed;
  }

  // Fallback in case of API failure or JSON parsing exception
  getFallbackScores(leftText, rightText) {
    // Generate simple deterministic scores based on text lengths as a safe mockup fallback
    const leftLen = leftText.length;
    const rightLen = rightText.length;
    
    const leftScore = Math.min(9.0, Math.max(5.0, (leftLen / 150) + 4.0)).toFixed(1);
    const rightScore = Math.min(9.0, Math.max(5.0, (rightLen / 150) + 4.0)).toFixed(1);
    
    return {
      left: {
        logic: Math.floor(leftScore),
        evidence: Math.floor(leftScore),
        persuasion: Math.floor(leftScore),
        total: parseFloat(leftScore)
      },
      right: {
        logic: Math.floor(rightScore),
        evidence: Math.floor(rightScore),
        persuasion: Math.floor(rightScore),
        total: parseFloat(rightScore)
      },
      commentary: "The court encountered a computational disruption in deliberations, leading to standard automated assessment of verbal density."
    };
  }
}

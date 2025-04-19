// server/ai.ts

import { IAIAdapter, AIAdapterFactory } from "./ai-adapter";
import { InsertAssessmentSubmission, AssessmentQuestion } from "@shared/schema";

export async function analyzeAssessment(
  submission: InsertAssessmentSubmission,
  questions?: AssessmentQuestion[]
): Promise<{ score: number; feedback: string; flagged: boolean }> {
  // Calculate the raw score and construct a summary string for context.
  let totalScore = 0;
  let maxPossibleScore = 0;
  let assessmentSummary = "Student Assessment Results:\n\n";

  for (const [questionId, responseValue] of Object.entries(submission.responses)) {
    const qId = parseInt(questionId, 10);
    if (questions) {
      const question = questions.find((q) => q.id === qId);
      if (question) {
        const selectedOption = question.options[responseValue];
        assessmentSummary += `Question: ${question.question}\n`;
        assessmentSummary += `Response: ${selectedOption} (${
          responseValue + 1
        } out of ${question.options.length})\n\n`;
        totalScore += responseValue * question.weight;
        maxPossibleScore += (question.options.length - 1) * question.weight;
        continue;
      }
    }
    // Fallback scoring if question metadata missing
    totalScore += responseValue;
    maxPossibleScore += 4;
  }

  // Normalize the score on a 0–100 scale.
  const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
  const flagged = normalizedScore > 70;

  const prompt = `
${assessmentSummary}

Based on the above results, provide personalized mental health feedback for the student.
The student's normalized score is ${normalizedScore}/100, where a higher score indicates higher stress levels or poor mental health.

Your feedback should:
1. Be empathetic and supportive.
2. Provide 2-3 actionable recommendations.
3. If the score is above 70, suggest speaking with a counselor.

Format your response strictly as a JSON object with a single key "feedback" that contains your message.
DO NOT include any extra text outside the JSON.
  `;

  // Adapter invocation
  const adapter: IAIAdapter = AIAdapterFactory.getAdapter();
  try {
    let raw = await adapter.generateFeedback(prompt);

    raw = raw.replace(/^```(json)?\s*/i, "").replace(/```$/, "").trim();
    // parse JSON or fallback
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("Error parsing AI response JSON:", parseError);
      parsed = { feedback: getFallbackFeedback(normalizedScore) };
    }

    return {
      score: normalizedScore,
      feedback: parsed.feedback || getFallbackFeedback(normalizedScore),
      flagged,
    };
  } catch (error) {
    console.error("AI provider error:", error);
    return {
      score: normalizedScore,
      feedback: getFallbackFeedback(normalizedScore),
      flagged,
    };
  }
}

function getFallbackFeedback(normalizedScore: number): string {
  if (normalizedScore < 30) {
    return "Your assessment suggests you are handling stress well. Keep up your good self-care practices!";
  } else if (normalizedScore < 50) {
    return "Your responses indicate mild stress. Consider incorporating stress-reduction activities like meditation and exercise.";
  } else if (normalizedScore < 70) {
    return "Your assessment indicates moderate stress levels. It may be helpful to discuss your feelings with someone you trust or consider speaking with a counselor.";
  } else {
    return "Your responses suggest high stress levels. We strongly recommend speaking with a counselor to discuss strategies for better stress management.";
  }
}

/**
 * Analyzes user's mood and generates a supportive response
 * @param mood The selected mood (low, neutral, good, great)
 * @returns A supportive message based on the mood
 */
export async function analyzeMood(mood: string): Promise<string> {

  const prompt = `
The user has indicated they are feeling "${mood}" today.

Generate a short, supportive response (2-3 sentences) that:
1. Acknowledges their current mood
2. Offers a positive perspective or gentle encouragement
3. Suggests a simple action they could take to maintain or improve their mood

Keep the tone warm and conversational. The response should be direct, not in JSON format.
  `;

  const adapter: IAIAdapter = AIAdapterFactory.getAdapter();
  try {
    // Adapter returns raw text for non‑JSON prompts
    const text = await adapter.generateFeedback(prompt);
    return text.trim();
  } catch (error) {
    console.error("AI provider error:", error);
    return getFallbackMoodResponse(mood);
  }
}

function getFallbackMoodResponse(mood: string): string {
  switch (mood.toLowerCase()) {
    case "low":
      return "It's okay to have difficult days. Remember that feelings are temporary, and there are people here to support you. Consider talking to someone you trust or doing a gentle activity you enjoy.";
    case "neutral":
      return "A neutral mood can be a good foundation for the day. Take a moment to appreciate the small things around you, and maybe try something that usually brings you joy.";
    case "good":
      return "It's great that you're feeling good! Use this positive energy to engage in activities you enjoy and connect with others. Keep up whatever is working for you!";
    case "great":
      return "Wonderful to hear you're feeling great! Your positive energy can be contagious—consider sharing your good mood with others and building on this momentum.";
    default:
      return "Thank you for sharing how you're feeling. Remember that MindCare is here to support you, whatever your mood may be.";
  }
}

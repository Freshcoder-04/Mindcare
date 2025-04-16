// ai.ts
import { InsertAssessmentSubmission, AssessmentQuestion } from '@shared/schema';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Generative AI client using your API key.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE");

/**
 * Analyzes a student's assessment submission using Google's Generative AI to generate personalized feedback.
 * 
 * @param submission - The student's assessment submission containing the responses.
 * @param questions - Optional array of assessment questions to provide contextual information.
 * @returns A promise that resolves to an object containing the normalized score, personalized feedback, and flagged status.
 */
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
      const question = questions.find(q => q.id === qId);
      if (question) {
        const selectedOption = question.options[responseValue];
        assessmentSummary += `Question: ${question.question}\n`;
        assessmentSummary += `Response: ${selectedOption} (${responseValue + 1} out of ${question.options.length})\n\n`;
        totalScore += responseValue * question.weight;
        maxPossibleScore += (question.options.length - 1) * question.weight;
      } else {
        totalScore += responseValue;
        maxPossibleScore += 4; // Assuming 5 options (0-4)
      }
    } else {
      totalScore += responseValue;
      maxPossibleScore += 4;
    }
  }
  
  // Normalize the score on a 0-100 scale.
  const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
  const flagged = normalizedScore > 70;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
    
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
    
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    // Remove markdown formatting if it exists.
    const cleanedText = text
      .replace(/^```(json)?\s*/i, "")  // remove starting triple backticks (optionally with "json")
      .replace(/```$/, "")             // remove ending triple backticks
      .trim();
    
    try {
      // Parse the cleaned JSON response.
      const jsonResponse = JSON.parse(cleanedText);
      return {
        score: normalizedScore,
        feedback: jsonResponse.feedback || getFallbackFeedback(normalizedScore),
        flagged,
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response as JSON:", parseError);
      return {
        score: normalizedScore,
        feedback: getFallbackFeedback(normalizedScore),
        flagged,
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
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
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
    
    const prompt = `
      The user has indicated they are feeling "${mood}" today.
      
      Generate a short, supportive response (2-3 sentences) that:
      1. Acknowledges their current mood
      2. Offers a positive perspective or gentle encouragement
      3. Suggests a simple action they could take to maintain or improve their mood
      
      Keep the tone warm and conversational. The response should be direct, not in JSON format.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    return getFallbackMoodResponse(mood);
  }
}

function getFallbackMoodResponse(mood: string): string {
  switch (mood.toLowerCase()) {
    case 'low':
      return "It's okay to have difficult days. Remember that feelings are temporary, and there are people here to support you. Consider talking to someone you trust or doing a gentle activity you enjoy.";
    case 'neutral':
      return "A neutral mood can be a good foundation for the day. Take a moment to appreciate the small things around you, and maybe try something that usually brings you joy.";
    case 'good':
      return "It's great that you're feeling good! Use this positive energy to engage in activities you enjoy and connect with others. Keep up whatever is working for you!";
    case 'great':
      return "Wonderful to hear you're feeling great! Your positive energy can be contagious - consider sharing your good mood with others and building on this momentum.";
    default:
      return "Thank you for sharing how you're feeling. Remember that MindCare is here to support you, whatever your mood may be.";
  }
}

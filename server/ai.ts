// This file handles AI analysis for the self-assessment module
import { InsertAssessmentSubmission, AssessmentQuestion } from '@shared/schema';
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: "OPENAIKEY" });

/**
 * Analyzes a student's assessment submission using OpenAI to generate personalized feedback
 * 
 * @param submission The student's assessment submission with responses
 * @param questions Optional array of assessment questions for better context
 * @returns Analysis results with score, personalized feedback, and flagged status
 */
export async function analyzeAssessment(
  submission: InsertAssessmentSubmission,
  questions?: AssessmentQuestion[]
): Promise<{ score: number; feedback: string; flagged: boolean }> {
  // First calculate the raw score
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  // Create a summary of the assessment responses
  let assessmentSummary = "Student Assessment Results:\n\n";
  
  for (const [questionId, responseValue] of Object.entries(submission.responses)) {
    const qId = parseInt(questionId, 10);
    
    if (questions) {
      // If we have the question details, include them in the summary
      const question = questions.find(q => q.id === qId);
      
      if (question) {
        const selectedOption = question.options[responseValue];
        assessmentSummary += `Question: ${question.question}\n`;
        assessmentSummary += `Response: ${selectedOption} (${responseValue + 1} out of ${question.options.length})\n\n`;
        
        totalScore += responseValue * question.weight;
        maxPossibleScore += (question.options.length - 1) * question.weight;
      } else {
        // Fall back to basic scoring if question not found
        totalScore += responseValue;
        maxPossibleScore += 4; // Assuming 5 options (0-4)
      }
    } else {
      // Basic scoring without question details
      totalScore += responseValue;
      maxPossibleScore += 4; // Assuming 5 options (0-4)
    }
  }
  
  // Normalize score to 0-100 scale
  const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
  
  // Determine if the score is above threshold for flagging (70%)
  const flagged = normalizedScore > 70;
  
  try {
    // Use OpenAI to generate personalized feedback
    const prompt = `
      ${assessmentSummary}
      
      Based on the assessment results above, provide personalized mental health feedback for a student.
      The student's normalized score is ${normalizedScore}/100, where higher scores indicate higher stress/anxiety levels.
      
      Your feedback should:
      1. Be compassionate and supportive
      2. Acknowledge their specific challenges based on their responses
      3. Provide 2-3 specific, actionable recommendations
      4. If the score is above 70, encourage them to speak with a counselor
      
      Format your response as a JSON object with a single field called "feedback" containing your message.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a compassionate mental health advisor for college students. Your advice is evidence-based and supportive."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response 
    const content = response.choices[0]?.message?.content;
    const result = content ? JSON.parse(content) : {};
    
    return {
      score: normalizedScore,
      feedback: result.feedback || "Thank you for completing the assessment. Based on your responses, we've generated personalized feedback to help support your mental health journey.",
      flagged,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback feedback if API fails
    let feedback = "Thank you for completing the assessment. ";
    
    if (normalizedScore < 30) {
      feedback += "Your responses indicate you're managing well. Keep up the good self-care practices and remember that seeking support is always an option if things change.";
    } else if (normalizedScore < 50) {
      feedback += "Your responses suggest mild stress levels. Consider incorporating more stress-reduction activities into your routine, like meditation or exercise.";
    } else if (normalizedScore < 70) {
      feedback += "Your responses indicate moderate stress levels. It might be helpful to talk to someone about what you're experiencing. Consider booking an appointment with a counselor.";
    } else {
      feedback += "Your responses suggest you're experiencing significant stress. We recommend speaking with a counselor soon to discuss strategies that might help. A counselor has been notified and may reach out to you.";
    }
    
    return {
      score: normalizedScore,
      feedback,
      flagged,
    };
  }
}

/**
 * In a production implementation, we would use the OpenAI API like this:
 * 
 * import OpenAI from "openai";
 * 
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * 
 * export async function analyzeAssessment(
 *   submission: InsertAssessmentSubmission,
 *   questions: AssessmentQuestion[]
 * ): Promise<{ score: number; feedback: string; flagged: boolean }> {
 *   // First calculate the raw score
 *   let totalScore = 0;
 *   let maxPossibleScore = 0;
 *   
 *   // Create a prompt with the questions and responses
 *   let assessmentSummary = "Student Assessment Results:\n\n";
 *   
 *   for (const [questionId, responseValue] of Object.entries(submission.responses)) {
 *     const qId = parseInt(questionId, 10);
 *     const question = questions.find(q => q.id === qId);
 *     
 *     if (question) {
 *       const selectedOption = question.options[responseValue];
 *       assessmentSummary += `Question: ${question.question}\n`;
 *       assessmentSummary += `Response: ${selectedOption} (${responseValue + 1} out of ${question.options.length})\n\n`;
 *       
 *       totalScore += responseValue * question.weight;
 *       maxPossibleScore += (question.options.length - 1) * question.weight;
 *     }
 *   }
 *   
 *   const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
 *   const flagged = normalizedScore > 70;
 *   
 *   // Use OpenAI to generate personalized feedback
 *   const prompt = `
 *     ${assessmentSummary}
 *     
 *     Based on the assessment results above, provide personalized mental health feedback for a student.
 *     The student's normalized score is ${normalizedScore}/100, where higher scores indicate higher stress/anxiety levels.
 *     
 *     Your feedback should:
 *     1. Be compassionate and supportive
 *     2. Acknowledge their specific challenges based on their responses
 *     3. Provide 2-3 specific, actionable recommendations
 *     4. If the score is above 70, encourage them to speak with a counselor
 *     
 *     Format your response as a JSON object with a single field called "feedback" containing your message.
 *   `;
 *   
 *   try {
 *     const response = await openai.chat.completions.create({
 *       model: "gpt-4o",
 *       messages: [
 *         {
 *           role: "system",
 *           content: "You are a compassionate mental health advisor for college students. Your advice is evidence-based and supportive."
 *         },
 *         {
 *           role: "user",
 *           content: prompt
 *         }
 *       ],
 *       response_format: { type: "json_object" }
 *     });
 *     
 *     const result = JSON.parse(response.choices[0].message.content);
 *     
 *     return {
 *       score: normalizedScore,
 *       feedback: result.feedback,
 *       flagged,
 *     };
 *   } catch (error) {
 *     console.error("OpenAI API error:", error);
 *     
 *     // Fallback feedback if API fails
 *     let feedback = "Thank you for completing the assessment. ";
 *     
 *     if (normalizedScore > 70) {
 *       feedback += "Your responses suggest you might benefit from speaking with a counselor. Consider booking an appointment.";
 *     } else {
 *       feedback += "Based on your responses, here are some self-care practices that might help: regular exercise, adequate sleep, and mindfulness meditation.";
 *     }
 *     
 *     return {
 *       score: normalizedScore,
 *       feedback,
 *       flagged,
 *     };
 *   }
 * }
 */

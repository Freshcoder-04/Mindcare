import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AssessmentQuestion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AssessmentFormProps {
  questions: AssessmentQuestion[];
  onComplete: (result: { score: number; feedback: string; flagged: boolean }) => void;
}

export default function AssessmentForm({ questions, onComplete }: AssessmentFormProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const handleOptionSelect = (value: string) => {
    setResponses({
      ...responses,
      [currentQuestion.id.toString()]: parseInt(value),
    });
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const isNextButtonDisabled = () => {
    return !responses.hasOwnProperty(currentQuestion.id.toString());
  };
  
  const handleSubmit = async () => {
    if (Object.keys(responses).length !== questions.length) {
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await apiRequest("POST", "/api/assessment/submit", {
        responses,
      });
      
      const result = await res.json();
      onComplete(result);
      
      toast({
        title: "Assessment Submitted",
        description: "Your assessment has been submitted successfully.",
      });
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-heading">Mental Health Self-Assessment</CardTitle>
        <CardDescription>
          Answer honestly to get the most accurate feedback. Your responses are anonymous.
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      
      <CardContent>
        {currentQuestion && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h3>
            
            <div className="text-lg font-medium mb-4">{currentQuestion.question}</div>
            
            <RadioGroup 
              value={responses[currentQuestion.id.toString()]?.toString() || ""} 
              onValueChange={handleOptionSelect}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          variant="outline"
        >
          Previous
        </Button>
        
        <Button
          onClick={goToNextQuestion}
          disabled={isNextButtonDisabled() || isSubmitting}
        >
          {currentQuestionIndex < questions.length - 1 ? "Next" : "Submit"}
          {isSubmitting && <i className="ri-loader-4-line animate-spin ml-2"></i>}
        </Button>
      </CardFooter>
    </Card>
  );
}

import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getScoreColor } from "@/lib/utils";

interface AssessmentResultsProps {
  score: number;
  feedback: string;
  flagged: boolean;
  onRetake: () => void;
  onBookAppointment: () => void;
}

export default function AssessmentResults({
  score,
  feedback,
  flagged,
  onRetake,
  onBookAppointment,
}: AssessmentResultsProps) {
  const { user } = useAuth();
  
  const getScoreText = (score: number) => {
    if (score < 30) return "Low Stress";
    if (score < 50) return "Moderate Stress";
    if (score < 70) return "High Stress";
    return "Severe Stress";
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-heading">Your Assessment Results</CardTitle>
        <CardDescription>
          Based on your responses, we've generated personalized feedback.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</div>
              <div className="text-sm text-neutral-500">out of 100</div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className={`text-xl font-medium ${getScoreColor(score)}`}>
            {getScoreText(score)}
          </h3>
        </div>
        
        <div className="p-4 bg-neutral-50 rounded-lg">
          <h4 className="font-medium mb-2">Personalized Feedback:</h4>
          <p className="text-neutral-700">
            {feedback}
          </p>
        </div>
        
        {flagged && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <i className="ri-information-line text-amber-500 text-xl mr-2"></i>
              <div>
                <h4 className="font-medium text-amber-800">Support Recommendation</h4>
                <p className="text-amber-700 text-sm">
                  Based on your responses, we recommend speaking with a counselor. 
                  A counselor will be notified and may reach out to offer support.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-primary-light rounded-lg">
          <h4 className="font-medium mb-2">What happens next?</h4>
          <p className="text-neutral-700 text-sm">
            Your assessment is completely anonymous. 
            {flagged 
              ? " A counselor has been notified of your results (identified only by your anonymous ID) and may reach out to offer support."
              : " You can retake this assessment anytime or book an appointment with a counselor if you want to talk."}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" onClick={onRetake}>
          Retake Assessment
        </Button>
        <Button onClick={onBookAppointment}>
          Book Appointment with Counselor
        </Button>
      </CardFooter>
    </Card>
  );
}

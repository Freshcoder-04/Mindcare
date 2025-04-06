import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import AssessmentForm from "@/components/assessment/assessment-form";
import AssessmentResults from "@/components/assessment/assessment-results";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SelfAssessment() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [results, setResults] = useState<{ score: number; feedback: string; flagged: boolean } | null>(null);
  
  // Fetch assessment questions
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['/api/assessment/questions'],
  });
  
  const handleStartAssessment = () => {
    setShowForm(true);
    setResults(null);
  };
  
  const handleAssessmentComplete = (result: { score: number; feedback: string; flagged: boolean }) => {
    setResults(result);
    setShowForm(false);
  };
  
  const handleBookAppointment = () => {
    navigate("/appointments");
  };
  
  return (
    <PageLayout
      title="Self-Assessment"
      description="Check in on your mental well-being with our confidential assessment tools"
    >
      <div className="max-w-4xl mx-auto">
        {!showForm && !results && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                  <i className="ri-mental-health-line text-4xl"></i>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-semibold mb-2">Mental Health Self-Assessment</h3>
                  <p className="text-neutral-600 mb-4">
                    This assessment consists of {questions?.length || 'several'} questions about how you've been feeling lately. 
                    Your responses are confidential and will help identify areas where you might need support.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-neutral-600">
                      <i className="ri-time-line mr-2"></i>
                      <span>Takes approximately 5-10 minutes to complete</span>
                    </div>
                    <div className="flex items-center text-sm text-neutral-600">
                      <i className="ri-shield-user-line mr-2"></i>
                      <span>Your responses are anonymous and confidential</span>
                    </div>
                    <div className="flex items-center text-sm text-neutral-600">
                      <i className="ri-robot-line mr-2"></i>
                      <span>AI-powered analysis provides personalized feedback</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="mt-4 bg-primary text-white hover:bg-primary-dark"
                    onClick={handleStartAssessment}
                    disabled={isLoading || !questions?.length}
                  >
                    {isLoading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Loading Assessment...
                      </>
                    ) : (
                      "Start Assessment"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-48 w-full" />
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <h3 className="font-medium">Error Loading Assessment</h3>
            <p>We couldn't load the assessment questions. Please try again later.</p>
            <Button 
              variant="destructive" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}
        
        {showForm && questions && (
          <AssessmentForm 
            questions={questions} 
            onComplete={handleAssessmentComplete} 
          />
        )}
        
        {results && (
          <AssessmentResults
            score={results.score}
            feedback={results.feedback}
            flagged={results.flagged}
            onRetake={handleStartAssessment}
            onBookAppointment={handleBookAppointment}
          />
        )}
        
        {/* Previous Assessments Section */}
        {!showForm && !results && (
          <div className="mt-8">
            <h3 className="text-xl font-heading font-semibold mb-4">Your Previous Assessments</h3>
            
            {/* Fetch and display previous assessments here */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-file-list-3-line text-2xl text-neutral-400"></i>
              </div>
              <h4 className="font-heading font-medium text-neutral-700 mb-2">No Previous Assessments</h4>
              <p className="text-neutral-500 text-sm">
                Once you complete an assessment, you'll be able to view your history here.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

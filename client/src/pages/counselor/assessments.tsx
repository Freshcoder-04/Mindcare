import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import AssessmentQuestionForm from "@/components/counselor/assessment-question-form";
import FlaggedSubmissions from "@/components/counselor/flagged-submissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AssessmentQuestion } from "@shared/schema";

export default function CounselorAssessments() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<AssessmentQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch assessment questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/assessment/questions'],
    queryFn: async () => {
      const res = await fetch('/api/assessment/questions', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessment questions");
      return res.json();
    },
  });
  
  const handleEditQuestion = (question: AssessmentQuestion) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };
  
  const handleDeleteQuestion = (question: AssessmentQuestion) => {
    setDeletingQuestion(question);
  };
  
  const confirmDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    
    setIsDeleting(true);
    
    try {
      await apiRequest("DELETE", `/api/assessment/questions/${deletingQuestion.id}`);
      
      toast({
        title: "Question Deleted",
        description: "Assessment question has been deleted successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/assessment/questions'] });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the assessment question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingQuestion(null);
    }
  };
  
  const handleFormComplete = () => {
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };
  
  return (
    <PageLayout
      title="Assessment Management"
      description="Create and manage assessment questions and view flagged submissions"
    >
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="questions">Assessment Questions</TabsTrigger>
              <TabsTrigger value="flagged">Flagged Submissions</TabsTrigger>
            </TabsList>
            
            {activeTab === "questions" && !showQuestionForm && (
              <Button onClick={() => setShowQuestionForm(true)}>
                <i className="ri-add-line mr-2"></i>
                Create Question
              </Button>
            )}
          </div>
          
          <TabsContent value="questions">
            {showQuestionForm ? (
              <AssessmentQuestionForm
                questionToEdit={editingQuestion || undefined}
                onComplete={handleFormComplete}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : questions?.length > 0 ? (
                    <div className="space-y-4">
                      {questions.map((question: AssessmentQuestion) => (
                        <div
                          key={question.id}
                          className="border border-neutral-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center mb-2">
                                <span className="text-xs bg-primary text-white rounded-full px-2 py-1 mr-2">
                                  {question.category}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  Weight: {question.weight}
                                </span>
                              </div>
                              
                              <div className="font-medium mb-3">{question.question}</div>
                              
                              <div className="text-sm text-neutral-600">
                                <div className="font-medium mb-1">Options:</div>
                                <ol className="list-decimal list-inside pl-2 space-y-1">
                                  {question.options.map((option, index) => (
                                    <li key={index}>{option}</li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <i className="ri-pencil-line mr-1"></i>
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteQuestion(question)}
                              >
                                <i className="ri-delete-bin-line mr-1"></i>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-question-line text-2xl text-neutral-400"></i>
                      </div>
                      <h3 className="text-lg font-medium text-neutral-700 mb-2">No Questions Created</h3>
                      <p className="text-neutral-500 text-sm mb-4">
                        Create assessment questions for students to complete.
                      </p>
                      <Button onClick={() => setShowQuestionForm(true)}>
                        Create First Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="flagged">
            <FlaggedSubmissions />
          </TabsContent>
        </Tabs>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Assessment Question</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this question? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {deletingQuestion && (
              <div className="bg-neutral-50 p-4 rounded-lg my-4">
                <p className="font-medium">{deletingQuestion.question}</p>
                <p className="text-sm text-neutral-500 mt-2">Category: {deletingQuestion.category}</p>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingQuestion(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteQuestion}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Deleting...
                  </>
                ) : (
                  "Delete Question"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}

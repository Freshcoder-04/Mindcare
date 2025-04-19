import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getScoreColor } from "@/lib/utils";
import { AssessmentSubmission } from "@shared/schema";
import { Link } from "react-router-dom";

export default function FlaggedSubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
  
  // Fetch flagged submissions
  const { data: flaggedSubmissions, isLoading } = useQuery({
    queryKey: ['/api/assessment/submissions/flagged'],
    queryFn: async () => {
      const res = await fetch('/api/assessment/submissions/flagged', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch flagged submissions");
      return res.json();
    },
  });
  
  const handleOpenDetails = (submission: AssessmentSubmission) => {
    setSelectedSubmission(submission);
  };
  
  const handleCloseDetails = () => {
    setSelectedSubmission(null);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="ri-flag-line text-red-500 mr-2"></i>
            Flagged Assessment Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : flaggedSubmissions?.length > 0 ? (
            <div className="space-y-4">
              {flaggedSubmissions.map((submission: AssessmentSubmission) => (
                <div
                  key={submission.id}
                  className="border border-red-100 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <Badge variant="destructive" className="mr-2">Flagged</Badge>
                        <div className="text-sm text-neutral-500">
                          User ID: {submission.userId}
                        </div>
                        <div className="text-sm text-neutral-500 ml-4">
                          Submitted: {formatDate(submission.createdAt.toString())}
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`text-lg font-semibold ${getScoreColor(submission.score)}`}>
                          Score: {submission.score}/100
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-neutral-700 line-clamp-2">
                        {submission.feedback}
                      </div>
                    </div>
                    
                    <Button onClick={() => handleOpenDetails(submission)}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-inbox-line text-2xl text-neutral-400"></i>
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">No Flagged Submissions</h3>
              <p className="text-neutral-500 text-sm">
                There are currently no assessment submissions that require attention.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Submission Details Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assessment Submission Details</DialogTitle>
            <DialogDescription>
              User ID: {selectedSubmission?.userId} | Submitted: {selectedSubmission && formatDate(selectedSubmission.createdAt.toString())}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center mr-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(selectedSubmission?.score || 0)}`}>
                    {selectedSubmission?.score}
                  </div>
                  <div className="text-xs text-neutral-500">out of 100</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Assessment Score</h3>
                <p className="text-sm text-neutral-600">
                  This score indicates a high level of distress or concern.
                </p>
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">AI-Generated Feedback:</h4>
              <p className="text-neutral-700">{selectedSubmission?.feedback}</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Recommended Action:</h4>
              <p className="text-amber-700">
                Consider reaching out to this student through the chat system to offer support.
                The assessment indicates they may benefit from counseling services.
              </p>
              
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseDetails}>
                  Close
                </Button>
                {/* <Button className="bg-primary text-white hover:bg-primary-dark">
                  Send Message to Student
                </Button> */}
                <Link to="/counselor/chat-counselor">
                    <button className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg">
                      Message Student
                    </button>
                  </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

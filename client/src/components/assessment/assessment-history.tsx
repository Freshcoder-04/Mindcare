import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AssessmentHistoryProps {
  onViewDetails: (submission: any) => void;
}

export default function AssessmentHistory({ onViewDetails }: AssessmentHistoryProps) {
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ["/api/assessment/submissions"],
    queryFn: async () => {
      const res = await fetch("/api/assessment/submissions", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch assessment submissions");
      }
      return res.json();
    },
  });

  if (isLoading) return <p>Loading assessment history…</p>;
  if (error) return <p>Error loading assessment history.</p>;

  return (
    <div className="space-y-4">
      {submissions && submissions.length > 0 ? (
        submissions.map((submission: any) => (
          <Card key={submission.id} className="cursor-pointer hover:shadow-lg" onClick={() => onViewDetails(submission)}>
            <CardHeader>
              <CardTitle>Assessment on {formatDateTime(submission.createdAt)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Score: {submission.score} / 100</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-file-list-3-line text-2xl text-neutral-400"></i>
          </div>
          <h4 className="font-heading font-medium text-neutral-700 mb-2">No Previous Assessments</h4>
          <p className="text-neutral-500 text-sm">
            Once you complete an assessment, you'll be able to view your history here.
          </p>
        </div>
      )}
    </div>
  );
}

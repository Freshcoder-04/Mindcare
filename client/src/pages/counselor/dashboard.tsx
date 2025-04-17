import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/page-layout";
import FlaggedSubmissions from "@/components/counselor/flagged-submissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CounselorDashboard() {
  const [, navigate] = useLocation();
  
  // Fetch upcoming appointments
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const res = await fetch('/api/appointments', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
  });
  
  // Fetch flagged assessments count
  const { data: flaggedSubmissions, isLoading: loadingFlagged } = useQuery({
    queryKey: ['/api/assessment/submissions/flagged'],
    queryFn: async () => {
      const res = await fetch('/api/assessment/submissions/flagged', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch flagged submissions");
      return res.json();
    },
  });
  
  // Filter scheduled appointments
  const scheduledAppointments = appointments?.filter((apt: any) => apt.status === 'scheduled') || [];
  const flaggedCount = flaggedSubmissions?.length || 0;
  
  return (
    <PageLayout
      title="Counselor Dashboard"
      description="Monitor student mental health and manage resources"
    >
      <div className="max-w-7xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Flagged Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFlagged ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline space-x-2">
                  <div className="text-3xl font-bold">{flaggedCount}</div>
                  <div className="text-sm text-neutral-500">
                    {flaggedCount === 1 ? "submission" : "submissions"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline space-x-2">
                  <div className="text-3xl font-bold">{scheduledAppointments.length}</div>
                  <div className="text-sm text-neutral-500">
                    {scheduledAppointments.length === 1 ? "session" : "sessions"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Active Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold">--</div>
                <div className="text-sm text-neutral-500">last 7 days</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => navigate("/counselor/assessments")}
            className="h-auto py-4 bg-primary-light hover:bg-primary-light/80 text-primary"
          >
            <div className="flex flex-col items-center">
              <i className="ri-file-list-3-line text-2xl mb-2"></i>
              <span>Manage Assessments</span>
            </div>
          </Button>
          
          <Button
            onClick={() => navigate("/counselor/resources")}
            className="h-auto py-4 bg-secondary-light hover:bg-secondary-light/80 text-secondary"
          >
            <div className="flex flex-col items-center">
              <i className="ri-book-open-line text-2xl mb-2"></i>
              <span>Manage Resources</span>
            </div>
          </Button>
          
          <Button
            onClick={() => navigate("/appointments")}
            className="h-auto py-4 bg-accent-light hover:bg-accent-light/80 text-neutral-800"
          >
            <div className="flex flex-col items-center">
              <i className="ri-calendar-line text-2xl mb-2"></i>
              <span>Manage Appointments</span>
            </div>
          </Button>
          
          <Button
            onClick={() => navigate("/counselor/chat-counselor")}
            className="h-auto py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
          >
            <div className="flex flex-col items-center">
              <i className="ri-chat-3-line text-2xl mb-2"></i>
              <span>Chat with Students</span>
            </div>
          </Button>
        </div>
        
        {/* Flagged Assessments */}
        <div className="mb-8">
          <FlaggedSubmissions />
        </div>
        
        {/* Upcoming Appointments */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="ri-calendar-check-line text-primary mr-2"></i>
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : scheduledAppointments.length > 0 ? (
                <div className="space-y-4">
                  {scheduledAppointments.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium mb-1">
                            Counseling Session with Student #{appointment.studentId}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                            {new Date(appointment.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {new Date(appointment.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {appointment.notes && (
                            <div className="mt-2 text-sm bg-neutral-50 p-2 rounded">
                              Notes: {appointment.notes}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => navigate("/appointments")}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-calendar-line text-2xl text-neutral-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700 mb-2">No Upcoming Appointments</h3>
                  <p className="text-neutral-500 text-sm mb-4">
                    You don't have any scheduled appointments with students.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/appointments")}>
                    Manage Appointment Slots
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

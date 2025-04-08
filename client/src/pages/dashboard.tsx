import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

import PageLayout from "@/components/layout/page-layout";
import QuickActionCard from "@/components/dashboard/quick-action-card";
import ResourceCard from "@/components/dashboard/resource-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch latest resources
  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['/api/resources'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Fetch upcoming appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  return (
    <PageLayout
      title="Welcome to MindCare"
      description="Your mental well-being companion"
    >
      <div className="max-w-7xl mx-auto">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <QuickActionCard
            title="Self-Assessment"
            description="Take a quick assessment to check your mental well-being"
            icon="ri-mental-health-line"
            variant="primary"
            action={{
              label: "Start Assessment",
              onClick: () => navigate("/self-assessment")
            }}
          />
          <QuickActionCard
            title="Anonymous Chat"
            description="Connect with peers and share your experiences"
            icon="ri-chat-3-line"
            variant="primary"
            action={{
              label: "Join Chat Room",
              onClick: () => navigate("/chat")
            }}
          />
          <QuickActionCard
            title="Book Appointment"
            description="Schedule a meeting with a counselor"
            icon="ri-calendar-line"
            variant="primary"
            action={{
              label: "View Calendar",
              onClick: () => navigate("/appointments")
            }}
          />
        </div>

        {/* Latest Resources */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-heading font-semibold text-neutral-800">Latest Resources</h3>
            <Button variant="link" onClick={() => navigate("/resources")} className="text-primary">
              View All
            </Button>
          </div>
          
          {isLoadingResources ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index}>
                  <Skeleton className="h-40 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources && resources.length > 0 ? (
                resources.slice(0, 3).map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-neutral-500">
                  No resources available yet. Check back later!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h3 className="text-xl font-heading font-semibold text-neutral-800 mb-4">Upcoming Appointments</h3>
          <Card className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {isLoadingAppointments ? (
              <div className="p-8">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto mb-4" />
                <Skeleton className="h-10 w-40 mx-auto" />
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="divide-y divide-neutral-200">
                {appointments.filter(appt => appt.status === 'scheduled').map((appointment) => (
                  <div key={appointment.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{new Date(appointment.startTime).toLocaleDateString()}</div>
                      <div className="text-sm text-neutral-500">
                        {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(appointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/appointments")}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-line text-2xl text-neutral-400"></i>
                </div>
                <h4 className="font-heading font-medium text-neutral-700 mb-2">No Upcoming Appointments</h4>
                <p className="text-neutral-500 text-sm mb-4">You don't have any scheduled appointments with counselors.</p>
                <Button 
                  className="bg-primary text-white hover:bg-primary-dark"
                  onClick={() => navigate("/appointments")}
                >
                  Book an Appointment
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Assessment & Chat Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Mood Check */}
          <Card className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-xl font-heading font-semibold text-neutral-800 mb-4">Quick Mood Check</h3>
              <p className="text-neutral-600 mb-6">How are you feeling today? This quick check won't be saved or shared.</p>
              
              <div className="flex flex-wrap justify-between gap-2 mb-6">
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[80px] hover:bg-neutral-200 py-3 px-2 rounded-lg text-neutral-700 text-sm font-medium"
                >
                  😔 Low
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[80px] hover:bg-neutral-200 py-3 px-2 rounded-lg text-neutral-700 text-sm font-medium"
                >
                  😐 Neutral
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[80px] hover:bg-neutral-200 py-3 px-2 rounded-lg text-neutral-700 text-sm font-medium"
                >
                  🙂 Good
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 min-w-[80px] hover:bg-neutral-200 py-3 px-2 rounded-lg text-neutral-700 text-sm font-medium"
                >
                  😄 Great
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => navigate("/self-assessment")}
                >
                  Take Full Assessment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat Preview */}
          <Card className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-xl font-heading font-semibold text-neutral-800">Chat Rooms</h3>
              <p className="text-neutral-600 text-sm">Join anonymous discussions with peers</p>
            </div>
            
            <div className="flex-1 overflow-hidden p-4">
              <div className="mb-4">
                <div className="flex mb-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-neutral-600">U1</span>
                  </div>
                  <div className="bg-neutral-100 px-4 py-2 rounded-lg chat-bubble-student max-w-[80%]">
                    <p className="text-sm text-neutral-700">Does anyone have tips for dealing with stress during finals?</p>
                    <span className="text-xs text-neutral-500 mt-1 block">10:15 AM</span>
                  </div>
                </div>
                
                <div className="flex mb-2 justify-end">
                  <div className="bg-primary-light px-4 py-2 rounded-lg chat-bubble-counselor max-w-[80%]">
                    <p className="text-sm text-neutral-700">I find that taking short breaks every 30 minutes helps me stay focused!</p>
                    <span className="text-xs text-neutral-500 mt-1 block">10:17 AM</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-2">
                    <span className="text-xs font-medium text-white">You</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-neutral-200">
              <Button 
                className="w-full bg-primary text-white hover:bg-primary-dark"
                onClick={() => navigate("/chat")}
              >
                Join Chat Room
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

// Helper function to handle 401 responses
function getQueryFn<T>({ on401 }: { on401: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json() as T;
  };
}

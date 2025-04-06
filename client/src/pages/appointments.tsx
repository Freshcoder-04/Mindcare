import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import AppointmentCalendar from "@/components/appointments/appointment-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

export default function Appointments() {
  const { toast } = useToast();
  const [canceling, setCanceling] = useState<number | null>(null);
  
  // Fetch available slots
  const { data: availableSlots, isLoading: loadingSlots } = useQuery({
    queryKey: ['/api/appointments/slots'],
    queryFn: async () => {
      const res = await fetch('/api/appointments/slots', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch available slots");
      return res.json();
    },
  });
  
  // Fetch user appointments
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const res = await fetch('/api/appointments', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
  });
  
  const handleCancelAppointment = async (appointmentId: number) => {
    setCanceling(appointmentId);
    
    try {
      await apiRequest("PUT", `/api/appointments/${appointmentId}/cancel`);
      
      toast({
        title: "Appointment Canceled",
        description: "Your appointment has been canceled successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/slots'] });
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "There was an error canceling your appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCanceling(null);
    }
  };
  
  // Filter appointments by status
  const upcomingAppointments = appointments?.filter((apt: any) => apt.status === 'scheduled') || [];
  const pastAppointments = appointments?.filter((apt: any) => apt.status !== 'scheduled') || [];
  
  return (
    <PageLayout
      title="Appointments"
      description="Schedule and manage your counseling appointments"
    >
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="book">
          <TabsList className="mb-6">
            <TabsTrigger value="book">Book Appointment</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Appointments</TabsTrigger>
            <TabsTrigger value="past">Past Appointments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book">
            <div className="mb-6">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-lg bg-accent-light flex items-center justify-center text-accent">
                      <i className="ri-calendar-line text-2xl"></i>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-heading font-semibold mb-2">Book a Counseling Session</h3>
                      <p className="text-neutral-600 mb-4">
                        Choose a convenient date and time to speak with a counselor. All appointments are confidential.
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-neutral-600">
                          <i className="ri-time-line mr-2"></i>
                          <span>Sessions typically last 50 minutes</span>
                        </div>
                        <div className="flex items-center text-sm text-neutral-600">
                          <i className="ri-shield-user-line mr-2"></i>
                          <span>Your identity remains anonymous throughout the process</span>
                        </div>
                        <div className="flex items-center text-sm text-neutral-600">
                          <i className="ri-calendar-event-line mr-2"></i>
                          <span>Booking is confirmed immediately</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <AppointmentCalendar
              availableSlots={availableSlots || []}
              isLoading={loadingSlots}
            />
          </TabsContent>
          
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment: any) => (
                      <div 
                        key={appointment.id} 
                        className="border border-neutral-200 rounded-lg p-4 flex flex-col md:flex-row justify-between"
                      >
                        <div className="mb-4 md:mb-0">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-neutral-800 mr-2">
                              <i className="ri-calendar-check-line"></i>
                            </div>
                            <div className="font-medium">Counseling Session</div>
                          </div>
                          <div className="text-sm text-neutral-600 ml-10">
                            <div><strong>Date & Time:</strong> {formatDateTime(appointment.startTime)}</div>
                            <div><strong>Counselor ID:</strong> {appointment.counselorId}</div>
                            {appointment.notes && <div><strong>Notes:</strong> {appointment.notes}</div>}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={canceling === appointment.id}
                          >
                            {canceling === appointment.id ? (
                              <>
                                <i className="ri-loader-4-line animate-spin mr-2"></i>
                                Canceling...
                              </>
                            ) : (
                              "Cancel Appointment"
                            )}
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
                      You don't have any scheduled appointments with counselors.
                    </p>
                    <Button variant="outline" onClick={() => document.querySelector('button[value="book"]')?.click()}>
                      Book an Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Past Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : pastAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {pastAppointments.map((appointment: any) => (
                      <div 
                        key={appointment.id} 
                        className="border border-neutral-200 rounded-lg p-4 bg-neutral-50"
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 mr-2">
                            <i className="ri-calendar-check-line"></i>
                          </div>
                          <div className="font-medium">Counseling Session ({appointment.status})</div>
                        </div>
                        <div className="text-sm text-neutral-600 ml-10">
                          <div><strong>Date & Time:</strong> {formatDateTime(appointment.startTime)}</div>
                          <div><strong>Counselor ID:</strong> {appointment.counselorId}</div>
                          {appointment.notes && <div><strong>Notes:</strong> {appointment.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-history-line text-2xl text-neutral-400"></i>
                    </div>
                    <h3 className="text-lg font-medium text-neutral-700 mb-2">No Past Appointments</h3>
                    <p className="text-neutral-500 text-sm">
                      Your appointment history will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

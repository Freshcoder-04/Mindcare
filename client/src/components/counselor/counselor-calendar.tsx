import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AvailableSlot } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface CounselorCalendarProps {}

export default function CounselorCalendar({}: CounselorCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null);

  const { data: availableSlots, isLoading } = useQuery({
    queryKey: ["/api/counselor/slots", user?.id],
    queryFn: async () => {
        const res = await fetch("/api/counselor/slots", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch counselor slots");
        return res.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
     refetchInterval: 30000,
  });

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) {
      return;
    }

    setDeletingSlot(slotId);
    try {
      const res = await apiRequest("DELETE", `/api/appointments/slots/${slotId}`);
      if (res.ok) {
        toast({
          title: "Slot Deleted",
          description: "The slot has been successfully deleted.",
        });
        // Invalidate the query to refresh the slots
        queryClient.invalidateQueries({ queryKey: ["/api/counselor/slots", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/appointments", user?.id] });
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete slot");
      }
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "There was an error deleting the slot.",
        variant: "destructive",
      });
    } finally {
      setDeletingSlot(null);
    }
  };

  // Filter slots that match the selected date
  const slotsForSelectedDate = selectedDate && availableSlots
    ? availableSlots.filter((slot: AvailableSlot) => isSameDay(new Date(slot.startTime), selectedDate))
    : [];

  // Helper function to highlight dates that have available slots (for the counselor)
  const isDayWithSlots = (day: Date) => {
    if (!availableSlots) return false;
    return availableSlots.some((slot: AvailableSlot) => isSameDay(new Date(slot.startTime), day));
  };

  return (
    <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side: Calendar */}
        <Card>
            <CardHeader>
            <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
            ) : (
                <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                    hasSlots: isDayWithSlots,
                }}
                modifiersClassNames={{
                    hasSlots: "bg-primary-light font-medium text-primary",
                }}
                disabled={{ before: new Date() }}
                />
            )}
            <div className="mt-4 flex items-center text-sm text-neutral-500">
                <div className="w-4 h-4 bg-primary-light rounded-full mr-2"></div>
                <span>Dates with available slots</span>
            </div>
            </CardContent>
        </Card>
        
        {/* Right side: List the available slots on the selected date */}
        <Card>
            <CardHeader>
            <CardTitle>My Available Slots</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
                </div>
            ) : selectedDate ? (
                slotsForSelectedDate.length > 0 ? (
                <div className="space-y-3">
                    <div className="text-sm font-medium mb-2">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </div>
                    {slotsForSelectedDate.map((slot: AvailableSlot) => (
                    <div 
                        key={slot.id} 
                        className={`bg-white border border-neutral-200 rounded-lg p-4 flex justify-between items-center hover:border-primary transition-colors ${slot.isBooked ? 'bg-red-50 border-red-200' : ''}`}
                    >
                        <div>
                        <div className="font-medium">
                            {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                        </div>
                        <div className="text-sm text-neutral-500">
                            Slot ID: {slot.id}
                            {slot.isBooked && <span className="ml-2 text-red-500">(Booked)</span>}
                        </div>
                        </div>
                        {!slot.isBooked && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={deletingSlot === slot.id}
                            >
                                {deletingSlot === slot.id ? (
                                    <>
                                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-delete-bin-line mr-2"></i>
                                        Delete
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    ))}
                </div>
                ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-time-line text-2xl text-neutral-400"></i>
                    </div>
                    <h3 className="text-lg font-medium text-neutral-700 mb-2">No Available Slots on this Date</h3>
                    <p className="text-neutral-500 text-sm">
                    You have not set any slots for the selected date. Please choose another date or set new slots.
                    </p>
                </div>
                )
            ) : (
                <div className="text-center py-8">
                <p>Please select a date to view your available slots.</p>
                </div>
            )}
            </CardContent>
        </Card>
        </div>
    </div>
  );
}

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { AvailableSlot } from "@shared/schema";

interface AppointmentCalendarProps {
  availableSlots: AvailableSlot[];
  isLoading: boolean;
}

export default function AppointmentCalendar({ availableSlots, isLoading }: AppointmentCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingSlot, setBookingSlot] = useState<AvailableSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  
  // Get slots for the selected date
  const slotsForSelectedDate = selectedDate
    ? availableSlots.filter((slot) => isSameDay(new Date(slot.startTime), selectedDate))
    : [];
  
  // Function to highlight dates with available slots
  const isDayWithSlots = (day: Date) => {
    return availableSlots.some((slot) => isSameDay(new Date(slot.startTime), day));
  };
  
  const handleBookAppointment = async (slot: AvailableSlot) => {
    setBookingSlot(slot);
    setIsBooking(true);
    
    try {
      await apiRequest("POST", "/api/appointments", {
        slotId: slot.id,
      });
      
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been scheduled successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/slots'] });
      
      setBookingSlot(null);
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Calendar */}
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
      
      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Available Time Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : selectedDate ? (
            slotsForSelectedDate.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-medium mb-2">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </div>
                
                {slotsForSelectedDate.map((slot) => (
                  <div 
                    key={slot.id} 
                    className="bg-white border border-neutral-200 rounded-lg p-4 flex justify-between items-center hover:border-primary transition-colors"
                  >
                    <div>
                      <div className="font-medium">
                        {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Counselor ID: {slot.counselorId}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleBookAppointment(slot)}
                      disabled={slot.isBooked || isBooking}
                    >
                      {isBooking && bookingSlot?.id === slot.id ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Booking...
                        </>
                      ) : (
                        "Book Slot"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-time-line text-2xl text-neutral-400"></i>
                </div>
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No Available Slots</h3>
                <p className="text-neutral-500 text-sm">
                  There are no available slots for the selected date.
                  Please select a different date or check back later.
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-calendar-line text-2xl text-neutral-400"></i>
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">Select a Date</h3>
              <p className="text-neutral-500 text-sm">
                Please select a date to view available appointment slots.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

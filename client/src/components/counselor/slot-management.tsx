import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function SlotManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Local state for slot form
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [repeatDays, setRepeatDays] = useState<string[]>([]); // e.g., ["Mon", "Wed"]
  const [repeatEndDate, setRepeatEndDate] = useState("");

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { startTime, endTime, repeatDays, repeatEndDate };
      const res = await apiRequest("POST", "/api/appointments/slots/repeat", payload);
      if (res.ok) {
        toast({
          title: "Slot Added",
          description: "Your available slot(s) have been set."
        });
        queryClient.invalidateQueries({ queryKey: ["/api/counselor/slots", user?.id] });
        // Optionally reset form
        setStartTime("");
        setEndTime("");
        setRepeatDays([]);
        setRepeatEndDate("");
      } else {
        throw new Error("Failed to create slot(s).");
      }
    } catch (error) {
      toast({
        title: "Slot Creation Failed",
        description: "There was an error creating your available slot(s).",
        variant: "destructive"
      });
    }
  };

  // Example checkbox group for days of the week
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="mb-6 p-4 lg:p-6">
      {/* Optional: Use a card for aesthetic wrapping */}
      <Card className="shadow-sm border border-neutral-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">
            Manage Available Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSlotSubmit} className="space-y-6">
            {/* Start/End Times in a 2-column grid on wider screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block font-medium mb-1">Start Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              {/* End Time */}
              <div>
                <label className="block font-medium mb-1">End Time</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Repeat on Days */}
            <div>
              <label className="block font-medium mb-2">Repeat on Days</label>
              <div className="flex flex-wrap gap-3">
                {days.map((day) => (
                  <label
                    key={day}
                    className="inline-flex items-center space-x-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={repeatDays.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRepeatDays((prev) => [...prev, day]);
                        } else {
                          setRepeatDays((prev) => prev.filter((d) => d !== day));
                        }
                      }}
                    />
                    <span className="select-none">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Repeat End Date */}
            <div>
              <label className="block font-medium mb-1">Repeat End Date</label>
              <Input
                type="date"
                value={repeatEndDate}
                onChange={(e) => setRepeatEndDate(e.target.value)}
                placeholder="Optional"
              />
              <p className="text-xs text-neutral-500 mt-1">
                If set, this slot will repeat for the chosen days until this date.
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full md:w-auto">
              Set Available Slot(s)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

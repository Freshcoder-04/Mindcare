import { BaseCommand } from "./Command";
import { apiRequest } from "@/lib/queryClient";
import { AvailableSlot } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export class BookAppointmentCommand extends BaseCommand {
  constructor(
    private slot: AvailableSlot,
    private onSuccess?: () => void,
    private onError?: (error: any) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    try {
      await apiRequest("POST", "/api/appointments", {
        slotId: this.slot.id,
      });

      await this.invalidateQueries([
        '/api/appointments',
        '/api/appointments/slots',
        '/api/counselor/slots'
      ]);

      this.onSuccess?.();
    } catch (error) {
      this.onError?.(error);
      throw error;
    }
  }

  async undo(): Promise<void> {
    // Implement cancellation logic if needed
    throw new Error("Undo not implemented for BookAppointmentCommand");
  }
} 
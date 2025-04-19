import { BaseCommand } from "./Command";
import { apiRequest } from "@/lib/queryClient";

export class CancelAppointmentCommand extends BaseCommand {
  constructor(
    private appointmentId: string,
    private onSuccess?: () => void,
    private onError?: (error: any) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    try {
      await apiRequest("DELETE", `/api/appointments/${this.appointmentId}`);

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
    // Implement rebooking logic if needed
    throw new Error("Undo not implemented for CancelAppointmentCommand");
  }
} 
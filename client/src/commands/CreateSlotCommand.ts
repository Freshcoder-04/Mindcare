import { BaseCommand } from "./Command";
import { apiRequest } from "@/lib/queryClient";

interface CreateSlotParams {
  startTime: string;
  endTime: string;
  counselorId: string;
}

export class CreateSlotCommand extends BaseCommand {
  constructor(
    private params: CreateSlotParams,
    private onSuccess?: () => void,
    private onError?: (error: any) => void
  ) {
    super();
  }

  async execute(): Promise<void> {
    try {
      await apiRequest("POST", "/api/counselor/slots", this.params);

      await this.invalidateQueries([
        '/api/counselor/slots',
        '/api/appointments/slots'
      ]);

      this.onSuccess?.();
    } catch (error) {
      this.onError?.(error);
      throw error;
    }
  }

  async undo(): Promise<void> {
    // Implement slot deletion logic if needed
    throw new Error("Undo not implemented for CreateSlotCommand");
  }
} 
import { queryClient } from "@/lib/queryClient";

export interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

export abstract class BaseCommand implements Command {
  protected queryClient = queryClient;

  abstract execute(): Promise<void>;
  abstract undo(): Promise<void>;

  protected async invalidateQueries(queries: string[]) {
    await Promise.all(
      queries.map(query => 
        this.queryClient.invalidateQueries({ queryKey: [query] })
      )
    );
  }
} 
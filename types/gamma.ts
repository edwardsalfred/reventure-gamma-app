export interface GammaGenerationResponse {
  generationId: string;
  status: "pending" | "completed" | "failed";
  gammaUrl?: string;
  credits?: {
    deducted: number;
    remaining: number;
  };
}

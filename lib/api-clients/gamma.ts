import axios from "axios";
import { GammaGenerationResponse } from "@/types/gamma";

const BASE_URL = "https://public-api.gamma.app/v1.0";

function getClient() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "X-API-KEY": process.env.GAMMA_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

export async function createPresentation(
  proposalText: string
): Promise<{ generationId: string }> {
  const client = getClient();

  const { data } = await client.post("/generations", {
    inputText: proposalText,
    textMode: "preserve",
  });

  return { generationId: data.generationId };
}

export async function checkGenerationStatus(
  generationId: string
): Promise<GammaGenerationResponse> {
  const client = getClient();
  const { data } = await client.get(`/generations/${generationId}`);

  return {
    generationId: data.generationId,
    status: data.status,
    gammaUrl: data.gammaUrl,
    credits: data.credits,
  };
}

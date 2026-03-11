import Anthropic from "@anthropic-ai/sdk";
import { PROPOSAL_SYSTEM_PROMPT } from "@/lib/prompts/proposal-system-prompt";
import { TranscriptLine } from "@/types/readai";

function formatTranscript(lines: TranscriptLine[]): string {
  return lines
    .map((line) => {
      const minutes = Math.floor(line.startTime / 60);
      const seconds = line.startTime % 60;
      const timestamp = `${String(minutes).padStart(2, "0")}:${String(Math.floor(seconds)).padStart(2, "0")}`;
      return `[${timestamp}] ${line.speaker}: ${line.text}`;
    })
    .join("\n");
}

export async function generateProposal(
  transcript: TranscriptLine[],
  meetingTitle: string
): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const formattedTranscript = formatTranscript(transcript);

  const userMessage = `Meeting Title: ${meetingTitle}

Call Transcript:
${formattedTranscript}

Please generate a comprehensive business proposal based on this call transcript following the required structure.`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: PROPOSAL_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  return textContent.text;
}

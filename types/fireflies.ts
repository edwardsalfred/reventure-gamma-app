export interface FirefliesMeeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  participantCount: number;
  status: string;
}

export interface TranscriptLine {
  speaker: string;
  text: string;
  startTime: number;
}

export interface MeetingDetail {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: Array<{ name: string; email?: string }>;
}

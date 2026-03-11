import { MeetingsList } from "@/components/meetings/MeetingsList";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Call Recordings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Select a meeting to generate a proposal from its transcript.
        </p>
      </div>
      <MeetingsList />
    </div>
  );
}

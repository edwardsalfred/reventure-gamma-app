import { notFound, redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { getSession } from "@/lib/auth/session";
import { Presentation } from "@/types/db";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function PresentationPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.status !== "approved") {
    redirect("/");
  }

  const userId = parseInt(session.sub, 10);
  const presentationId = parseInt(params.id, 10);

  const { rows } = await sql<Presentation>`
    SELECT * FROM presentations
    WHERE id = ${presentationId} AND user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    notFound();
  }

  const presentation = rows[0];

  if (presentation.status !== "completed" || !presentation.gamma_url) {
    redirect(`/dashboard`);
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to meetings
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{presentation.meeting_title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Generated {new Date(presentation.created_at).toLocaleDateString()}
          </p>
        </div>

        <a
          href={presentation.gamma_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open Presentation in Gamma
        </a>

        {presentation.proposal_text && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Generated Proposal</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
              {presentation.proposal_text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

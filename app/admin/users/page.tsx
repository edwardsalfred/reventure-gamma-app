import { sql } from "@vercel/postgres";
import { UserTable } from "@/components/admin/UserTable";

interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

interface Props {
  searchParams: { readai?: string; detail?: string };
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { rows: users } = await sql<User>`
    SELECT id, username, role, status, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  const readaiStatus = searchParams.readai;
  const readaiDetail = searchParams.detail;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Approve or reject user registrations.
          </p>
        </div>
        <a
          href="/api/auth/readai"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          Reconnect Read.ai
        </a>
      </div>

      {readaiStatus === "connected" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Read.ai connected successfully.
        </div>
      )}
      {readaiStatus === "error" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Read.ai connection failed{readaiDetail ? `: ${readaiDetail}` : ""}.
        </div>
      )}

      <UserTable initialUsers={users} />
    </div>
  );
}

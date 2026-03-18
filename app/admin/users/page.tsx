import { sql } from "@vercel/postgres";
import { UserTable } from "@/components/admin/UserTable";

interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

export default async function AdminUsersPage() {
  const { rows: users } = await sql<User>`
    SELECT id, username, role, status, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Approve or reject user registrations.
        </p>
      </div>

      <UserTable initialUsers={users} />
    </div>
  );
}

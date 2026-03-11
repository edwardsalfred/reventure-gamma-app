"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

interface UserTableProps {
  initialUsers: User[];
}

export function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleAction(userId: number, action: "approve" | "reject") {
    setLoadingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, status: data.user.status } : u
          )
        );
      }
    } finally {
      setLoadingId(null);
    }
  }

  function statusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge variant="green">Approved</Badge>;
      case "rejected":
        return <Badge variant="red">Rejected</Badge>;
      default:
        return <Badge variant="yellow">Pending</Badge>;
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Registered
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">
                  {user.username}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-500 capitalize">{user.role}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {statusBadge(user.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                {user.role !== "admin" && (
                  <div className="flex items-center justify-end gap-2">
                    {user.status !== "approved" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={loadingId === user.id}
                        onClick={() => handleAction(user.id, "approve")}
                      >
                        Approve
                      </Button>
                    )}
                    {user.status !== "rejected" && (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={loadingId === user.id}
                        onClick={() => handleAction(user.id, "reject")}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No users found.
        </div>
      )}
    </div>
  );
}

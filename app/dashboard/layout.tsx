import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.status !== "approved") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar username={session.username} role={session.role} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

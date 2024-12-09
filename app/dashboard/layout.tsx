import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Панель управления | TULPAR EXPRESS",
  description: "Панель управления TULPAR EXPRESS",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Здесь будет навигация */}
      <main className="container mx-auto py-4">{children}</main>
    </div>
  );
}

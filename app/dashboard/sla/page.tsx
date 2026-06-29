"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SlaCharts from "./SlaCharts";

export default async function SLADashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date().toISOString();

  // Fetch ticket counts per status
  const { data: tickets } = await supabase
    .from("tickets")
    .select("status, priority, sla_due_at, title, id, created_at");

  // Fetch assets
  const { data: assets } = await supabase
    .from("assets")
    .select("category, status");

  const ticketList = tickets ?? [];
  const assetList = assets ?? [];

  // Ticket per status
  const statusCounts = ["open", "in_progress", "resolved", "closed"].map(
    (s) => ({
      status: s,
      label:
        s === "in_progress"
          ? "In Progress"
          : s.charAt(0).toUpperCase() + s.slice(1),
      count: ticketList.filter((t) => t.status === s).length,
    })
  );

  // Breach SLA: sla_due_at < now AND status not resolved/closed
  const breachedTickets = ticketList
    .filter(
      (t) =>
        t.sla_due_at &&
        t.sla_due_at < now &&
        t.status !== "resolved" &&
        t.status !== "closed"
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      sla_due_at: t.sla_due_at,
      created_at: t.created_at,
    }));

  // Asset per category
  const assetCategories = [
    "laptop",
    "desktop",
    "software_license",
    "server",
    "peripheral",
    "other",
  ];
  const assetByCategory = assetCategories.map((cat) => ({
    name:
      cat === "software_license"
        ? "SW License"
        : cat.charAt(0).toUpperCase() + cat.slice(1),
    value: assetList.filter((a) => a.category === cat).length,
  }));

  // Asset per status
  const assetStatuses = ["available", "in_use", "maintenance", "retired"];
  const assetByStatus = assetStatuses.map((s) => ({
    name: s === "in_use" ? "In Use" : s.charAt(0).toUpperCase() + s.slice(1),
    value: assetList.filter((a) => a.status === s).length,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-1">
            Operations
          </p>
          <h1 className="text-2xl font-bold text-white">SLA Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Ticket health, SLA compliance, and asset inventory at a glance.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statusCounts.map((s) => (
            <div
              key={s.status}
              className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {s.label}
              </p>
              <p className="text-3xl font-bold text-white">{s.count}</p>
            </div>
          ))}
        </div>

        {/* Breach SLA Alert */}
        {breachedTickets.length > 0 && (
          <div className="mb-8 bg-red-950 border border-red-800 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-red-400 text-lg">⚠</span>
            <p className="text-sm text-red-300">
              <span className="font-semibold">{breachedTickets.length}</span>{" "}
              ticket melewati batas SLA dan belum diselesaikan.
            </p>
          </div>
        )}

        {/* Charts — client component */}
        <SlaCharts
          statusCounts={statusCounts}
          assetByCategory={assetByCategory.filter((a) => a.value > 0)}
          assetByStatus={assetByStatus.filter((a) => a.value > 0)}
          breachedTickets={breachedTickets}
        />
      </div>
    </div>
  );
}

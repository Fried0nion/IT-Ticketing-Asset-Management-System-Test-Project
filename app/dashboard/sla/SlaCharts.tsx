"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type StatusCount = { status: string; label: string; count: number };
type PieEntry = { name: string; value: number };
type BreachedTicket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  sla_due_at: string;
  created_at: string;
};

interface SlaChartsProps {
  statusCounts: StatusCount[];
  assetByCategory: PieEntry[];
  assetByStatus: PieEntry[];
  breachedTickets: BreachedTicket[];
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];
const PIE_COLORS_STATUS = ["#22c55e", "#6366f1", "#f59e0b", "#6b7280"];

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-900 text-red-300 border border-red-700",
  high: "bg-orange-900 text-orange-300 border border-orange-700",
  medium: "bg-yellow-900 text-yellow-300 border border-yellow-700",
  low: "bg-gray-800 text-gray-400 border border-gray-700",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-900 text-blue-300",
  in_progress: "bg-indigo-900 text-indigo-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hoursOverdue(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h < 24) return `${h} jam`;
  return `${Math.floor(h / 24)} hari`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-300 font-medium">{label}</p>
        <p className="text-indigo-400">{payload[0].value} tiket</p>
      </div>
    );
  }
  return null;
};

export default function SlaCharts({
  statusCounts,
  assetByCategory,
  assetByStatus,
  breachedTickets,
}: SlaChartsProps) {
  return (
    <div className="space-y-6">
      {/* Row 1: Bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5">
          Tiket per Status
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={statusCounts.map((s) => ({ name: s.label, count: s.count }))}
            barCategoryGap="35%"
          >
            <XAxis
              dataKey="name"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {statusCounts.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asset per Category */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Asset per Kategori
          </h2>
          {assetByCategory.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-12">Belum ada data asset.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={assetByCategory}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  itemStyle={{ color: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Asset per Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Asset per Status
          </h2>
          {assetByStatus.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-12">Belum ada data asset.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={assetByStatus}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  itemStyle={{ color: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Breach SLA table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Tiket Breach SLA
          {breachedTickets.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300 border border-red-700 normal-case tracking-normal">
              {breachedTickets.length} tiket
            </span>
          )}
        </h2>
        {breachedTickets.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-gray-400 text-sm">Semua tiket aktif masih dalam batas SLA.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                    Tiket
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                    Prioritas
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                    SLA Deadline
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Terlambat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {breachedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 pr-4">
                      <a
                        href={`/dashboard/tickets/${t.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium truncate max-w-xs block"
                      >
                        {t.title}
                      </a>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_BADGE[t.status] ?? "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {t.status === "in_progress" ? "In Progress" : t.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          PRIORITY_BADGE[t.priority] ?? "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {formatDate(t.sla_due_at)}
                    </td>
                    <td className="py-3 text-red-400 font-medium">
                      +{hoursOverdue(t.sla_due_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

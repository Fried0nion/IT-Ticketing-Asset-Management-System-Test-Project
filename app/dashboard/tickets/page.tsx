import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-600',
}

function formatLabel(value: string | null) {
  if (!value) return '-'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function TicketsListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // RLS di Supabase sudah otomatis membatasi: user biasa hanya melihat
  // ticket miliknya (created_by/assigned_to = dirinya), admin melihat semua.
  // Jadi query di sini sama saja untuk semua role.
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, title, status, priority, category, created_at, sla_due_at')
    .order('created_at', { ascending: false })

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isAdmin ? 'Semua Ticket' : 'Ticket Saya'}
            </h1>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
              ← Kembali ke Dashboard
            </Link>
          </div>
          <Link
            href="/dashboard/tickets/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Buat Ticket
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Gagal memuat ticket: {error.message}
          </div>
        )}

        {tickets && tickets.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Belum ada ticket. Klik &quot;+ Buat Ticket&quot; untuk membuat yang pertama.
          </div>
        )}

        {tickets && tickets.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">SLA Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => {
                  const slaBreached =
                    ticket.sla_due_at &&
                    new Date(ticket.sla_due_at) < new Date() &&
                    ticket.status !== 'resolved' &&
                    ticket.status !== 'closed'

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {formatLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${PRIORITY_STYLES[ticket.priority ?? ''] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {formatLabel(ticket.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatLabel(ticket.category)}</td>
                      <td className="px-4 py-3">
                        {ticket.sla_due_at ? (
                          <span className={slaBreached ? 'font-medium text-red-600' : 'text-gray-600'}>
                            {new Date(ticket.sla_due_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                            {slaBreached && ' (Breach)'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

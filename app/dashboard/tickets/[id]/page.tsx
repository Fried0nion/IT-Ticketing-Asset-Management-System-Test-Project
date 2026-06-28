import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateTicket, addComment } from '@/app/actions'

function formatLabel(value: string | null) {
  if (!value) return '-'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDateTime(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
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

  const isAdmin = profile?.role === 'admin'

  // RLS otomatis menolak kalau ticket ini bukan milik user & user bukan admin
  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      id, title, description, status, priority, category,
      ai_suggested_priority, ai_suggested_category, ai_confidence,
      created_by, assigned_to, related_asset_id,
      sla_due_at, resolved_at, created_at,
      creator:profiles!tickets_created_by_fkey(full_name, email),
      assignee:profiles!tickets_assigned_to_fkey(full_name, email),
      related_asset:assets(name, category)
    `)
    .eq('id', id)
    .single()

  if (!ticket) {
    notFound()
  }

  const { data: comments } = await supabase
    .from('ticket_comments')
    .select('id, comment, created_at, user_id, author:profiles(full_name, email)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  // Untuk dropdown "assigned to" — hanya relevan kalau admin
  const { data: allProfiles } = isAdmin
    ? await supabase.from('profiles').select('id, full_name, email').order('full_name')
    : { data: null }

  const creator = Array.isArray(ticket.creator) ? ticket.creator[0] : ticket.creator
  const assignee = Array.isArray(ticket.assignee) ? ticket.assignee[0] : ticket.assignee
  const relatedAsset = Array.isArray(ticket.related_asset) ? ticket.related_asset[0] : ticket.related_asset

  const aiMismatch =
    ticket.ai_suggested_priority &&
    ticket.ai_suggested_category &&
    (ticket.ai_suggested_priority !== ticket.priority || ticket.ai_suggested_category !== ticket.category)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard/tickets" className="text-sm text-gray-500 hover:underline">
          ← Kembali ke daftar ticket
        </Link>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Info utama ticket */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">{ticket.title}</h1>
          <p className="mb-4 whitespace-pre-wrap text-sm text-gray-700">{ticket.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-gray-400">Status</p>
              <p className="font-medium text-gray-900">{formatLabel(ticket.status)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Prioritas</p>
              <p className="font-medium text-gray-900">{formatLabel(ticket.priority)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Kategori</p>
              <p className="font-medium text-gray-900">{formatLabel(ticket.category)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Dibuat oleh</p>
              <p className="font-medium text-gray-900">{creator?.full_name ?? creator?.email ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Ditangani oleh</p>
              <p className="font-medium text-gray-900">{assignee?.full_name ?? assignee?.email ?? 'Belum ditugaskan'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Asset Terkait</p>
              <p className="font-medium text-gray-900">{relatedAsset?.name ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">SLA Due</p>
              <p className="font-medium text-gray-900">{formatDateTime(ticket.sla_due_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Diselesaikan</p>
              <p className="font-medium text-gray-900">{formatDateTime(ticket.resolved_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Dibuat pada</p>
              <p className="font-medium text-gray-900">{formatDateTime(ticket.created_at)}</p>
            </div>
          </div>

          {/* Perbandingan saran AI vs keputusan final */}
          {ticket.ai_suggested_priority && (
            <div className="mt-4 rounded-md bg-purple-50 px-4 py-3 text-xs text-purple-800">
              <p className="font-medium">
                🤖 Saran AI: prioritas <strong>{formatLabel(ticket.ai_suggested_priority)}</strong>,
                {' '}kategori <strong>{formatLabel(ticket.ai_suggested_category)}</strong>
                {ticket.ai_confidence !== null && ` (confidence: ${Math.round(ticket.ai_confidence * 100)}%)`}
              </p>
              {aiMismatch && (
                <p className="mt-1 text-purple-600">
                  Catatan: keputusan final berbeda dari saran AI — kemungkinan sudah dikoreksi manual oleh admin.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Form edit — hanya admin */}
        {isAdmin && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Kelola Ticket (Admin)</h2>
            <form action={updateTicket} className="space-y-4">
              <input type="hidden" name="ticket_id" value={ticket.id} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    defaultValue={ticket.status}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Prioritas</label>
                  <select
                    name="priority"
                    defaultValue={ticket.priority ?? 'medium'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Kategori</label>
                  <select
                    name="category"
                    defaultValue={ticket.category ?? 'other'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="network">Network</option>
                    <option value="access_request">Access Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Tugaskan ke</label>
                  <select
                    name="assigned_to"
                    defaultValue={ticket.assigned_to ?? ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">— Belum ditugaskan —</option>
                    {allProfiles?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name ?? p.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        )}

        {/* Comment thread */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Diskusi</h2>

          <div className="mb-4 space-y-3">
            {comments && comments.length === 0 && (
              <p className="text-sm text-gray-400">Belum ada komentar.</p>
            )}
            {comments?.map((c) => {
              const author = Array.isArray(c.author) ? c.author[0] : c.author
              return (
                <div key={c.id} className="rounded-md bg-gray-50 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {author?.full_name ?? author?.email ?? 'User'}
                    </span>
                    <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700">{c.comment}</p>
                </div>
              )
            })}
          </div>

          <form action={addComment} className="space-y-2">
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <textarea
              name="comment"
              required
              rows={3}
              placeholder="Tulis komentar..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Kirim Komentar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

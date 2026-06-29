import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Hitung ringkasan singkat untuk ditampilkan di kartu.
  // RLS otomatis membatasi: user biasa hanya menghitung ticket miliknya.
  const { count: openTicketCount } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'in_progress'])

  const { count: assetCount } = await supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">
          Halo, {profile?.full_name ?? 'kamu'} 👋
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Ini ringkasan singkat aktivitas IT Ticketing kamu.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/tickets"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              {profile?.role === 'admin' ? 'Total Ticket Aktif' : 'Ticket Aktif Saya'}
            </p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{openTicketCount ?? 0}</p>
            <p className="mt-2 text-sm font-medium text-blue-600">Lihat semua ticket →</p>
          </Link>

          <Link
            href="/dashboard/assets"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Total Asset Terdaftar</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{assetCount ?? 0}</p>
            <p className="mt-2 text-sm font-medium text-blue-600">Lihat semua asset →</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

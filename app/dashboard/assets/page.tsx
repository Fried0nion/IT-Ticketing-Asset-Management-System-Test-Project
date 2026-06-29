import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-600',
}

function formatLabel(value: string | null) {
  if (!value) return '-'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function AssetsListPage() {
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

  // RLS: semua user authenticated bisa SELECT semua asset (read-only utk user biasa)
  const { data: assets, error } = await supabase
    .from('assets')
    .select('id, name, category, serial_number, status, assigned_to, assignee:profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Asset IT</h1>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
              ← Kembali ke Dashboard
            </Link>
          </div>
          {isAdmin && (
            <Link
              href="/dashboard/assets/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Tambah Asset
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Gagal memuat asset: {error.message}
          </div>
        )}

        {assets && assets.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Belum ada asset yang terdaftar.
          </div>
        )}

        {assets && assets.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ditugaskan ke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => {
                  const assignee = Array.isArray(asset.assignee) ? asset.assignee[0] : asset.assignee
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <Link
                            href={`/dashboard/assets/${asset.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                          >
                            {asset.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-900">{asset.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatLabel(asset.category)}</td>
                      <td className="px-4 py-3 text-gray-600">{asset.serial_number ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[asset.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {formatLabel(asset.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {assignee?.full_name ?? assignee?.email ?? '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isAdmin && (
          <p className="mt-4 text-xs text-gray-400">
            Halaman ini read-only. Hanya admin yang bisa menambah/mengubah asset.
          </p>
        )}
      </div>
    </div>
  )
}

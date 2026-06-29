import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAsset } from '@/app/actions'

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
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

  // Halaman ini hanya untuk admin. RLS sebenarnya sudah menolak insert-nya
  // di level database, tapi kita redirect lebih awal supaya UX-nya jelas
  // (bukan dibiarkan submit form lalu gagal dengan error RLS).
  if (profile?.role !== 'admin') {
    redirect('/dashboard/assets')
  }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Tambah Asset Baru</h1>
          <Link href="/dashboard/assets" className="text-sm font-medium text-blue-600 hover:underline">
            ← Kembali ke daftar asset
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form action={createAsset} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Nama Asset
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="Contoh: Dell Latitude 5420"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                Kategori
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="software_license">Software License</option>
                <option value="server">Server</option>
                <option value="peripheral">Peripheral</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue="available"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="serial_number" className="mb-1 block text-sm font-medium text-gray-700">
              Serial Number / License Key <span className="text-gray-400">(opsional)</span>
            </label>
            <input
              id="serial_number"
              name="serial_number"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="Contoh: SN-12345 atau license key"
            />
          </div>

          <div>
            <label htmlFor="assigned_to" className="mb-1 block text-sm font-medium text-gray-700">
              Tugaskan ke <span className="text-gray-400">(opsional)</span>
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">— Tidak ada —</option>
              {allProfiles?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="purchase_date" className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Pembelian <span className="text-gray-400">(opsional)</span>
              </label>
              <input
                id="purchase_date"
                name="purchase_date"
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="warranty_expiry" className="mb-1 block text-sm font-medium text-gray-700">
                Garansi Sampai <span className="text-gray-400">(opsional)</span>
              </label>
              <input
                id="warranty_expiry"
                name="warranty_expiry"
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Catatan <span className="text-gray-400">(opsional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="Catatan tambahan tentang asset ini"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tambah Asset
          </button>
        </form>
      </div>
    </div>
  )
}

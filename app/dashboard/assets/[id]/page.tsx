import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateAsset, deleteAsset } from '@/app/actions'

export default async function AssetDetailPage({
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

  if (profile?.role !== 'admin') {
    redirect('/dashboard/assets')
  }

  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single()

  if (!asset) {
    notFound()
  }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Asset</h1>
          <Link href="/dashboard/assets" className="text-sm font-medium text-blue-600 hover:underline">
            ← Kembali ke daftar asset
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form action={updateAsset} className="space-y-4">
          <input type="hidden" name="asset_id" value={asset.id} />

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Nama Asset
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={asset.name}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
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
                defaultValue={asset.category}
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
                defaultValue={asset.status}
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
              Serial Number / License Key
            </label>
            <input
              id="serial_number"
              name="serial_number"
              type="text"
              defaultValue={asset.serial_number ?? ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="assigned_to" className="mb-1 block text-sm font-medium text-gray-700">
              Tugaskan ke
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              defaultValue={asset.assigned_to ?? ''}
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
                Tanggal Pembelian
              </label>
              <input
                id="purchase_date"
                name="purchase_date"
                type="date"
                defaultValue={asset.purchase_date ?? ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="warranty_expiry" className="mb-1 block text-sm font-medium text-gray-700">
                Garansi Sampai
              </label>
              <input
                id="warranty_expiry"
                name="warranty_expiry"
                type="date"
                defaultValue={asset.warranty_expiry ?? ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Catatan
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={asset.notes ?? ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Simpan Perubahan
          </button>
        </form>

        <form action={deleteAsset} className="mt-3">
          <input type="hidden" name="asset_id" value={asset.id} />
          <button
            type="submit"
            className="w-full rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Hapus Asset
          </button>
        </form>
      </div>
    </div>
  )
}

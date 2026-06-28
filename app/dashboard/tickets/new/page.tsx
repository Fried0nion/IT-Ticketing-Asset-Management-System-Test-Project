import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createTicket } from '@/app/actions'

export default async function NewTicketPage({
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

  // Ambil daftar asset untuk dropdown "asset terkait" (opsional).
  // Field ini opsional, jadi kalau gagal/kosong tidak masalah.
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, category')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Buat Ticket Baru</h1>
          <Link
            href="/dashboard/tickets"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Kembali ke daftar ticket
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={createTicket} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
              Judul
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={150}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="Contoh: Laptop tidak bisa connect WiFi"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="Jelaskan masalah atau permintaan kamu secara detail. Semakin detail, semakin akurat AI menentukan kategori & prioritas."
            />
          </div>

          <div>
            <label htmlFor="related_asset_id" className="mb-1 block text-sm font-medium text-gray-700">
              Asset Terkait <span className="text-gray-400">(opsional)</span>
            </label>
            <select
              id="related_asset_id"
              name="related_asset_id"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">— Tidak ada —</option>
              {assets?.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.category})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500">
            Kategori &amp; prioritas akan otomatis disarankan oleh AI berdasarkan deskripsi kamu,
            dan bisa diubah oleh admin setelah ticket dibuat.
          </p>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buat Ticket
          </button>
        </form>
      </div>
    </div>
  )
}

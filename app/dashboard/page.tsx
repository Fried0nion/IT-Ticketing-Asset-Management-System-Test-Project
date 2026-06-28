import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil data profile (termasuk role) dari tabel profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Keluar
            </button>
          </form>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Nama:</span> {profile?.full_name ?? '(belum diisi)'}</p>
          <p><span className="font-medium">Role:</span> {profile?.role ?? 'user'}</p>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Ini halaman sementara. Selanjutnya kita bangun fitur ticket &amp; asset management di sini.
        </p>
      </div>
    </div>
  )
}

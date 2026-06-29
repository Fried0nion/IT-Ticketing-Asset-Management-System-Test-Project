import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-base font-semibold text-gray-900">
              IT Ticketing
            </Link>
            <Link href="/dashboard/tickets" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              Tickets
            </Link>
            <Link href="/dashboard/assets" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              Assets
            </Link>
            <Link href="/dashboard/sla" className="text-sm font-medium text-gray-600 hover:text-blue-600">
              SLA
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-gray-900">{profile?.full_name ?? user.email}</p>
              <p className="text-xs text-gray-400">
                {profile?.role === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  )
}

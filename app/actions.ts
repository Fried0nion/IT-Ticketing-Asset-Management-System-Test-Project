'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { classifyTicket } from '@/lib/gemini'

// Mapping priority -> berapa jam SLA-nya
const SLA_HOURS: Record<string, number> = {
  urgent: 4,
  high: 24,
  medium: 72,
  low: 168, // 7 hari
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/signup?message=Cek email kamu untuk konfirmasi akun')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function createTicket(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const relatedAssetId = formData.get('related_asset_id') as string

  // Panggil Gemini untuk auto-suggest category & priority.
  // Kalau gagal (network error, API down, dll), tetap lanjut insert ticket
  // tanpa klasifikasi AI — jangan sampai fitur AI yang optional ini
  // menghalangi fitur inti (bikin ticket).
  const classification = await classifyTicket(title, description)

  const finalPriority = classification?.priority ?? 'medium'
  const finalCategory = classification?.category ?? 'other'

  const slaHours = SLA_HOURS[finalPriority] ?? SLA_HOURS.medium
  const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()

  const { data: newTicket, error } = await supabase
    .from('tickets')
    .insert({
      title,
      description,
      created_by: user.id,
      related_asset_id: relatedAssetId || null,
      priority: finalPriority,
      category: finalCategory,
      ai_suggested_priority: classification?.priority ?? null,
      ai_suggested_category: classification?.category ?? null,
      ai_confidence: classification?.confidence ?? null,
      sla_due_at: slaDueAt,
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/dashboard/tickets/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/tickets')
  redirect(`/dashboard/tickets/${newTicket.id}`)
}

export async function updateTicket(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const ticketId = formData.get('ticket_id') as string
  const status = formData.get('status') as string
  const priority = formData.get('priority') as string
  const category = formData.get('category') as string
  const assignedTo = formData.get('assigned_to') as string

  const updatePayload: Record<string, string | null> = {
    status,
    priority,
    category,
    assigned_to: assignedTo || null,
  }

  // Kalau status berubah jadi resolved, catat waktunya.
  if (status === 'resolved') {
    updatePayload.resolved_at = new Date().toISOString()
  }

  // RLS akan otomatis menolak kalau yang melakukan ini bukan admin
  // dan bukan pembuat ticket (lihat policy tickets_update_own_or_admin).
  const { error } = await supabase
    .from('tickets')
    .update(updatePayload)
    .eq('id', ticketId)

  if (error) {
    redirect(`/dashboard/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`)
  revalidatePath('/dashboard/tickets')
  redirect(`/dashboard/tickets/${ticketId}`)
}

export async function addComment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const ticketId = formData.get('ticket_id') as string
  const comment = formData.get('comment') as string

  if (!comment?.trim()) {
    redirect(`/dashboard/tickets/${ticketId}`)
  }

  const { error } = await supabase.from('ticket_comments').insert({
    ticket_id: ticketId,
    user_id: user.id,
    comment,
  })

  if (error) {
    redirect(`/dashboard/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`)
  redirect(`/dashboard/tickets/${ticketId}`)
}


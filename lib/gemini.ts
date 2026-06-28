// Helper untuk memanggil Gemini API (model: gemini-2.5-flash-lite)
// Dipakai untuk auto-suggest category & priority ticket berdasarkan deskripsi.
//
// CATATAN: Gemini 2.0 Flash sudah di-shutdown (per 1 Juni 2026), jadi kita
// pakai gemini-2.5-flash-lite yang masih aktif & cocok untuk task klasifikasi
// teks sederhana seperti ini (cepat & murah, nggak butuh reasoning berat).

const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

type TicketClassification = {
  category: 'hardware' | 'software' | 'network' | 'access_request' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  confidence: number
}

const VALID_CATEGORIES = ['hardware', 'software', 'network', 'access_request', 'other']
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']

export async function classifyTicket(
  title: string,
  description: string
): Promise<TicketClassification | null> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('GEMINI_API_KEY tidak ditemukan di environment variables')
    return null
  }

  const prompt = `Kamu adalah sistem klasifikasi tiket IT support. Berdasarkan judul dan deskripsi tiket berikut, tentukan kategori dan prioritasnya.

Judul: ${title}
Deskripsi: ${description}

Kategori yang valid: hardware, software, network, access_request, other
Prioritas yang valid: low, medium, high, urgent

Panduan prioritas:
- urgent: sistem down total, tidak bisa kerja sama sekali, banyak orang terdampak
- high: gangguan signifikan tapi ada workaround, atau berdampak ke satu orang secara serius
- medium: gangguan minor, masih bisa kerja dengan sedikit terganggu
- low: permintaan rutin, tidak mendesak, atau pertanyaan umum

Balas HANYA dalam format JSON murni tanpa markdown, tanpa backtick, seperti ini:
{"category": "hardware", "priority": "medium", "confidence": 0.85}

confidence adalah angka 0-1 yang menunjukkan seberapa yakin kamu dengan klasifikasi ini.`

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100,
        },
      }),
    })

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      console.error('Gemini API: response tidak ada text', JSON.stringify(data))
      return null
    }

    // Bersihkan kemungkinan markdown code fence sebelum parse JSON
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    if (
      !VALID_CATEGORIES.includes(parsed.category) ||
      !VALID_PRIORITIES.includes(parsed.priority)
    ) {
      console.error('Gemini API: hasil klasifikasi tidak valid', parsed)
      return null
    }

    return {
      category: parsed.category,
      priority: parsed.priority,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    }
  } catch (err) {
    console.error('Gagal memanggil/parse Gemini API:', err)
    return null
  }
}

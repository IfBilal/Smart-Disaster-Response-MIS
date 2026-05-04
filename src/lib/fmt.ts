const TZ = 'Asia/Karachi'

export function fmtDateTime(ts: string | Date | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-PK', { timeZone: TZ })
}

export function fmtDate(ts: string | Date | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-PK', { timeZone: TZ })
}

export function fmtTime(ts: string | Date | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('en-PK', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
}

import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { total_beds, available_beds } = await req.json()

  if (available_beds < 0 || total_beds < 0) {
    return NextResponse.json({ error: 'Bed counts cannot be negative' }, { status: 400 })
  }
  if (available_beds > total_beds) {
    return NextResponse.json({ error: 'Available beds cannot exceed total beds' }, { status: 400 })
  }

  try {
    const pool = await getPool()
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('total_beds', sql.Int, total_beds)
      .input('available_beds', sql.Int, available_beds)
      .query(`UPDATE Hospitals SET total_beds=@total_beds, available_beds=@available_beds WHERE hospital_id=@id`)

    return NextResponse.json({ message: 'Hospital updated' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

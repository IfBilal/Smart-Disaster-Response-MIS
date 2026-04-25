import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'field_officer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { condition, discharge } = await req.json()

  try {
    const pool = await getPool()
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('condition', sql.NVarChar, condition)
      .input('discharge', sql.Bit, discharge ? 1 : 0)
      .query(`UPDATE Patients
              SET condition = @condition,
                  discharge_time = CASE WHEN @discharge = 1 THEN GETDATE() ELSE discharge_time END
              WHERE patient_id = @id`)

    return NextResponse.json({ message: 'Patient updated' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

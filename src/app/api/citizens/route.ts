import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'emergency_operator'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  try {
    const pool = await getPool()
    const req2 = pool.request()
    let where = ''
    if (search) {
      where = `WHERE full_name LIKE @search OR cnic LIKE @search OR phone LIKE @search`
      req2.input('search', sql.NVarChar, `%${search}%`)
    }
    const result = await req2.query(`
      SELECT c.citizen_id, c.full_name, c.cnic, c.phone, c.address, c.registered_at,
             COUNT(er.report_id) AS report_count
      FROM Citizens c
      LEFT JOIN EmergencyReports er ON er.citizen_id = c.citizen_id
      ${where}
      GROUP BY c.citizen_id, c.full_name, c.cnic, c.phone, c.address, c.registered_at
      ORDER BY c.registered_at DESC
    `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

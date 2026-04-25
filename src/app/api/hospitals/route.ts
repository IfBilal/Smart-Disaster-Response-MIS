import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request().query(
      `SELECT * FROM vw_HospitalCapacity ORDER BY available_beds ASC`
    )
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, location, total_beds, contact_number } = await req.json()

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('location', sql.NVarChar, location)
      .input('total_beds', sql.Int, total_beds)
      .input('contact_number', sql.NVarChar, contact_number || null)
      .query(`INSERT INTO Hospitals (name, location, total_beds, available_beds, contact_number)
              VALUES (@name, @location, @total_beds, @total_beds, @contact_number);
              SELECT SCOPE_IDENTITY() AS hospital_id`)

    return NextResponse.json({ hospital_id: result.recordset[0].hospital_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

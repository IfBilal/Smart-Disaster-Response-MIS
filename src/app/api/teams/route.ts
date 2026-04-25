import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const availability = searchParams.get('availability')
  const type = searchParams.get('type')

  let where = 'WHERE 1=1'
  if (availability) where += ` AND t.availability_status = '${availability}'`
  if (type) where += ` AND t.team_type = '${type}'`

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT t.team_id, t.team_name, t.team_type, t.current_location,
             t.availability_status, t.capacity,
             COUNT(tm.member_id) AS members
      FROM RescueTeams t
      LEFT JOIN TeamMembers tm ON tm.team_id = t.team_id
      ${where}
      GROUP BY t.team_id, t.team_name, t.team_type, t.current_location,
               t.availability_status, t.capacity
    `)
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

  const { team_name, team_type, current_location, capacity } = await req.json()

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('name', sql.NVarChar, team_name)
      .input('type', sql.NVarChar, team_type)
      .input('location', sql.NVarChar, current_location || null)
      .input('capacity', sql.Int, capacity || 1)
      .query(`INSERT INTO RescueTeams (team_name, team_type, current_location, capacity)
              VALUES (@name, @type, @location, @capacity);
              SELECT SCOPE_IDENTITY() AS team_id`)

    return NextResponse.json({ team_id: result.recordset[0].team_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('team_id', sql.Int, parseInt(id))
      .query(`
        SELECT tm.team_id, tm.member_id, tm.member_role, tm.joined_at,
               u.username, u.role AS user_role, u.phone
        FROM TeamMembers tm
        JOIN Users u ON u.user_id = tm.user_id
        WHERE tm.team_id = @team_id
        ORDER BY tm.member_id
      `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { user_id, member_role } = await req.json()

  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })

  try {
    const pool = await getPool()

    // Check user exists
    const userCheck = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`SELECT user_id FROM Users WHERE user_id = @user_id AND is_active = 1`)
    if (!userCheck.recordset[0]) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 })
    }

    // Check UQ_TM_user — user already in a team?
    const dupCheck = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`SELECT team_id FROM TeamMembers WHERE user_id = @user_id`)
    if (dupCheck.recordset[0]) {
      return NextResponse.json({ error: 'This user is already a member of another team.' }, { status: 409 })
    }

    // Get next member_id for this team
    const nextId = await pool.request()
      .input('team_id', sql.Int, parseInt(id))
      .query(`SELECT ISNULL(MAX(member_id), 0) + 1 AS next_id FROM TeamMembers WHERE team_id = @team_id`)

    await pool.request()
      .input('team_id',    sql.Int,      parseInt(id))
      .input('member_id',  sql.Int,      nextId.recordset[0].next_id)
      .input('user_id',    sql.Int,      user_id)
      .input('member_role', sql.NVarChar, member_role || null)
      .query(`
        INSERT INTO TeamMembers (team_id, member_id, user_id, member_role)
        VALUES (@team_id, @member_id, @user_id, @member_role)
      `)

    return NextResponse.json({ message: 'Member added' }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { member_id } = await req.json()

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('team_id',   sql.Int, parseInt(id))
      .input('member_id', sql.Int, member_id)
      .query(`
        DELETE FROM TeamMembers WHERE team_id = @team_id AND member_id = @member_id;
        SELECT @@ROWCOUNT AS affected
      `)

    if (result.recordset[0].affected === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Member removed' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

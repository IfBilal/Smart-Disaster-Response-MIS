import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('user_id', sql.Int, user.user_id)
      .query(`
        SELECT notification_id, message, notification_type, is_read, sent_at
        FROM Notifications
        WHERE user_id = @user_id
        ORDER BY sent_at DESC
      `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notification_id } = await req.json()

  try {
    const pool = await getPool()
    if (notification_id) {
      await pool.request()
        .input('id', sql.Int, notification_id)
        .input('user_id', sql.Int, user.user_id)
        .query(`UPDATE Notifications SET is_read = 1 WHERE notification_id = @id AND user_id = @user_id`)
    } else {
      await pool.request()
        .input('user_id', sql.Int, user.user_id)
        .query(`UPDATE Notifications SET is_read = 1 WHERE user_id = @user_id`)
    }
    return NextResponse.json({ message: 'Marked as read' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'finance_officer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pool = await getPool()
    const result = await pool.request().query(
      `SELECT TOP 100 d.*, u.username AS received_by_name
       FROM Donations d
       LEFT JOIN Users u ON u.user_id = d.received_by
       ORDER BY d.donated_at DESC`
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
  if (!['admin', 'finance_officer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { donor_name, donor_type, amount, payment_method } = await req.json()

  if (!donor_name || !donor_name.trim()) {
    return NextResponse.json({ error: 'donor_name is required.' }, { status: 400 })
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Donation amount must be greater than zero.' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    // Transaction C: insert donation + finance transaction atomically
    const result = await pool.request()
      .input('received_by', sql.Int, user.user_id)
      .input('donor_name', sql.NVarChar, donor_name)
      .input('donor_type', sql.NVarChar, donor_type)
      .input('amount', sql.Decimal(15, 2), amount)
      .input('payment_method', sql.NVarChar, payment_method || null)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION
            INSERT INTO Donations (received_by, donor_name, donor_type, amount, payment_method)
            VALUES (@received_by, @donor_name, @donor_type, @amount, @payment_method);

            DECLARE @did INT = SCOPE_IDENTITY();

            INSERT INTO FinanceTransactions (performed_by, donation_id, transaction_type, amount, status)
            VALUES (@received_by, @did, 'donation', @amount, 'completed');

            SELECT @did AS donation_id;
          COMMIT TRANSACTION
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `)

    return NextResponse.json({ donation_id: result.recordset[0].donation_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

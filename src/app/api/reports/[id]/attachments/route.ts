import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'
import cloudinary from '@/lib/cloudinary'

// GET — list all attachments for a report
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('report_id', sql.Int, parseInt(id))
      .query(`
        SELECT attachment_id, report_id, file_url, media_type, uploaded_at,
               uploaded_by
        FROM MediaAttachments
        WHERE report_id = @report_id
        ORDER BY uploaded_at DESC
      `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — upload a file to Cloudinary and save the URL
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Determine media type
    const mime = file.type
    let media_type = 'document'
    if (mime.startsWith('image/')) media_type = 'image'
    else if (mime.startsWith('video/')) media_type = 'video'
    else if (mime.startsWith('audio/')) media_type = 'audio'

    // Convert file to buffer and upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())

    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `disaster-mis/report-${id}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) return reject(error)
          resolve(result)
        }
      ).end(buffer)
    })

    // Save to MediaAttachments table
    const pool = await getPool()
    const result = await pool.request()
      .input('report_id',   sql.Int,       parseInt(id))
      .input('file_url',    sql.NVarChar,  uploaded.secure_url)
      .input('media_type',  sql.NVarChar,  media_type)
      .input('uploaded_by', sql.Int,       user.user_id)
      .query(`
        INSERT INTO MediaAttachments (report_id, file_url, media_type, uploaded_by)
        OUTPUT INSERTED.attachment_id, INSERTED.file_url, INSERTED.media_type, INSERTED.uploaded_at
        VALUES (@report_id, @file_url, @media_type, @uploaded_by)
      `)

    return NextResponse.json(result.recordset[0], { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE — remove an attachment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { attachment_id } = await req.json()

  try {
    const pool = await getPool()
    await pool.request()
      .input('attachment_id', sql.Int, attachment_id)
      .input('report_id',     sql.Int, parseInt(id))
      .query('DELETE FROM MediaAttachments WHERE attachment_id = @attachment_id AND report_id = @report_id')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

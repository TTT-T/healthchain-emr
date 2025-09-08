import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const backendResponse = await fetch(`${backendUrl}/api/admin/pending-users/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || 'NextJS-Frontend',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '127.0.0.1'
      },
      body: JSON.stringify(body)
    })

    const backendData = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json({
        success: false,
        message: backendData.message || 'ไม่สามารถปฏิเสธผู้ใช้ได้'
      }, { status: backendResponse.status })
    }

    return NextResponse.json({
      success: true,
      data: backendData.data,
      message: 'ปฏิเสธผู้ใช้สำเร็จ'
    }, { status: 200 })

  } catch (error) {
    logger.error('Reject user error:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 })
  }
}

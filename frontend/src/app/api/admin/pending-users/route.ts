import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    const role = searchParams.get('role') || ''
    const search = searchParams.get('search') || ''

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const params = new URLSearchParams({
      page,
      limit,
      ...(role && { role }),
      ...(search && { search })
    })

    const backendResponse = await fetch(`${backendUrl}/api/admin/pending-users?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || 'NextJS-Frontend',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '127.0.0.1'
      }
    })

    const backendData = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json({
        success: false,
        message: backendData.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ที่รอการอนุมัติได้'
      }, { status: backendResponse.status })
    }

    return NextResponse.json({
      success: true,
      data: backendData.data
    }, { status: 200 })

  } catch (error) {
    logger.error('Get pending users error:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 })
  }
}

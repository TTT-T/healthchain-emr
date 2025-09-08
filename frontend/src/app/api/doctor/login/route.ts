import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface DoctorLoginRequest {
  username: string
  password: string
}

interface DoctorLoginResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      username: string
      email: string
      role: string
      firstName: string
      lastName: string
      isActive: boolean
      emailVerified: boolean
    }
    accessToken: string
    refreshToken: string
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DoctorLoginRequest = await request.json()
    
    // Validation
    if (!body.username || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน'
      }, { status: 400 })
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const backendResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || 'NextJS-Frontend',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '127.0.0.1'
      },
      body: JSON.stringify({
        username: body.username,
        password: body.password
      })
    })

    const backendData = await backendResponse.json()

    // If backend request failed, return the error with additional status info
    if (!backendResponse.ok) {
      // Extract data from backend error response structure
      const errorMessage = backendData.error?.message || backendData.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      const metadata = backendData.metadata || {}
      
      return NextResponse.json({
        success: false,
        message: errorMessage,
        requiresEmailVerification: metadata.requiresEmailVerification,
        requiresAdminApproval: metadata.requiresAdminApproval,
        email: metadata.email
      }, { status: backendResponse.status })
    }

    // Check if user has doctor role
    if (backendData.data?.user?.role !== 'doctor') {
      return NextResponse.json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงระบบแพทย์'
      }, { status: 403 })
    }

    // If backend request succeeded, return the data
    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: backendData.data
    }, { status: 200 })

    // Set cookies if tokens are available
    if (backendData.data?.accessToken) {
      response.cookies.set('access_token', backendData.data.accessToken, {
        httpOnly: false, // Allow client-side access for localStorage sync
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/'
      })
    }

    if (backendData.data?.refreshToken) {
      response.cookies.set('refresh_token', backendData.data.refreshToken, {
        httpOnly: false, // Allow client-side access for localStorage sync
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      })
    }

    return response

  } catch (error) {
    logger.error('Doctor login error:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface NurseLoginRequest {
  email: string
  password: string
}

interface NurseLoginResponse {
  success: boolean
  message: string
  data?: {
    user: any
    accessToken: string
    refreshToken: string
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: NurseLoginRequest = await request.json()
    
    // Validation
    if (!body.email || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'กรุณากรอกอีเมลและรหัสผ่าน'
      }, { status: 400 })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง'
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
        email: body.email,
        password: body.password
      })
    })

    const backendData = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json({
        success: false,
        message: backendData.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      }, { status: backendResponse.status })
    }

    // Check if user has nurse role
    if (backendData.data?.user?.role !== 'nurse') {
      return NextResponse.json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงระบบพยาบาล'
      }, { status: 403 })
    }

    // Set cookies
    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบพยาบาลสำเร็จ',
      data: {
        user: backendData.data.user,
        accessToken: backendData.data.accessToken,
        refreshToken: backendData.data.refreshToken
      }
    }, { status: 200 })

    // Set access token cookie
    response.cookies.set('access_token', backendData.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Set refresh token cookie
    response.cookies.set('refresh_token', backendData.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response

  } catch (error) {
    logger.error('Nurse login error:', error)
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    }, { status: 500 })
  }
}

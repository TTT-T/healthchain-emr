import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface RegistrationStatus {
  id: string
  requestId: string
  email: string
  organizationName: string
  status: 'pending_email_verification' | 'pending_admin_approval' | 'approved' | 'rejected'
  emailVerified: boolean
  adminApproved: boolean
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')
    const email = searchParams.get('email')

    if (!requestId || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        message: 'กรุณาระบุ requestId และ email'
      }, { status: 400 })
    }

    // Fetch actual status from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    
    const backendResponse = await fetch(`${backendUrl}/api/external-requesters/status?requestId=${requestId}&email=${email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      logger.safeError('Backend status fetch failed:', errorData)
      throw new Error(errorData.message || 'Backend status fetch failed')
    }

    const backendData = await backendResponse.json()
    
    logger.debug('Registration status requested:', { requestId, email, status: backendData.data?.status })

    return NextResponse.json(backendData)

  } catch (error) {
    logger.safeError('Error fetching registration status:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ'
    }, { status: 500 })
  }
}


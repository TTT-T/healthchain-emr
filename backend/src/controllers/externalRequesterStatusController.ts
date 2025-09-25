import { Request, Response } from 'express'
import { databaseManager } from '../database/connection'
import { successResponse, errorResponse } from '../utils'
import { getCurrentThailandTimeForDB } from '../utils/thailandTime'

export const getRegistrationStatus = async (req: Request, res: Response) => {
  try {
    const { requestId, email } = req.query

    if (!requestId || !email) {
      return res.status(400).json(
        errorResponse('Missing required parameters', 400, {
          message: 'กรุณาระบุ requestId และ email'
        })
      )
    }

    // Query external_data_requests table
    const externalRequestQuery = `
      SELECT 
        edr.id,
        edr.request_id,
        edr.requester_name,
        edr.requester_organization,
        edr.status,
        edr.created_at,
        edr.updated_at
      FROM external_data_requests edr
      WHERE edr.request_id = $1
    `

    const externalRequestResult = await databaseManager.query(externalRequestQuery, [requestId])

    if (externalRequestResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Registration not found', 404, {
          message: 'ไม่พบข้อมูลการลงทะเบียน'
        })
      )
    }

    const externalRequest = externalRequestResult.rows[0]

    // Query users table for email verification status
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.email_verified,
        u.is_active,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.email = $1 AND u.role = 'external_requester'
    `

    const userResult = await databaseManager.query(userQuery, [email])

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found', 404, {
          message: 'ไม่พบข้อมูลผู้ใช้'
        })
      )
    }

    const user = userResult.rows[0]

    // Determine overall status
    let overallStatus: 'pending_email_verification' | 'pending_admin_approval' | 'approved' | 'rejected'
    
    if (externalRequest.status === 'rejected') {
      overallStatus = 'rejected'
    } else if (externalRequest.status === 'approved') {
      overallStatus = 'approved'
    } else if (user.email_verified && user.is_active) {
      overallStatus = 'approved'
    } else if (user.email_verified) {
      overallStatus = 'pending_admin_approval'
    } else {
      overallStatus = 'pending_email_verification'
    }

    const statusData = {
      id: externalRequest.id,
      requestId: externalRequest.request_id,
      email: user.email,
      organizationName: externalRequest.requester_organization,
      status: overallStatus,
      emailVerified: user.email_verified,
      adminApproved: externalRequest.status === 'approved',
      createdAt: externalRequest.created_at,
      updatedAt: externalRequest.updated_at
    }

    return res.status(200).json(
      successResponse('Registration status retrieved successfully', statusData)
    )

  } catch (error) {
    console.error('Error fetching registration status:', error)
    return res.status(500).json(
      errorResponse('Internal server error', 500, {
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ'
      })
    )
  }
}

export const updateRegistrationStatus = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params
    const { status, adminNotes } = req.body

    if (!requestId || !status) {
      return res.status(400).json(
        errorResponse('Missing required parameters', 400, {
          message: 'กรุณาระบุ requestId และ status'
        })
      )
    }

    const validStatuses = ['pending_review', 'approved', 'rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        errorResponse('Invalid status', 400, {
          message: 'สถานะไม่ถูกต้อง'
        })
      )
    }

    // Update external_data_requests table
    const updateQuery = `
      UPDATE external_data_requests 
      SET 
        status = $1,
        admin_notes = $2,
        updated_at = $3
      WHERE request_id = $4
      RETURNING *
    `

    const updateResult = await databaseManager.query(updateQuery, [
      status,
      adminNotes || null,
      getCurrentThailandTimeForDB(),
      requestId
    ])

    if (updateResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Registration not found', 404, {
          message: 'ไม่พบข้อมูลการลงทะเบียน'
        })
      )
    }

    // If approved, also activate the user account
    if (status === 'approved') {
      const userQuery = `
        SELECT u.id 
        FROM users u
        JOIN external_data_requests edr ON u.email = edr.requester_email
        WHERE edr.request_id = $1
      `

      const userResult = await databaseManager.query(userQuery, [requestId])
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id
        
        const activateUserQuery = `
          UPDATE users 
          SET 
            is_active = true,
            updated_at = $1
          WHERE id = $2
        `

        await databaseManager.query(activateUserQuery, [
          getCurrentThailandTimeForDB(),
          userId
        ])
      }
    }

    return res.status(200).json(
      successResponse('Registration status updated successfully', {
        requestId,
        status,
        adminNotes,
        updatedAt: getCurrentThailandTimeForDB()
      })
    )

  } catch (error) {
    console.error('Error updating registration status:', error)
    return res.status(500).json(
      errorResponse('Internal server error', 500, {
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
      })
    )
  }
}

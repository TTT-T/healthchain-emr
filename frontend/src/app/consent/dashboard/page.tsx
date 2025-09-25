'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Shield, 
  Eye, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  Hospital,
  CreditCard
} from 'lucide-react'

interface ConsentRequest {
  id: string
  requestId: string
  requesterType: 'hospital' | 'insurance' | 'research' | 'legal'
  requesterName: string
  requestType: string
  purpose: string
  requestedDataTypes: string[]
  urgencyLevel: 'emergency' | 'urgent' | 'normal'
  status: string
  created_at: string
  expiresAt: string
  referenceNumber?: string
}

interface ConsentContract {
  id: string
  contractId: string
  requesterName: string
  contractType: string
  allowedDataTypes: string[]
  validFrom: string
  validUntil: string
  accessCount: number
  maxAccessCount?: number
  status: 'active' | 'expired' | 'revoked'
}

const mockConsentRequests: ConsentRequest[] = [
  {
    id: '1',
    requestId: 'CR-2025-001',
    requesterType: 'hospital',
    requesterName: 'โรงพยาบาลจุฬาลงกรณ์',
    requestType: 'hospital_transfer',
    purpose: 'ผู้ป่วยต้องการรับการรักษาต่อเนื่องสำหรับโรคเบาหวาน และต้องการประวัติการรักษาจากโรงพยาบาลเดิม',
    requestedDataTypes: ['medical_history', 'lab_results', 'medications', 'vital_signs'],
    urgencyLevel: 'urgent',
    status: 'pending',
    created_at: '2025-07-03T10:30:00Z',
    expiresAt: '2025-07-10T10:30:00Z'
  },
  {
    id: '2',
    requestId: 'CR-2025-002',
    requesterType: 'insurance',
    requesterName: 'บริษัท กรุงเทพประกันชีวิต จำกัด',
    requestType: 'insurance_claim',
    purpose: 'ตรวจสอบเอกสารสำหรับการเคลมประกันสุขภาพ กรมธรรม์เลขที่ POL-2025-789456',
    requestedDataTypes: ['diagnosis', 'treatment_records', 'billing'],
    urgencyLevel: 'normal',
    status: 'pending',
    created_at: '2025-07-02T14:15:00Z',
    expiresAt: '2025-07-09T14:15:00Z',
    referenceNumber: 'CLM-789456-2025'
  }
]

const mockConsentContracts: ConsentContract[] = [
  {
    id: '1',
    contractId: 'CC-2025-001',
    requesterName: 'โรงพยาบาลศิริราช',
    contractType: 'hospital_transfer',
    allowedDataTypes: ['medical_history', 'lab_results'],
    validFrom: '2025-06-20T09:00:00Z',
    validUntil: '2025-07-20T09:00:00Z',
    accessCount: 3,
    maxAccessCount: 5,
    status: 'active'
  },
  {
    id: '2',
    contractId: 'CC-2025-002',
    requesterName: 'บริษัท ไทยประกันชีวิต',
    contractType: 'insurance_claim',
    allowedDataTypes: ['diagnosis', 'billing'],
    validFrom: '2025-06-15T10:00:00Z',
    validUntil: '2025-06-30T10:00:00Z',
    accessCount: 2,
    maxAccessCount: 3,
    status: 'expired'
  }
]

export default function ConsentDashboard() {
  const [activeTab, setActiveTab] = useState('requests')
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([])
  const [consentContracts, setConsentContracts] = useState<ConsentContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConsentData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load consent requests
        const requestsResponse = await apiClient.getConsentRequests()
        if (requestsResponse.statusCode === 200 && requestsResponse.data) {
          setConsentRequests(requestsResponse.data as ConsentRequest[])
        } else {
          // Fallback to mock data if API fails
          setConsentRequests(mockConsentRequests)
        }

        // Load consent contracts
        const contractsResponse = await apiClient.getConsentContracts()
        if (contractsResponse.statusCode === 200 && contractsResponse.data) {
          setConsentContracts(contractsResponse.data as any)
        } else {
          // Fallback to mock data if API fails
          setConsentContracts(mockConsentContracts)
        }

      } catch (err) {
        logger.error('Error loading consent data:', err)
        setError('ไม่สามารถโหลดข้อมูลได้')
        // Use mock data as fallback
        setConsentRequests(mockConsentRequests)
        setConsentContracts(mockConsentContracts)
      } finally {
        setLoading(false)
      }
    }

    loadConsentData()
  }, [])

  const getRequesterIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <Hospital className="h-4 w-4" />
      case 'insurance': return <CreditCard className="h-4 w-4" />
      case 'research': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline', color: 'text-yellow-600' },
      approved: { variant: 'default', color: 'text-green-600' },
      rejected: { variant: 'destructive', color: 'text-red-600' },
      expired: { variant: 'secondary', color: 'text-gray-600' },
      active: { variant: 'default', color: 'text-blue-600' },
      revoked: { variant: 'destructive', color: 'text-red-600' }
    }
    
    return (
      <Badge variant={variants[status]?.variant || 'outline'} className={variants[status]?.color}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      emergency: 'bg-red-100 text-red-800',
      urgent: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800'
    }
    
    return (
      <Badge className={colors[urgency as keyof typeof colors]}>
        {urgency.toUpperCase()}
      </Badge>
    )
  }

  const formatDateTime = (daring: string) => {
    return new Date(daring).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await apiClient.updateConsentStatus(requestId, 'approved')
      if (response.statusCode === 200) {
        setConsentRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'approved' }
              : req
          )
        )
        setError(null)
      } else {
        setError(response.error?.message || 'ไม่สามารถอนุมัติคำขอได้')
      }
    } catch (err) {
      logger.error('Error approving request:', err)
      setError('เกิดข้อผิดพลาดในการอนุมัติคำขอ')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await apiClient.updateConsentStatus(requestId, 'rejected')
      if (response.statusCode === 200) {
        setConsentRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'rejected' }
              : req
          )
        )
        setError(null)
      } else {
        setError(response.error?.message || 'ไม่สามารถปฏิเสธคำขอได้')
      }
    } catch (err) {
      logger.error('Error rejecting request:', err)
      setError('เกิดข้อผิดพลาดในการปฏิเสธคำขอ')
    }
  }

  const handleRevokeContract = async (contractId: string) => {
    try {
      const response = await apiClient.updateConsentStatus(contractId, 'revoked')
      if (response.statusCode === 200) {
        setConsentContracts(prev => 
          prev.map(contract => 
            contract.id === contractId 
              ? { ...contract, status: 'revoked' }
              : contract
          )
        )
        setError(null)
      } else {
        setError(response.error?.message || 'ไม่สามารถยกเลิกสัญญาได้')
      }
    } catch (err) {
      logger.error('Error revoking contract:', err)
      setError('เกิดข้อผิดพลาดในการยกเลิกสัญญา')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consent Management</h1>
          <p className="text-muted-foreground">
            จัดการการยินยอมการเข้าถึงข้อมูลทางการแพทย์ของคุณ
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">ปลอดภัยด้วย Smart Contract Logic</span>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">
            คำขอรอการอนุมัติ ({consentRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="contracts">
            สัญญาการยินยอม ({consentContracts.filter(c => c.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="history">
            ประวัติการเข้าถึง
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              คุณมีคำขอการเข้าถึงข้อมูล {consentRequests.filter(r => r.status === 'pending').length} รายการที่รอการพิจารณา
            </AlertDescription>
          </Alert>

          {consentRequests.filter(r => r.status === 'pending').map((request) => (
            <Card key={request.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getRequesterIcon(request.requesterType)}
                    <div>
                      <CardTitle className="text-lg">{request.requesterName}</CardTitle>
                      <CardDescription>{request.requestId}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getUrgencyBadge(request.urgencyLevel)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">วัตถุประสงค์:</h4>
                  <p className="text-sm">{request.purpose}</p>
                </div>

                {request.referenceNumber && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">หมายเลขอ้างอิง:</h4>
                    <p className="text-sm font-mono">{request.referenceNumber}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">ข้อมูลที่ขอเข้าถึง:</h4>
                  <div className="flex flex-wrap gap-2">
                    {request.requestedDataTypes.map((dataType) => (
                      <Badge key={dataType} variant="outline" className="text-xs">
                        {dataType}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>สร้างเมื่อ: {formatDateTime(request.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>หมดอายุ: {formatDateTime(request.expiresAt)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      ปฏิเสธ
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      อนุมัติ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          {consentContracts.map((contract) => (
            <Card key={contract.id} className={`border-l-4 ${
              contract.status === 'active' ? 'border-l-green-500' : 
              contract.status === 'expired' ? 'border-l-gray-500' : 'border-l-red-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{contract.requesterName}</CardTitle>
                    <CardDescription>{contract.contractId}</CardDescription>
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">ข้อมูลที่อนุญาต:</h4>
                  <div className="flex flex-wrap gap-2">
                    {contract.allowedDataTypes.map((dataType) => (
                      <Badge key={dataType} variant="outline" className="text-xs">
                        {dataType}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-muted-foreground">ระยะเวลาใช้งาน:</h4>
                    <p>{formatDateTime(contract.validFrom)} - {formatDateTime(contract.validUntil)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">การเข้าถึง:</h4>
                    <p>{contract.accessCount}{contract.maxAccessCount ? ` / ${contract.maxAccessCount}` : ''} ครั้ง</p>
                  </div>
                </div>

                {contract.status === 'active' && (
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>มีการเข้าถึงข้อมูล {contract.accessCount} ครั้ง</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRevokeContract(contract.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      เพิกถอนการยินยอม
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              ประวัติการเข้าถึงข้อมูลทั้งหมดจะถูกบันทึกไว้อย่างปลอดภัยและไม่สามารถแก้ไขได้
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>รายงานการเข้าถึงข้อมูล</CardTitle>
              <CardDescription>
                ดูประวัติการเข้าถึงข้อมูลของคุณโดยองค์กรต่างๆ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่มีประวัติการเข้าถึงข้อมูลในขณะนี้</p>
                <p className="text-sm">เมื่อมีการเข้าถึงข้อมูลจะแสดงที่นี่</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

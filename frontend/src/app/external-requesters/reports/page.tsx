'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="mb-3 lg:mb-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
                รายงานและสถิติ
              </h1>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
              ดูสถิติการใช้งานและรายงานการขอเข้าถึงข้อมูลของคุณ
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">คำขอทั้งหมด</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">47</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-blue-100 flex-shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">อนุมัติแล้ว</p>
                    <p className="text-2xl font-bold text-green-600">38</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">รอดำเนินการ</p>
                    <p className="text-2xl font-bold text-yellow-600">6</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">อัตราความสำเร็จ</p>
                    <p className="text-2xl font-bold text-blue-600">81%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>สถิติการขอข้อมูลรายเดือน</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">กราฟแสดงสถิติการขอข้อมูลรายเดือน</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <span>ประเภทข้อมูลที่ขอมากที่สุด</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">ประวัติการรักษา</span>
                    <Badge className="bg-blue-100 text-blue-800">25 คำขอ</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">ผลการตรวจทางห้องปฏิบัติการ</span>
                    <Badge className="bg-green-100 text-green-800">18 คำขอ</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">ข้อมูลการวินิจฉัย</span>
                    <Badge className="bg-yellow-100 text-yellow-800">12 คำขอ</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">ข้อมูลยา</span>
                    <Badge className="bg-purple-100 text-purple-800">8 คำขอ</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Download className="h-6 w-6 text-orange-600" />
                </div>
                <span>ส่งออกรายงาน</span>
              </CardTitle>
              <CardDescription className="text-gray-700">
                ดาวน์โหลดรายงานในรูปแบบต่างๆ สำหรับการวิเคราะห์เพิ่มเติม
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center justify-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>รายงานรายเดือน (PDF)</span>
                </Button>
                <Button variant="outline" className="flex items-center justify-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>สถิติการใช้งาน (Excel)</span>
                </Button>
                <Button variant="outline" className="flex items-center justify-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>รายงานประจำปี (PDF)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Shield, 
  FileText, 
  Search,
  CheckCircle, 
  ArrowRight,
  Users,
  Database,
  Lock,
  Zap,
  Hospital,
  CreditCard,
  Scale,
  UserPlus,
  Clock
} from 'lucide-react'

export default function ExternalRequestersLanding() {
  const organizationTypes = [
    {
      icon: <Hospital className="h-6 w-6 text-blue-600" />,
      title: 'โรงพยาบาล & คลินิก',
      description: 'สำหรับการส่งต่อผู้ป่วยและการรักษาต่อเนื่อง',
      examples: ['โรงพยาบาลรัฐ/เอกชน', 'คลินิกเฉพาะทาง', 'ศูนย์การแพทย์']
    },
    {
      icon: <CreditCard className="h-6 w-6 text-green-600" />,
      title: 'บริษัทประกัน',
      description: 'สำหรับการตรวจสอบและเคลมประกันสุขภาพ',
      examples: ['ประกันชีวิต', 'ประกันสุขภาพ', 'ประกันอุบัติเหตุ']
    },
    {
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      title: 'สถาบันวิจัย',
      description: 'สำหรับการวิจัยทางการแพทย์และสาธารณสุข',
      examples: ['มหาวิทยาลัย', 'สถาบันวิจัย', 'องค์กรวิชาการ']
    },
    {
      icon: <Building2 className="h-6 w-6 text-orange-600" />,
      title: 'หน่วยงานราชการ',
      description: 'สำหรับการรายงานและการดำเนินนโยบาย',
      examples: ['กระทรวงสาธารณสุข', 'ประกันสังคม', 'สำนักงานสถิติ']
    },
    {
      icon: <Scale className="h-6 w-6 text-red-600" />,
      title: 'หน่วยงานกฎหมาย',
      description: 'สำหรับกระบวนการทางกฎหมายและคดีความ',
      examples: ['สำนักงานทนายความ', 'ศาล', 'สำนักงานตำรวจ']
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      title: 'องค์กรตรวจสอบ',
      description: 'สำหรับการตรวจสอบคุณภาพและมาตรฐาน',
      examples: ['หน่วยงานรับรอง', 'องค์กรตรวจสอบ', 'คณะกรรมการ']
    }
  ]

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: 'ระบบ Consent Engine',
      description: 'การขอความยินยอมแบบอัตโนมัติที่ปลอดภัยและโปร่งใส',
      details: ['Smart Contract Logic', 'การยืนยันตัวตนแบบดิจิทัล', 'บันทึกการเข้าถึงทุกครั้ง']
    },
    {
      icon: <Database className="h-8 w-8 text-green-600" />,
      title: 'ข้อมูลมาตรฐาน',
      description: 'ข้อมูลทางการแพทย์ที่ได้มาตรฐานสากล HL7 FHIR',
      details: ['ข้อมูลเวชระเบียน', 'ผลตรวจทางห้องปฏิบัติการ', 'ข้อมูลการจ่ายยา']
    },
    {
      icon: <Lock className="h-8 w-8 text-purple-600" />,
      title: 'ความปลอดภัย',
      description: 'การเข้ารหัสและการควบคุมการเข้าถึงระดับสูง',
      details: ['เข้ารหัส End-to-End', 'การควบคุมสิทธิ์แบบละเอียด', 'การตรวจสอบการใช้งาน']
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-600" />,
      title: 'ประสิทธิภาพสูง',
      description: 'ระบบตอบสนองเร็วและรองรับการใช้งานจำนวนมาก',
      details: ['API แบบ Real-time', 'การจัดการคิวอัตโนมัติ', 'รายงานและสถิติ']
    }
  ]

  const processSteps = [
    {
      step: 1,
      title: 'ลงทะเบียนองค์กร',
      description: 'กรอกข้อมูลองค์กรและอัปโหลดเอกสารประกอบ',
      time: '15-20 นาที'
    },
    {
      step: 2,
      title: 'ตรวจสอบข้อมูล',
      description: 'ทีมงานตรวจสอบเอกสารและข้อมูลที่ส่งมา',
      time: '3-5 วันทำการ'
    },
    {
      step: 3,
      title: 'การอนุมัติ',
      description: 'รับการแจ้งผลการอนุมัติและข้อมูลการเข้าใช้งาน',
      time: '1 วันทำการ'
    },
    {
      step: 4,
      title: 'เริ่มใช้งาน',
      description: 'เข้าสู่ระบบและเริ่มส่งคำขอเข้าถึงข้อมูล',
      time: 'ทันที'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8">
            ระบบ Consent Engine
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl mb-6 sm:mb-8 text-blue-100 font-medium">
            สำหรับองค์กรภายนอกที่ต้องการเข้าถึงข้อมูลทางการแพทย์
          </p>
          <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 max-w-4xl mx-auto text-blue-50 leading-relaxed">
            ระบบการจัดการความยินยอมแบบอัตโนมัติที่ปลอดภัย โปร่งใส และเป็นไปตามมาตรฐานสากล 
            สำหรับการเข้าถึงข้อมูลสุขภาพผู้ป่วยอย่างถูกต้องตามกฎหมาย
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Link href="/external-requesters/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white bg-white/10 text-white hover:bg-white hover:text-blue-700 px-8 sm:px-10 py-4 text-lg font-semibold shadow-lg transition-all duration-200 backdrop-blur-sm">
                <UserPlus className="h-6 w-6 mr-3" />
                ลงทะเบียนใหม่
              </Button>
            </Link>
            <Link href="/external-requesters/status">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white bg-white/10 text-white hover:bg-white hover:text-blue-700 px-8 sm:px-10 py-4 text-lg font-semibold shadow-lg transition-all duration-200 backdrop-blur-sm">
                <Search className="h-6 w-6 mr-3" />
                ตรวจสอบสถานะ
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Organization Types */}
        <section className="mb-16 lg:mb-20">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              ประเภทองค์กรที่รองรับ
            </h2>
            <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              ระบบรองรับการลงทะเบียนสำหรับองค์กรต่างประเภทที่มีความจำเป็นในการเข้าถึงข้อมูลทางการแพทย์
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {organizationTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white group hover:-translate-y-1">
                <CardHeader className="p-6 lg:p-8">
                  <CardTitle className="flex items-center space-x-4 text-lg lg:text-xl">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      {type.icon}
                    </div>
                    <span className="font-bold text-gray-900">{type.title}</span>
                  </CardTitle>
                  <CardDescription className="text-base text-gray-700 leading-relaxed mt-3">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8 pb-6 lg:pb-8">
                  <div className="space-y-2">
                    {type.examples.map((example, i) => (
                      <Badge key={i} variant="outline" className="mr-2 mb-2 text-sm px-3 py-1 font-medium text-gray-700 border-gray-300">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16 lg:mb-20">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              คุณสมบัติเด่น
            </h2>
            <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              ระบบที่ออกแบบมาเพื่อความปลอดภัย ความถูกต้อง และการใช้งานที่มีประสิทธิภาพ
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white group hover:-translate-y-1">
                <CardHeader className="p-6 lg:p-8">
                  <CardTitle className="flex items-center space-x-4 text-xl lg:text-2xl">
                    <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <span className="font-bold text-gray-900">{feature.title}</span>
                  </CardTitle>
                  <CardDescription className="text-base lg:text-lg text-gray-700 leading-relaxed mt-3">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8 pb-6 lg:pb-8">
                  <ul className="space-y-3">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center space-x-3 text-sm lg:text-base text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="font-medium">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Process Steps */}
        <section className="mb-16 lg:mb-20">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              ขั้นตอนการลงทะเบียน
            </h2>
            <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              กระบวนการลงทะเบียนที่ง่ายและรวดเร็ว พร้อมการติดตามสถานะแบบ Real-time
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white group hover:-translate-y-1">
                  <CardHeader className="p-6 lg:p-8">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 text-2xl lg:text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      {step.step}
                    </div>
                    <CardTitle className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{step.title}</CardTitle>
                    <CardDescription className="text-sm lg:text-base text-gray-700 leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 lg:px-8 pb-6 lg:pb-8">
                    <div className="flex items-center justify-center space-x-2 text-sm lg:text-base text-blue-600 font-medium">
                      <Clock className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>{step.time}</span>
                    </div>
                  </CardContent>
                </Card>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 xl:-right-6 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-xl">
            <CardContent className="py-12 lg:py-16 px-6 lg:px-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 lg:mb-6">
                พร้อมเริ่มต้นใช้งานแล้วหรือยัง?
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mb-8 lg:mb-10 max-w-3xl mx-auto leading-relaxed">
                ลงทะเบียนองค์กรของคุณวันนี้ เพื่อเข้าถึงข้อมูลทางการแพทย์อย่างปลอดภัยและถูกต้องตามกฎหมาย
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <Link href="/external-requesters/register">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 lg:px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                    <UserPlus className="h-6 w-6 mr-3" />
                    เริ่มลงทะเบียน
                  </Button>
                </Link>
                <Link href="/external-requesters/status">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-blue-400 text-blue-700 hover:bg-blue-50 px-8 lg:px-10 py-4 text-lg font-semibold transition-all duration-200">
                    <Search className="h-6 w-6 mr-3" />
                    ตรวจสอบสถานะคำขอ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Info Alert */}
        <Alert className="mt-8 lg:mt-12 border-2 border-blue-300 bg-blue-50 shadow-xl">
          <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
          <AlertDescription className="text-blue-800 text-base lg:text-lg font-medium leading-relaxed">
            <strong>หมายเหตุด้านความปลอดภัย:</strong> ระบบนี้เป็นไปตามมาตรฐาน PDPA และกฎหมายคุ้มครองข้อมูลส่วนบุคคล 
            ข้อมูลทั้งหมดจะถูกเข้ารหัสและบันทึกการเข้าถึงเพื่อการตรวจสอบ
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}


import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-300 to-indigo-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">H</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-slate-700">HealthChain</span>
            </div>
            <div className="hidden md:flex space-x-6 lg:space-x-8">
              <a href="#features" className="text-sm lg:text-base text-slate-500 hover:text-blue-400 transition">ฟีเจอร์</a>
              <a href="#technology" className="text-sm lg:text-base text-slate-500 hover:text-blue-400 transition">เทคโนโลยี</a>
              <a href="#security" className="text-sm lg:text-base text-slate-500 hover:text-blue-400 transition">ความปลอดภัย</a>
              <a href="#contact" className="text-sm lg:text-base text-slate-500 hover:text-blue-400 transition">ติดต่อ</a>
            </div>
            <Link 
              href="/login" 
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-lg transition text-sm sm:text-base"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-700 mb-4 sm:mb-6 leading-tight">
              ระบบบันทึกสุขภาพ
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                อิเล็กทรอนิกส์
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2">
                ด้วยเทคโนโลยีบล็อกเชน
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-500 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              ปฏิวัติการดูแลสุขภาพด้วยเทคโนโลยีบล็อกเชนที่ปลอดภัย การแลกเปลี่ยนข้อมูลสุขภาพที่โปร่งใส 
              และการคาดการณ์ความเสี่ยงของโรคด้วยปัญญาประดิษฐ์ขั้นสูง
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                เริ่มใช้งานฟรี
              </Link>
              <Link 
                href="/accounts/patient/records" 
                className="bg-white border-2 border-blue-300 text-blue-500 hover:bg-blue-50 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                ดูประวัติสุขภาพ
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="text-4xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-slate-500">ความปลอดภัยของข้อมูล</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-indigo-100">
              <div className="text-4xl font-bold text-indigo-400 mb-2">AI</div>
              <div className="text-slate-500">การคาดการณ์ความเสี่ยง</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-100">
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-slate-500">การเข้าถึงข้อมูล</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-700 mb-4">ฟีเจอร์หลัก</h2>
            <p className="text-xl text-slate-500">เทคโนโลยีที่ทันสมัยเพื่อการดูแลสุขภาพที่ดีที่สุด</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Blockchain Security */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all border border-blue-200">
              <div className="w-16 h-16 bg-blue-400 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">ความปลอดภัยด้วยบล็อกเชน</h3>
              <p className="text-slate-500">ข้อมูลสุขภาพของคุณถูกเข้ารหัสและจัดเก็บในบล็อกเชนที่ปลอดภัยสูงสุด ไม่สามารถแก้ไขหรือลบได้</p>
            </div>

            {/* AI Prediction */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 hover:shadow-xl transition-all border border-indigo-200">
              <div className="w-16 h-16 bg-indigo-400 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">AI คาดการณ์ความเสี่ยง</h3>
              <p className="text-slate-500">ระบบปัญญาประดิษฐ์วิเคราะห์ข้อมูลสุขภาพและคาดการณ์ความเสี่ยงของโรคต่างๆ เพื่อการป้องกันที่ดีกว่า</p>
            </div>

            {/* Data Exchange */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all border border-purple-200">
              <div className="w-16 h-16 bg-purple-400 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">แลกเปลี่ยนข้อมูล</h3>
              <p className="text-slate-500">แบ่งปันข้อมูลสุขภาพระหว่างโรงพยาบาลและแพทย์ได้อย่างปลอดภัย พร้อมการควบคุมสิทธิ์การเข้าถึง</p>
            </div>

            {/* Electronic Records */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 hover:shadow-xl transition-all border border-amber-200">
              <div className="w-16 h-16 bg-amber-400 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">บันทึกอิเล็กทรอนิกส์</h3>
              <p className="text-slate-500">จัดเก็บประวัติการรักษา ผลการตรวจ และข้อมูลสุขภาพทั้งหมดในรูปแบบดิจิทัลที่เข้าถึงง่าย</p>
            </div>

            {/* Real-time Monitoring */}
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-8 hover:shadow-xl transition-all border border-rose-200">
              <div className="w-16 h-16 bg-rose-400 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">การติดตามแบบเรียลไทม์</h3>
              <p className="text-slate-500">ติดตามสุขภาพแบบเรียลไทม์ด้วยอุปกรณ์เชื่อมต่อ IoT และได้รับการแจ้งเตือนทันที</p>
            </div>

            {/* Analytics */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 hover:shadow-xl transition-all border border-teal-200">
              <div className="w-16 h-16 bg-teal-400 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-4">การวิเคราะห์ข้อมูล</h3>
              <p className="text-slate-500">วิเคราะห์ข้อมูลสุขภาพส่วนบุคคลเพื่อให้คำแนะนำการดูแลสุขภาพที่เหมาะสมกับแต่ละบุคคล</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-700 mb-4">เทคโนโลยีที่ใช้</h2>
            <p className="text-xl text-slate-500">การผสานเทคโนโลยีล่าสุดเพื่อประสบการณ์ที่ดีที่สุด</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start justify-center max-w-6xl mx-auto">
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100">
              <h3 className="text-2xl font-bold text-slate-600 mb-8 text-center">Blockchain Technology</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <div className="text-left">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-semibold text-slate-700">การเข้ารหัสขั้นสูง</span> - ใช้เทคโนโลยี SHA-256 และ AES-256 เพื่อความปลอดภัยสูงสุด
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <div className="text-left">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-semibold text-slate-700">การกระจายข้อมูล</span> - การทำงานของฐานข้อมูลกระจายในเครือข่ายป้องกันสูญหาย
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <div className="text-left">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-semibold text-slate-700">Smart Contracts</span> - การทำงานอัตโนมัติที่โปร่งใสและตรวจสอบได้
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
              <h3 className="text-2xl font-bold text-slate-600 mb-8 text-center">Artificial Intelligence</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></div>
                  <div className="text-left">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-semibold text-slate-700">Machine Learning</span> - อัลกอริธึมการเรียนรู้เพื่อคาดการณ์ความเสี่ยง
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></div>
                  <div className="text-left">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-semibold text-slate-700">Natural Language Processing</span> - การประมวลผลภาษาธรรมชาติสำหรับวิเคราะห์อาการ
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></div>
                  <div className="text-left">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      <span className="font-semibold text-slate-700">Deep Learning</span> - เครือข่ายประสาทเทียมสำหรับการวิเคราะห์ภาพการแพทย์
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 bg-white/40">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-700 mb-8">ความปลอดภัยระดับสูงสุด</h2>
          <p className="text-xl text-slate-500 mb-12 max-w-3xl mx-auto">
            เราให้ความสำคัญกับการรักษาความปลอดภัยของข้อมูลสุขภาพของคุณเป็นอันดับแรก
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">การเข้ารหัส End-to-End</h3>
              <p className="text-slate-500">ข้อมูลถูกเข้ารหัสตั้งแต่ต้นทางถึงปลายทาง</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">การยืนยันตัวตนหลายขั้น</h3>
              <p className="text-slate-500">ระบบ Multi-Factor Authentication</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">การควบคุมสิทธิ์</h3>
              <p className="text-slate-500">คุณเป็นผู้ควบคุมการเข้าถึงข้อมูลของคุณ</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
                <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">การสำรองข้อมูล</h3>
              <p className="text-slate-500">การสำรองข้อมูลอัตโนมัติและปลอดภัย</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">เริ่มต้นการดูแลสุขภาพแบบใหม่วันนี้</h2>
          <p className="text-xl mb-8 opacity-90">
            ร่วมเป็นส่วนหนึ่งของอนาคตการดูแลสุขภาพด้วยเทคโนโลยีที่ทันสมัยและปลอดภัย
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/accounts/patient/dashboard" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              สมัครสมาชิกฟรี
            </Link>
            <Link 
              href="/accounts/patient/profile" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-4 px-8 rounded-xl transition-all transform hover:-translate-y-1"
            >
              ดูข้อมูลเพิ่มเติม
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="text-xl font-bold">HealthChain</span>
              </div>
              <p className="text-gray-400">
                ระบบบันทึกสุขภาพอิเล็กทรอนิกส์ที่ใช้เทคโนโลยีบล็อกเชนและปัญญาประดิษฐ์
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">บริการ</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">บันทึกสุขภาพ</a></li>
                <li><a href="#" className="hover:text-white transition">การคาดการณ์ AI</a></li>
                <li><a href="#" className="hover:text-white transition">แลกเปลี่ยนข้อมูล</a></li>
                <li><a href="#" className="hover:text-white transition">การตรวจสุขภาพ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">เกี่ยวกับเรา</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">เกี่ยวกับบริษัท</a></li>
                <li><a href="#" className="hover:text-white transition">ทีมงาน</a></li>
                <li><a href="#" className="hover:text-white transition">ข่าวสาร</a></li>
                <li><a href="#" className="hover:text-white transition">อาชีพ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">ติดต่อเรา</h3>
              <ul className="space-y-2 text-gray-400">
                <li>อีเมล: info@healthchain.th</li>
                <li>โทร: 02-xxx-xxxx</li>
                <li>ที่อยู่: กรุงเทพมหานคร</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} HealthChain. สงวนลิขสิทธิ์ทั้งหมด.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

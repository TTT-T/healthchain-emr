"use client";

import React from "react";

export default function AdvancedRoleManagementPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Advanced Role Management</h1>
      <p className="mb-8 text-gray-600">จัดการบทบาทผู้ใช้งานขั้นสูง เพิ่ม แก้ไข หรือลบบทบาทและสิทธิ์การเข้าถึงระบบ</p>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Table header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">Roles</span>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">+ เพิ่มบทบาท</button>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-2 text-left">ชื่อบทบาท</th>
                <th className="px-4 py-2 text-left">สิทธิ์</th>
                <th className="px-4 py-2 text-left">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {/* ตัวอย่างข้อมูล */}
              <tr className="border-b">
                <td className="px-4 py-2">Admin</td>
                <td className="px-4 py-2">จัดการผู้ใช้, ดูรายงาน, ตั้งค่าระบบ</td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 hover:underline mr-2">แก้ไข</button>
                  <button className="text-red-600 hover:underline">ลบ</button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Doctor</td>
                <td className="px-4 py-2">ดูข้อมูลผู้ป่วย, เพิ่มบันทึกการรักษา</td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 hover:underline mr-2">แก้ไข</button>
                  <button className="text-red-600 hover:underline">ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

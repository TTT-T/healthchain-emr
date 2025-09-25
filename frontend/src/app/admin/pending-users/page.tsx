"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserCheck, UserX, Clock, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface PendingUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  professionalInfo: {
    licenseNumber: string;
    specialization: string;
    department: string;
    position: string;
  };
}

interface ApprovalStats {
  stats: {
    [key: string]: {
      total: number;
      pending: number;
      approved: number;
      unverified: number;
    };
  };
  summary: {
    totalPending: number;
    totalApproved: number;
    totalUnverified: number;
  };
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
    fetchApprovalStats();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/admin/pending-users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ที่รอการอนุมัติได้');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApprovalStats = async () => {
    try {
      const response = await fetch('/api/admin/approval-stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching approval stats:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/pending-users/${selectedUser.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalNotes: approvalNotes
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('อนุมัติผู้ใช้สำเร็จ');
        setShowApprovalDialog(false);
        setApprovalNotes('');
        setSelectedUser(null);
        fetchPendingUsers();
        fetchApprovalStats();
      } else {
        toast.error(data.message || 'ไม่สามารถอนุมัติผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/pending-users/${selectedUser.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ปฏิเสธผู้ใช้สำเร็จ');
        setShowRejectionDialog(false);
        setRejectionReason('');
        setSelectedUser(null);
        fetchPendingUsers();
        fetchApprovalStats();
      } else {
        toast.error(data.message || 'ไม่สามารถปฏิเสธผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('เกิดข้อผิดพลาดในการปฏิเสธ');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      doctor: 'แพทย์',
      nurse: 'พยาบาล',
      staff: 'เจ้าหน้าที่'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      doctor: 'bg-emerald-100 text-emerald-800',
      nurse: 'bg-pink-100 text-pink-800',
      staff: 'bg-blue-100 text-blue-800'
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPendingUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">การอนุมัติผู้ใช้</h1>
          <p className="text-gray-600">จัดการการอนุมัติผู้ใช้แพทย์ พยาบาล และเจ้าหน้าที่</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-amber-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">รอการอนุมัติ</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.summary.totalPending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.summary.totalApproved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">รอยืนยันอีเมล</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.summary.totalUnverified}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.summary.totalPending + stats.summary.totalApproved + stats.summary.totalUnverified}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">ค้นหา</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="ค้นหาด้วยชื่อ อีเมล หรือ username"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Label htmlFor="role">ประเภทผู้ใช้</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ทั้งหมด</SelectItem>
                    <SelectItem value="doctor">แพทย์</SelectItem>
                    <SelectItem value="nurse">พยาบาล</SelectItem>
                    <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>ผู้ใช้ที่รอการอนุมัติ</CardTitle>
            <CardDescription>
              รายการผู้ใช้ที่สมัครสมาชิกและยืนยันอีเมลแล้ว รอการอนุมัติจากผู้ดูแลระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีผู้ใช้ที่รอการอนุมัติ</h3>
                <p className="text-gray-600">ผู้ใช้ทั้งหมดได้รับการอนุมัติแล้ว</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{user.email}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>หมายเลขใบอนุญาต:</strong> {user.professionalInfo.licenseNumber}</p>
                            <p><strong>สาขา:</strong> {user.professionalInfo.specialization}</p>
                          </div>
                          <div>
                            <p><strong>แผนก:</strong> {user.professionalInfo.department}</p>
                            <p><strong>ตำแหน่ง:</strong> {user.professionalInfo.position}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          สมัครเมื่อ: {new Date(user.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowApprovalDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          อนุมัติ
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRejectionDialog(true);
                          }}
                          variant="destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog isOpen={showApprovalDialog} onClose={() => setShowApprovalDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>อนุมัติผู้ใช้</DialogTitle>
              <DialogDescription>
                คุณกำลังจะอนุมัติ {selectedUser?.name} ในฐานะ {getRoleLabel(selectedUser?.role || '')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="approvalNotes">หมายเหตุ (ไม่บังคับ)</Label>
                <Textarea
                  id="approvalNotes"
                  placeholder="เพิ่มหมายเหตุสำหรับการอนุมัติ..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={isProcessing}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog isOpen={showRejectionDialog} onClose={() => setShowRejectionDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ปฏิเสธผู้ใช้</DialogTitle>
              <DialogDescription>
                คุณกำลังจะปฏิเสธ {selectedUser?.name} ในฐานะ {getRoleLabel(selectedUser?.role || '')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">เหตุผลในการปฏิเสธ *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="ระบุเหตุผลในการปฏิเสธ..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectionDialog(false)}
                disabled={isProcessing}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                variant="destructive"
              >
                {isProcessing ? 'กำลังปฏิเสธ...' : 'ปฏิเสธ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

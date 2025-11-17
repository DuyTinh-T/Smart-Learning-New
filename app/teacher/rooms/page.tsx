'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { TeacherRoomManagement } from '@/components/teacher/room-management';

export default function TeacherRoomsPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <div className="container mx-auto py-6">
        <TeacherRoomManagement />
      </div>
    </RoleGuard>
  );
}
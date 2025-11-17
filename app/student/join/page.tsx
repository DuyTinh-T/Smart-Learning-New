'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { StudentJoinRoom } from '@/components/student/join-room';

export default function StudentJoinPage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="container mx-auto py-6">
        <StudentJoinRoom />
      </div>
    </RoleGuard>
  );
}
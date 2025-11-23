'use client';

import { useParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { StudentExamInterface } from '@/components/student/exam-interface';

export default function StudentExamPage() {
  const params = useParams();
  const roomCode = params.code as string;

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="container mx-auto p-6">
        <StudentExamInterface roomCode={roomCode} />
      </div>
    </RoleGuard>
  );
}
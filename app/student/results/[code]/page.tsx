'use client';

import { useParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { StudentExamResults } from '@/components/student/exam-results';

export default function StudentResultsPage() {
  const params = useParams();
  const roomCode = params.code as string;

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="container mx-auto p-6">
        <StudentExamResults roomCode={roomCode} />
      </div>
    </RoleGuard>
  );
}

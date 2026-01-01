'use client';

import { TeacherExamOverview } from '@/components/teacher/teacher-exam-overview';

export default function TeacherExamOverviewPage({ params }: { params: { code: string } }) {
  return <TeacherExamOverview roomCode={params.code} />;
}

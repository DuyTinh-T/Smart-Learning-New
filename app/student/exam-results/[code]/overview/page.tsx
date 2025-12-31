'use client';

import { StudentExamOverview } from '@/components/student/student-exam-overview';

export default function ExamOverviewPage({ params }: { params: { code: string } }) {
  return <StudentExamOverview roomCode={params.code} />;
}

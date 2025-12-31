'use client';

import { StudentExamAnalysis } from '@/components/student/student-exam-analysis';

export default function ExamAnalysisPage({ params }: { params: { code: string } }) {
  return <StudentExamAnalysis roomCode={params.code} />;
}

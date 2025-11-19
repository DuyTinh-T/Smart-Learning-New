'use client';

import { useParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { RoomStatistics } from '@/components/teacher/room-statistics';

export default function RoomStatisticsPage() {
  const params = useParams();
  const roomCode = params.code as string;

  return (
    <RoleGuard allowedRoles={['teacher']}>
      <div className="container mx-auto py-6">
        <RoomStatistics roomCode={roomCode} />
      </div>
    </RoleGuard>
  );
}

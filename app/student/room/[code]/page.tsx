'use client';

import { useParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { StudentRoomLobby } from '@/components/student/room-lobby';

export default function StudentRoomPage() {
  const params = useParams();
  const roomCode = params.code as string;

  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="container mx-auto py-6">
        <StudentRoomLobby roomCode={roomCode} />
      </div>
    </RoleGuard>
  );
}
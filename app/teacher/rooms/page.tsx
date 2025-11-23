'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { TeacherRoomManagement } from '@/components/teacher/room-management';
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TeacherRoomsPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
        <Header />
      <div className="container mx-auto p-6 ">
        <TeacherRoomManagement />
      </div>
      <Footer />
    </RoleGuard>
  );
}
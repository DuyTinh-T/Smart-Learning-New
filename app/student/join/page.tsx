'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { StudentJoinRoom } from '@/components/student/join-room';
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function StudentJoinPage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex items-center justify-center h-screen">
                  <StudentJoinRoom/>
                </main>
                <Footer />
              </div>
    </RoleGuard>
  );
}
import { UserProfile } from "@/components/profile/user-profile"
import { Header } from "@/components/header"

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <UserProfile />
      </main>
    </div>
  )
}

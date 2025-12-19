import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function LoginPage() {
  return (
     <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex items-center justify-center p-4 h-screen">
            <LoginForm/>
          </main>
          <Footer />
        </div>
  )
}

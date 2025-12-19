import { RegisterForm } from "@/components/auth/register-form"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function RegisterPage() {
  return (
   <div className="min-h-screen flex flex-col">
             <Header />
             <main className="flex items-center justify-center p-4 h-screen">
               <RegisterForm/>
             </main>
             <Footer />
           </div>
  )
}

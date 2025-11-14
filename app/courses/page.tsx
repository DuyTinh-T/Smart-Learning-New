import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import CourseBrowser from "@/components/course/course-browser"

export default function CoursesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CourseBrowser />
      </main>
      <Footer />
    </div>
  )
}
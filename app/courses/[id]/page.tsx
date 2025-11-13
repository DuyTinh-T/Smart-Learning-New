import CourseDetail from "@/components/course/course-detail"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CourseDetail courseId={id} />
      </main>
      <Footer />
    </div>
  )
}

import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-mesh">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-mandala">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

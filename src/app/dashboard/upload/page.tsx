import { DashboardHeader } from "@/components/dashboard-header"
import { UploadForm } from "@/components/upload-form"

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Upload Receipt"
        description="Upload a screenshot of your transaction to automatically extract details"
      />

      <UploadForm />
    </div>
  )
}


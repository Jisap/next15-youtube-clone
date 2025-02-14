"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"


const StudioUploadModal = () => {
  return (
    <Button variant="secondary">
      <PlusIcon className="size-5" />
      <span className="text-sm">Create</span>
    </Button>
  )
}

export default StudioUploadModal
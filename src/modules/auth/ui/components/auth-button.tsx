import { Button } from "@/components/ui/button"
import { UserCircleIcon } from "lucide-react"


export const AuthButton = () => {
  return (
    <Button>
      <UserCircleIcon className="size-4" />
      Sign in
    </Button>
  )
}
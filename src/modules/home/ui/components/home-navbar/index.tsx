import { SidebarTrigger } from "@/components/ui/sidebar"
import Image from "next/image"
import Link from "next/link"





export const HomeNavbar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 flex items-center px-2 pr-5 z-50 bg-pink-200">
      <div className="flex items-center gap-4 w-full">
        {/* Menu and logo */}
        <div className="flex items-center flex-shrink-0">
          <SidebarTrigger 
          
          />
          <Link href="/">
            <div className="p-4 flex items-center gap-1">
              <Image 
                src="/logo.svg"
                alt="logo"
                width={32}
                height={32}
              />
              <p className="text-xl font-semibold tracking-tight">
                NewTube
              </p>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
      </div>
    </div>
  )
}
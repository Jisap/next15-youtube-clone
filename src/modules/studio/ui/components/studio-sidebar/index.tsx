"use client"

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { LogOutIcon, VideoIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { StudioSidebarHeader } from "./studio-sidebar-header"


const StudioSidebar = () => {

  const pathname = usePathname()

  return (
    <Sidebar className="pt-16 z-10" collapsible="icon">
      <SidebarContent className="bg-background">     
        <SidebarGroup>
          <SidebarMenu>
            <StudioSidebarHeader />
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Content" 
                asChild
                isActive={pathname === "/studio"}  
              >
                <Link prefetch  href="/studio">
                  <VideoIcon className="size-5" />
                  <span className="text-sm">Content</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Separator />

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Exit studio" asChild>
                <Link prefetch  href="/">
                  <LogOutIcon className="size-5" />
                  <span className="text-sm">Exit studio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default StudioSidebar
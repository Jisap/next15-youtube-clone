"use client"

import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { MainSection } from "./main-section"


const HomeSidebar = () => {
  return (
    <Sidebar className="pt-16 z-10 border-none">
      <SidebarContent className="bg-background">
        <MainSection />
      </SidebarContent>
    </Sidebar>
  )
}

export default HomeSidebar
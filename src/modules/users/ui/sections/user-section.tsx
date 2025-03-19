"use client"

import { trpc } from "@/trpc/client"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import UserPageBanner from "../components/user-page-banner"


interface UserSectionProps {
  userId: string
}


const UserSection = (props: UserSectionProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary fallback={<div>Error</div>}>
        <UserSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserSection

const UserSectionSuspense = ({ userId }: UserSectionProps) => {

  const [user] = trpc.users.getOne.useSuspenseQuery({ id: userId })

  return (
    <div className="flex flex-col">
      <UserPageBanner user={user}/>
    </div>
  )}
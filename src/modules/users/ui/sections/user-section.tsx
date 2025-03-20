"use client"

import { trpc } from "@/trpc/client"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import UserPageBanner, { UserPageBannerSkeleton } from "../components/user-page-banner"
import UserPageInfo, { UserPageInfoSkeleton } from "../components/user-page-info"


interface UserSectionProps {
  userId: string
}


export const UserSection = (props: UserSectionProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary fallback={<div>Error</div>}>
        <UserSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  )
}

const UserSectionSkeleton = () => {
  return (
    <div className="flex flex-col">
      <UserPageBannerSkeleton />
      <UserPageInfoSkeleton />
    </div>
  )
}

const UserSectionSuspense = ({ userId }: UserSectionProps) => {

  const [user] = trpc.users.getOne.useSuspenseQuery({ id: userId })

  return (
    <div className="flex flex-col">
      <UserPageBanner user={user}/>
      <UserPageInfo user={user} />
    </div>
  )}
"use client"

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <FormSectionSuspense videoId={videoId}/>
      </ErrorBoundary>
    </Suspense>
  )
}

const FormSectionSkeleton = () => {
  return (
    <p>Loading...</p>
  )
}


const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId }); // Petición desde el cliente usando la cache del server si existe, sino petición a la api.

  return(
    <div>
      {JSON.stringify(video)}
    </div>
  )
}

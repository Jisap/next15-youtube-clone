"use client"

import { trpc } from "@/trpc/client"
import { Suspense } from "react"
import { ErrorBoundary } from 'react-error-boundary';


interface CategoriesSectionProps {
  categoryId?: string
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense  categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {

  const  [categories] = trpc.categories.getMany.useSuspenseQuery(); // Obtiene los datos precargados del servidor. React espera hasta que los datos estén listos (gracias a useSuspenseQuery).

  return (
    <div>
      {JSON.stringify(categories)}
    </div>
  )
}


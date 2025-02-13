"use client"

import { FilterCarousel } from "@/components/filter-carousel";
import { trpc } from "@/trpc/client"
import { Suspense } from "react"
import { ErrorBoundary } from 'react-error-boundary';


interface CategoriesSectionProps {
  categoryId?: string
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<FilterCarousel isLoading data={[]} onSelect={() => {}} />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense  categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {

  const  [categories] = trpc.categories.getMany.useSuspenseQuery(); // Obtiene los datos precargados del servidor. React espera hasta que los datos estén listos (gracias a useSuspenseQuery).
  const data = categories.map((category) => ({ 
    value: category.id, 
    label: category.name 
  }))

  return (
    <FilterCarousel 
      value={categoryId}
      data={data} 
      onSelect={(x) => console.log(x)}
    />
  )
}


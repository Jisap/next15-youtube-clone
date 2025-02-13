"use client"

import { FilterCarousel } from "@/components/filter-carousel";
import { trpc } from "@/trpc/client"
import { useRouter } from "next/navigation";
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

  const router = useRouter();

  const  [categories] = trpc.categories.getMany.useSuspenseQuery(); // Obtiene los datos precargados del servidor. React espera hasta que los datos estén listos (gracias a useSuspenseQuery).
  const data = categories.map((category) => ({ 
    value: category.id, 
    label: category.name 
  }));

  const onSelect= (value:string | null) => {
    const url = new URL(window.location.href);
    if(value){
      url.searchParams.set("categoryId", value);
    }else{
      url.searchParams.delete("categoryId");
    }
    router.push(url.toString()); // Establece la URL actualizada en la ruta actual con el nuevo valor de categoryId.
  }

  return (
    <FilterCarousel 
      value={categoryId}
      data={data} 
      onSelect={onSelect}
    />
  )
}


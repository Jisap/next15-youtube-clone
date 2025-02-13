"use client"

import { trpc } from "@/trpc/client"

interface CategoriesSectionProps {
  categoryId?: string
}



const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {

  const  [categories] = trpc.categories.getMany.useSuspenseQuery(); // Obtiene los datos precargados del servidor. React espera hasta que los datos estén listos (gracias a useSuspenseQuery).

  return (
    <div>
      {JSON.stringify(categories)}
    </div>
  )
}

export default CategoriesSection
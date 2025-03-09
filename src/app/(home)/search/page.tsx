


export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{
    query: string;
    categoryId: string | undefined;
  }>
}


const Search = async({searchParams}: PageProps) => {	

  const { query, categoryId } = await searchParams;

  return (
    <div>
      Searchin for { query } in category: { categoryId }
    </div>
  )
}

export default Search
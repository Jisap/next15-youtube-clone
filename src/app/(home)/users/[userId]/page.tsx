import { DEFAULT_LIMIT } from '@/constant';
import UserView from '@/modules/users/ui/views/user-view';
import { HydrateClient, trpc } from '@/trpc/server';



interface PageProps {
  params: Promise<{
    userId: string
  }>
}


const Page = async({ params }: PageProps) => {
  
  const { userId } = await params;

  void trpc.users.getOne.prefetch({ id: userId }); // Obtenemos los datos del usuario
  void trpc.videos.getMany.prefetchInfinite({              // Obtenemos los videos del usuario 
    userId, 
    limit: DEFAULT_LIMIT 
  });   
  
  return (
    <HydrateClient>
      <UserView userId={userId} />
    </HydrateClient>
  )
}

export default Page
import UserAvatar from "@/components/user-avatar"
import { UserGetOneOutput } from "../../types"
import { useClerk, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { useSubscriptions } from "@/modules/subscriptions/hooks/use-subscriptions";



interface UserPageInfoProps {
  user: UserGetOneOutput
}

const UserPageInfo = ({ user }: UserPageInfoProps) => {

  const { userId, isLoaded } = useAuth();
  const clerk = useClerk();

  const { isPending, onClick } = useSubscriptions({ // Gestiona las suscripciones del usuario autenticado
      userId: user.id,
      isSubscribed: user.viewerSubscribed,          // Verifica si el usuario autenticado está suscrito al usuario que se consulta en su userPageInfo
  })

  return (
    <div className="py-6">
      {/* mobile layout */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <UserAvatar 
            size="lg" 
            imageUrl={user.imageUrl}
            name={user.name}  
            className="h-[60px] w-[60px]"
            onClick={() => {
              if(user.clerkId === userId){
                clerk.openUserProfile()
              }
            }}
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{user.subscriberCount} subscribers</span>
              <span>&bull;</span>
              <span>{user.videoCount} videos</span>
            </div>
          </div>
        </div>

        {userId === user.clerkId ? (
          <Button
            variant="secondary"
            asChild
            className="w-full mt-3 rounded-full"
          >
            <Link href="/studio">
              Go to studio
            </Link>
          </Button>
        ) : (
          <SubscriptionButton
            disabled={isPending || !isLoaded}
            isSubscribed={user.viewerSubscribed}
            onClick={onClick}
            className="w-full mt-3"
          />
            
        )}
      </div>
    </div>
  )
}

export default UserPageInfo
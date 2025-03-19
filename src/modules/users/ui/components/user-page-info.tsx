import UserAvatar from "@/components/user-avatar"
import { UserGetOneOutput } from "../../types"
import { useClerk, useAuth } from "@clerk/nextjs";



interface UserPageInfoProps {
  user: UserGetOneOutput
}

const UserPageInfo = ({ user }: UserPageInfoProps) => {

  const { userId } = useAuth();
  const clerk = useClerk();

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
      </div>
    </div>
  )
}

export default UserPageInfo
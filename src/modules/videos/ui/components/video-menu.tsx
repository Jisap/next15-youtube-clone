import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ListPlusIcon, MoreVertical, ShareIcon, Trash2Icon } from "lucide-react";

interface VideoMenuProps {
  videoId: string;
  variant?: "ghost" | "secondary";
  onRemove?: () => void;
}

const VideoMenu = ({
  videoId,
  variant,
  onRemove
 }: VideoMenuProps) => {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className="rounded-full"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onClick={() => {}}>
          <ShareIcon className="mr-2 size-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { }}>
          <ListPlusIcon className="mr-2 size-4" />
          Add to playlist
        </DropdownMenuItem>
        {onRemove && (
          <DropdownMenuItem onClick={() => { }}>
            <Trash2Icon className="mr-2 size-4" />
            Remove
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default VideoMenu
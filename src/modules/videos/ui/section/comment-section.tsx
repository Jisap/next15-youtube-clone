"use client"

import { trpc } from "@/trpc/client"

interface CommentSectionProps {
  videoId: string
}

const CommentSection = ({ videoId }: CommentSectionProps) => {

  const [comments] = trpc.comments.getMany.useSuspenseQuery({ videoId })

  return (
    <div>
      {JSON.stringify(comments)}
    </div>
  )
}

export default CommentSection
import { trpc } from "@/trpc/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { ResponsiveModal } from "@/components/responsive-dialog";
import { 
  Form,
  FormControl,
  FormLabel,
  FormItem,
  FormField,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";



interface ThumbnailGenerateModalProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formSchema = z.object({
  prompt: z.string().min(10),
})

export const ThumbnailGenerateModal = ({ videoId, open, onOpenChange }: ThumbnailGenerateModalProps) => {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:{
      prompt: ""
    }
  });


   const generateThumbnail = trpc.videos.generateThumbnail.useMutation({   // Mutación para generar la miniatura del video.
      onSuccess: () => {
        toast.success("Background job started", { description: "This may take a few minutes to complete" });
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      }
    }); 

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateThumbnail.mutate({ 
      id: videoId, 
      prompt: values.prompt, 
    });
    
  }

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange} 
      title="Upload Thumbnail"
    >
     <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField 
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea 
                  {...field}
                  placeholder="A description of wanted thumbnail"
                  className="resize-none"
                  cols={30}
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={generateThumbnail.isPending}
          >
            Generate Thumbnail
          </Button>
        </div>
      </form>
     </Form>
    </ResponsiveModal>
  )
}
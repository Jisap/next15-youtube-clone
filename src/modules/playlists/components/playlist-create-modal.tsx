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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";



interface PlaylistCreateModalProps {

  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formSchema = z.object({
  name: z.string().min(1),
})

export const PlaylistCreateModal = ({ open, onOpenChange }: PlaylistCreateModalProps) => {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:{
      name: ""
    }
  });


   const create = trpc.playlists.create.useMutation({   // Mutación para crear una playlist.
      onSuccess: () => {
        toast.success("Playlist created");
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      }
    }); 

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    create.mutate(values);
  }

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange} 
      title="Create playlist"
    >
     <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField 
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="My favorite videos"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={create.isPending}
          >
            Create
          </Button>
        </div>
      </form>
     </Form>
    </ResponsiveModal>
  )
}
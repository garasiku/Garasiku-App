import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PlusCircle } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Param } from "@/models/param";
import { ParamGroup } from "@/models/param-group";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

interface AddParamDialogProps {
  paramGroup: ParamGroup;
  onSave?: (newParam: Param) => void;
}

const formSchema = z.object({
  group: z.string().min(1, { message: "Group harus terisi" }),
  name: z.string({ message: "Nama harus terisi" }).min(1, { message: "Nama harus terisi" }),
  description: z.string().optional(),
});

export function AddParamDialog({ paramGroup, onSave }: AddParamDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group: paramGroup.group,
      name: undefined,
      description: undefined,
    },
  });

  const { reset } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("parameter")
        .insert({
          group: paramGroup.group,
          name: values.name,
          description: values.description || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error("Gagal menyimpan data parameter: " + error.message);
      }

      toast.success("Data parameter berhasil ditambahkan.");
      if (onSave) {
        onSave(data);
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan pada sistem: " + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <LoadingOverlay loading={loading} />

      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}>
        <DialogTrigger asChild>
          <div>
            <Button className="hidden sm:flex">
              <PlusCircle className="mr-2" /> Tambah Param
            </Button>
            <Button
              variant="default"
              size="icon2"
              className="fixed z-50 bottom-4 right-4 sm:hidden"
            >
              <Plus className="size-8" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Tambah Param</DialogTitle>
            <DialogDescription>Tambah param baru dan klik simpan.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Masukkan nama param" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Masukkan deskripsi" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Batal
                  </Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

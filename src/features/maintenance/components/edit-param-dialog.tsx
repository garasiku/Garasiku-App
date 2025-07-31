// components/EditParamDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Button } from "@/components/shadcn/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Param } from "@/models/param";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useState } from "react";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

interface EditParamDialogProps {
  param: Param;
  onSave?: (updatedParam: Param) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const formSchema = z.object({
  id: z.string().min(1),
  group: z.string().min(1),
  name: z.string({ message: "Nama harus diisi" }).min(1, { message: "Nama harus diisi" }),
  description: z.string().optional(),
});

export function EditParamDialog({
  param,
  onSave,
  open,
  onOpenChange,
}: EditParamDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: param.id,
      group: param.group,
      name: param.name,
      description: param.description ?? undefined,
    },
  });

  const { reset } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("parameter")
        .update({
          name: values.name,
          description: values.description,
        })
        .eq("id", values.id)
        .select("*")
        .single();

      if (error) {
        throw new Error("Gagal mengubah data param: " + error.message);
      }

      toast.success("Data param berhasil diperbarui.");

      if (onSave) {
        onSave(data);
      }
      onOpenChange?.(false);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan pada sistem: " + error);
    } finally {
      setLoading(false);
    }
  }

  function handleDialogChange(isOpen: boolean) {
    onOpenChange?.(isOpen);
    if (isOpen) {
      reset({
        id: param.id,
        group: param.group,
        name: param.name,
        description: param.description ?? undefined,
      });
    } else {
      reset();
    }
  }

  return (
    <>
      <LoadingOverlay loading={loading} />

      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="bg-white rounded-lg p-6 max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit Param</DialogTitle>
            <DialogDescription>Ubah dan simpan perubahan param.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Batal</Button>
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

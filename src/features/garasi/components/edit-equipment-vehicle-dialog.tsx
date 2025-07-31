import { useState } from "react"
import { Edit } from "lucide-react"

import { Button } from "@/components/shadcn/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/shadcn/form"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Checkbox } from "@/components/shadcn/checkbox"
import { Param } from "@/models/param"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/shared/loading-overlay"

interface EditEquipmentVehicleDialogProps {
  vehicleId?: string
  equipmentParam: Param[]
  vehicleEquipments: string[]
  onSave?: (updatedEquipment: string[]) => void
}

const formSchema = z.object({
  items: z.array(z.string()),
})

export function EditEquipmentVehicleDialog({ vehicleId, equipmentParam, vehicleEquipments, onSave }: EditEquipmentVehicleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: vehicleEquipments
    },
  })

  const { reset } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const formattedArray = values.items.join("|");

      const { error } = await supabase
        .from("vehicles")
        .update({ equipments: formattedArray })
        .eq("id", vehicleId);

      if (error) {
        throw new Error("Gagal mengubah equipments vehicle: " + error.message);
      }

      toast.success("Kelengkapan kendaraan berhasil diperbarui.");

      if (onSave) {
        onSave(values.items);
      }

      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengubah data kelengkapan kendaraan: " + error);
    } finally {
      setLoading(false);
    }
  }

  function handleDialogChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      reset({
        items: vehicleEquipments
      });
    } else {
      reset();
    }
  }

  return (
    <>
      <LoadingOverlay loading={loading} />

      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit />
            Ubah
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Ubah Kelengkapan Kendaraan</DialogTitle>
            <DialogDescription>Atur informasi kelengkapan kendaraan dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Kelengkapan Kendaraan */}
              <FormField
                control={form.control}
                name="items"
                render={({ field }) => (
                  <FormItem className={`grid gap-5 p-2 ${equipmentParam.length > 5 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                    {equipmentParam.map((item) => (
                      <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(item.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, item.name]);
                              } else {
                                field.onChange(field.value.filter((val) => val !== item.name));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{item.description}</FormLabel>
                      </FormItem>
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />


              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DialogClose>
                <Button type="submit">
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>

        </DialogContent>
      </Dialog>
    </>
  )
}

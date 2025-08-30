import { useState } from "react"
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
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { Vehicle } from "@/models/vehicle"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/shadcn/calendar"
import { LoadingOverlay } from "@/components/shared/loading-overlay"

interface SellVehicleDialogProps {
  vehicle: Vehicle;
  onSave?: (updatedVehicle: Vehicle) => void;
}

// Define the form schema with validation
const formSchema = z.object({
  vehicleId: z.string().min(1, { message: "Vehicle Id harus terisi" }),
  soldDate: z.date({ required_error: "Tanggal Terjual harus terisi" }),
})

export function SellVehicleDialog({ vehicle, onSave }: SellVehicleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: vehicle.id,
      soldDate: new Date(),
    },
  })

  const { reset } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const isSelling = true;
      const todayDateOnly = format(values.soldDate, "yyyy-MM-dd");

      const payload = {
        is_sold: isSelling,
        sold_date: todayDateOnly,
      }

      const { data, error } = await supabase
        .from("vehicles")
        .update(payload)
        .eq("id", values.vehicleId)
        .select("*")
        .single();

      if (error) {
        throw new Error("Gagal mengubah status kendaraan: " + error.message);
      }

      toast.success(`Kendaraan "${vehicle.name}" berhasil diubah menjadi terjual.`);

      if (onSave) {
        onSave(data);
      }

      setOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengubah status kendaraan: " + error);
    } finally {
      setLoading(false);
    }
  }

  function handleDialogChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      reset({
        vehicleId: vehicle.id,
        soldDate: new Date(),
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
          <Button className="w-full sm:w-auto">
            Jual Kendaraan
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Jual Kendaraan</DialogTitle>
            <DialogDescription>Masukkan tanggal terjual kendaraan dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Tanggal Terjual Kendaraan */}
              <div className="flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="soldDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="font-medium">Tanggal Terjual</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd MMM yyyy")
                              ) : (
                                <span>Pilih tanggal selesai administrasi</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            captionLayout="dropdown"
                            onSelect={field.onChange}
                            startMonth={new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)}
                            endMonth={new Date(new Date().getFullYear() + 5, new Date().getMonth(), 1)}
                            disabled={(date: Date) =>
                              date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

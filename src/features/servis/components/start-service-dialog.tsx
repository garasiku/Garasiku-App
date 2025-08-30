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
import { Input } from "@/components/shadcn/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Service } from "@/models/service"
import { Textarea } from "@/components/shadcn/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/shadcn/calendar"
import { cn, formatNumber, formatRupiah } from "@/lib/utils"
import { format } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { ONGOING } from "@/lib/constants"
import { LoadingOverlay } from "@/components/shared/loading-overlay"

interface StartServiceDialogProps {
  service: Service
  onSave?: (updatedService: Service) => void
}

const formSchema = z.object({
  id: z.string().min(1, { message: "Id harus terisi" }),
  startDate: z.date({ required_error: "Tanggal Mulai harus terisi" }),
  mileage: z.coerce.number({ message: "Kilometer harus terisi" }).min(0, { message: "Kilometer harus terisi" }),
  totalCost: z.coerce.number().optional(),
  mechanicName: z.string().optional(),
  task: z.string({ message: "Jasa harus terisi" }).min(1, { message: "Jasa harus terisi" }),
  sparepart: z.string().optional(),
  material: z.string().optional(),
  notes: z.string().optional(),
})

export function StartServiceDialog({ service, onSave }: StartServiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: service.id,
      startDate: new Date(),
      mileage: service.mileage ?? undefined,
      totalCost: service.totalCost ?? undefined,
      mechanicName: service.mechanicName ?? undefined,
      task: service.task ?? undefined,
      sparepart: service.sparepart ?? undefined,
      material: service.material ?? undefined,
      notes: service.notes ?? undefined,
    },
  })

  const { reset } = form

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const payload = {
        start_date: format(values.startDate, "yyyy-MM-dd"),
        mileage: values.mileage,
        total_cost: values.totalCost,
        mechanic_name: values.mechanicName,
        task: values.task,
        sparepart: values.sparepart,
        material: values.material,
        notes: values.notes,
        status: ONGOING,
      }

      const { data, error } = await supabase
        .from("service")
        .update(payload)
        .eq("id", values.id)
        .select("*")
        .single()

      if (error) {
        throw new Error("Gagal mengubah data service: " + error.message);
      }

      toast.success("Servis berhasil dimulai.")
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

  function handleDialogChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      reset({
        id: service.id,
        startDate: new Date(),
        mileage: service.mileage ?? undefined,
        totalCost: service.totalCost ?? undefined,
        mechanicName: service.mechanicName ?? undefined,
        task: service.task ?? undefined,
        sparepart: service.sparepart ?? undefined,
        material: service.material ?? undefined,
        notes: service.notes ?? undefined,
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
          <Button variant="default">Mulai Servis</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Mulai Servis</DialogTitle>
            <DialogDescription>Tambah informasi rincian servis dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Detail Servis */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Tanggal Mulai</FormLabel>
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
                                  <span>Pilih tanggal mulai servis</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Kilometer</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan kilometer kendaraan"
                            {...field}
                            value={formatNumber(field.value)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              field.onChange(raw);
                            }}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Biaya</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan biaya servis"
                            {...field}
                            value={formatRupiah(field.value)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              field.onChange(raw);
                            }}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="mechanicName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Nama Mekanik</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama mekanik servis"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="task"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Jasa</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan jasa servis"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sparepart"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Sparepart</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan sparepart servis"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Bahan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan bahan servis"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Catatan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan catatan servis"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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

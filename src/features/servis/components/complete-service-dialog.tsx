import { useEffect, useState } from "react"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/shadcn/form"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Service } from "@/models/service"
import { Textarea } from "@/components/shadcn/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/shadcn/calendar"
import { cn, formatNumber, formatRupiah } from "@/lib/utils"
import { addMonths, format } from "date-fns"
import { Switch } from "@/components/shadcn/switch"
import { Separator } from "@/components/shadcn/separator"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { LoadingOverlay } from "@/components/shared/loading-overlay"
import { COMPLETED, PENDING } from "@/lib/constants"

interface CompleteServiceDialogProps {
  service: Service
  onSave?: (updatedService: Service) => void
}

const formSchema = z.object({
  id: z.string().min(1, { message: "Id harus terisi" }),
  endDate: z.date({ required_error: "Tanggal Selesai harus terisi" }),
  mileage: z.coerce.number({ message: "Kilometer harus terisi" }).min(0, { message: "Kilometer harus terisi" }),
  totalCost: z.coerce.number({ message: "Biaya harus terisi" }).min(0, { message: "Biaya harus terisi" }),
  mechanicName: z.string().optional(),
  task: z.string({ message: "Jasa harus terisi" }).min(1, { message: "Jasa harus terisi" }),
  sparepart: z.string().optional(),
  material: z.string().optional(),
  notes: z.string().optional(),
  isSetNextReminder: z.boolean(),
  nextScheduleDate: z.date().optional(),
}).refine(
  (data) => {
    if (data.isSetNextReminder) {
      return data.nextScheduleDate instanceof Date;
    }
    return true;
  },
  {
    path: ["nextScheduleDate"],
    message: "Jadwal Servis Berikutnya harus terisi",
  }
)

export function CompleteServiceDialog({ service, onSave }: CompleteServiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: service.id,
      endDate: new Date(),
      mileage: service.mileage ?? undefined,
      totalCost: service.totalCost ?? undefined,
      mechanicName: service.mechanicName ?? undefined,
      task: service.task ?? undefined,
      sparepart: service.sparepart ?? undefined,
      material: service.material ?? undefined,
      notes: service.notes ?? undefined,
      isSetNextReminder: true
    },
  })

  const { watch, setValue, reset } = form
  const endDate = watch("endDate")
  const isSetNextReminder = watch("isSetNextReminder")

  useEffect(() => {
    if (isSetNextReminder && endDate) {
      setValue("nextScheduleDate", addMonths(endDate, 6))
    }
  }, [endDate, isSetNextReminder, setValue])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const payload = {
        end_date: format(values.endDate, "yyyy-MM-dd"),
        mileage: values.mileage,
        total_cost: values.totalCost,
        mechanic_name: values.mechanicName,
        task: values.task,
        sparepart: values.sparepart,
        material: values.material,
        notes: values.notes,
        status: COMPLETED,
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

      // insert servis baru kalau isSetNextReminder true
      if (values.isSetNextReminder && values.nextScheduleDate) {
        const { data: ticketData, error: ticketError } = await supabase.rpc("generate_ticket_number", {
          task_type_input: "SRV",
        });
        if (ticketError || !ticketData) {
          throw ticketError || new Error("Gagal generate nomor tiket");
        }
        const insertData = {
          vehicle_id: service.vehicleId,
          type: service.type,
          schedule_date: format(values.nextScheduleDate, "yyyy-MM-dd"),
          status: PENDING,
          ticket_num: ticketData
        }

        const { error: insertError } = await supabase.from("service").insert(insertData)

        if (insertError) {
          throw new Error("Servis selesai, tapi gagal membuat reminder servis berikutnya: " + insertError.message);
        } else {
          toast.success("Servis selesai & reminder servis berikutnya berhasil dibuat.")
        }
      } else {
        toast.success("Servis berhasil diselesaikan.")
      }

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
        endDate: new Date(),
        mileage: service.mileage ?? undefined,
        totalCost: service.totalCost ?? undefined,
        mechanicName: service.mechanicName ?? undefined,
        task: service.task ?? undefined,
        sparepart: service.sparepart ?? undefined,
        material: service.material ?? undefined,
        notes: service.notes ?? undefined,
        isSetNextReminder: true
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
          <Button variant="default">Selesaikan Servis</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Selesaikan Servis</DialogTitle>
            <DialogDescription>Tambah informasi rincian servis dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Detail Servis */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Tanggal Selesai</FormLabel>
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
                                  <span>Pilih tanggal selesai servis</span>
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

                  <Separator />

                  <FormField
                    control={form.control}
                    name="isSetNextReminder"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="font-medium">Buat Reminder Servis Berikutnya</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isSetNextReminder && (
                    <FormField
                      control={form.control}
                      name="nextScheduleDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Jadwal Servis Berikutnya</FormLabel>
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
                                    <span>Pilih tanggal servis berikutnya</span>
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
                  )}
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

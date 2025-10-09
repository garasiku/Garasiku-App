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
import { Textarea } from "@/components/shadcn/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/shadcn/calendar"
import { cn, formatRupiah } from "@/lib/utils"
import { addYears, format } from "date-fns"
import { Switch } from "@/components/shadcn/switch"
import { Separator } from "@/components/shadcn/separator"
import { Administration } from "@/models/administration"
import { COMPLETED, PENDING } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/shared/loading-overlay"

interface CompleteAdministrationDialogProps {
  administration: Administration
  onSave?: (updatedAdministration: Administration) => void
}

// Define the form schema with validation
const formSchema = z.object({
  id: z.string().min(1, { message: "Id harus terisi" }),
  endDate: z.date({ required_error: "Tanggal Selesai harus terisi" }),
  totalCost: z.coerce.number({ message: "Biaya harus terisi" }).min(0, { message: "Biaya harus terisi" }),
  notes: z.string().optional(),
  isSetNextReminder: z.boolean(),
  newDueDate: z.date().optional(),
}).refine(
  (data) => {
    if (data.isSetNextReminder) {
      return data.newDueDate instanceof Date;
    }
    return true;
  },
  {
    path: ["newDueDate"],
    message: "Jatuh Tempo Baru harus terisi",
  }
)

export function CompleteAdministrationDialog({ administration, onSave }: CompleteAdministrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: administration.id,
      endDate: new Date(),
      totalCost: administration.totalCost ?? undefined,
      notes: administration.notes ?? undefined,
      isSetNextReminder: true,
      newDueDate: administration.dueDate ? addYears(administration.dueDate, 1) : undefined
    },
  })

  const { watch, setValue, reset } = form;

  const isSetNextReminder = watch("isSetNextReminder");

  useEffect(() => {
    if (isSetNextReminder && administration.dueDate) {
      setValue("newDueDate", addYears(administration.dueDate, 1))
    }
  }, [administration.dueDate, isSetNextReminder, setValue])


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const payload = {
        end_date: format(values.endDate, "yyyy-MM-dd"),
        total_cost: values.totalCost,
        notes: values.notes,
        status: COMPLETED,
        new_due_date: values.newDueDate ? format(values.newDueDate, "yyyy-MM-dd") : undefined,
      }

      const { data, error } = await supabase
        .from("administration")
        .update(payload)
        .eq("id", values.id)
        .select("*")
        .single();

      if (error) {
        throw new Error("Gagal mengubah data administration: " + error.message);
      }

      // insert administrasi baru kalau isSetNextReminder true
      if (values.isSetNextReminder && values.newDueDate) {
        const { data: ticketData, error: ticketError } = await supabase.rpc("generate_ticket_number", {
          task_type_input: "ADM",
        });
        if (ticketError || !ticketData) {
          throw ticketError || new Error("Gagal generate nomor tiket");
        }
        const insertData = {
          vehicle_id: administration.vehicleId,
          type: administration.type,
          due_date: format(values.newDueDate, "yyyy-MM-dd"),
          status: PENDING,
          ticket_num: ticketData
        }

        const { error: insertError } = await supabase.from("administration").insert(insertData)

        if (insertError) {
          throw new Error("Administrasi selesai, tapi gagal membuat reminder administrasi berikutnya: " + insertError.message);
        } else {
          toast.success("Administrasi selesai & reminder administrasi berikutnya berhasil dibuat.")
        }
      } else {
        toast.success("Administrasi berhasil diselesaikan.")
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
        id: administration.id,
        endDate: new Date(),
        totalCost: administration.totalCost ?? undefined,
        notes: administration.notes ?? undefined,
        isSetNextReminder: true,
        newDueDate: administration.dueDate ? addYears(administration.dueDate, 1) : undefined
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
          <Button variant="default">Selesaikan Administrasi</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Selesaikan Administrasi</DialogTitle>
            <DialogDescription>Tambah informasi rincian administrasi dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Detail Administrasi */}
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
                              startMonth={new Date(new Date().getFullYear() - 100, new Date().getMonth(), 1)}
                              endMonth={new Date(new Date().getFullYear() + 100, new Date().getMonth(), 1)}
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

                  <FormField
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Biaya</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan biaya administrasi"
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

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Catatan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan catatan administrasi"
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
                        <FormLabel className="font-medium">Buat Reminder Administrasi Berikutnya</FormLabel>
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
                      name="newDueDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Jatuh Tempo Berikutnya</FormLabel>
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
                                    <span>Pilih tanggal administrasi berikutnya</span>
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
                                startMonth={new Date(new Date().getFullYear() - 100, new Date().getMonth(), 1)}
                                endMonth={new Date(new Date().getFullYear() + 100, new Date().getMonth(), 1)}
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

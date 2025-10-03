import { useEffect, useMemo, useState } from "react"
import { CalendarIcon, Plus, PlusCircle } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select"
import { Param } from "@/models/param"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover"
import { Calendar } from "@/components/shadcn/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { VEHICLE_CATEGORY_PARAM, PARAM_GROUP_MERK_KENDARAAN, PENDING } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/shared/loading-overlay"
import { useAuth } from "@/lib/auth-context"

interface AddVehicleDialogProps {
  onSave?: (newVehicle: string) => void
}

const formSchema = z.object({
  name: z.string({ message: "Nama harus terisi" }).min(1, { message: "Nama harus terisi" }),
  category: z.string({ message: "Jenis harus terisi" }).min(1, { message: "Jenis harus terisi" }),
  brand: z.string({ message: "Merk harus terisi" }).min(1, { message: "Merk harus terisi" }),
  type: z.string({ message: "Type harus terisi" }).min(1, { message: "Type harus terisi" }),
  year: z.string({ message: "Tahun harus terisi" }).min(1, { message: "Tahun harus terisi" }),
  color: z.string({ message: "Warna harus terisi" }).min(1, { message: "Warna harus terisi" }),
  licensePlate: z.string({ message: "Plat No harus terisi" }).min(1, { message: "Plat No harus terisi" }),
  stnkDueDate: z.date().optional(),
  insuranceDueDate: z.date().optional(),
})

export function AddVehicleDialog({ onSave }: AddVehicleDialogProps) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      brand: "",
      type: "",
      year: "",
      color: "",
      licensePlate: "",
    },
  })

  const vehicleCategoryParam = VEHICLE_CATEGORY_PARAM;
  const [vehicleBrandParam, setVehicleBrandParam] = useState<Param[]>([]);

  const userMeta = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      username: meta.username || user.email?.split("@")[0] || "nama pengguna",
    };
  }, [user]);

  const fetchBrandParams = async () => {
    const { data, error } = await supabase
      .from("parameter")
      .select("*")
      .eq("group", PARAM_GROUP_MERK_KENDARAAN)
      .order("name");

    if (error) {
      console.error("Brand params fetch error:", error);
    }

    if (data) {
      setVehicleBrandParam(data);
    }
  }

  useEffect(() => {
    if (!open) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        await fetchBrandParams();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [open])

  const { watch, setValue, reset } = form;

  const brand = watch("brand");
  const type = watch("type");
  const color = watch("color");
  const year = watch("year");

  useEffect(() => {
    if (brand || type || color || year) {
      const updatedName = `${brand} ${type} ${color} ${year}`;
      setValue("name", updatedName);
    }
  }, [brand, type, color, year, setValue]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const stnkDate = values.stnkDueDate;
      const insuranceDate = values.insuranceDueDate;

      const { data: vehicle, error: insertError } = await supabase
        .from("vehicles")
        .insert({
          name: values.name,
          category: values.category,
          brand: values.brand,
          type: values.type,
          year: values.year || new Date().getFullYear(),
          color: values.color,
          license_plate: values.licensePlate,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error("Gagal menyimpan kendaraan: " + insertError.message);
      }

      if (!vehicle) return;

      const updatedAt = new Date().toISOString();
      const { error: plateHistoryError } = await supabase
        .from("vehicle_plate_history")
        .insert({
          vehicle_id: vehicle.id,
          plat_no: values.licensePlate,
          updated_by: userMeta?.username || "system",
          updated_at: updatedAt
        });

      if (plateHistoryError) {
        throw new Error("Gagal menyimpan plat no vehicle: " + plateHistoryError.message);
      }

      const { error: stnkError } = await supabase
        .from("stnk")
        .insert({
          vehicle_id: vehicle.id,
          category: values.category,
          brand: values.brand,
          type: values.type,
          manufactured_year: values.year,
          color: values.color,
          license_plate: values.licensePlate,
        });

      if (stnkError) {
        throw new Error("Gagal menyimpan data stnk: " + stnkError.message);
      }

      if (stnkDate) {
        const { data: ticketData, error: ticketError } = await supabase.rpc("generate_ticket_number", {
          task_type_input: "ADM",
        });
        if (ticketError || !ticketData) {
          throw ticketError || new Error("Gagal generate nomor tiket");
        }
        const { error: adminStnkError } = await supabase
          .from("administration")
          .insert({
            vehicle_id: vehicle.id,
            type: "administrasi-stnk-1",
            status: PENDING,
            due_date: format(stnkDate, "yyyy-MM-dd"),
            ticket_num: ticketData
          });

        if (adminStnkError) {
          throw new Error("Gagal menyimpan data administration stnk: " + adminStnkError.message);
        }
      }

      if (insuranceDate) {
        const { data: ticketDataAs, error: ticketErrorAs } = await supabase.rpc("generate_ticket_number", {
          task_type_input: "ADM",
        });
        if (ticketErrorAs || !ticketDataAs) {
          throw ticketErrorAs || new Error("Gagal generate nomor tiket");
        }
        const { error: adminInsuranceError } = await supabase
          .from("administration")
          .insert({
            vehicle_id: vehicle.id,
            type: "administrasi-asuransi",
            status: PENDING,
            due_date: format(insuranceDate, "yyyy-MM-dd"),
            ticket_num: ticketDataAs
          });

        if (adminInsuranceError) {
          throw new Error("Gagal menyimpan data administration insurance: " + adminInsuranceError.message);
        }
      }

      toast.success("Data kendaraan baru berhasil ditambahkan.")

      if (onSave) {
        onSave(vehicle.id);
      }

      setOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan data kendaraan baru: " + error);
    } finally {
      setLoading(false);
    }
  }

  function handleDialogChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  }

  return (
    <>
      <LoadingOverlay loading={loading} />

      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <div>
            <Button className="hidden sm:flex">
              <PlusCircle /> Tambah Kendaraan
            </Button>
            <Button variant="default" size="icon2" className="fixed z-50 bottom-4 right-4 sm:hidden">
              <Plus className="size-8" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Tambah Kendaraan</DialogTitle>
            <DialogDescription>Tambah kendaraan baru dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Detail Kendaraan */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Nama Kendaraan</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Hasil nama kendaraan"
                            {...field}
                            className="w-full"
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="grid grid-cols-1 gap-5">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Jenis</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih jenis kendaraan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicleCategoryParam.map((option) => (
                                <SelectItem key={option.id} value={option.name}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Merk</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih merk kendaraan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicleBrandParam.map((option) => (
                                <SelectItem key={option.id} value={option.name}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Tipe</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan tipe kendaraan"
                              {...field}
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
                      name="year"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Tahun</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan tahun kendaraan"
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
                      name="color"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Warna</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan warna kendaraan"
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
                      name="licensePlate"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Plat No</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan plat no kendaraan"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="stnkDueDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Jatuh Tempo STNK</FormLabel>
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
                                  <span>Pilih jatuh tempo STNK</span>
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

                  <FormField
                    control={form.control}
                    name="insuranceDueDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Jatuh Tempo Asuransi</FormLabel>
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
                                  <span>Pilih jatuh tempo Asuransi</span>
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
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
import { VEHICLE_CATEGORY_PARAM, PARAM_GROUP_MERK_KENDARAAN, PENDING, PARAM_GROUP_KELENGKAPAN_KENDARAAN } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { LoadingOverlay } from "@/components/shared/loading-overlay"
import { useAuth } from "@/lib/auth-context"
import { Checkbox } from "@/components/shadcn/checkbox"

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
  stnkNumber: z.string().optional(),
  ownerName: z.string().optional(),
  ownerAddress: z.string().optional(),
  model: z.string().optional(),
  cylinderCapacity: z.string().optional(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  fuelType: z.string().optional(),
  licensePlateColor: z.string().optional(),
  registrationYear: z.string().optional(),
  bpkbNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  validUntil: z.date().optional(),
  items: z.array(z.string()).optional(),
})

export function AddVehicleDialog({ onSave }: AddVehicleDialogProps) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

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
      items: [],
    },
  })

  const vehicleCategoryParam = VEHICLE_CATEGORY_PARAM;
  const [vehicleBrandParam, setVehicleBrandParam] = useState<Param[]>([]);
  const [equipmentParam, setEquipmentParam] = useState<Param[]>([])

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

  const fetchEquipmentParams = async () => {
    const { data, error } = await supabase
      .from("parameter")
      .select("*")
      .eq("group", PARAM_GROUP_KELENGKAPAN_KENDARAAN)
      .order("name")

    if (error) {
      console.error("Equipment params fetch error:", error)
    }

    if (data) {
      setEquipmentParam(data);
    }
  };

  useEffect(() => {
    if (!open) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        await fetchBrandParams();
        await fetchEquipmentParams();
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

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const isLastStep = step === 3;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLastStep) {
      nextStep();
      return;
    }

    setLoading(true);

    try {
      const stnkDate = values.stnkDueDate;
      const insuranceDate = values.insuranceDueDate;
      const formattedArray = (values.items ?? []).join("|");;

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
          equipments: formattedArray
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
          stnk_number: values.stnkNumber,
          fuel_type: values.fuelType,
          license_plate_color: values.licensePlateColor,
          registration_year: values.registrationYear,
          bpkb_number: values.bpkbNumber,
          cylinder_capacity: values.cylinderCapacity,
          registration_number: values.registrationNumber,
          chassis_number: values.chassisNumber,
          engine_number: values.engineNumber,
          valid_until: values.validUntil ? format(values.validUntil, "yyyy-MM-dd") : null,
          model: values.model,
          owner_name: values.ownerName,
          owner_address: values.ownerAddress,
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
      setStep(1);
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
            <DialogDescription>
              {step === 1 && "Step 1 dari 3 - Detail Kendaraan"}
              {step === 2 && "Step 2 dari 3 - Detail STNK"}
              {step === 3 && "Step 3 dari 3 - Kelengkapan Kendaraan"}
            </DialogDescription>

            {/* Progress bar */}
            <div className="relative w-full h-2 bg-gray-200 rounded-full my-2">
              <div
                className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Step 1 - Detail Kendaraan */}
              {step === 1 && (
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
                  </div>
                </div>
              )}

              {/* Step 1 - STNK Kendaraan */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="licensePlate"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">No Polisi</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan no polisi kendaraan"
                              {...field}
                              className="w-full"
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stnkNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">No STNK</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan no STNK kendaraan"
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
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2 space-y-1">
                          <FormLabel className="font-medium">Nama Pemilik</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan nama pemilik kendaraan"
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
                      name="ownerAddress"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2 space-y-1">
                          <FormLabel className="font-medium">Alamat</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan alamat kendaraan"
                              {...field}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-5">
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Merk</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan merk kendaraan"
                                {...field}
                                className="w-full"
                                disabled
                              />
                            </FormControl>
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
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Jenis</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan jenis kendaraan"
                                {...field}
                                className="w-full"
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Model</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan model kendaraan"
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
                        name="year"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Tahun Pembuatan</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan tahun pembuatan kendaraan"
                                {...field}
                                className="w-full"
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cylinderCapacity"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Isi Silinder</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan isi silinder kendaraan"
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
                        name="chassisNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">No Rangka</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan no rangka kendaraan"
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
                        name="engineNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">No Mesin</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan no mesin kendaraan"
                                {...field}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col gap-5">
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
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fuelType"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Bahan Bakar</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan bahan bakar kendaraan"
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
                        name="licensePlateColor"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Warna TNKB</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan warna TNKB kendaraan"
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
                        name="registrationYear"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Tahun Registrasi</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan tahun registrasi kendaraan"
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
                        name="bpkbNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">No BPKB</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan no BPKB kendaraan"
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
                        name="registrationNumber"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">No Pendaftaran</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan no pendaftaran kendaraan"
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
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="font-medium">Berlaku Sampai</FormLabel>
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
                                      <span>Pilih tanggal berlaku STNK</span>
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
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 - Kelengkapan Kendaraan */}
              {step === 3 && (
                <FormField
                  control={form.control}
                  name="items"
                  render={({ field }) => {
                    const selectedItems = field.value ?? [];

                    return (
                      <FormItem className={`grid gap-5 p-2 ${equipmentParam.length > 5 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                        {equipmentParam.map((item) => (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-center space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={selectedItems.includes(item.name)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...selectedItems, item.name]);
                                  } else {
                                    field.onChange(selectedItems.filter((val) => val !== item.name));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">{item.description}</FormLabel>
                          </FormItem>
                        ))}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              <DialogFooter>
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Kembali
                  </Button>
                ) : (
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Batal
                    </Button>
                  </DialogClose>
                )}
                <Button type="submit">
                  {isLastStep ? "Simpan" : "Lanjut"}
                </Button>
              </DialogFooter>
            </form>
          </Form>

        </DialogContent>
      </Dialog>
    </>
  )
}
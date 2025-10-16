import { useEffect, useState } from "react"
import { Edit } from "lucide-react"
import { toast } from "sonner";

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
import { Vehicle } from "@/models/vehicle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select"
import { Param } from "@/models/param"
import { VEHICLE_CATEGORY_PARAM, PARAM_GROUP_MERK_KENDARAAN } from "@/lib/constants"
import { supabase } from "@/lib/supabaseClient"
import { LoadingOverlay } from "@/components/shared/loading-overlay";

interface EditDetailVehicleDialogProps {
  vehicle: Vehicle
  onSave?: (updatedVehicle: Vehicle) => void
}

const formSchema = z.object({
  id: z.string().min(1, { message: "Id harus terisi" }),
  name: z.string({ message: "Nama harus terisi" }).min(1, { message: "Nama harus terisi" }),
  category: z.string({ message: "Jenis harus terisi" }).min(1, { message: "Jenis harus terisi" }),
  brand: z.string({ message: "Merk harus terisi" }).min(1, { message: "Merk harus terisi" }),
  type: z.string({ message: "Tipe harus terisi" }).min(1, { message: "Tipe harus terisi" }),
  year: z.string({ message: "Tahun harus terisi" }).min(1, { message: "Tahun harus terisi" }),
  color: z.string({ message: "Warna harus terisi" }).min(1, { message: "Warna harus terisi" }),
})

export function EditDetailVehicleDialog({ vehicle, onSave }: EditDetailVehicleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: vehicle.id,
      name: vehicle.name,
      category: vehicle.category,
      brand: vehicle.brand,
      type: vehicle.type,
      year: vehicle.year,
      color: vehicle.color,
    },
  })

  const vehicleCategoryParam = VEHICLE_CATEGORY_PARAM
  const [vehicleBrandParam, setVehicleBrandParam] = useState<Param[]>([])

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
  }, [open]);

  const { watch, setValue, reset } = form

  const brand = watch("brand")
  const type = watch("type")
  const color = watch("color")
  const year = watch("year")

  useEffect(() => {
    const updatedName = `${brand} ${type} ${color} ${year}`
    setValue("name", updatedName)
  }, [brand, type, color, year, setValue])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .update({
          name: values.name,
          category: values.category,
          brand: values.brand,
          type: values.type,
          year: values.year,
          color: values.color,
        })
        .eq("id", values.id)
        .select("*")
        .single();

      if (error) {
        throw new Error("Gagal mengubah data vehicle: " + error.message);
      }

      const { error: errorStnk } = await supabase
        .from("stnk")
        .update({
          category: values.category,
          brand: values.brand,
          type: values.type,
          manufactured_year: values.year,
          color: values.color
        })
        .eq("vehicle_id", values.id);

      if (errorStnk) {
        throw new Error("Gagal mengubah data stnk: " + errorStnk.message);
      }

      toast.success("Data kendaraan berhasil diperbarui.")

      if (onSave) {
        onSave(data as Vehicle);
      }

      setOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengubah data kendaraan: " + error);
    } finally {
      setLoading(false);
    }
  }

  function handleDialogChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      reset({
        id: vehicle.id,
        name: vehicle.name,
        category: vehicle.category,
        brand: vehicle.brand,
        type: vehicle.type,
        year: vehicle.year,
        color: vehicle.color,
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
            <DialogTitle>Ubah Detail Kendaraan</DialogTitle>
            <DialogDescription>Atur informasi detail kendaraan dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Nama Kendaraan</FormLabel>
                        <FormControl>
                          <Input placeholder="Hasil nama kendaraan" {...field} className="w-full" disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                          <Input placeholder="Masukkan tipe kendaraan" {...field} className="w-full" />
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
                        <FormLabel className="font-medium">Tahun</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan tahun kendaraan" {...field} className="w-full" />
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
                          <Input placeholder="Masukkan warna kendaraan" {...field} className="w-full" />
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
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

import { useState } from "react"
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
import { Stnk } from "@/models/stnk"
import { supabase } from "@/lib/supabaseClient"
import { LoadingOverlay } from "@/components/shared/loading-overlay";

interface EditDetailStnkDialogProps {
  stnk: Stnk | null
  onSave?: (updatedStnk: Stnk) => void
}

// Form schema
const formSchema = z.object({
  id: z.string().min(1),
  vehicleId: z.string().min(1),
  licensePlate: z.string().optional(),
  stnkNumber: z.string().optional(),
  ownerName: z.string().optional(),
  ownerAddress: z.string().optional(),
  brand: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  model: z.string().optional(),
  manufacturedYear: z.string().optional(),
  cylinderCapacity: z.string().optional(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  licensePlateColor: z.string().optional(),
  registrationYear: z.string().optional(),
  bpkbNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  validUntil: z.string().optional(),
})

export function EditDetailStnkDialog({ stnk, onSave }: EditDetailStnkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: stnk?.id ?? "",
      vehicleId: stnk?.vehicleId ?? "",
      licensePlate: stnk?.licensePlate ?? undefined,
      stnkNumber: stnk?.stnkNumber ?? undefined,
      ownerName: stnk?.ownerName ?? undefined,
      ownerAddress: stnk?.ownerAddress ?? undefined,
      brand: stnk?.brand ?? undefined,
      type: stnk?.type ?? undefined,
      category: stnk?.category ?? undefined,
      model: stnk?.model ?? undefined,
      manufacturedYear: stnk?.manufacturedYear ?? undefined,
      chassisNumber: stnk?.chassisNumber ?? undefined,
      engineNumber: stnk?.engineNumber ?? undefined,
      color: stnk?.color ?? undefined,
      fuelType: stnk?.fuelType ?? undefined,
      licensePlateColor: stnk?.licensePlateColor ?? undefined,
      registrationYear: stnk?.registrationYear ?? undefined,
      cylinderCapacity: stnk?.cylinderCapacity ?? undefined,
      bpkbNumber: stnk?.bpkbNumber ?? undefined,
      registrationNumber: stnk?.registrationNumber ?? undefined,
      validUntil: stnk?.validUntil ?? undefined,
    },
  })

  const { reset } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("stnk")
        .update({
          license_plate: values.licensePlate,
          stnk_number: values.stnkNumber,
          fuel_type: values.fuelType,
          license_plate_color: values.licensePlateColor,
          registration_year: values.registrationYear,
          manufactured_year: values.manufacturedYear,
          bpkb_number: values.bpkbNumber,
          cylinder_capacity: values.cylinderCapacity,
          registration_number: values.registrationNumber,
          chassis_number: values.chassisNumber,
          engine_number: values.engineNumber,
          valid_until: values.validUntil,
          model: values.model,
          brand: values.brand,
          owner_name: values.ownerName,
          owner_address: values.ownerAddress,
          type: values.type,
          category: values.category,
          color: values.color
        })
        .eq("id", values.id)
        .select("*")
        .single();

      if (error) {
        throw new Error("Gagal mengubah data stnk: " + error.message);
      }

      toast.success("Data STNK berhasil diperbarui.")
      if (onSave) {
        onSave(data as Stnk)
      }

      setOpen(false)
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengubah data STNK: " + error);
    } finally {
      setLoading(false);
    }
  }

  function handleDialogChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      reset({
        id: stnk?.id ?? "",
        vehicleId: stnk?.vehicleId ?? "",
        licensePlate: stnk?.licensePlate ?? undefined,
        stnkNumber: stnk?.stnkNumber ?? undefined,
        ownerName: stnk?.ownerName ?? undefined,
        ownerAddress: stnk?.ownerAddress ?? undefined,
        brand: stnk?.brand ?? undefined,
        type: stnk?.type ?? undefined,
        category: stnk?.category ?? undefined,
        model: stnk?.model ?? undefined,
        manufacturedYear: stnk?.manufacturedYear ?? undefined,
        chassisNumber: stnk?.chassisNumber ?? undefined,
        engineNumber: stnk?.engineNumber ?? undefined,
        color: stnk?.color ?? undefined,
        fuelType: stnk?.fuelType ?? undefined,
        licensePlateColor: stnk?.licensePlateColor ?? undefined,
        registrationYear: stnk?.registrationYear ?? undefined,
        cylinderCapacity: stnk?.cylinderCapacity ?? undefined,
        bpkbNumber: stnk?.bpkbNumber ?? undefined,
        registrationNumber: stnk?.registrationNumber ?? undefined,
        validUntil: stnk?.validUntil ?? undefined,
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
          <Button variant="outline" size="sm" disabled={!stnk}>
            <Edit className="mr-2 h-4 w-4" />
            Ubah
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-h-[90vh] md:max-w-3xl overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Ubah Detail STNK</DialogTitle>
            <DialogDescription>
              Atur informasi detail STNK kendaraan dan klik button simpan.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Detail Kendaraan */}
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
                      name="manufacturedYear"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="font-medium">Tahun Pembuatan</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan tahun pembuatan kendaraan"
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
                          <FormControl>
                            <Input
                              placeholder="Masukkan berlaku sampai kendaraan"
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

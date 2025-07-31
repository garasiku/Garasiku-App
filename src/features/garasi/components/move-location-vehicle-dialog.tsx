// (Semua import tetap seperti sebelumnya)
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { LocationVehicle } from "@/models/location-vehicle";
import { supabase } from "@/lib/supabaseClient";
import { PARAM_GROUP_LOKASI_KENDARAAN } from "@/lib/constants";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

interface MoveLocationVehicleDialogProps {
  vehicleId?: string;
  currLocationAddress?: string;
  onSave?: (newLocationVehicle: LocationVehicle) => void;
}

const formSchema = (currLocationAddress?: string) =>
  z.object({
    vehicleId: z.string().min(1, { message: "Vehicle Id harus terisi" }),
    name: z.string({ message: "Nama Lokasi harus terisi" }).min(1, { message: "Nama Lokasi harus terisi" }),
    address: z.string({ message: "Alamat Lokasi harus terisi" }).min(1, { message: "Alamat Lokasi harus terisi" }),
  })
    .refine(
      (data) => {
        if (!currLocationAddress) return true;
        const normalize = (str: string) => str.replace(/\s+/g, "").toLowerCase();
        return normalize(data.address) !== normalize(currLocationAddress);
      },
      {
        message: "Lokasi baru tidak boleh sama dengan lokasi sekarang",
        path: ["address"],
      }
    );

export function MoveLocationVehicleDialog({
  vehicleId,
  currLocationAddress,
  onSave,
}: MoveLocationVehicleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [locationParams, setLocationParams] = useState<{ name: string; description: string }[]>([]);

  const { user } = useAuth();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(currLocationAddress)),
    defaultValues: {
      vehicleId: vehicleId ?? "",
      name: "",
      address: "",
    },
  });

  const userMeta = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      username: meta.username || user.email?.split("@")[0] || "nama pengguna",
    };
  }, [user]);

  const { watch, setValue, reset } = form;
  const selectedName = watch("name");
  const isManualAddress = selectedName === "Lain-lain";

  const fetchLocationParams = async () => {
    const { data, error } = await supabase
      .from("parameter")
      .select("name, description")
      .eq("group", PARAM_GROUP_LOKASI_KENDARAAN);

    if (error) {
      console.error("Locations params fetch error:", error);
    }

    if (data) {
      const extendedData = [
        ...data,
        { name: "Lain-lain", description: "" }
      ];

      setLocationParams(extendedData);
    }
  }

  useEffect(() => {
    if (!open) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        await fetchLocationParams();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [open]);

  useEffect(() => {
    const location = locationParams.find((l) => l.name === selectedName);
    if (!isManualAddress) {
      setValue("address", location?.description || "");
    } else {
      setValue("address", "");
    }

    if (selectedName) {
      form.trigger("address");
    }
  }, [selectedName, isManualAddress, locationParams, setValue, form]);

  async function onSubmit(values: z.infer<ReturnType<typeof formSchema>>) {
    if (!vehicleId) return;
    setLoading(true);

    try {
      const createdAt = new Date().toISOString();
      const { error } = await supabase
        .from("vehicle_locations")
        .insert({
          vehicle_id: vehicleId,
          name: values.name,
          address: values.address,
          created_by: userMeta?.username || "system",
          created_at: createdAt,
        });

      if (error) {
        throw new Error("Gagal menambah vehicle_locations: " + error.message);
      }

      toast.success("Lokasi kendaraan berhasil diperbarui.");

      if (onSave) {
        onSave(values);
      }

      setOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengubah lokasi kendaraan: " + error);
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
          <Button>Pindah Lokasi</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Pindah Lokasi Kendaraan</DialogTitle>
            <DialogDescription>Pilih lokasi baru kendaraan dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Nama Lokasi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih nama lokasi kendaraan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locationParams.map((option) => (
                            <SelectItem key={option.name} value={option.name}>
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Lokasi</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Masukkan alamat lokasi kendaraan"
                          disabled={!isManualAddress}
                        />
                      </FormControl>
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
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Plus,
  PlusCircle,
} from "lucide-react";
import { Calendar } from "@/components/shadcn/calendar";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Administration } from "@/models/administration";
import { Vehicle } from "@/models/vehicle";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/shadcn/command";
import { ADMINISTRATION_TYPE_PARAM, PENDING } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient"
import { LoadingOverlay } from "@/components/shared/loading-overlay";

interface AddAdministrationDialogProps {
  onSave?: (newAdministration: Administration) => void;
}

const formSchema = z.object({
  vehicleId: z.string().min(1, { message: "Kendaraan harus terisi" }),
  type: z.string({ message: "Tipe Administrasi harus terisi" }).min(1, { message: "Tipe Administrasi harus terisi" }),
  dueDate: z.date({ required_error: "Jatuh Tempo Administrasi harus terisi" }),
});
const typeAdministrationParam = ADMINISTRATION_TYPE_PARAM;


export function AddAdministrationDialog({ onSave }: AddAdministrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [listVehicle, setListVehicle] = useState<Vehicle[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: "",
      type: "",
      dueDate: new Date(),
    },
  });

  const { reset } = form;

  const fetchListVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, license_plate, brand, type, color, year");

    if (error) {
      console.error("List Vehicles fetch error:", error);
    }

    if (data) {
      const formatted = data.map((v) => ({
        id: v.id,
        name: `${v.license_plate} - ${v.brand} ${v.type} ${v.color} ${v.year}`,
      }));
      setListVehicle(formatted);
    }
  }

  useEffect(() => {
    if (!open) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        await fetchListVehicles();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const { data: ticketData, error: ticketError } = await supabase.rpc("generate_ticket_number", {
        task_type_input: "ADM",
      });

      if (ticketError || !ticketData) {
        throw ticketError || new Error("Gagal generate nomor tiket");
      }

      const formattedValues = {
        vehicle_id: values.vehicleId,
        type: values.type,
        status: PENDING,
        due_date: format(values.dueDate, "yyyy-MM-dd"),
        ticket_num: ticketData,
      };

      const { data, error } = await supabase
        .from("administration")
        .insert(formattedValues)
        .select("*")
        .single();

      if (error) {
        throw new Error("Gagal menambahkan data administrasi: " + error.message);
      }

      toast.success("Data administrasi berhasil ditambahkan.");
      if (onSave) {
        onSave(data as Administration);
      }
      setOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan pada sistem: " + error);
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
        {/* HTML tetap sama, tak diubah */}
        <DialogTrigger asChild>
          <div>
            <Button className="hidden sm:flex">
              <PlusCircle /> Tambah Administrasi
            </Button>
            <Button
              variant="default"
              size="icon2"
              className="fixed z-50 bottom-4 right-4 sm:hidden"
            >
              <Plus className="size-8" />
            </Button>
          </div>
        </DialogTrigger>

        <DialogContent
          className="max-h-[90vh] md:max-w-3xl overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Tambah Administrasi</DialogTitle>
            <DialogDescription>
              Tambah administrasi baru dan klik button simpan.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Detail Administrasi */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Jatuh Tempo Administrasi</FormLabel>
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
                                  <span>Pilih tanggal jatuh Tempo administrasi</span>
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
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Kendaraan</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal h-fit",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <span className="whitespace-normal break-words text-left">
                                  {field.value
                                    ? listVehicle.find((vehicle) => vehicle.id === field.value)?.name
                                    : "Pilih kendaraan"}
                                </span>
                                <ChevronsUpDown className="opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0"
                            style={{
                              minWidth: 'var(--radix-popover-trigger-width)',
                              maxWidth: 'var(--radix-popover-trigger-width)',
                            }}>
                            <Command>
                              <CommandInput
                                placeholder="Cari kendaraan..."
                                className="h-9"
                              />
                              <CommandList>
                                <CommandEmpty>Kendaraan tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  {listVehicle.map((vehicle) => (
                                    <CommandItem
                                      value={vehicle.name}
                                      key={vehicle.id}
                                      onSelect={() => {
                                        form.setValue("vehicleId", vehicle.id || "");
                                      }}
                                    >
                                      <span className="whitespace-normal break-words text-left">
                                        {vehicle.name}
                                      </span>
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          vehicle.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Tipe Administrasi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih tipe administrasi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {typeAdministrationParam.map((option) => (
                              <SelectItem key={option.id} value={option.name}>
                                {option.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
  );
}

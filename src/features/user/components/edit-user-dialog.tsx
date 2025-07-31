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
import { User } from "@/models/user"
import { Input } from "@/components/shadcn/input"
import { Switch } from "@/components/shadcn/switch"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { ACTIVE, INACTIVE, ROLE_PARAM } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select"
import { LoadingOverlay } from "@/components/shared/loading-overlay"

interface EditUserDialogProps {
  user: User,
  onSave?: (updatedUser: User) => void
}

// Define the form schema with validation
const formSchema = z.object({
  id: z.string().min(1, { message: "Id harus terisi" }),
  username: z.string({ message: "Username harus terisi" }).min(1, { message: "Username harus terisi" }),
  fullname: z.string({ message: "Nama Lengkap harus terisi" }).min(1, { message: "Nama Lengkap harus terisi" }),
  email: z.string({ message: "Email harus terisi" }).min(1, { message: "Email harus terisi" }),
  phone: z.string().optional(),
  role: z.string({ message: "Role harus terisi" }).min(1, { message: "Role harus terisi" }),
  isActive: z.boolean()
})

export function EditUserDialog({ user, onSave }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone?.replace(/^(\+62|62)/, "") || "",
      role: user.role,
      isActive: user.isActive
    },
  })

  const roleParam = ROLE_PARAM;

  const { reset } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token || ""

      const formattedPhone = values.phone?.trim()
        ? `+62${values.phone.replace(/^0+/, "")}`
        : "";

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-admin`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: values.id,
            username: values.username,
            fullname: values.fullname,
            email: values.email,
            phone: formattedPhone,
            role: values.role,
            status: values.isActive ? ACTIVE : INACTIVE,
          }),
        }
      )

      const result = await res.json()
      if (!res.ok) {
        const errorMessage = result.error || result.message || "Gagal mengubah user"
        throw new Error(errorMessage)
      }

      toast.success("User berhasil diperbarui.")

      if (onSave) {
        onSave({
          id: values.id,
          username: values.username,
          fullname: values.fullname,
          email: values.email,
          phone: values.phone,
          role: values.role,
          isActive: values.isActive,
        })
      }

      setOpen(false)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Terjadi kesalahan pada sistem")
      }
    } finally {
      setLoading(false);
    }
  }

  function handleDialogChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      reset({
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone?.replace(/^(\+62|62)/, "") || "",
        role: user.role,
        isActive: user.isActive
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
          <Button variant="default">Ubah Detail</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] md:max-w-3xl overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Ubah Detail User</DialogTitle>
            <DialogDescription>Ubah detail user dan klik button simpan.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Detail User */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan username user"
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
                    name="fullname"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama lengkap user"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan email user"
                            {...field}
                            className="w-full"
                            type="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">No Telepon</FormLabel>
                        <FormControl>
                          <div className="flex w-full">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                              +62
                            </span>
                            <Input
                              placeholder="Masukkan no telepon user"
                              {...field}
                              className="rounded-l-none"
                              type="tel"
                              onChange={(e) => {
                                // Remove leading 0 if user types it
                                const cleaned = e.target.value.replace(/^0+/, "");
                                field.onChange(cleaned);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="font-medium">Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih role user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleParam.map((option) => (
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

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="font-medium">Status Aktif</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/shadcn/input"
import { Button } from "@/components/shadcn/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { LoadingOverlay } from "@/components/shared/loading-overlay"
import { ACTIVE } from "@/lib/constants"

// Form schema
const formSchema = z.object({
  username: z.string({ message: "Username harus terisi" }).min(1, { message: "Username harus terisi" }),
  password: z.string({ message: "Password harus terisi" }).min(1, { message: "Password harus terisi" }),
})

export default function LoginPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { username, password } = values
    setLoading(true)

    try {
      const { data: result, error: rpcError } = await supabase
        .rpc("lookup_user_by_username", { uname: username })

      const userRow = Array.isArray(result) ? result[0] : null

      if (rpcError || !userRow?.email) {
        throw new Error("User tidak ditemukan");
      }

      if (userRow.status !== ACTIVE) {
        await supabase.auth.signOut();
        throw new Error("User tidak aktif, hubungi admin");
      }

      // 🔐 Attempt login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: userRow.email,
        password,
      })

      if (loginError) {
        throw new Error("Kredensial tidak valid");
      }

      // ✅ Navigate on success
      navigate("/")
    } catch (error) {
      console.error(error);
      toast.error("Gagal saat login: " + error);
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingOverlay loading={loading} />

      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <h1 className="text-5xl font-bold mb-6">Garasiku</h1>

        <div className="bg-background w-full max-w-md p-6 md:p-8 rounded-lg border shadow-xs">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-medium">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Username"
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
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          {...field}
                          className="w-full"
                        />
                        <div
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-medium" />
                          ) : (
                            <Eye className="h-5 w-5 text-medium" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                Masuk
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  )
}

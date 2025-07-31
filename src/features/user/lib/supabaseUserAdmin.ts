const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-admin`;

export async function addUser({
  email,
  password,
  fullname, 
  username,
  role,
  status,
  phone,
}: {
  email: string;
  password: string;
  fullname: string; 
  username: string;
  role: string;
  status: string;
  phone: string;
}) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      fullname, 
      username,
      role,
      status,
      phone
    }),
  });

  const data = await res.json();
if (!res.ok) {
  const errorMessage = typeof data?.error === "string" ? data.error : "Gagal tambah user";
  throw new Error(errorMessage);
}  return data;
}

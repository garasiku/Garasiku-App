import { Button } from "@/components/shadcn/button";
import { useNavigate } from "react-router-dom";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold text-destructive mb-2">403 - Akses Ditolak</h1>
      <p className="text-muted-foreground mb-4">
        Anda tidak memiliki hak akses untuk membuka halaman ini.
      </p>
      <Button onClick={() => navigate("/")}>Kembali ke Dashboard</Button>
    </div>
  );
}
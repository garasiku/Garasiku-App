import { Input } from "@/components/shadcn/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ParamGroupCard } from "../components/param-group-card";
import { ParamGroup } from "@/models/param-group";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

// Sesuaikan dengan struktur tabel Supabase

export default function MaintenancePage() {
  const [loading, setLoading] = useState(false);

  const [searchGroup, setSearchGroup] = useState("");
  const [paramGroups, setParamGroups] = useState<ParamGroup[]>([]);

  useEffect(() => {
    const fetchParamGroups = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("parameter_group")
          .select("*")
          .eq("is_maintain", true);

        if (error) {
          console.error("List Parameter Group fetch error:", error.message);
          return;
        }

        setParamGroups(data || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParamGroups();
  }, []);

  const filteredParamGroups = paramGroups.filter((paramGroup) =>
    paramGroup.name?.toLowerCase().includes(searchGroup.toLowerCase())
  );

  return (
    <>
      <LoadingOverlay loading={loading} />
      
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Parameter</h1>
          </div>

          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative flex w-full items-center space-x-2">
              <Search className="h-5 w-5 absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama parameter"
                className="w-full pl-10"
                value={searchGroup}
                onChange={(e) => setSearchGroup(e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <p className="text-sm text-muted-foreground">
                Total Data: <span className="font-medium">{filteredParamGroups.length}</span>
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {filteredParamGroups.map((paramGroup) => (
                <ParamGroupCard key={paramGroup.group} paramGroup={paramGroup} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

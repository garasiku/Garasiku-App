import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Param } from "@/models/param";
import { ParamGroup } from "@/models/param-group";
import { ParamCard } from "../components/param-card";
import { AddParamDialog } from "../components/add-param-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

export default function MaintenanceDetailPage() {
  const [loading, setLoading] = useState(false);

  const { id: groupCode } = useParams();
  const [paramGroup, setParamGroup] = useState<ParamGroup | null>(null);
  const [params, setParams] = useState<Param[]>([]);

  const fetchParamGroupDetail = async (group: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("parameter_group")
      .select("*")
      .eq("group", group)
      .single();

    if (error) {
      console.error("Parameter Group detail fetch error:", error)
    }

    if (data) {
      setParamGroup({
        id: data.id,
        group: data.group,
        name: data.name,
        description: data.description,
        isMaintain: data.is_maintain,
        isTotalFixed: data.is_total_fixed
      });

      return data.id;
    }

    return null;
  };

  const fetchParamsByGroup = async (group: string) => {
    const { data, error } = await supabase
      .from("parameter")
      .select("*")
      .eq("group", group)
      .order("name", { ascending: true })

    if (error) {
      console.error("List Parameter fetch error:", error)
    }

    if (data) {
      setParams(data);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!groupCode) return;
      setLoading(true);

      try {
        const groupId = await fetchParamGroupDetail(groupCode);

        if (groupId) {
          await fetchParamsByGroup(groupCode);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [groupCode]);

  if (!paramGroup && !loading) return (
    <EmptyState title="Parameter Tidak Ditemukan" description="Parameter dengan ID tersebut tidak tersedia." />
  );

  if (!paramGroup) return null;

  return (
    <>
      <LoadingOverlay loading={loading} />
      
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{paramGroup.name}</h1>
            {!paramGroup.isMaintain || !paramGroup.isTotalFixed ? (
              <AddParamDialog paramGroup={paramGroup} onSave={() => fetchParamsByGroup(groupCode!)} />
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground">
                Total Data: <span className="font-medium">{params.length}</span>
              </p>
            </div>

            <div className="flex flex-col gap-5 overflow-auto">
              {params.map((param, index) => (
                <ParamCard
                  key={param.id}
                  param={param}
                  paramGroup={paramGroup}
                  index={index}
                  onDeleted={() => fetchParamsByGroup(groupCode!)}
                  onUpdated={() => fetchParamsByGroup(groupCode!)}
                />
              ))}

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

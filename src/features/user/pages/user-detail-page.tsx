import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom"; // atau next/router jika pakai Next.js
import { supabase } from "@/lib/supabaseClient";

import { User } from "@/models/user";
import { Param } from "@/models/param";

import StatusBar from "@/components/shared/status-bar";
import SectionItem from "@/components/shared/section-item";
import { Separator } from "@/components/shadcn/separator";
import { EditUserDialog } from "../components/edit-user-dialog";
import { ChangePasswordDialog } from "../components/change-password-dialog";
import { ACTIVE, INACTIVE, ROLE_PARAM } from "@/lib/constants";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

export default function UserDetailPage() {
  const [loading, setLoading] = useState(false);
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [roleParam, setRoleParam] = useState<Param[]>([]);

  const avatarLetter = useMemo(() => {
    const str = user?.fullname || user?.username || "U";
    return str.charAt(0).toUpperCase();
  }, [user]);

  const isActive = useMemo(() => {
    return user?.isActive ? ACTIVE : INACTIVE;
  }, [user]);

  const fetchRoleParams = async () => {
    // Using static param for now — replace with API call if needed
    const { data, error } = await Promise.resolve(
      {
        data: ROLE_PARAM,
        error: null,
      }
    );

    if (error) {
      console.error("Service Type params fetch error:", error)
    }

    if (data) {
      setRoleParam(data);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    const { data, error } = await supabase
      .rpc("get_all_users")
      .eq("id", userId)
      .limit(1);

    if (error) {
      console.error("Users fetch error:", error.message);
    }

    if (data.length > 0) {
      const mapped: User = {
        id: data[0].id,
        username: data[0].username,
        fullname: data[0].fullname,
        email: data[0].email ?? undefined,
        phone: data[0].phone_no ? `+${data[0].phone_no}` : undefined,
        role: data[0].role,
        isActive: data[0].status === ACTIVE,
      };
      setUser(mapped);
    }
  };

  useEffect(() => {
    fetchRoleParams();
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);

      try {
        await fetchUserDetail(id);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (!user && !loading) return (
    <EmptyState title="User Tidak Ditemukan" description="User dengan ID tersebut tidak tersedia." />
  );

  if (!user) return null;

  return (
    <>
      <LoadingOverlay loading={loading} />

      <div className="min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 md:max-w-6xl md:mx-auto md:w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">User Detail</h1>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-lg border bg-background p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-lg">
                      {avatarLetter}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.fullname}</p>
                    <p className="text-xs text-medium">{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center px-2">
                  <StatusBar status={isActive} />
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-start gap-2">
                  <div className="flex gap-2 items-center justify-center border rounded-lg px-3 py-2 ">
                    <span className="text-xs font-medium">
                      {roleParam.find((param) => param.name === user.role)?.description || user.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SectionItem label="Email" value={user.email} />
                  <SectionItem label="No Telepon" value={user.phone} />
                </div>

                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
                  <EditUserDialog user={user} onSave={() => fetchUserDetail(id!)} />
                  <ChangePasswordDialog user={user} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

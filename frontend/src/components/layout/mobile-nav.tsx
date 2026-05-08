import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  BookOpen,
  Heart,
  MoreHorizontal,
  Users,
  Settings2,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/lib/api/auth";
import { UserAvatar } from "@/components/layout/user-menu";

const primaryTabs = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, exact: true },
  { label: "Collection", to: "/humidors", icon: Boxes, exact: false },
  { label: "Journal", to: "/sessions", icon: BookOpen, exact: false },
  { label: "Wishlist", to: "/wishlist", icon: Heart, exact: false },
];

function tabActive(pathname: string, to: string, exact: boolean) {
  if (exact) return pathname === to;
  const collectionPaths = ["/humidors", "/cigars", "/inventory"];
  if (to === "/humidors") return collectionPaths.some((p) => pathname.startsWith(p));
  return pathname.startsWith(to);
}

export function MobileNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { user, refreshToken, clear } = useAuthStore();
  const displayName = user?.display_name || user?.username || "User";

  async function handleLogout() {
    setSheetOpen(false);
    if (refreshToken) {
      try { await logout(refreshToken); } catch { /* best-effort */ }
    }
    clear();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  }

  const socialPaths = ["/swaps", "/guests"];
  const adminPaths = ["/admin/community", "/admin/settings"];
  const moreActive =
    socialPaths.some((p) => pathname.startsWith(p)) ||
    adminPaths.some((p) => pathname.startsWith(p));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {primaryTabs.map((tab) => {
            const active = tabActive(pathname, tab.to, tab.exact);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-colors min-w-0",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-colors",
              moreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-serif text-left">More</SheetTitle>
          </SheetHeader>

          <div className="space-y-1">
            <Link
              to="/swaps"
              onClick={() => setSheetOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                socialPaths.some((p) => pathname.startsWith(p))
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Users className="h-5 w-5" />
              Social
            </Link>

            {user?.is_admin && (
              <Link
                to="/admin/community"
                onClick={() => setSheetOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  adminPaths.some((p) => pathname.startsWith(p))
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings2 className="h-5 w-5" />
                Admin
              </Link>
            )}
          </div>

          <div className="mt-4 border-t pt-4 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2">
              <UserAvatar className="h-8 w-8" />
              <span className="text-sm font-medium">{displayName}</span>
            </div>
            <Link
              to="/admin/settings"
              onClick={() => setSheetOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

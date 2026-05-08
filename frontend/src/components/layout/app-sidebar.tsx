import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  BookOpen,
  Heart,
  Users,
  Settings2,
  Package,
  ClipboardList,
  ArrowLeftRight,
  UserCheck,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu, UserAvatar } from "@/components/layout/user-menu";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const topNavItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, exact: true },
  { label: "Journal", to: "/sessions", icon: BookOpen, exact: false },
  { label: "Wishlist", to: "/wishlist", icon: Heart, exact: false },
];

const collectionItems = [
  { label: "Humidors", to: "/humidors", icon: Boxes },
  { label: "Cigars", to: "/cigars", icon: Package },
  { label: "Inventory", to: "/inventory", icon: ClipboardList },
];

const socialItems = [
  { label: "Swaps", to: "/swaps", icon: ArrowLeftRight },
  { label: "Guests", to: "/guests", icon: UserCheck },
];

const adminItems = [
  { label: "Community Data", to: "/admin/community", icon: ShieldCheck },
  { label: "Settings", to: "/admin/settings", icon: SlidersHorizontal },
];

function routeActive(pathname: string, to: string, exact: boolean) {
  if (exact) return pathname === to;
  return pathname.startsWith(to);
}

function NavTooltip({
  label,
  isCollapsed,
  children,
}: {
  label: string;
  isCollapsed: boolean;
  children: React.ReactNode;
}) {
  if (!isCollapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.display_name || user?.username || "User";
  const isCollapsed = state === "collapsed";

  const collectionOpen = collectionItems.some((i) => pathname.startsWith(i.to));
  const socialOpen = socialItems.some((i) => pathname.startsWith(i.to));
  const adminOpen = adminItems.some((i) => pathname.startsWith(i.to));

  const [colOpen, setColOpen] = useState(collectionOpen);
  const [socOpen, setSocOpen] = useState(socialOpen);
  const [admOpen, setAdmOpen] = useState(adminOpen);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <span
          className={cn(
            "font-serif font-bold text-sidebar-primary",
            isCollapsed ? "text-xl text-center block" : "text-xl"
          )}
        >
          {isCollapsed ? "H" : "HerfBook"}
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Top-level items */}
              {topNavItems.map((item) => {
                const active = routeActive(pathname, item.to, item.exact);
                return (
                  <SidebarMenuItem key={item.to}>
                    <NavTooltip label={item.label} isCollapsed={isCollapsed}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </NavTooltip>
                  </SidebarMenuItem>
                );
              })}

              {/* Collection */}
              <Collapsible open={colOpen} onOpenChange={setColOpen}>
                <SidebarMenuItem>
                  <NavTooltip label="Collection" isCollapsed={isCollapsed}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={collectionOpen}>
                        <Boxes />
                        <span>Collection</span>
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform",
                            colOpen && "rotate-180"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </NavTooltip>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {collectionItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.to}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname.startsWith(sub.to)}
                          >
                            <Link to={sub.to}>
                              <sub.icon className="h-3.5 w-3.5" />
                              <span>{sub.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Social */}
              <Collapsible open={socOpen} onOpenChange={setSocOpen}>
                <SidebarMenuItem>
                  <NavTooltip label="Social" isCollapsed={isCollapsed}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={socialOpen}>
                        <Users />
                        <span>Social</span>
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform",
                            socOpen && "rotate-180"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </NavTooltip>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {socialItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.to}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname.startsWith(sub.to)}
                          >
                            <Link to={sub.to}>
                              <sub.icon className="h-3.5 w-3.5" />
                              <span>{sub.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Admin — only for admins */}
              {user?.is_admin && (
                <Collapsible open={admOpen} onOpenChange={setAdmOpen}>
                  <SidebarMenuItem>
                    <NavTooltip label="Admin" isCollapsed={isCollapsed}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={adminOpen}>
                          <Settings2 />
                          <span>Admin</span>
                          <ChevronDown
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform",
                              admOpen && "rotate-180"
                            )}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </NavTooltip>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {adminItems.map((sub) => (
                          <SidebarMenuSubItem key={sub.to}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname.startsWith(sub.to)}
                            >
                              <Link to={sub.to}>
                                <sub.icon className="h-3.5 w-3.5" />
                                <span>{sub.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <UserMenu>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <UserAvatar className="h-7 w-7 shrink-0" />
            {!isCollapsed && (
              <span className="truncate font-medium text-sidebar-foreground">
                {displayName}
              </span>
            )}
          </button>
        </UserMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

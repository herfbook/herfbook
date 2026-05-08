import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserMenu, UserAvatar } from "@/components/layout/user-menu";
import { usePageMetaContext } from "@/components/layout/page-title-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import React from "react";

export function TopBar() {
  const { meta } = usePageMetaContext();
  const { title, breadcrumbs } = meta;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
      {/* Sidebar trigger — desktop only */}
      <div className="hidden md:flex">
        <SidebarTrigger />
      </div>

      {/* Title + breadcrumbs */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.to ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="truncate text-base font-semibold leading-none">{title}</h1>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search — desktop only, disabled placeholder */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-48 h-8 text-sm"
                placeholder="Search…"
                disabled
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>

        {/* Search icon — mobile only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" disabled>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>

        <ThemeToggle />

        <UserMenu>
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserAvatar className="h-7 w-7" />
            <span className="sr-only">User menu</span>
          </Button>
        </UserMenu>
      </div>
    </header>
  );
}

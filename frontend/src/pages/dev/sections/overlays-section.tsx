import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageSection } from "@/components/layout/page-section";

export function OverlaysSection() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Overlays</h2>

      <div className="flex flex-wrap gap-3">
        {/* Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Swap List</DialogTitle>
              <DialogDescription>
                Make this cigar available for trading with other members.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Padrón 1964 Exclusivo Natural · 12 sticks in stock
            </p>
            <DialogFooter>
              <Button variant="outline" type="button">Cancel</Button>
              <Button type="button">Add to Swap List</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Quick Log Session</SheetTitle>
              <SheetDescription>
                Log a quick smoking session without full tasting notes.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 text-sm text-muted-foreground">
              Session form fields would go here…
            </div>
          </SheetContent>
        </Sheet>

        {/* Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Dropdown Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit cigar</DropdownMenuItem>
            <DropdownMenuItem>Move to humidor</DropdownMenuItem>
            <DropdownMenuItem>Log session</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Remove from collection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Aging Calculator</p>
              <p className="text-xs text-muted-foreground">
                This cigar has been resting in your humidor for 84 days.
                Optimal aging for this blend: 6–12 months.
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
              <span className="sr-only">Info</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ring gauge: 52 · Length: 6⅛″</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </PageSection>
  );
}

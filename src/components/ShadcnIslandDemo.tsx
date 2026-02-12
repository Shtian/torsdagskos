import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";

export default function ShadcnIslandDemo() {
  const [selection, setSelection] = useState("ready");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <Card data-test-id="shadcn-island" data-hydrated={isHydrated ? "true" : "false"} className="mb-6">
      <CardHeader>
        <CardTitle>shadcn Interactive Overlay Primitives</CardTitle>
        <CardDescription>
          React island demonstrating Dialog, DropdownMenu, Tabs, and other
          shadcn components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs Demo */}
        <Tabs defaultValue="overview" data-test-id="tabs-demo">
          <TabsList>
            <TabsTrigger value="overview" data-test-id="tab-trigger-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="components" data-test-id="tab-trigger-components">
              Components
            </TabsTrigger>
            <TabsTrigger value="interactions" data-test-id="tab-trigger-interactions">
              Interactions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" data-test-id="tab-content-overview" className="mt-4">
            <p className="m-0 text-sm text-(--color-text-secondary)">
              This demo showcases Dialog, DropdownMenu, and Tabs primitives from
              shadcn, integrated as React islands in an Astro application.
            </p>
          </TabsContent>
          <TabsContent value="components" data-test-id="tab-content-components" className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" data-test-id="badge-default">
                Default Badge
              </Badge>
              <Badge variant="secondary" data-test-id="badge-secondary">
                Secondary
              </Badge>
              <Badge variant="outline" data-test-id="badge-outline">
                Outline
              </Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </TabsContent>
          <TabsContent value="interactions" data-test-id="tab-content-interactions" className="mt-4 space-y-3">
            {/* Dialog Demo */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-test-id="dialog-trigger">
                  Open Dialog
                </Button>
              </DialogTrigger>
              <DialogContent data-test-id="dialog-content">
                <DialogHeader>
                  <DialogTitle data-test-id="dialog-title">
                    Example Dialog
                  </DialogTitle>
                  <DialogDescription data-test-id="dialog-description">
                    This is a modal dialog demonstrating keyboard navigation and
                    overlay behavior. Press Escape to close.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-(--color-text-secondary)">
                    Dialog content goes here. You can place forms, confirmations,
                    or any interactive content.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-test-id="dialog-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setDialogOpen(false)}
                    data-test-id="dialog-confirm"
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* DropdownMenu Demo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-test-id="dropdown-trigger">
                  Open Dropdown Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-test-id="dropdown-content">
                <DropdownMenuLabel>Menu Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-test-id="dropdown-item-view">
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem data-test-id="dropdown-item-edit">
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  data-test-id="dropdown-item-delete"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsContent>
        </Tabs>

        <Separator data-test-id="separator" />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <p className="m-0 text-sm text-(--color-text-secondary)">
            Form controls with selection state
          </p>
          <Select value={selection} onValueChange={setSelection}>
            <SelectTrigger aria-label="Shadcn status" className="w-44">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button">
            Shadcn {selection === "ready" ? "Ready" : "Configured"}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
} from "@/components/ui";

export default function ShadcnIslandDemo() {
  const [selection, setSelection] = useState("ready");
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <Card data-test-id="shadcn-island" className="mb-6">
      <CardHeader>
        <CardTitle>shadcn Surface & Feedback Primitives</CardTitle>
        <CardDescription>
          React island demonstrating Card, Badge, Separator, and Skeleton
          components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Separator />

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSkeleton(!showSkeleton)}
            data-test-id="toggle-skeleton"
          >
            {showSkeleton ? "Hide" : "Show"} Skeleton Loading State
          </Button>
          {showSkeleton && (
            <div className="space-y-2" data-test-id="skeleton-container">
              <Skeleton className="h-4 w-full" data-test-id="skeleton-line-1" />
              <Skeleton className="h-4 w-3/4" data-test-id="skeleton-line-2" />
              <Skeleton className="h-4 w-1/2" data-test-id="skeleton-line-3" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

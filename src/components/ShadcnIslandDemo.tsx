import { useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

export default function ShadcnIslandDemo() {
  const [selection, setSelection] = useState("ready");

  return (
    <div
      data-test-id="shadcn-island"
      className="mb-6 grid gap-3 rounded-lg border border-(--color-border) bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
    >
      <p className="m-0 text-sm text-(--color-text-secondary)">
        React island rendered with shadcn scaffold.
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
      <Button type="button">Shadcn {selection === "ready" ? "Ready" : "Configured"}</Button>
    </div>
  );
}

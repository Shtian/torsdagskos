import { Button } from "@/components/ui/button";

export default function ShadcnIslandDemo() {
  return (
    <div
      data-test-id="shadcn-island"
      className="mb-6 flex items-center justify-between rounded-lg border border-(--color-border) bg-white p-4"
    >
      <p className="m-0 text-sm text-(--color-text-secondary)">
        React island rendered with shadcn scaffold.
      </p>
      <Button type="button">Shadcn Ready</Button>
    </div>
  );
}

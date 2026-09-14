import { FileBox } from "lucide-react";
import type { ReactNode } from "react";
import type { SaveView } from "../save/view";

/** Full-width bars whose content lines up with the page column. */
function Bar({ gutter, className, children }: { gutter: number; className: string; children: ReactNode }) {
  return (
    <div className={className} style={{ paddingInline: gutter }}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6">{children}</div>
    </div>
  );
}

export function TitleBar({ gutter, fileName, children }: { gutter: number; fileName: string | undefined; children: ReactNode }) {
  return (
    <Bar gutter={gutter} className="border-b border-border bg-card py-1.5 text-card-foreground">
      <FileBox size={15} className="text-primary" />
      <span className="text-strong-foreground">gbfr-save-editor</span>
      <span className="text-subtle-foreground">— {fileName ?? "no file"}</span>
      <div className="ml-auto flex gap-1">{children}</div>
    </Bar>
  );
}

export function StatusBar({ gutter, view }: { gutter: number; view: SaveView | undefined }) {
  return (
    <Bar gutter={gutter} className="bg-status py-0.5 text-[12px] text-status-foreground">
      {view ? (
        <>
          <span>slot data v{view.slotVersion ?? "?"}</span>
          <span>{view.characters.length} characters</span>
          <span className={view.unresolved ? "font-bold" : ""}>{view.unresolved} unresolved keys</span>
        </>
      ) : (
        <span>no file</span>
      )}
      <span className="ml-auto">read-only</span>
    </Bar>
  );
}

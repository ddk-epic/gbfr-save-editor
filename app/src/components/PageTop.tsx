import type { ReactNode } from "react";

/** Breadcrumbs and the page header. Sticky as one block. */
export function PageTop({
  crumbs,
  title,
  actions,
  onRoot,
  children,
}: {
  crumbs: string[];
  title: string;
  actions?: ReactNode;
  onRoot: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-3 border-b border-border bg-background/95 px-3 pb-3 backdrop-blur">
      <div className="flex gap-1.5 pt-6 text-subtle-foreground">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex gap-1.5">
            {i > 0 && <span className="text-faint-foreground">/</span>}
            {i === 0 ? (
              <button onClick={onRoot} className="hover:text-strong-foreground">{crumb}</button>
            ) : (
              <span className={i === crumbs.length - 1 ? "text-foreground" : ""}>{crumb}</span>
            )}
          </span>
        ))}
      </div>
      <div className="flex items-baseline gap-4 pt-1">
        <h1 className="text-lg text-strong-foreground">{title}</h1>
        {actions}
      </div>
      {children && <div className="pt-3">{children}</div>}
    </div>
  );
}

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
    <div
      data-page-top
      className="sticky top-0 z-100 -mx-3 border-b border-border bg-background px-3 pb-3"
    >
      <div className="flex gap-1.5 pt-6 text-[13px] text-subtle-foreground">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex gap-1.5">
            {i > 0 && <span className="text-faint-foreground">/</span>}
            {i === 0 ? (
              <button onClick={onRoot} className="hover:text-strong-foreground">
                {crumb}
              </button>
            ) : (
              <span
                className={i === crumbs.length - 1 ? "text-foreground" : ""}
              >
                {crumb}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="flex items-baseline gap-4 pt-1">
        <h1 className="text-lg text-strong-foreground">{title}</h1>
        {actions && <div className="ml-auto flex gap-4">{actions}</div>}
      </div>
      {children && <div className="pt-3">{children}</div>}
    </div>
  );
}

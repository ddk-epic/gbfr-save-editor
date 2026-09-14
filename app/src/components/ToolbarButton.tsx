import type { ButtonHTMLAttributes } from "react";

export function ToolbarButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex items-center gap-1 rounded-sm px-2 py-0.5 hover:bg-accent hover:text-accent-foreground disabled:opacity-30 ${className}`}
    />
  );
}

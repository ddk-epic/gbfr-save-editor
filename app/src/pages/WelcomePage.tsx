import { Upload } from "lucide-react";
import { useState } from "react";
import { NEWS } from "../content";

export function WelcomePage({
  loadError,
  onPick,
  onFile,
}: {
  loadError: string | undefined;
  onPick: () => void;
  onFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="py-6">
      <h1 className="text-2xl text-strong-foreground">Granblue Fantasy: Relink save editor</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <button
            onClick={onPick}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) onFile(file);
            }}
            className={`flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed py-8 ${
              dragging ? "border-primary text-primary" : "border-input text-muted-foreground hover:border-primary hover:text-strong-foreground"
            }`}
          >
            <Upload size={20} />
            Drop SaveData1.dat here, or click to choose it
          </button>
          {loadError && <p className="mt-2 text-destructive">Rejected: {loadError}</p>}
        </div>
        <div>
          <h2 className="mb-3 text-[11px] tracking-widest text-subtle-foreground uppercase">What's new</h2>
          <ul className="space-y-4">
            {NEWS.map((item) => (
              <li key={item.title}>
                <span className="text-primary">{item.date}</span> <span className="text-strong-foreground">{item.title}</span>
                <p className="font-sans text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

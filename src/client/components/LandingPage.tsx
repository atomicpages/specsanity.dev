import { useSetAtom } from "jotai";
import {
  ArrowRight,
  FileText,
  FileUp,
  Link2,
  Loader2,
  Type,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import { inputModeAtom, specAtom, specNameAtom } from "../atoms/spec";
import { BRAND } from "../lib/brand";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

export function LandingPage() {
  const setSpec = useSetAtom(specAtom);
  const setSpecName = useSetAtom(specNameAtom);
  const setInputMode = useSetAtom(inputModeAtom);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-primary">
        {BRAND.domain}
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
        Keep your OpenAPI specs sane
      </h1>
      <p className="mt-3 text-muted-foreground">
        Lint with Redocly rules, tune severity, and share results — from a URL,
        paste, or file.
      </p>

      <div className="mt-10">
        <Tabs
          defaultValue="url"
          onValueChange={(v) => setInputMode(v as "url" | "paste" | "upload")}
        >
          <TabsList variant="default" className="grid w-full grid-cols-3">
            <TabsTrigger value="url">
              <Link2 className="size-4" aria-hidden="true" />
              URL
            </TabsTrigger>
            <TabsTrigger value="paste">
              <Type className="size-4" aria-hidden="true" />
              Paste
            </TabsTrigger>
            <TabsTrigger value="upload">
              <FileUp className="size-4" aria-hidden="true" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-4">
            <UrlTab setSpec={setSpec} setSpecName={setSpecName} />
          </TabsContent>

          <TabsContent value="paste" className="mt-4">
            <PasteTab setSpec={setSpec} setSpecName={setSpecName} />
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <UploadTab setSpec={setSpec} setSpecName={setSpecName} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function UrlTab({
  setSpec,
  setSpecName,
}: {
  setSpec: (val: string) => void;
  setSpecName: (val: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const url = (form.get("url") as string).trim();

    if (!url) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await api.api.proxy.post({ url });

      if (error || !data || data instanceof Response) {
        toast.error("Failed to fetch spec", {
          description: error ? String(error) : "Unknown error",
        });
        return;
      }

      setSpec(data.spec);
      setSpecName(url.split("/").pop() || "remote-spec");
    } catch (err) {
      toast.error("Failed to fetch spec", {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        id="spec-url"
        name="url"
        type="url"
        placeholder="https://example.com/openapi.yaml"
        aria-label="OpenAPI specification URL"
        disabled={loading}
        required
      />
      <Button type="submit" disabled={loading} size="sm">
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <>
            Load spec
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}

function PasteTab({
  setSpec,
  setSpecName,
}: {
  setSpec: (val: string) => void;
  setSpecName: (val: string) => void;
}) {
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const content = (form.get("spec") as string).trim();

    if (!content) {
      return;
    }

    setSpec(content);
    setSpecName("pasted-spec");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        id="spec-paste"
        name="spec"
        placeholder="Paste YAML or JSON here…"
        aria-label="OpenAPI specification content (YAML or JSON)"
        rows={10}
        required
        className="min-h-64 resize-y font-mono text-sm"
      />
      <Button type="submit" size="sm" className="self-end">
        Load spec
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Button>
    </form>
  );
}

function UploadTab({
  setSpec,
  setSpecName,
}: {
  setSpec: (val: string) => void;
  setSpecName: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();

      reader.onload = () => {
        const content = reader.result as string;
        setSpec(content);
        setSpecName(file.name);
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
      };

      reader.readAsText(file);
    },
    [setSpec, setSpecName],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      readFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      readFile(file);
    }
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 ${
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent"
      }`}
    >
      {fileName ? (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <FileText className="size-5" aria-hidden="true" />
          <span>{fileName}</span>
        </div>
      ) : (
        <>
          <FileUp
            className="mb-2 size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">
            Drop a .yaml, .yml, or .json file here
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            or click to browse
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".yaml,.yml,.json"
        aria-label="Upload OpenAPI specification file (.yaml, .yml, or .json)"
        onChange={handleFileChange}
        className="sr-only"
      />
    </label>
  );
}

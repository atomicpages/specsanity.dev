import { useSetAtom } from "jotai";
import { WrapText } from "lucide-react";
import { lazy, Suspense, useCallback } from "react";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { formatTriggerAtom } from "../atoms/editor";
import { ConfigPanel } from "./ConfigPanel";
import { ProblemsPanel } from "./ProblemsPanel";
import { Button } from "./ui/button";

const MonacoEditor = lazy(() =>
  import("./MonacoEditor").then((m) => ({ default: m.MonacoEditor })),
);

function ResizeHandleHorizontal() {
  return (
    <PanelResizeHandle className="group relative w-0.5 bg-border transition-colors hover:bg-primary/40 data-[resize-handle-active]:bg-primary/60">
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute left-1/2 top-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border transition-colors group-hover:bg-primary/60 group-data-[resize-handle-active]:bg-primary" />
    </PanelResizeHandle>
  );
}

function ResizeHandleVertical() {
  return (
    <PanelResizeHandle className="group relative h-0.5 bg-border transition-colors hover:bg-primary/40 data-[resize-handle-active]:bg-primary/60">
      <div className="absolute inset-x-0 -top-1 -bottom-1" />
      <div className="absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border transition-colors group-hover:bg-primary/60 group-data-[resize-handle-active]:bg-primary" />
    </PanelResizeHandle>
  );
}

export function EditorView() {
  const setFormatTrigger = useSetAtom(formatTriggerAtom);

  const handleFormat = useCallback(() => {
    setFormatTrigger((n) => n + 1);
  }, [setFormatTrigger]);

  return (
    <main id="main-content" className="flex flex-1 overflow-hidden">
      <h1 className="sr-only">OpenAPI Specification Editor</h1>
      <PanelGroup orientation="vertical">
        <Panel defaultSize={70} minSize={30}>
          <PanelGroup orientation="horizontal">
            <Panel defaultSize={70} minSize={40}>
              <section
                aria-label="Specification editor"
                className="h-full flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-end border-b border-border px-2 py-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleFormat}
                    title="Format document (Shift+Alt+F)"
                  >
                    <WrapText className="size-3.5" aria-hidden="true" />
                    Format
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Loading editor…
                      </div>
                    }
                  >
                    <MonacoEditor />
                  </Suspense>
                </div>
              </section>
            </Panel>
            <ResizeHandleHorizontal />
            <Panel defaultSize={30} minSize={20}>
              <section
                aria-label="Rule configuration"
                className="h-full overflow-hidden"
              >
                <ConfigPanel />
              </section>
            </Panel>
          </PanelGroup>
        </Panel>
        <ResizeHandleVertical />
        <Panel defaultSize={30} minSize={10} collapsible>
          <section
            aria-label="Validation problems"
            className="h-full overflow-hidden"
          >
            <ProblemsPanel />
          </section>
        </Panel>
      </PanelGroup>
    </main>
  );
}

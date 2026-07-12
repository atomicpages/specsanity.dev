import { useAtomValue } from "jotai";
import { lazy, Suspense, useEffect, useRef } from "react";
import { specAtom } from "./atoms/spec";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { Toaster } from "./components/ui/sonner";
import { useShare } from "./hooks/useShare";

const EditorView = lazy(() =>
  import("./components/EditorView").then((m) => ({ default: m.EditorView })),
);

export function App() {
  const spec = useAtomValue(specAtom);
  const { restoreFromUrl } = useShare();
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    restoreFromUrl();
  }, [restoreFromUrl]);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <Header />
      {spec !== null ? (
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading editor…
            </div>
          }
        >
          <EditorView />
        </Suspense>
      ) : (
        <LandingPage />
      )}
      <Toaster />
    </div>
  );
}

import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { specAtom } from "./atoms/spec";
import { EditorView } from "./components/EditorView";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { Toaster } from "./components/ui/sonner";
import { useShare } from "./hooks/useShare";

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
      {spec !== null ? <EditorView /> : <LandingPage />}
      <Toaster />
    </div>
  );
}

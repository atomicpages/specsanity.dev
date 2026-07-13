import Editor, { type OnMount } from "@monaco-editor/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type * as Monaco from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";
import {
  formatCompleteAtom,
  formatTriggerAtom,
  goToLineAtom,
} from "../atoms/editor";
import { specAtom } from "../atoms/spec";
import { validationResultsAtom } from "../atoms/validation";
import { useTheme } from "../hooks/useTheme";
import { BRAND } from "../lib/brand";
import { formatJson, formatYaml } from "../lib/format";
import { getFriendlyMessage } from "../lib/friendly-messages";

export function MonacoEditor() {
  const [spec, setSpec] = useAtom(specAtom);
  const validationResults = useAtomValue(validationResultsAtom);
  const [goToLine, setGoToLine] = useAtom(goToLineAtom);
  const formatTrigger = useAtomValue(formatTriggerAtom);
  const { resolvedTheme } = useTheme();

  const setFormatComplete = useSetAtom(formatCompleteAtom);

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const language = spec?.trimStart().startsWith("{") ? "json" : "yaml";

  const handleChange = useCallback(
    (value: string | undefined) => {
      setSpec(value ?? null);
    },
    [setSpec],
  );

  const updateMarkers = useCallback(
    (monaco: typeof Monaco, editor: Monaco.editor.IStandaloneCodeEditor) => {
      const model = editor.getModel();
      if (!model) {
        return;
      }

      const markers: Monaco.editor.IMarkerData[] = validationResults.map(
        (problem) => {
          const friendly = getFriendlyMessage(problem.ruleId, problem.message);
          return {
            severity:
              problem.severity === "error"
                ? monaco.MarkerSeverity.Error
                : monaco.MarkerSeverity.Warning,
            message: friendly
              ? `${friendly}\n\n${problem.message} (${problem.ruleId})`
              : `${problem.message} (${problem.ruleId})`,
            startLineNumber: problem.line,
            startColumn: problem.col,
            endLineNumber: problem.endLine ?? problem.line,
            endColumn: problem.endCol ?? problem.col + 1,
          };
        },
      );

      monaco.editor.setModelMarkers(model, BRAND.slug, markers);
    },
    [validationResults],
  );

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    updateMarkers(monaco, editor);

    monaco.languages.registerDocumentFormattingEditProvider("json", {
      provideDocumentFormattingEdits(model: Monaco.editor.ITextModel) {
        const formatted = formatJson(model.getValue());
        if (!formatted) {
          return [];
        }
        return [{ range: model.getFullModelRange(), text: formatted }];
      },
    });

    monaco.languages.registerDocumentFormattingEditProvider("yaml", {
      provideDocumentFormattingEdits(model: Monaco.editor.ITextModel) {
        const formatted = formatYaml(model.getValue());
        if (!formatted) {
          return [];
        }
        return [{ range: model.getFullModelRange(), text: formatted }];
      },
    });
  };

  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      updateMarkers(monacoRef.current, editorRef.current);
    }
  }, [updateMarkers]);

  useEffect(() => {
    if (formatTrigger > 0 && editorRef.current) {
      editorRef.current
        .getAction("editor.action.formatDocument")
        ?.run()
        .then(() => setFormatComplete((n) => n + 1));
    }
  }, [formatTrigger, setFormatComplete]);

  useEffect(() => {
    if (!goToLine || !editorRef.current) {
      return;
    }

    editorRef.current.revealLineInCenter(goToLine.line);
    editorRef.current.setPosition({
      lineNumber: goToLine.line,
      column: goToLine.col,
    });
    editorRef.current.focus();
    setGoToLine(null);
  }, [goToLine, setGoToLine]);

  return (
    <div className="h-full w-full">
      <Editor
        defaultValue={spec ?? ""}
        language={language}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          ariaLabel: "OpenAPI specification editor",
          accessibilitySupport: "on",
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}

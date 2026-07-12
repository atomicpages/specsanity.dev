import { useAtom } from "jotai";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const Editor = lazy(() => import("@monaco-editor/react"));

import {
  configOverridesAtom,
  type Preset,
  presetAtom,
  rawConfigAtom,
} from "../atoms/config";
import { useTheme } from "../hooks/useTheme";
import { configToYaml, yamlToConfig } from "../lib/config-sync";
import {
  getDefaultSeverity,
  ruleCategories,
  rulesByCategory,
  type Severity,
} from "../lib/rules";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const SEVERITY_COLORS: Record<Severity, string> = {
  error: "text-destructive",
  warn: "text-amber-700 dark:text-amber-400",
  off: "text-muted-foreground",
};

function SeverityDot({ severity }: { severity: Severity }) {
  const color =
    severity === "error"
      ? "bg-destructive"
      : severity === "warn"
        ? "bg-amber-700 dark:bg-amber-400"
        : "bg-muted-foreground/40";

  return (
    <span
      className={cn("inline-block size-1.5 rounded-full", color)}
      aria-hidden="true"
    />
  );
}

const RuleRow = memo(function RuleRow({
  ruleId,
  description,
  effectiveSeverity,
  hasOverride,
  onSeverityChange,
}: {
  ruleId: string;
  description: string;
  effectiveSeverity: Severity;
  hasOverride: boolean;
  onSeverityChange: (ruleId: string, severity: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-1 mx-1 rounded-sm",
        hasOverride && "bg-accent/50 border-l-2 border-primary",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <SeverityDot severity={effectiveSeverity} />
          <span className="text-xs font-mono text-foreground truncate">
            {ruleId}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate pl-[18px]">
          {description}
        </p>
      </div>
      <Select
        value={effectiveSeverity}
        onValueChange={(val) => {
          if (val) {
            onSeverityChange(ruleId, val);
          }
        }}
      >
        <SelectTrigger
          size="sm"
          aria-label={`Severity for ${ruleId}`}
          className={cn(
            "w-[68px] h-6 text-[11px] shrink-0",
            SEVERITY_COLORS[effectiveSeverity],
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="error">error</SelectItem>
          <SelectItem value="warn">warn</SelectItem>
          <SelectItem value="off">off</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

export function ConfigPanel() {
  const [preset, setPreset] = useAtom(presetAtom);
  const [overrides, setOverrides] = useAtom(configOverridesAtom);
  const [rawConfig, setRawConfig] = useAtom(rawConfigAtom);
  const { resolvedTheme } = useTheme();

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [yamlError, setYamlError] = useState(false);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    setRawConfig(configToYaml(preset, overrides));
  }, [preset, overrides, setRawConfig]);

  const handlePresetChange = useCallback(
    (value: string) => {
      setPreset(value as Preset);
      setOverrides({});
    },
    [setPreset, setOverrides],
  );

  const handleSeverityChange = useCallback(
    (ruleId: string, severity: string) => {
      const defaultSev = getDefaultSeverity(preset, ruleId);
      setOverrides((prev: Record<string, string>) => {
        const next = { ...prev };
        if (severity === defaultSev) {
          delete next[ruleId];
        } else {
          next[ruleId] = severity;
        }
        return next;
      });
    },
    [preset, setOverrides],
  );

  const handleReset = useCallback(() => {
    setOverrides({});
  }, [setOverrides]);

  const handleRawChange = useCallback(
    (value: string | undefined) => {
      const val = value ?? "";
      setRawConfig(val);
      const parsed = yamlToConfig(val);
      if (parsed) {
        setYamlError(false);
        skipSyncRef.current = true;
        setPreset(parsed.preset);
        setOverrides(parsed.overrides);
      } else if (val.trim().length > 0) {
        setYamlError(true);
      } else {
        setYamlError(false);
      }
    },
    [setRawConfig, setPreset, setOverrides],
  );

  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Configuration
        </span>
      </div>

      <Tabs defaultValue={0} className="flex-1 min-h-0">
        <div className="px-3 pt-2 shrink-0">
          <TabsList variant="default" className="grid w-full grid-cols-2">
            <TabsTrigger value={0} className="text-xs">
              Rules
            </TabsTrigger>
            <TabsTrigger value={1} className="text-xs">
              Raw Config
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={0} className="flex-1 min-h-0 flex flex-col">
          <div className="px-3 py-2 space-y-2 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="preset-select"
                className="text-xs text-muted-foreground"
              >
                Preset
              </Label>
              {hasOverrides && (
                <Button variant="ghost" size="xs" onClick={handleReset}>
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Reset
                </Button>
              )}
            </div>
            <Select
              value={preset}
              onValueChange={(value) => {
                if (value) {
                  handlePresetChange(value);
                }
              }}
            >
              <SelectTrigger id="preset-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="recommended-strict">Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="py-1">
              {ruleCategories.map((category) => {
                const rules = rulesByCategory[category];
                const isCollapsed = collapsedCategories.has(category);

                return (
                  <div key={category}>
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-2.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-2.5" aria-hidden="true" />
                      )}
                      {category}
                      <Badge
                        variant="secondary"
                        className="ml-auto h-4 px-1.5 text-[10px]"
                      >
                        {rules.length}
                      </Badge>
                    </button>

                    {!isCollapsed && (
                      <div className="pb-1">
                        {rules.map((rule) => (
                          <RuleRow
                            key={rule.id}
                            ruleId={rule.id}
                            description={rule.description}
                            effectiveSeverity={
                              (overrides[rule.id] ??
                                getDefaultSeverity(preset, rule.id)) as Severity
                            }
                            hasOverride={rule.id in overrides}
                            onSeverityChange={handleSeverityChange}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value={1} className="flex-1 min-h-0 flex flex-col">
          {yamlError && (
            <div
              role="alert"
              className="px-3 py-1.5 text-xs text-destructive bg-destructive/10 border-b border-destructive/20 shrink-0"
            >
              Invalid YAML syntax
            </div>
          )}
          <div className="flex-1 min-h-0">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Loading editor…
                </div>
              }
            >
              <Editor
                height="100%"
                language="yaml"
                theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
                value={rawConfig}
                onChange={handleRawChange}
                options={{
                  ariaLabel: "Redocly configuration editor",
                  accessibilitySupport: "on",
                  fontSize: 12,
                  minimap: { enabled: false },
                  lineNumbers: "off",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 8, bottom: 8 },
                  renderLineHighlight: "none",
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    vertical: "auto",
                    horizontal: "hidden",
                  },
                }}
              />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

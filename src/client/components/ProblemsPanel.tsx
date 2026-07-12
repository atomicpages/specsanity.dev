import { useAtomValue, useSetAtom } from "jotai";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { memo, type ReactNode, useCallback, useMemo, useState } from "react";
import { goToLineAtom } from "../atoms/editor";
import {
  hasValidatedAtom,
  isValidatingAtom,
  type ValidationProblem,
  validationResultsAtom,
} from "../atoms/validation";

type SeverityFilter = "all" | "error" | "warn";

export function ProblemsPanel() {
  const results = useAtomValue(validationResultsAtom);
  const isValidating = useAtomValue(isValidatingAtom);
  const hasValidated = useAtomValue(hasValidatedAtom);
  const setGoToLine = useSetAtom(goToLineAtom);
  const [filter, setFilter] = useState<SeverityFilter>("all");

  const counts = useMemo(() => {
    const errors = results.filter((r) => r.severity === "error").length;
    const warnings = results.filter((r) => r.severity === "warn").length;
    return { errors, warnings };
  }, [results]);

  const filtered = useMemo(() => {
    if (filter === "all") {
      return results;
    }
    return results.filter((r) => r.severity === filter);
  }, [results, filter]);

  const handleRowClick = useCallback(
    (problem: ValidationProblem) => {
      setGoToLine({ line: problem.line, col: problem.col });
    },
    [setGoToLine],
  );

  return (
    <div className="flex h-full flex-col border-t border-border bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Problems
        </span>

        <div aria-live="polite" className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-destructive">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            {counts.errors} errors
          </span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            {counts.warnings} warnings
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {(["all", "error", "warn"] as SeverityFilter[]).map((value) => (
            <FilterButton
              key={value}
              active={filter === value}
              onClick={() => setFilter(value)}
              label={
                value === "all"
                  ? "All"
                  : value === "error"
                    ? "Errors"
                    : "Warnings"
              }
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isValidating && (
          <EmptyState
            icon={<Loader2 className="size-5 animate-spin" />}
            text="Validating…"
          />
        )}

        {!isValidating && results.length === 0 && !hasValidated && (
          <EmptyState
            icon={<CheckCircle2 className="size-6 opacity-50" />}
            text="Click Validate to lint your spec."
          />
        )}

        {!isValidating && results.length === 0 && hasValidated && (
          <EmptyState
            icon={
              <CheckCircle2 className="size-6 text-green-600 dark:text-green-500" />
            }
            text="No problems found."
          />
        )}

        {!isValidating && filtered.length > 0 && (
          <ul className="divide-y divide-border">
            {filtered.map((problem) => (
              <ProblemRow
                key={`${problem.ruleId}-${problem.line}-${problem.col}-${problem.message}`}
                problem={problem}
                onClick={handleRowClick}
              />
            ))}
          </ul>
        )}

        {!isValidating && results.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={
              <CheckCircle2 className="size-6 text-green-600 dark:text-green-500" />
            }
            text={`No ${filter} problems found.`}
          />
        )}
      </div>
    </div>
  );
}

const ProblemRow = memo(function ProblemRow({
  problem,
  onClick,
}: {
  problem: ValidationProblem;
  onClick: (problem: ValidationProblem) => void;
}) {
  return (
    <li className="flex items-start gap-2 px-3 py-2 text-sm">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-2 text-left transition-colors hover:bg-accent rounded-sm -m-1 p-1"
        onClick={() => onClick(problem)}
      >
        {problem.severity === "error" ? (
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
        ) : (
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
            aria-hidden="true"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-foreground">{problem.message}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {problem.line}:{problem.col}
          </div>
        </div>
      </button>

      <a
        href={`https://redocly.com/docs/cli/rules/${problem.ruleId}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${problem.ruleId} documentation (opens in new tab)`}
        className="mt-0.5 flex shrink-0 items-center gap-0.5 font-mono text-xs text-primary hover:underline"
      >
        {problem.ruleId}
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
    </li>
  );
});

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rounded px-2 py-0.5 text-xs capitalize transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}

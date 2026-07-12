import { useAtomValue, useSetAtom } from "jotai";
import {
  Check,
  Loader2,
  Monitor,
  Moon,
  Play,
  Plus,
  Save,
  Share2,
  Sun,
} from "lucide-react";
import { useCallback } from "react";
import { configOverridesAtom } from "../atoms/config";
import { isOwnerAtom, savedSnapshotAtom, shareIdAtom } from "../atoms/share";
import { hasSpecAtom, specAtom, specNameAtom } from "../atoms/spec";
import type { Theme } from "../atoms/theme";
import { hasValidatedAtom, validationResultsAtom } from "../atoms/validation";
import { useShare } from "../hooks/useShare";
import { useTheme } from "../hooks/useTheme";
import { useValidation } from "../hooks/useValidation";
import { BRAND } from "../lib/brand";
import { BrandLogo } from "./BrandLogo";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const hasSpec = useAtomValue(hasSpecAtom);
  const specName = useAtomValue(specNameAtom);
  const setSpec = useSetAtom(specAtom);
  const setSpecName = useSetAtom(specNameAtom);
  const setValidationResults = useSetAtom(validationResultsAtom);
  const setShareId = useSetAtom(shareIdAtom);
  const setOverrides = useSetAtom(configOverridesAtom);
  const setHasValidated = useSetAtom(hasValidatedAtom);
  const setIsOwner = useSetAtom(isOwnerAtom);
  const setSnapshot = useSetAtom(savedSnapshotAtom);
  const { validate, isValidating } = useValidation();
  const { share, save, isSharing, isSaving, canSave, isDirty } = useShare();

  const handleNewSpec = useCallback(() => {
    setSpec(null);
    setSpecName(null);
    setValidationResults([]);
    setHasValidated(false);
    setShareId(null);
    setIsOwner(false);
    setSnapshot(null);
    setOverrides({});

    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, [
    setSpec,
    setSpecName,
    setValidationResults,
    setHasValidated,
    setShareId,
    setIsOwner,
    setSnapshot,
    setOverrides,
  ]);

  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <button
        type="button"
        onClick={handleNewSpec}
        className="flex min-w-0 items-center gap-2 rounded-md transition-colors hover:opacity-80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
        aria-label={`${BRAND.name} home`}
      >
        <BrandLogo className="size-5" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          <span className="text-muted-foreground">Spec </span>
          <span className="text-primary">Sanity</span>
        </span>
        {hasSpec && specName && (
          <span className="ml-3 truncate text-xs text-muted-foreground">
            {specName}
          </span>
        )}
      </button>

      <div className="flex items-center gap-1.5">
        {hasSpec && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={validate}
              disabled={isValidating}
            >
              {isValidating ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="size-3.5" aria-hidden="true" />
              )}
              Validate
            </Button>
            {canSave ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={save}
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="size-3.5" aria-hidden="true" />
                  )}
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={share}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Share2 className="size-3.5" aria-hidden="true" />
                  )}
                  Share New
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={share}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Share2 className="size-3.5" aria-hidden="true" />
                )}
                Share
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleNewSpec}>
              <Plus className="size-3.5" aria-hidden="true" />
              New Spec
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Change theme">
                {resolvedTheme === "dark" ? (
                  <Moon className="size-4" aria-hidden="true" />
                ) : (
                  <Sun className="size-4" aria-hidden="true" />
                )}
              </Button>
            }
          />
          <DropdownMenuContent>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {option.label}
                  {theme === option.value && (
                    <Check className="ml-auto size-4" aria-hidden="true" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

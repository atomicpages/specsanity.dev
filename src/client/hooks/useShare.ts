import { useAtomValue, useSetAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import { configOverridesAtom, presetAtom } from "../atoms/config";
import {
  canSaveAtom,
  isOwnerAtom,
  isSavingAtom,
  isSharingAtom,
  shareIdAtom,
} from "../atoms/share";
import { specAtom } from "../atoms/spec";
import { presets } from "../lib/presets";

export function useShare() {
  const isSharing = useAtomValue(isSharingAtom);
  const isSaving = useAtomValue(isSavingAtom);
  const canSave = useAtomValue(canSaveAtom);

  const setSharing = useSetAtom(isSharingAtom);
  const setSaving = useSetAtom(isSavingAtom);
  const setShareId = useSetAtom(shareIdAtom);
  const setIsOwner = useSetAtom(isOwnerAtom);
  const setSpec = useSetAtom(specAtom);
  const setPreset = useSetAtom(presetAtom);
  const setOverrides = useSetAtom(configOverridesAtom);

  const share = useAtomCallback(
    useCallback(
      async (get) => {
        const spec = get(specAtom);
        if (!spec) {
          return;
        }

        const preset = get(presetAtom);
        const overrides = get(configOverridesAtom);

        setSharing(true);

        try {
          const config = { ...presets[preset], rules: overrides };
          const { data, error } = await api.api.share.post({ spec, config });

          if (error || !data || data instanceof Response) {
            toast.error("Failed to create share link");
            return;
          }

          const id = (data as { id: string }).id;
          setShareId(id);
          setIsOwner(true);

          const url = `${window.location.origin}/s/${id}`;
          window.history.pushState(null, "", `/s/${id}`);

          try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard", { description: url });
          } catch {
            toast.success("Share link created", { description: url });
          }
        } catch {
          toast.error("Failed to create share link");
        } finally {
          setSharing(false);
        }
      },
      [setSharing, setShareId, setIsOwner],
    ),
  );

  const save = useAtomCallback(
    useCallback(
      async (get) => {
        const spec = get(specAtom);
        const id = get(shareIdAtom);
        if (!spec || !id) {
          return;
        }

        const preset = get(presetAtom);
        const overrides = get(configOverridesAtom);

        setSaving(true);

        try {
          const config = { ...presets[preset], rules: overrides };
          const { data, error } = await api.api
            .share({ id })
            .put({ spec, config });

          if (error || !data || data instanceof Response) {
            toast.error("Failed to save changes");
            return;
          }

          toast.success("Changes saved");
        } catch {
          toast.error("Failed to save changes");
        } finally {
          setSaving(false);
        }
      },
      [setSaving],
    ),
  );

  const restoreFromUrl = useCallback(async (): Promise<boolean> => {
    const match = window.location.pathname.match(/^\/s\/(.+)$/);

    if (!match) {
      return false;
    }

    const id = match[1];

    try {
      const { data, error } = await api.api.share({ id }).get();

      if (error || !data || data instanceof Response) {
        toast.error("Shared spec not found or expired");
        return false;
      }

      const shared = data as {
        spec: string;
        config: Record<string, unknown>;
        isOwner: boolean;
      };

      if (typeof shared.spec !== "string") {
        toast.error("Invalid share data");
        return false;
      }

      setSpec(shared.spec);
      setIsOwner(!!shared.isOwner);

      if (shared.config) {
        const cfg = shared.config;

        if (Array.isArray(cfg.extends) && cfg.extends.length > 0) {
          const presetName = cfg.extends[0] as string;
          if (
            presetName === "minimal" ||
            presetName === "recommended" ||
            presetName === "recommended-strict"
          ) {
            setPreset(presetName);
          }
        }

        if (
          cfg.rules &&
          typeof cfg.rules === "object" &&
          !Array.isArray(cfg.rules)
        ) {
          setOverrides(cfg.rules as Record<string, string>);
        }
      }

      setShareId(id);
      return true;
    } catch {
      toast.error("Shared spec not found or expired");
      return false;
    }
  }, [setSpec, setPreset, setOverrides, setShareId, setIsOwner]);

  return { share, save, isSharing, isSaving, canSave, restoreFromUrl };
}

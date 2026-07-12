import { X } from "lucide-react";
import { SnarkdownInReact } from "snarkdown-in-react";
// @ts-expect-error — Bun text import
import changelog from "../../../CHANGELOG.md" with { type: "text" };
import { BRAND } from "../lib/brand";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border px-6 py-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between text-xs text-muted-foreground">
        <p>
          &copy; {currentYear} {BRAND.name}
        </p>

        <nav className="flex items-center gap-2">
          <a
            href="https://github.com/densitydesign/specsanity"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>

          <span aria-hidden="true">&middot;</span>

          <Dialog>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="cursor-pointer transition-colors hover:text-foreground"
                >
                  About
                </button>
              }
            />
            <DialogContent>
              <div className="flex items-center justify-between">
                <DialogTitle>About Spec Sanity</DialogTitle>
                <DialogClose
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  }
                />
              </div>
              <DialogDescription className="mt-2">
                A simple way to check your API description.
              </DialogDescription>
              <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-foreground">
                <p>
                  An OpenAPI spec is a file that describes how an API works.
                  Spec Sanity helps you check that file before you share it.
                </p>
                <p>
                  Add your spec from a link, paste it in, or upload a file. Spec
                  Sanity checks it in your browser against common API guidelines
                  and shows anything that may need attention.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <span aria-hidden="true">&middot;</span>

          <Dialog>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="cursor-pointer transition-colors hover:text-foreground"
                >
                  Changelog
                </button>
              }
            />
            <DialogContent className="flex max-h-[80vh] flex-col">
              <div className="flex items-center justify-between">
                <DialogTitle>Changelog</DialogTitle>
                <DialogClose
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  }
                />
              </div>
              <DialogDescription className="sr-only">
                Project changelog and release notes
              </DialogDescription>
              <ScrollArea className="mt-4 flex-1 overflow-y-auto">
                <div className="changelog-content text-sm text-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_p]:my-2 [&_p]:leading-relaxed">
                  <SnarkdownInReact markdown={changelog} />
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </nav>
      </div>
    </footer>
  );
}

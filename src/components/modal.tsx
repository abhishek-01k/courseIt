"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
};

/** A centered dialog over a dimmed page. Clicking outside, Escape or × closes it. */
export default function Modal({ open, onOpenChange, title, description, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#0f1611]/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[min(480px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-card bg-surface p-[22px] text-ink shadow-[0_0_0_1px_var(--line),0_40px_80px_-30px_rgba(22,49,92,0.5)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="text-h3 font-medium">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-[0.92rem] text-ink-soft">{description}</Dialog.Description>}
            </div>
            <Dialog.Close render={<Button type="button" variant="outline" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Close" />}>
              <X aria-hidden="true" className="size-[18px]" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

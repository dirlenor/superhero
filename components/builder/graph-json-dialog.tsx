"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface GraphJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportValue: string;
  onImport: (raw: string) => void;
}

export function GraphJsonDialog({
  open,
  onOpenChange,
  exportValue,
  onImport,
}: GraphJsonDialogProps) {
  const [importValue, setImportValue] = useState("");

  useEffect(() => {
    if (!open) {
      setImportValue("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export / Import Graph JSON</DialogTitle>
          <DialogDescription>
            Save a workflow as JSON or paste JSON to restore it on the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Export JSON</Label>
            <Textarea value={exportValue} readOnly className="min-h-[300px] font-mono text-xs" />
          </div>

          <div className="space-y-2">
            <Label>Import JSON</Label>
            <Textarea
              value={importValue}
              onChange={(event) => setImportValue(event.target.value)}
              placeholder='{"nodes": [...], "edges": [...]}'
              className="min-h-[300px] font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              onImport(importValue);
              onOpenChange(false);
            }}
          >
            Apply Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

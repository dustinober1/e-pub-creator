import { useEffect, useRef } from "react";

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="shortcuts-backdrop" role="presentation" onClick={onClose}>
      <section
        className="panel shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-heading"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shortcuts-dialog-header">
          <h2 id="shortcuts-heading">Keyboard Shortcuts</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
          >
            Close
          </button>
        </div>
        <dl className="shortcuts-list">
          <div>
            <dt>Save</dt>
            <dd>
              <kbd>Ctrl/Cmd</kbd>+<kbd>S</kbd>
            </dd>
          </div>
          <div>
            <dt>Find</dt>
            <dd>
              <kbd>Ctrl/Cmd</kbd>+<kbd>F</kbd>
            </dd>
          </div>
          <div>
            <dt>Undo</dt>
            <dd>
              <kbd>Ctrl/Cmd</kbd>+<kbd>Z</kbd>
            </dd>
          </div>
          <div>
            <dt>Redo</dt>
            <dd>
              <kbd>Ctrl/Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>
            </dd>
          </div>
          <div>
            <dt>Shortcuts</dt>
            <dd>
              <kbd>Ctrl/Cmd</kbd>+<kbd>/</kbd>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

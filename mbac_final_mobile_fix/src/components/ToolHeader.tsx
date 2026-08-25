import React from 'react';

interface ToolHeaderProps {
  title: string;
  onClose: () => void;
}

export default function ToolHeader({ title, onClose }: ToolHeaderProps) {
  return (
    <div className="tool-header-inner">
      <h2 className="tool-title">{title}</h2>

      <button
        onClick={onClose}
        aria-label={`Fermer ${title}`}
        className="tool-close-button"
        type="button"
      >
        ×
      </button>
    </div>
  );
}

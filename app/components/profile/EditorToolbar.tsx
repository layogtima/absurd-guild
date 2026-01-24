import { Link } from "react-router";

interface EditorToolbarProps {
  isVisible: boolean;
}

export function EditorToolbar({ isVisible }: EditorToolbarProps) {
  if (!isVisible) return null;

  return (
    <div className="editor-toolbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-bold text-lg text-primary">🎨 Live Edit Mode</h3>
          <div className="text-sm text-secondary">
            Click on any element to edit it!
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="bg-secondary text-primary px-4 py-2 rounded-lg hover-lift border border-theme"
          >
            <i className="fas fa-eye mr-2"></i>Preview
          </Link>
        </div>
      </div>
    </div>
  );
}
import { Form, Link } from "react-router";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseUrl?: string;
  title: string;
  type: "text" | "image" | "object";
  defaultValues?: any;
  fields?: Record<string, {
    label: string;
    type: "text" | "textarea" | "url" | "number" | "file";
    placeholder?: string;
  }>;
  action: string;
  children?: React.ReactNode;
}

export function EditModal({
  isOpen,
  onClose,
  onCloseUrl,
  title,
  type,
  defaultValues = {},
  fields = {},
  action,
  children
}: EditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      {onCloseUrl && (
        <Link
          to={onCloseUrl}
          className="absolute inset-0 w-full h-full"
          aria-label="Close modal"
        />
      )}
      <div
        className="modal-content rounded-3xl max-w-2xl w-full p-8 animate-slide-up relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-jura text-3xl font-bold text-primary flex items-center gap-3">
            <i className="fas fa-edit accent-orange-text"></i>
            Edit {title}
          </h3>
          {onCloseUrl ? (
            <Link
              to={onCloseUrl}
              className="hover-lift text-secondary hover:text-primary"
            >
              <i className="fas fa-times text-2xl"></i>
            </Link>
          ) : (
            <button
              onClick={onClose}
              className="hover-lift text-secondary hover:text-primary"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          )}
        </div>

        <Form method="post" encType="multipart/form-data" className="space-y-6">
          <input type="hidden" name="_action" value={action} />

          {/* Always include all profile fields as hidden inputs */}
          {/* For displayName - only hidden if we're not editing it */}
          {(!fields?.displayName) && (
            <input type="hidden" name="displayName" value={defaultValues.displayName || ""} />
          )}

          {/* For bio - only hidden if we're not editing it */}
          {(!fields?.bio) && (
            <input type="hidden" name="bio" value={defaultValues.bio || ""} />
          )}

          {/* For avatarUrl - only hidden if we're not editing it (image type) */}
          {type !== "image" && (
            <input type="hidden" name="avatarUrl" value={defaultValues.avatarUrl || ""} />
          )}

          {/* Text editing */}
          {type === "text" && (
            <div>
              <label className="block text-sm font-bold text-primary mb-3">
                Content
              </label>
              <textarea
                name="value"
                defaultValue={defaultValues.value || ""}
                className="w-full bg-tertiary border-2 border-theme rounded-xl p-4 text-primary h-32 resize-none focus:border-orange-300 outline-none transition-all"
                placeholder={`Enter ${title.toLowerCase()}...`}
              />
            </div>
          )}

          {/* Image editing */}
          {type === "image" && (
            <>
              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-primary mb-3">
                  Upload Image
                </label>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  className="w-full bg-tertiary border-2 border-theme rounded-xl p-4 text-primary focus:border-orange-300 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                <p className="text-xs text-secondary mt-1">
                  Upload JPEG, PNG, WebP, or GIF (max 5MB)
                </p>
              </div>

              {/* URL Alternative */}
              <div>
                <label className="block text-sm font-bold text-primary mb-3">
                  Or enter image URL
                </label>
                <input
                  type="url"
                  name="avatarUrl"
                  defaultValue={defaultValues.avatarUrl || ""}
                  className="w-full bg-tertiary border-2 border-theme rounded-xl p-4 text-primary focus:border-orange-300 outline-none transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Preview */}
              {defaultValues.avatarUrl && (
                <div className="mt-4">
                  <img
                    src={defaultValues.avatarUrl}
                    className="max-w-full h-40 object-cover rounded-lg mx-auto"
                    alt="Current"
                  />
                </div>
              )}
            </>
          )}

          {/* Object editing */}
          {type === "object" && (
            <div className="space-y-4">
              {Object.entries(fields).map(([key, field]) => (
                <div key={key}>
                  <label className="block text-sm font-bold text-primary mb-2">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={key}
                      defaultValue={defaultValues[key] || ""}
                      className="w-full bg-tertiary border-2 border-theme rounded-xl p-3 text-primary h-20 resize-none focus:border-orange-300 outline-none transition-all"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "file" ? (
                    <input
                      type="file"
                      name={key}
                      accept="image/*"
                      className="w-full bg-tertiary border-2 border-theme rounded-xl p-3 text-primary focus:border-orange-300 outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={key}
                      defaultValue={field.type === "number" ? Number(defaultValues[key]) || "" : defaultValues[key] || ""}
                      className="w-full bg-tertiary border-2 border-theme rounded-xl p-3 text-primary focus:border-orange-300 outline-none transition-all"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {children}

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 accent-orange text-on-accent py-4 rounded-xl text-lg font-bold hover-lift transition-all"
            >
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </button>
            {onCloseUrl ? (
              <Link
                to={onCloseUrl}
                className="flex-1 bg-secondary text-primary py-4 rounded-xl text-lg font-bold hover-lift border border-theme transition-all text-center flex items-center justify-center"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-secondary text-primary py-4 rounded-xl text-lg font-bold hover-lift border border-theme transition-all"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </button>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}
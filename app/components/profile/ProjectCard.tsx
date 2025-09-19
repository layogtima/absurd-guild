import { Form, Link } from "react-router";
import { type Product, getStatusDisplayName } from "~/types/product";

interface ProjectCardProps {
  project: Product;
  isEditing?: boolean;
  showAdminActions?: boolean;
  mode?: 'profile' | 'showcase';
}

export function ProjectCard({
  project,
  isEditing = false,
  showAdminActions = true,
  mode = 'profile'
}: ProjectCardProps) {
  return (
    <div className="bg-secondary border-2 border-theme rounded-3xl overflow-hidden hover-lift transition-all">
      {/* Project Image */}
      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🔧
          </div>
        )}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium">
            {getStatusDisplayName(project.status)}
          </span>
        </div>
      </div>

      {/* Project Details */}
      <div className="p-6">
        <h3 className="font-jura text-2xl font-bold text-primary mb-2">
          {project.title}
        </h3>

        {project.description && (
          <p className="text-secondary leading-relaxed mb-4">
            {project.description}
          </p>
        )}

        {/* Features */}
        {project.features && (() => {
          try {
            const features = JSON.parse(project.features);
            return features.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {features.slice(0, 3).map((feature: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {features.length > 3 && (
                    <span className="text-xs text-secondary">
                      +{features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          } catch (e) {
            return null;
          }
        })()}

        {project.category && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm bg-tertiary text-secondary rounded-full">
              {project.category}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-secondary">
            Project in {getStatusDisplayName(project.status).toLowerCase()}
          </div>
          <div className="flex gap-2">
            {project.github_repo && (
              <a
                href={project.github_repo}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary text-primary px-4 py-2 rounded-lg hover-lift transition-all border border-theme"
                title="View Source"
              >
                <i className="fab fa-github"></i>
              </a>
            )}
            {project.documentation_url && (
              <a
                href={project.documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary text-primary px-4 py-2 rounded-lg hover-lift transition-all border border-theme"
                title="View Docs"
              >
                <i className="fas fa-book"></i>
              </a>
            )}
          </div>
        </div>

        {/* Admin Actions - Only show in profile mode */}
        {showAdminActions && (
          <div className="flex space-x-2 pt-4 mt-4 border-t border-theme">
            {isEditing ? (
              <Link
                to="/profile"
                className="flex-1 text-center bg-tertiary text-primary px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
            ) : (
              <Link
                to={`?edit-product=${project.id}`}
                className="flex-1 text-center bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Edit
              </Link>
            )}

            <Form method="post" className="flex-1">
              <input type="hidden" name="_action" value="deleteProduct" />
              <input type="hidden" name="productId" value={project.id} />
              <button
                type="submit"
                className="w-full text-red-600 hover:text-red-800 border px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  if (
                    !confirm(
                      `Are you sure you want to delete "${project.title}"?`
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  Link,
  useLoaderData,
  useSearchParams,
  Form,
  redirect,
  useNavigation,
} from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import {
  getProjectById,
  getProjectItems,
  addItemToProject,
  updateProjectItem,
  removeProjectItem,
  updateProject,
  getProjectLinks,
  createProjectLink,
  deleteProjectLink,
  getProjectImages,
  createProjectImage,
  deleteProjectImage,
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
} from "~/lib/workbench.server";
import { getAllItems } from "~/lib/items.server";
import { getImageUrl } from "~/lib/images.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);
  const projectId = parseInt(params.projectId || "", 10);

  if (isNaN(projectId)) {
    throw new Response("Invalid project ID", { status: 400 });
  }

  const project = await getProjectById(db, projectId);

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  // Check if user owns this project
  if (project.user_id !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  // Get project items with details
  const projectItems = await getProjectItems(db, projectId);

  // Process image URLs for items
  const projectItemsWithImages = projectItems.map((pi) => ({
    ...pi,
    item: {
      ...pi.item,
      image_url: getImageUrl(pi.item.image_key, pi.item.image_url, env),
    },
  }));

  // Get all available items for adding to project
  const allItems = await getAllItems(db);
  const allItemsWithImages = allItems.map((item) => ({
    ...item,
    image_url: getImageUrl(item.image_key, item.image_url, env),
  }));

  // Get project links, images, notes, and tasks
  const projectLinks = await getProjectLinks(db, projectId);
  const projectImages = await getProjectImages(db, projectId);
  const projectNotes = await getProjectNotes(db, projectId);
  const projectTasks = await getProjectTasks(db, projectId);

  // Process image URLs for project images
  const projectImagesWithUrls = projectImages.map((img) => ({
    ...img,
    image_url: getImageUrl(img.image_key, img.image_url, env),
  }));

  return {
    user,
    project,
    projectItems: projectItemsWithImages,
    allItems: allItemsWithImages,
    projectLinks,
    projectImages: projectImagesWithUrls,
    projectNotes,
    projectTasks,
  };
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);
  const projectId = parseInt(params.projectId || "", 10);
  const formData = await request.formData();
  const action = formData.get("_action");

  // Verify ownership
  const project = await getProjectById(db, projectId);
  if (!project || project.user_id !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  if (action === "add_item") {
    const itemId = parseInt(formData.get("item_id") as string, 10);
    const quantityNeeded = parseInt(
      formData.get("quantity_needed") as string,
      10
    );

    await addItemToProject(db, {
      project_id: projectId,
      item_id: itemId,
      quantity_needed: quantityNeeded || 1,
    });

    return redirect(`/workbench/${projectId}?success=item-added`);
  }

  if (action === "update_item") {
    const projectItemId = parseInt(formData.get("project_item_id") as string, 10);
    const quantityHave = formData.get("quantity_have");
    const itemStatus = formData.get("item_status");
    const vendor = formData.get("vendor");
    const actualCost = formData.get("actual_cost");
    const notes = formData.get("notes");

    await updateProjectItem(db, projectItemId, {
      quantity_have: quantityHave ? parseInt(quantityHave as string, 10) : undefined,
      item_status: itemStatus as string | undefined,
      vendor: vendor as string | undefined,
      actual_unit_cost: actualCost
        ? Math.round(parseFloat(actualCost as string) * 100)
        : undefined,
      notes: notes as string | undefined,
    });

    return redirect(`/workbench/${projectId}?success=item-updated`);
  }

  if (action === "remove_item") {
    const projectItemId = parseInt(formData.get("project_item_id") as string, 10);
    await removeProjectItem(db, projectItemId);
    return redirect(`/workbench/${projectId}?success=item-removed`);
  }

  if (action === "update_project") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const visibility = formData.get("visibility") as string;

    await updateProject(db, projectId, {
      title: title || undefined,
      description: description || undefined,
      status: status || undefined,
      visibility: visibility || undefined,
    });

    return redirect(`/workbench/${projectId}?success=project-updated`);
  }

  // Link actions
  if (action === "add_link") {
    const title = formData.get("title") as string;
    const url = formData.get("url") as string;
    const linkType = formData.get("link_type") as string;

    await createProjectLink(db, {
      project_id: projectId,
      title,
      url,
      link_type: linkType || undefined,
    });

    return redirect(`/workbench/${projectId}?success=link-added`);
  }

  if (action === "delete_link") {
    const linkId = parseInt(formData.get("link_id") as string, 10);
    await deleteProjectLink(db, linkId);
    return redirect(`/workbench/${projectId}?success=link-deleted`);
  }

  // Image actions
  if (action === "add_image") {
    const imageUrl = formData.get("image_url") as string;
    const caption = formData.get("caption") as string;
    const isPrimary = formData.get("is_primary") === "true";

    await createProjectImage(db, {
      project_id: projectId,
      image_url: imageUrl,
      caption: caption || undefined,
      is_primary: isPrimary,
    });

    return redirect(`/workbench/${projectId}?success=image-added`);
  }

  if (action === "delete_image") {
    const imageId = parseInt(formData.get("image_id") as string, 10);
    await deleteProjectImage(db, imageId);
    return redirect(`/workbench/${projectId}?success=image-deleted`);
  }

  // Note actions
  if (action === "add_note") {
    const content = formData.get("content") as string;
    const noteType = formData.get("note_type") as string;
    const isPinned = formData.get("is_pinned") === "true";

    await createProjectNote(db, {
      project_id: projectId,
      content,
      note_type: noteType || undefined,
      is_pinned: isPinned,
    });

    return redirect(`/workbench/${projectId}?success=note-added`);
  }

  if (action === "update_note") {
    const noteId = parseInt(formData.get("note_id") as string, 10);
    const content = formData.get("content") as string;
    const isPinned = formData.get("is_pinned") === "true";

    await updateProjectNote(db, noteId, {
      content,
      is_pinned: isPinned,
    });

    return redirect(`/workbench/${projectId}?success=note-updated`);
  }

  if (action === "delete_note") {
    const noteId = parseInt(formData.get("note_id") as string, 10);
    await deleteProjectNote(db, noteId);
    return redirect(`/workbench/${projectId}?success=note-deleted`);
  }

  // Task actions
  if (action === "add_task") {
    const title = formData.get("title") as string;

    await createProjectTask(db, {
      project_id: projectId,
      title,
    });

    return redirect(`/workbench/${projectId}?success=task-added`);
  }

  if (action === "update_task") {
    const taskId = parseInt(formData.get("task_id") as string, 10);
    const title = formData.get("title") as string;
    const status = formData.get("status") as string;

    await updateProjectTask(db, taskId, {
      title: title || undefined,
      status: status || undefined,
    });

    return redirect(`/workbench/${projectId}?success=task-updated`);
  }

  if (action === "toggle_task") {
    const taskId = parseInt(formData.get("task_id") as string, 10);
    const currentStatus = formData.get("current_status") as string;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    await updateProjectTask(db, taskId, {
      status: newStatus,
    });

    return redirect(`/workbench/${projectId}?success=task-updated`);
  }

  if (action === "delete_task") {
    const taskId = parseInt(formData.get("task_id") as string, 10);
    await deleteProjectTask(db, taskId);
    return redirect(`/workbench/${projectId}?success=task-deleted`);
  }

  return { error: "Invalid action" };
}

export default function ProjectDetailPage() {
  const { user, project, projectItems, allItems, projectLinks, projectImages, projectNotes, projectTasks } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const success = searchParams.get("success");
  const addingItem = searchParams.get("add-item") === "true";
  const addingTool = searchParams.get("add-tool") === "true";
  const editingItem = searchParams.get("edit-item");
  const editingProject = searchParams.get("edit") === "true";
  const addingLink = searchParams.get("add-link") === "true";
  const addingImage = searchParams.get("add-image") === "true";
  const addingNote = searchParams.get("add-note") === "true";
  const editingNote = searchParams.get("edit-note");
  const addingTask = searchParams.get("add-task") === "true";
  const editingTask = searchParams.get("edit-task");

  // Separate tools from parts/supplies
  const tools = projectItems.filter((pi) => pi.item.item_type === "tool");
  const bomItems = projectItems.filter((pi) => pi.item.item_type !== "tool");

  // Calculate BOM stats (excluding tools)
  const totalItems = bomItems.length;
  const itemsReady = bomItems.filter(
    (pi) => pi.quantity_have >= pi.quantity_needed
  ).length;
  const completionPercent =
    totalItems > 0 ? Math.round((itemsReady / totalItems) * 100) : 0;

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Success Messages */}
          {success && (
            <div className="mb-6 bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>
                {success === "item-added" && "Item added to project!"}
                {success === "item-updated" && "Item updated!"}
                {success === "item-removed" && "Item removed!"}
                {success === "project-updated" && "Project updated!"}
                {success === "link-added" && "Link added!"}
                {success === "link-deleted" && "Link deleted!"}
                {success === "image-added" && "Image added!"}
                {success === "image-deleted" && "Image deleted!"}
                {success === "note-added" && "Note added!"}
                {success === "note-updated" && "Note updated!"}
                {success === "note-deleted" && "Note deleted!"}
                {success === "task-added" && "Task added!"}
                {success === "task-updated" && "Task updated!"}
                {success === "task-deleted" && "Task deleted!"}
              </span>
              <Link
                to={`/workbench/${project.id}`}
                className="text-green-600 font-bold"
              >
                ✕
              </Link>
            </div>
          )}

          {/* Back Link */}
          <div className="mb-6">
            <Link
              to="/workbench"
              className="text-secondary hover:text-orange-600 transition-colors"
            >
              ← Back to Workbench
            </Link>
          </div>

          {/* Project Header */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
            {editingProject ? (
              <Form method="post" className="space-y-4">
                <input type="hidden" name="_action" value="update_project" />
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={project.title}
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={project.description || ""}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={project.status}
                      className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    >
                      <option value="planning">Planning</option>
                      <option value="prototyping">Prototyping</option>
                      <option value="testing">Testing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">
                      Visibility
                    </label>
                    <select
                      name="visibility"
                      defaultValue={project.visibility}
                      className="w-full px-4 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    >
                      <option value="private">Private</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                  >
                    Save Changes
                  </button>
                  <Link
                    to={`/workbench/${project.id}`}
                    className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                  >
                    Cancel
                  </Link>
                </div>
              </Form>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold uppercase ${
                          project.status === "completed"
                            ? "bg-green-500 text-white"
                            : "bg-accent-orange text-on-accent"
                        }`}
                      >
                        {project.status}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-tertiary text-secondary">
                        {project.visibility}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-primary mb-2">
                      {project.title}
                    </h1>
                    {project.description && (
                      <p className="text-secondary">{project.description}</p>
                    )}
                  </div>
                  <Link
                    to="?edit=true"
                    className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500 hover:-translate-y-1"
                  >
                    Edit Project
                  </Link>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-secondary mb-2">
                    <span>BOM Completion</span>
                    <span>
                      {itemsReady} / {totalItems} items ready ({completionPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-tertiary rounded-full h-3">
                    <div
                      className="bg-accent-orange h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tools Needed */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Tools Needed</h2>
              {!addingTool && (
                <Link
                  to="?add-tool=true"
                  className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                >
                  + Add Tool
                </Link>
              )}
            </div>

            {/* Add Tool Form */}
            {addingTool && (
              <div className="bg-tertiary rounded-lg p-4 mb-6 border-2 border-orange-500">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_item" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Select Tool *
                      </label>
                      <select
                        name="item_id"
                        required
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Choose a tool...</option>
                        {allItems
                          .filter((item) => item.item_type === "tool")
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Quantity Needed *
                      </label>
                      <input
                        type="number"
                        name="quantity_needed"
                        defaultValue="1"
                        min="1"
                        required
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Add Tool
                    </button>
                    <Link
                      to={`/workbench/${project.id}`}
                      className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      Cancel
                    </Link>
                    <Link
                      to="/items/new"
                      className="ml-auto bg-secondary text-secondary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      + Create New Tool
                    </Link>
                  </div>
                </Form>
              </div>
            )}

            {/* Tools List */}
            {tools.length > 0 ? (
              <div className="space-y-3">
                {tools.map((pi) => (
                  <div
                    key={pi.id}
                    className="border border-theme rounded-lg p-3 bg-primary"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {pi.item.image_url && (
                          <img
                            src={pi.item.image_url}
                            alt={pi.item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <Link
                            to={`/items/${pi.item_id}`}
                            className="font-semibold text-primary hover:text-orange-600 transition-colors"
                          >
                            {pi.item.name}
                          </Link>
                          {pi.notes && (
                            <p className="text-xs text-secondary mt-1">
                              {pi.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Form method="post" className="inline">
                        <input type="hidden" name="_action" value="remove_item" />
                        <input type="hidden" name="project_item_id" value={pi.id} />
                        <button
                          type="submit"
                          className="text-sm text-secondary hover:text-red-600 transition-colors"
                          onClick={(e) => {
                            if (!confirm("Remove this tool?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Remove
                        </button>
                      </Form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <p>No tools added yet</p>
              </div>
            )}
          </div>

          {/* Bill of Materials */}
          <div className="bg-secondary rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">
                Bill of Materials (Parts & Supplies)
              </h2>
              {!addingItem && (
                <Link
                  to="?add-item=true"
                  className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                >
                  + Add Item
                </Link>
              )}
            </div>

            {/* Add Item Form */}
            {addingItem && (
              <div className="bg-tertiary rounded-lg p-4 mb-6 border-2 border-orange-500">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_item" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Select Item *
                      </label>
                      <select
                        name="item_id"
                        required
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Choose an item...</option>
                        {allItems
                          .filter((item) => item.item_type !== "tool")
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.item_type})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Quantity Needed *
                      </label>
                      <input
                        type="number"
                        name="quantity_needed"
                        defaultValue="1"
                        min="1"
                        required
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Add to BOM
                    </button>
                    <Link
                      to={`/workbench/${project.id}`}
                      className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      Cancel
                    </Link>
                    <Link
                      to="/items/new"
                      className="ml-auto bg-secondary text-secondary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      + Create New Item
                    </Link>
                  </div>
                </Form>
              </div>
            )}

            {/* Items List */}
            {bomItems.length > 0 ? (
              <div className="space-y-4">
                {bomItems.map((pi) => (
                  <div
                    key={pi.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      editingItem === String(pi.id)
                        ? "border-orange-500 bg-tertiary"
                        : "border-theme bg-primary"
                    }`}
                  >
                    {editingItem === String(pi.id) ? (
                      <Form method="post" className="space-y-3">
                        <input type="hidden" name="_action" value="update_item" />
                        <input type="hidden" name="project_item_id" value={pi.id} />

                        <div className="flex items-center gap-3 mb-3">
                          {pi.item.image_url && (
                            <img
                              src={pi.item.image_url}
                              alt={pi.item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-primary">
                              {pi.item.name}
                            </h4>
                            <p className="text-sm text-secondary">
                              {pi.item.item_type}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-primary mb-1">
                              Have
                            </label>
                            <input
                              type="number"
                              name="quantity_have"
                              defaultValue={pi.quantity_have}
                              min="0"
                              className="w-full px-2 py-1 text-sm border border-theme rounded bg-secondary text-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-primary mb-1">
                              Status
                            </label>
                            <select
                              name="item_status"
                              defaultValue={pi.item_status}
                              className="w-full px-2 py-1 text-sm border border-theme rounded bg-secondary text-primary"
                            >
                              <option value="needed">Needed</option>
                              <option value="ordered">Ordered</option>
                              <option value="received">Received</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-primary mb-1">
                              Vendor
                            </label>
                            <input
                              type="text"
                              name="vendor"
                              defaultValue={pi.vendor || ""}
                              placeholder="e.g., Robu.in"
                              className="w-full px-2 py-1 text-sm border border-theme rounded bg-secondary text-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-primary mb-1">
                              Cost (₹)
                            </label>
                            <input
                              type="number"
                              name="actual_cost"
                              defaultValue={
                                pi.actual_unit_cost
                                  ? (pi.actual_unit_cost / 100).toFixed(2)
                                  : ""
                              }
                              step="0.01"
                              placeholder="0.00"
                              className="w-full px-2 py-1 text-sm border border-theme rounded bg-secondary text-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-primary mb-1">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            defaultValue={pi.notes || ""}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-theme rounded bg-secondary text-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="accent-orange text-on-accent px-3 py-1 text-sm rounded hover:bg-orange-600 transition-colors font-semibold"
                          >
                            Save
                          </button>
                          <Link
                            to={`/workbench/${project.id}`}
                            className="bg-secondary text-primary border border-theme px-3 py-1 text-sm rounded hover:border-orange-500 transition-colors"
                          >
                            Cancel
                          </Link>
                        </div>
                      </Form>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {pi.item.image_url && (
                            <img
                              src={pi.item.image_url}
                              alt={pi.item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                to={`/items/${pi.item_id}`}
                                className="font-semibold text-primary hover:text-orange-600 transition-colors"
                              >
                                {pi.item.name}
                              </Link>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  pi.quantity_have >= pi.quantity_needed
                                    ? "bg-green-500 text-white"
                                    : "bg-orange-500 text-white"
                                }`}
                              >
                                {pi.quantity_have >= pi.quantity_needed
                                  ? "Ready"
                                  : pi.item_status}
                              </span>
                            </div>
                            <p className="text-sm text-secondary">
                              Qty: {pi.quantity_have} / {pi.quantity_needed}
                              {pi.vendor && ` • Vendor: ${pi.vendor}`}
                              {pi.actual_unit_cost &&
                                ` • ₹${(pi.actual_unit_cost / 100).toFixed(2)}`}
                            </p>
                            {pi.notes && (
                              <p className="text-xs text-secondary mt-1">
                                Note: {pi.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`?edit-item=${pi.id}`}
                            className="text-sm text-secondary hover:text-orange-600 transition-colors"
                          >
                            Edit
                          </Link>
                          <Form method="post" className="inline">
                            <input type="hidden" name="_action" value="remove_item" />
                            <input type="hidden" name="project_item_id" value={pi.id} />
                            <button
                              type="submit"
                              className="text-sm text-secondary hover:text-red-600 transition-colors"
                              onClick={(e) => {
                                if (!confirm("Remove this item from the project?")) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Remove
                            </button>
                          </Form>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-primary mb-2">
                  No items yet
                </h3>
                <p className="text-secondary mb-6">
                  Add items from the global library to start your BOM
                </p>
                {!addingItem && (
                  <Link
                    to="?add-item=true"
                    className="inline-block accent-orange text-on-accent px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                  >
                    Add First Item
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Project Links */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Links</h2>
              {!addingLink && (
                <Link
                  to="?add-link=true"
                  className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                >
                  + Add Link
                </Link>
              )}
            </div>

            {/* Add Link Form */}
            {addingLink && (
              <div className="bg-tertiary rounded-lg p-4 mb-6 border-2 border-orange-500">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_link" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        placeholder="e.g., Source Code, Documentation"
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Type
                      </label>
                      <select
                        name="link_type"
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Select type...</option>
                        <option value="code">Code</option>
                        <option value="docs">Documentation</option>
                        <option value="shop">Shop</option>
                        <option value="demo">Demo</option>
                        <option value="video">Video</option>
                        <option value="article">Article</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                      URL *
                    </label>
                    <input
                      type="url"
                      name="url"
                      required
                      placeholder="https://..."
                      className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Add Link
                    </button>
                    <Link
                      to={`/workbench/${project.id}`}
                      className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      Cancel
                    </Link>
                  </div>
                </Form>
              </div>
            )}

            {/* Links List */}
            {projectLinks.length > 0 ? (
              <div className="space-y-3">
                {projectLinks.map((link) => (
                  <div
                    key={link.id}
                    className="border border-theme rounded-lg p-3 bg-primary flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:text-orange-600 transition-colors"
                        >
                          {link.title}
                        </a>
                        {link.link_type && (
                          <span className="text-xs px-2 py-0.5 rounded bg-tertiary text-secondary">
                            {link.link_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary mt-1 truncate">{link.url}</p>
                    </div>
                    <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="delete_link" />
                      <input type="hidden" name="link_id" value={link.id} />
                      <button
                        type="submit"
                        className="text-sm text-secondary hover:text-red-600 transition-colors ml-4"
                        onClick={(e) => {
                          if (!confirm("Delete this link?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </Form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <p>No links added yet</p>
              </div>
            )}
          </div>

          {/* Project Images */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Images</h2>
              {!addingImage && (
                <Link
                  to="?add-image=true"
                  className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                >
                  + Add Image
                </Link>
              )}
            </div>

            {/* Add Image Form */}
            {addingImage && (
              <div className="bg-tertiary rounded-lg p-4 mb-6 border-2 border-orange-500">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_image" />
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      required
                      placeholder="https://..."
                      className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                      Caption
                    </label>
                    <input
                      type="text"
                      name="caption"
                      placeholder="Optional caption..."
                      className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_primary"
                        value="true"
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-primary">
                        Set as primary image
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Add Image
                    </button>
                    <Link
                      to={`/workbench/${project.id}`}
                      className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      Cancel
                    </Link>
                  </div>
                </Form>
              </div>
            )}

            {/* Images Grid */}
            {projectImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectImages.map((img) => (
                  <div key={img.id} className="border border-theme rounded-lg overflow-hidden bg-primary">
                    {img.image_url && (
                      <img
                        src={img.image_url}
                        alt={img.caption || "Project image"}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-3">
                      {img.caption && (
                        <p className="text-sm text-primary mb-2">{img.caption}</p>
                      )}
                      {img.is_primary && (
                        <span className="text-xs px-2 py-0.5 rounded bg-accent-orange text-on-accent font-semibold">
                          Primary
                        </span>
                      )}
                      <Form method="post" className="mt-2">
                        <input type="hidden" name="_action" value="delete_image" />
                        <input type="hidden" name="image_id" value={img.id} />
                        <button
                          type="submit"
                          className="text-sm text-secondary hover:text-red-600 transition-colors"
                          onClick={(e) => {
                            if (!confirm("Delete this image?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <p>No images added yet</p>
              </div>
            )}
          </div>

          {/* Project Notes */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Notes & Timeline</h2>
              {!addingNote && (
                <Link
                  to="?add-note=true"
                  className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                >
                  + Add Note
                </Link>
              )}
            </div>

            {/* Add Note Form */}
            {addingNote && (
              <div className="bg-tertiary rounded-lg p-4 mb-6 border-2 border-orange-500">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_note" />
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                      Note Content *
                    </label>
                    <textarea
                      name="content"
                      required
                      rows={4}
                      placeholder="Write your note here..."
                      className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">
                        Type
                      </label>
                      <select
                        name="note_type"
                        className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                      >
                        <option value="general">General</option>
                        <option value="issue">Issue</option>
                        <option value="solution">Solution</option>
                        <option value="idea">Idea</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_pinned"
                          value="true"
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-semibold text-primary">
                          Pin this note
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Add Note
                    </button>
                    <Link
                      to={`/workbench/${project.id}`}
                      className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      Cancel
                    </Link>
                  </div>
                </Form>
              </div>
            )}

            {/* Notes List */}
            {projectNotes.length > 0 ? (
              <div className="space-y-4">
                {projectNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`border-2 rounded-lg p-4 ${
                      editingNote === String(note.id)
                        ? "border-orange-500 bg-tertiary"
                        : note.is_pinned
                        ? "border-orange-400 bg-primary"
                        : "border-theme bg-primary"
                    }`}
                  >
                    {editingNote === String(note.id) ? (
                      <Form method="post" className="space-y-3">
                        <input type="hidden" name="_action" value="update_note" />
                        <input type="hidden" name="note_id" value={note.id} />
                        <div>
                          <label className="block text-sm font-semibold text-primary mb-1">
                            Content
                          </label>
                          <textarea
                            name="content"
                            defaultValue={note.content}
                            required
                            rows={4}
                            className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-secondary text-primary focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="is_pinned"
                              value="true"
                              defaultChecked={note.is_pinned}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-semibold text-primary">
                              Pin this note
                            </span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="accent-orange text-on-accent px-3 py-1 text-sm rounded hover:bg-orange-600 transition-colors font-semibold"
                          >
                            Save
                          </button>
                          <Link
                            to={`/workbench/${project.id}`}
                            className="bg-secondary text-primary border border-theme px-3 py-1 text-sm rounded hover:border-orange-500 transition-colors"
                          >
                            Cancel
                          </Link>
                        </div>
                      </Form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                note.note_type === "issue"
                                  ? "bg-red-500 text-white"
                                  : note.note_type === "solution"
                                  ? "bg-green-500 text-white"
                                  : note.note_type === "idea"
                                  ? "bg-blue-500 text-white"
                                  : "bg-tertiary text-secondary"
                              }`}
                            >
                              {note.note_type}
                            </span>
                            {note.is_pinned && (
                              <span className="text-xs px-2 py-0.5 rounded bg-accent-orange text-on-accent font-semibold">
                                Pinned
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Link
                              to={`?edit-note=${note.id}`}
                              className="text-sm text-secondary hover:text-orange-600 transition-colors"
                            >
                              Edit
                            </Link>
                            <Form method="post" className="inline">
                              <input type="hidden" name="_action" value="delete_note" />
                              <input type="hidden" name="note_id" value={note.id} />
                              <button
                                type="submit"
                                className="text-sm text-secondary hover:text-red-600 transition-colors"
                                onClick={(e) => {
                                  if (!confirm("Delete this note?")) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </Form>
                          </div>
                        </div>
                        <p className="text-primary whitespace-pre-wrap mb-2">{note.content}</p>
                        <p className="text-xs text-secondary">
                          {new Date(note.created_at).toLocaleDateString()} at{" "}
                          {new Date(note.created_at).toLocaleTimeString()}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <p>No notes added yet</p>
              </div>
            )}
          </div>

          {/* Project Tasks */}
          <div className="bg-secondary rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Tasks</h2>
              {!addingTask && (
                <Link
                  to="?add-task=true"
                  className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                >
                  + Add Task
                </Link>
              )}
            </div>

            {/* Add Task Form */}
            {addingTask && (
              <div className="bg-tertiary rounded-lg p-4 mb-6 border-2 border-orange-500">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_task" />
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="e.g., Design PCB layout"
                      className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-primary text-primary focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="accent-orange text-on-accent px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Add Task
                    </button>
                    <Link
                      to={`/workbench/${project.id}`}
                      className="bg-secondary text-primary border-2 border-theme px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:border-orange-500"
                    >
                      Cancel
                    </Link>
                  </div>
                </Form>
              </div>
            )}

            {/* Tasks List */}
            {projectTasks.length > 0 ? (
              <div className="space-y-3">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`border-2 rounded-lg p-4 ${
                      editingTask === String(task.id)
                        ? "border-orange-500 bg-tertiary"
                        : task.status === "completed"
                        ? "border-green-400 bg-primary"
                        : "border-theme bg-primary"
                    }`}
                  >
                    {editingTask === String(task.id) ? (
                      <Form method="post" className="space-y-3">
                        <input type="hidden" name="_action" value="update_task" />
                        <input type="hidden" name="task_id" value={task.id} />
                        <div>
                          <label className="block text-sm font-semibold text-primary mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            defaultValue={task.title}
                            required
                            className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-secondary text-primary focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-primary mb-1">
                            Status
                          </label>
                          <select
                            name="status"
                            defaultValue={task.status}
                            className="w-full px-3 py-2 border-2 border-theme rounded-lg bg-secondary text-primary focus:outline-none focus:border-orange-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="accent-orange text-on-accent px-3 py-1 text-sm rounded hover:bg-orange-600 transition-colors font-semibold"
                          >
                            Save
                          </button>
                          <Link
                            to={`/workbench/${project.id}`}
                            className="bg-secondary text-primary border border-theme px-3 py-1 text-sm rounded hover:border-orange-500 transition-colors"
                          >
                            Cancel
                          </Link>
                        </div>
                      </Form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Form method="post" className="inline">
                            <input type="hidden" name="_action" value="toggle_task" />
                            <input type="hidden" name="task_id" value={task.id} />
                            <input type="hidden" name="current_status" value={task.status} />
                            <button
                              type="submit"
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                task.status === "completed"
                                  ? "bg-green-500 border-green-500"
                                  : "border-theme hover:border-orange-500"
                              }`}
                            >
                              {task.status === "completed" && (
                                <span className="text-white font-bold">✓</span>
                              )}
                            </button>
                          </Form>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold text-primary ${
                                  task.status === "completed" ? "line-through opacity-60" : ""
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.status === "in_progress" && (
                                <span className="text-xs px-2 py-0.5 rounded bg-accent-orange text-on-accent font-semibold">
                                  In Progress
                                </span>
                              )}
                            </div>
                            {task.completed_at && (
                              <p className="text-xs text-secondary mt-1">
                                Completed: {new Date(task.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`?edit-task=${task.id}`}
                            className="text-sm text-secondary hover:text-orange-600 transition-colors"
                          >
                            Edit
                          </Link>
                          <Form method="post" className="inline">
                            <input type="hidden" name="_action" value="delete_task" />
                            <input type="hidden" name="task_id" value={task.id} />
                            <button
                              type="submit"
                              className="text-sm text-secondary hover:text-red-600 transition-colors"
                              onClick={(e) => {
                                if (!confirm("Delete this task?")) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Delete
                            </button>
                          </Form>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary">
                <p>No tasks added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

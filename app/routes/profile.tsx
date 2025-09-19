import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
  Form,
  useSearchParams,
  Link,
} from "react-router";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { uploadImage } from "~/lib/upload.server";
import {
  getFullMakerProfile,
  updateMakerProfile,
  addProfileLink,
  deleteProfileLink,
  createMakerProfile,
} from "~/lib/makers.server";
import {
  getUserProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  parsePrice,
} from "~/lib/products.server";
import { useLoaderData, useActionData } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { ProductManagement } from "~/components/profile/ProductManagement";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  // Get user profile with links
  const profile = await getFullMakerProfile(db, user.id);

  // Get user products
  const products = await getUserProducts(db, user.id);

  return { profile, user, products };
}

// Helper function to handle avatar/image uploads
async function handleImageUpload(
  context: any,
  formData: FormData,
  userId: number,
  type: "profile" | "product",
  fallbackUrlField: string
): Promise<string | undefined> {
  console.log("=== HANDLE IMAGE UPLOAD ===");
  console.log(
    "Type:",
    type,
    "UserId:",
    userId,
    "FallbackField:",
    fallbackUrlField
  );

  const file = formData.get(`${type}Image`) as File | null;
  const urlInput = formData.get(fallbackUrlField) as string;

  console.log(
    "File from form:",
    file ? `${file.name} (${file.size} bytes)` : "null"
  );
  console.log("URL from form:", urlInput || "null");

  // If user uploaded a file, use that
  if (file && file.size > 0) {
    console.log("Processing file upload...");
    const uploadResult = await uploadImage(context, file, userId, type);
    console.log("Upload result:", uploadResult);

    if (uploadResult.success) {
      console.log("File upload successful, returning URL:", uploadResult.url);
      return uploadResult.url;
    }
    // If upload fails, fall back to URL input
    console.warn(
      "File upload failed, falling back to URL input:",
      uploadResult.error
    );
  } else {
    console.log("No file uploaded or file is empty");
  }

  // Fall back to URL input if provided
  const finalUrl = urlInput?.trim() || undefined;
  console.log("Final URL:", finalUrl);
  return finalUrl;
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    // console.log("=== ACTION START ===");

    const db = getDB(context);
    const kv = getKV(context);
    const env = getEnv(context);
    const authService = createAuthService(db, kv, env);

    const user = await requireAuth(request, authService);
    const formData = await request.formData();
    // console.log("FormData entries:", Array.from(formData.entries()));

    const action = formData.get("_action") as string;

    // console.log("Parsed values:", { action });

    if (action === "createProfile") {
      // console.log("Handling createProfile action");
      const makerName = formData.get("makerName") as string;
      const displayName = formData.get("displayName") as string;
      const bio = formData.get("bio") as string;

      if (!makerName?.trim()) {
        return redirect("/profile?error=Maker name is required");
      }

      try {
        // Handle avatar upload/URL
        const avatarUrl = await handleImageUpload(
          context,
          formData,
          user.id,
          "profile",
          "avatarUrl"
        );

        await createMakerProfile(db, user.id, {
          makerName,
          displayName,
          bio,
          avatarUrl,
        });

        return redirect("/profile?success=Profile created successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create profile";
        return redirect(`/profile?error=${encodeURIComponent(errorMessage)}`);
      }
    }

    if (action === "updateProfile") {
      // console.log("Handling updateProfile action");
      const displayName = formData.get("displayName") as string;
      const bio = formData.get("bio") as string;

      try {
        // Handle avatar upload/URL
        const avatarUrl = await handleImageUpload(
          context,
          formData,
          user.id,
          "profile",
          "avatarUrl"
        );

        await updateMakerProfile(db, user.id, {
          displayName,
          bio,
          avatarUrl,
        });

        // console.log("Profile updated successfully, redirecting...");
        // Redirect to profile with success message (removes edit-profile automatically)
        return redirect("/profile?success=Profile+updated+successfully");
      } catch (error) {
        console.error("Error updating profile:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to update profile",
        };
      }
    }

    if (action === "addLink") {
      // console.log("Handling addLink action");
      const title = formData.get("linkTitle") as string;
      const linkUrl = formData.get("linkUrl") as string;

      // console.log("Link data:", { title, linkUrl });

      if (!title?.trim() || !linkUrl?.trim()) {
        // console.log("Validation failed: missing title or URL");
        return { error: "Both title and URL are required" };
      }

      try {
        await addProfileLink(db, user.id, title, linkUrl);
        // console.log("Link added successfully, redirecting...");
        // Redirect to profile with success message (removes add-link automatically)
        return redirect("/profile?success=Link+added+successfully");
      } catch (error) {
        console.error("Error adding link:", error);
        return {
          error: error instanceof Error ? error.message : "Failed to add link",
        };
      }
    }

    if (action === "deleteLink") {
      // console.log("Handling deleteLink action");
      const linkId = parseInt(formData.get("linkId") as string);
      // console.log("Deleting link ID:", linkId);

      try {
        await deleteProfileLink(db, user.id, linkId);
        // console.log("Link deleted successfully");
        return { success: "Link deleted successfully" };
      } catch (error) {
        console.error("Error deleting link:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to delete link",
        };
      }
    }

    if (action === "createProduct") {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const priceStr = formData.get("price") as string;
      const category = formData.get("category") as string;
      const shopifyUrl = formData.get("shopifyUrl") as string;
      const status = (formData.get("status") as string) || "active";
      const stockQuantity = formData.get("stockQuantity") as string;
      const shippingWeight = formData.get("shippingWeight") as string;
      const features = formData.get("features") as string;
      const isOpenSource = formData.get("isOpenSource") === "on";
      const githubRepo = formData.get("githubRepo") as string;
      const documentationUrl = formData.get("documentationUrl") as string;

      if (!title?.trim()) {
        return { error: "Product title is required" };
      }

      // Price is only required for ready-for-sale products
      const isProjectStatus = [
        "concept",
        "development",
        "prototype",
        "testing",
      ].includes(status);
      if (!isProjectStatus && !priceStr?.trim()) {
        return {
          error: "Product price is required for products ready for sale",
        };
      }

      try {
        const price = priceStr?.trim() ? parsePrice(priceStr) : 0;

        // Handle product image upload/URL
        const imageUrl = await handleImageUpload(
          context,
          formData,
          user.id,
          "product",
          "imageUrl"
        );

        // Parse features from newline-separated text
        const featuresArray = features?.trim()
          ? features
              .split("\n")
              .map((f) => f.trim())
              .filter((f) => f.length > 0)
          : undefined;

        await createProduct(db, user.id, {
          title,
          description: description || undefined,
          price,
          category: category || undefined,
          image_url: imageUrl || undefined,
          shopify_url: shopifyUrl || "",
          status: status as any,
          stock_quantity: stockQuantity ? parseInt(stockQuantity) : undefined,
          shipping_weight: shippingWeight
            ? parseInt(shippingWeight)
            : undefined,
          features: featuresArray,
          is_open_source: isOpenSource,
          github_repo: githubRepo || undefined,
          documentation_url: documentationUrl || undefined,
        });

        return redirect("/profile?success=Product+created+successfully");
      } catch (error) {
        console.error("Error creating product:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to create product",
        };
      }
    }

    if (action === "updateProduct") {
      const productId = parseInt(formData.get("productId") as string);
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const priceStr = formData.get("price") as string;
      const category = formData.get("category") as string;
      const shopifyUrl = formData.get("shopifyUrl") as string;
      const status = formData.get("status") as string;
      const stockQuantity = formData.get("stockQuantity") as string;
      const shippingWeight = formData.get("shippingWeight") as string;
      const features = formData.get("features") as string;
      const isOpenSource = formData.get("isOpenSource") === "on";
      const githubRepo = formData.get("githubRepo") as string;
      const documentationUrl = formData.get("documentationUrl") as string;

      if (!productId || isNaN(productId)) {
        return { error: "Invalid product ID" };
      }

      try {
        const updateData: any = {};

        if (title?.trim()) updateData.title = title;
        if (description !== null)
          updateData.description = description || undefined;

        // Handle price based on status
        if (priceStr !== null) {
          if (priceStr?.trim()) {
            updateData.price = parsePrice(priceStr);
          } else {
            updateData.price = 0; // Allow 0 price for projects
          }
        }

        if (category !== null) updateData.category = category || undefined;

        // Handle product image upload/URL
        const imageUrl = await handleImageUpload(
          context,
          formData,
          user.id,
          "product",
          "imageUrl"
        );
        if (imageUrl !== undefined)
          updateData.image_url = imageUrl || undefined;

        if (shopifyUrl !== null) updateData.shopify_url = shopifyUrl || "";
        if (status) updateData.status = status;

        // Handle new fields
        if (stockQuantity !== null) {
          updateData.stock_quantity = stockQuantity
            ? parseInt(stockQuantity)
            : undefined;
        }
        if (shippingWeight !== null) {
          updateData.shipping_weight = shippingWeight
            ? parseInt(shippingWeight)
            : undefined;
        }
        if (features !== null) {
          const featuresArray = features?.trim()
            ? features
                .split("\n")
                .map((f) => f.trim())
                .filter((f) => f.length > 0)
            : undefined;
          updateData.features = featuresArray;
        }
        if (isOpenSource !== undefined)
          updateData.is_open_source = isOpenSource;
        if (githubRepo !== null)
          updateData.github_repo = githubRepo || undefined;
        if (documentationUrl !== null)
          updateData.documentation_url = documentationUrl || undefined;

        await updateProduct(db, user.id, productId, updateData);

        return redirect("/profile?success=Product+updated+successfully");
      } catch (error) {
        console.error("Error updating product:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to update product",
        };
      }
    }

    if (action === "deleteProduct") {
      const productId = parseInt(formData.get("productId") as string);

      if (!productId || isNaN(productId)) {
        return { error: "Invalid product ID" };
      }

      try {
        await deleteProduct(db, user.id, productId);
        return { success: "Product deleted successfully" };
      } catch (error) {
        console.error("Error deleting product:", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to delete product",
        };
      }
    }

    // console.log("No action matched, returning invalid action error");
    return { error: "Invalid action" };
  } catch (error) {
    console.error("=== UNEXPECTED ERROR IN ACTION ===", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export default function Profile() {
  const { profile, user, products } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [searchParams] = useSearchParams();
  const editingProfile = searchParams.get("edit-profile") === "true";
  const addingLink = searchParams.get("add-link") === "true";
  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");

  return (
    <Layout>
      <Navigation user={user} />
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success/Error Messages */}
          {(successMessage || actionData?.success) && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4 flex items-center justify-between">
              <span>{successMessage || actionData?.success}</span>
              <Link
                to="/profile"
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium text-sm"
              >
                ✕
              </Link>
            </div>
          )}
          {(errorMessage || actionData?.error) && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 flex items-center justify-between">
              <span>{errorMessage || actionData?.error}</span>
              <Link
                to="/profile"
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
              >
                ✕
              </Link>
            </div>
          )}

          {/* Profile Setup or Existing Profile */}
          {!profile ? (
            /* Profile Setup Form */
            <div className="bg-secondary rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-primary mb-6">
                Setup Your Maker Profile
              </h1>

              <Form
                method="post"
                encType="multipart/form-data"
                className="space-y-6"
              >
                <input type="hidden" name="_action" value="createProfile" />

                <div>
                  <label
                    htmlFor="makerName"
                    className="block text-sm font-medium text-primary mb-2"
                  >
                    Maker Name *
                  </label>
                  <input
                    type="text"
                    id="makerName"
                    name="makerName"
                    defaultValue={searchParams.get("makerName") || ""}
                    required
                    className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                    placeholder="Your unique maker username"
                  />
                  <p className="text-xs text-secondary mt-1">
                    This will be your public username (e.g., /maker/yourname)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-primary mb-2"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    defaultValue={searchParams.get("displayName") || ""}
                    className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                    placeholder="Your full name or brand name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-primary mb-2"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    defaultValue={searchParams.get("bio") || ""}
                    rows={3}
                    className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                    placeholder="Tell us about yourself and what you make..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Profile Photo
                  </label>

                  {/* File Upload */}
                  <div className="mb-3">
                    <label
                      htmlFor="profileImage"
                      className="block text-xs font-medium text-secondary mb-1"
                    >
                      Upload Image
                    </label>
                    <input
                      type="file"
                      id="profileImage"
                      name="profileImage"
                      accept="image/*"
                      className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    <p className="text-xs text-secondary mt-1">
                      Recommended: Upload JPEG, PNG, WebP, or GIF (max 5MB)
                    </p>
                  </div>

                  {/* URL Alternative */}
                  <div>
                    <label
                      htmlFor="avatarUrl"
                      className="block text-xs font-medium text-secondary mb-1"
                    >
                      Or enter image URL
                    </label>
                    <input
                      type="url"
                      id="avatarUrl"
                      name="avatarUrl"
                      defaultValue={searchParams.get("avatarUrl") || ""}
                      className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                      placeholder="https://example.com/your-photo.jpg"
                    />
                    <p className="text-xs text-secondary mt-1">
                      Alternative: Link to an existing image
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  Create Profile
                </button>
              </Form>
            </div>
          ) : (
            <>
              {/* Existing Profile Display */}
              <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-tertiary rounded-full flex items-center justify-center overflow-hidden">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={
                            profile.display_name ||
                            profile.maker_name ||
                            "Profile"
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-secondary text-2xl">👤</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-primary">
                        {profile.display_name || profile.maker_name}
                      </h1>
                      <p className="text-secondary">@{profile.maker_name}</p>
                      {profile.bio && (
                        <p className="text-primary mt-2">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                  {editingProfile ? (
                    <Link
                      to="/profile"
                      className="border px-4 py-2 rounded-md hover:bg-orange-600"
                    >
                      Cancel
                    </Link>
                  ) : (
                    <Link
                      to="?edit-profile=true"
                      className="accent-orange text-on-accent px-4 py-2 rounded-md hover:bg-orange-600 flex-shrink-0"
                    >
                      Edit Profile
                    </Link>
                  )}
                </div>
              </div>

              {editingProfile && (
                <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-primary">
                    Edit Profile
                  </h2>
                  <Form
                    method="post"
                    encType="multipart/form-data"
                    className="space-y-4"
                  >
                    <input type="hidden" name="_action" value="updateProfile" />

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        defaultValue={profile.display_name || ""}
                        className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                        placeholder="Your full name or brand name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        defaultValue={profile.bio || ""}
                        rows={3}
                        className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        Profile Photo
                      </label>

                      {/* File Upload */}
                      <div className="mb-3">
                        <label
                          htmlFor="profileImageEdit"
                          className="block text-xs font-medium text-secondary mb-1"
                        >
                          Upload New Image
                        </label>
                        <input
                          type="file"
                          id="profileImageEdit"
                          name="profileImage"
                          accept="image/*"
                          className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        <p className="text-xs text-secondary mt-1">
                          Upload JPEG, PNG, WebP, or GIF (max 5MB)
                        </p>
                      </div>

                      {/* URL Alternative */}
                      <div>
                        <label
                          htmlFor="avatarUrlEdit"
                          className="block text-xs font-medium text-secondary mb-1"
                        >
                          Or enter image URL
                        </label>
                        <input
                          type="url"
                          id="avatarUrlEdit"
                          name="avatarUrl"
                          defaultValue={profile.avatar_url || ""}
                          className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                          placeholder="https://example.com/photo.jpg"
                        />
                        <p className="text-xs text-secondary mt-1">
                          Current image will be replaced if you upload a new one
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="accent-orange text-on-accent px-4 py-2 rounded-md hover:bg-orange-600"
                      >
                        Save Changes
                      </button>
                      <Link
                        to="/profile"
                        className="border px-4 py-2 rounded-md hover:bg-orange-600"
                      >
                        Cancel
                      </Link>
                    </div>
                  </Form>
                </div>
              )}

              {/* Products Section */}
              <ProductManagement products={products} />

              {/* Profile Links */}
              <div className="bg-secondary rounded-lg shadow-md p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary">
                    Profile Links
                  </h2>
                  {addingLink ? (
                    <Link
                      to="/profile"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Cancel
                    </Link>
                  ) : (
                    <Link
                      to="?add-link=true"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Add Link
                    </Link>
                  )}
                </div>

                {/* Add Link Form */}
                {addingLink && (
                  <Form
                    method="post"
                    className="bg-tertiary p-4 rounded-md mb-4"
                  >
                    <input type="hidden" name="_action" value="addLink" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          name="linkTitle"
                          className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                          placeholder="e.g., Website, GitHub, Instagram"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          name="linkUrl"
                          className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                          placeholder="https://example.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Add Link
                      </button>
                    </div>
                  </Form>
                )}

                {/* Links List */}
                <div className="space-y-2">
                  {profile.links && profile.links.length > 0 ? (
                    profile.links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-3 bg-tertiary rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-primary">
                            {link.title}
                          </span>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="accent-orange-text hover:text-orange-600 text-sm"
                          >
                            {link.url}
                          </a>
                        </div>
                        <form method="post" className="inline">
                          <input
                            type="hidden"
                            name="_action"
                            value="deleteLink"
                          />
                          <input type="hidden" name="linkId" value={link.id} />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-800 text-sm"
                            onClick={(e) => {
                              if (
                                !confirm(
                                  "Are you sure you want to delete this link?"
                                )
                              ) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-secondary">
                      No links added yet. Add some links to showcase your work!
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

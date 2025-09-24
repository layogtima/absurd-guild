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
import { ProductList } from "~/components/profile/ProductList";
import { EditModal } from "~/components/profile/EditModal";
import { EditorToolbar } from "~/components/profile/EditorToolbar";

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

  return { profile, user, products, userProfile: profile };
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
      const makerName = formData.get("makerName") as string;

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
          makerName,
        });

        // console.log("Profile updated successfully, redirecting...");
        return redirect("/profile?success=Profile updated successfully");
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
        return redirect("/profile?success=Link added successfully");
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

        return redirect("/profile?success=Product created successfully");
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

        return redirect("/profile?success=Product updated successfully");
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
  const { profile, user, products, userProfile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [searchParams] = useSearchParams();
  const editingProfile = searchParams.get("edit-profile") === "true";
  const editMode = true; // Always in edit mode
  const addingLink = searchParams.get("add-link") === "true";
  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");

  // Modal state from URL params
  const editingModal = searchParams.get("editing");
  const editingProductId = searchParams.get("edit-product");
  const isModalOpen = editingModal !== null || editingProductId !== null;

  // Modal configuration based on URL param
  const getModalConfig = () => {
    // Base values to preserve existing data
    const baseValues = {
      displayName: profile?.display_name || "",
      bio: profile?.bio || "",
      avatarUrl: profile?.avatar_url || "",
      makerName: profile?.maker_name || "",
    };

    // Handle product editing
    if (editingProductId) {
      const productToEdit = products.find(
        (p) => p.id === parseInt(editingProductId)
      );
      if (productToEdit) {
        return {
          type: "object" as const,
          title: "Edit Product",
          action: "updateProduct",
          defaultValues: {
            productId: productToEdit.id,
            title: productToEdit.title || "",
            description: productToEdit.description || "",
            price: productToEdit.price ? productToEdit.price.toString() : "",
            category: productToEdit.category || "",
            status: productToEdit.status || "",
            imageUrl: productToEdit.image_url || "",
            stockQuantity: productToEdit.stock_quantity
              ? productToEdit.stock_quantity.toString()
              : "",
            shippingWeight: productToEdit.shipping_weight
              ? productToEdit.shipping_weight.toString()
              : "",
            features: productToEdit.features
              ? productToEdit.features.join("\n")
              : "",
            isOpenSource: productToEdit.is_open_source || false,
            githubRepo: productToEdit.github_repo || "",
            documentationUrl: productToEdit.documentation_url || "",
          },
          fields: {
            title: {
              label: "Product Title",
              type: "text",
              placeholder: "Enter product name",
            },
            description: {
              label: "Description",
              type: "textarea",
              placeholder: "Describe your product...",
            },
            price: {
              label: "Price (₹)",
              type: "number",
              placeholder: "199 or leave empty for projects",
            },
            category: {
              label: "Category",
              type: "text",
              placeholder: "e.g., Software, Hardware, Book",
            },
            status: {
              label: "Status",
              type: "text",
              placeholder: "active, concept, development, prototype, testing",
            },
            productImage: {
              label: "Product Image",
              type: "file",
              placeholder: "",
            },
            imageUrl: {
              label: "Or enter image URL",
              type: "url",
              placeholder: "https://example.com/product-image.jpg",
            },
          },
        };
      }
    }

    switch (editingModal) {
      case "avatar":
        return {
          type: "image" as const,
          title: "Avatar",
          action: "updateProfile",
          defaultValues: baseValues,
        };
      case "name":
        return {
          type: "object" as const,
          title: "Profile Info",
          action: "updateProfile",
          defaultValues: baseValues,
          fields: {
            displayName: {
              label: "Display Name",
              type: "text",
              placeholder: "Your full name or brand name",
            },
          },
        };
      case "bio":
        return {
          type: "object" as const,
          title: "Bio",
          action: "updateProfile",
          defaultValues: baseValues,
          fields: {
            bio: {
              label: "Bio",
              type: "textarea",
              placeholder: "Tell us about yourself...",
            },
          },
        };
      case "maker-name":
        return {
          type: "object" as const,
          title: "Maker Name",
          action: "updateProfile",
          defaultValues: baseValues,
          fields: {
            makerName: {
              label: "Maker Name",
              type: "text",
              placeholder: "your-unique-username",
              pattern: "^[a-z][a-z\\-]*$",
              title:
                "Only lowercase letters and hyphens. Must start with a letter. 2-50 characters.",
              minLength: 3,
              maxLength: 50,
            },
          },
        };
      case "add-product":
        return {
          type: "object" as const,
          title: "Add Product",
          action: "createProduct",
          defaultValues: {},
          fields: {
            title: {
              label: "Product Title",
              type: "text",
              placeholder: "Enter product name",
            },
            description: {
              label: "Description",
              type: "textarea",
              placeholder: "Describe your product...",
            },
            price: {
              label: "Price (₹)",
              type: "number",
              placeholder: "199 or leave empty for projects",
            },
            category: {
              label: "Category",
              type: "text",
              placeholder: "e.g., Software, Hardware, Book",
            },
            status: {
              label: "Status",
              type: "text",
              placeholder: "active, concept, development, prototype, testing",
            },
            productImage: {
              label: "Product Image",
              type: "file",
              placeholder: "",
            },
            imageUrl: {
              label: "Or enter image URL",
              type: "url",
              placeholder: "https://example.com/product-image.jpg",
            },
          },
        };
      default:
        return null;
    }
  };

  const modalConfig = getModalConfig();

  // Helper to get current URL with modal param
  const getEditUrl = (editingType: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("editing", editingType);
    return `?${newParams.toString()}`;
  };

  // Helper to get URL without modal param
  const getCloseModalUrl = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("editing");
    newParams.delete("edit-product");
    return newParams.toString() ? `?${newParams.toString()}` : "/profile";
  };

  return (
    <Layout>
      <Navigation user={user} userProfile={userProfile} />
      <EditorToolbar isVisible={editMode} />
      <div
        className={`min-h-screen bg-primary py-8 ${editMode ? "edit-mode" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4">
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
                    pattern="^[a-z][a-z\-]*$"
                    minLength={3}
                    maxLength={50}
                    title="Only lowercase letters and hyphens. Must start with a letter. 2-50 characters."
                    className="w-full px-3 py-2 border border-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-primary text-primary"
                    placeholder="your-unique-username"
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
              {/* Hero Section - matching html/profile.html */}
              <section className="relative min-h-[70vh] flex items-center justify-center">
                <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
                  <div className="flex flex-col items-center mb-12 animate-fade-in">
                    {/* Avatar */}
                    {editMode ? (
                      <Link to={getEditUrl("avatar")}>
                        <div className="w-32 h-32 lg:w-40 lg:h-40 accent-orange rounded-3xl flex items-center justify-center text-4xl lg:text-5xl font-bold overflow-hidden text-on-accent mb-6 hover-lift editable">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.display_name || profile.maker_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-secondary text-6xl">👤</span>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="w-32 h-32 lg:w-40 lg:h-40 accent-orange rounded-3xl flex items-center justify-center text-4xl lg:text-5xl font-bold overflow-hidden text-on-accent mb-6 hover-lift">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.display_name || profile.maker_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-secondary text-6xl">👤</span>
                        )}
                      </div>
                    )}

                    {/* Name and tagline */}
                    {editMode ? (
                      <Link to={getEditUrl("name")}>
                        <h1 className="font-jura text-6xl lg:text-8xl font-bold text-primary mb-4 editable">
                          {profile.display_name || profile.maker_name}
                        </h1>
                      </Link>
                    ) : (
                      <h1 className="font-jura text-6xl lg:text-8xl font-bold text-primary mb-4">
                        {profile.display_name || profile.maker_name}
                      </h1>
                    )}
                    {editMode ? (
                      <Link to={getEditUrl("maker-name")}>
                        <p className="text-xl lg:text-2xl text-secondary mb-6 editable">
                          @{profile.maker_name}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-xl lg:text-2xl text-secondary mb-6">
                        @{profile.maker_name}
                      </p>
                    )}

                    {/* Bio */}
                    <div className="max-w-4xl mx-auto mb-12">
                      {profile.bio ? (
                        editMode ? (
                          <Link to={getEditUrl("bio")}>
                            <p className="text-xl lg:text-2xl text-secondary leading-relaxed editable">
                              {profile.bio}
                            </p>
                          </Link>
                        ) : (
                          <p className="text-xl lg:text-2xl text-secondary leading-relaxed">
                            {profile.bio}
                          </p>
                        )
                      ) : editMode ? (
                        <Link to={getEditUrl("bio")}>
                          <p className="text-xl lg:text-2xl text-gray-400 italic leading-relaxed editable">
                            Missing bio
                          </p>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              {/* Main Content - matching m.$id.tsx */}
              <main className="max-w-7xl mx-auto p-6">
                {/* Ready Products Section */}
                {products.filter((p) =>
                  ["active", "limited", "sold-out"].includes(p.status)
                ).length > 0 && (
                  <section id="products" className="mb-20">
                    <div className="text-center mb-12">
                      <h2 className="font-jura text-4xl lg:text-5xl font-bold text-primary mb-4">
                        Shop
                      </h2>
                      <p className="text-xl text-secondary max-w-3xl mx-auto">
                        These are ready to ship within two weeks of ordering!
                      </p>
                    </div>

                    <ProductList
                      products={products.filter((p) =>
                        ["active", "limited", "sold-out"].includes(p.status)
                      )}
                      showAdminActions={editMode}
                      mode="showcase"
                      gridCols="md:grid-cols-2"
                    />
                  </section>
                )}

                {/* Development Projects Section */}
                {products.filter((p) =>
                  ["concept", "development", "prototype", "testing"].includes(
                    p.status
                  )
                ).length > 0 && (
                  <section id="workbench" className="mb-20">
                    <div className="text-center mb-12">
                      <h2 className="font-jura text-4xl lg:text-5xl font-bold text-primary mb-4">
                        Workbench
                      </h2>
                      <p className="text-xl text-secondary max-w-3xl mx-auto">
                        Projects currently being cooked.
                      </p>
                    </div>

                    <ProductList
                      products={products.filter((p) =>
                        [
                          "concept",
                          "development",
                          "prototype",
                          "testing",
                        ].includes(p.status)
                      )}
                      showAdminActions={editMode}
                      mode="showcase"
                      gridCols="md:grid-cols-2 lg:grid-cols-3"
                    />
                  </section>
                )}

                {/* No content state */}
                {products.length === 0 && (
                  <section className="text-center py-20">
                    <div className="text-6xl mb-4">🚀</div>
                    <h2 className="font-jura text-3xl font-bold text-primary mb-4">
                      Ready to Build
                    </h2>
                    <p className="text-xl text-secondary mb-8">
                      Start creating amazing products to showcase here!
                    </p>
                    {editMode && (
                      <Link
                        to={getEditUrl("add-product")}
                        className="accent-orange text-on-accent px-8 py-4 rounded-2xl text-lg font-semibold hover-lift transition-all inline-flex items-center"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Add Product
                      </Link>
                    )}
                  </section>
                )}

                {/* Add Product Button for edit mode */}
                {editMode && products.length > 0 && (
                  <section className="text-center mb-20">
                    <Link
                      to={getEditUrl("add-product")}
                      className="accent-orange text-on-accent px-8 py-4 rounded-2xl text-lg font-semibold hover-lift transition-all inline-flex items-center"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add Product
                    </Link>
                  </section>
                )}
              </main>

              {/* Social Links Section - matching html/profile.html */}
              {profile.links && profile.links.length > 0 && (
                <section className="mb-20">
                  <div className="max-w-7xl mx-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {profile.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-secondary border-2 border-theme rounded-xl p-4 hover-lift transition-all flex items-center gap-3 group"
                        >
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-tertiary">
                            <i className="fas fa-link text-xl accent-orange-text"></i>
                          </div>
                          <div className="flex-grow">
                            <div className="font-bold text-primary text-base flex items-center gap-2">
                              {link.title}
                            </div>
                          </div>
                          <i className="fas fa-external-link-alt text-secondary group-hover:accent-orange-text transition-colors"></i>
                        </a>
                      ))}
                    </div>

                    {/* Add/Manage Links for Owner - only show in edit mode */}
                    {editMode && (
                      <div className="text-center">
                        {addingLink ? (
                          <div className="bg-secondary border-2 border-theme rounded-xl p-6 mb-4">
                            <Form method="post" className="space-y-4">
                              <input
                                type="hidden"
                                name="_action"
                                value="addLink"
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-primary mb-2">
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
                                  <label className="block text-sm font-medium text-primary mb-2">
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
                              <div className="flex gap-4 justify-center">
                                <button
                                  type="submit"
                                  className="accent-orange text-on-accent px-6 py-3 rounded-xl font-semibold hover-lift transition-all"
                                >
                                  <i className="fas fa-plus mr-2"></i>
                                  Add Link
                                </button>
                                <Link
                                  to="/profile"
                                  className="bg-secondary text-primary px-6 py-3 rounded-xl font-semibold hover-lift border-2 border-theme transition-all"
                                >
                                  Cancel
                                </Link>
                              </div>
                            </Form>
                          </div>
                        ) : (
                          <Link
                            to="?add-link=true"
                            className="accent-orange text-on-accent px-6 py-3 rounded-xl font-semibold hover-lift transition-all inline-flex items-center"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Add Link
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Delete Link Forms (hidden) */}
                    {profile.links.map((link) => (
                      <Form
                        key={`delete-${link.id}`}
                        method="post"
                        className="hidden"
                      >
                        <input
                          type="hidden"
                          name="_action"
                          value="deleteLink"
                        />
                        <input type="hidden" name="linkId" value={link.id} />
                      </Form>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Edit Modal */}
        {isModalOpen && modalConfig && (
          <EditModal
            isOpen={isModalOpen}
            onClose={() => {}}
            onCloseUrl={getCloseModalUrl()}
            title={modalConfig.title}
            type={modalConfig.type}
            defaultValues={modalConfig.defaultValues}
            fields={modalConfig.fields}
            action={modalConfig.action}
          />
        )}
      </div>

      {/* Public View Button - only show if profile exists */}
      {profile && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            to={`/m/${profile.maker_name}`}
            className="bg-secondary text-primary px-6 py-3 rounded-full text-base font-semibold hover-lift border-2 border-theme transition-all shadow-lg flex items-center"
          >
            <i className="fas fa-globe mr-2"></i>
            Public View
          </Link>
        </div>
      )}
    </Layout>
  );
}

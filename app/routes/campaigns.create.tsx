import { json, redirect } from "react-router";
import type { Route } from "./+types/campaigns.create";
import { Form, Link } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import {
  createCampaign,
  generateSlug,
  isSlugAvailable,
  type CreateCampaignData,
} from "~/lib/campaigns.server";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);

  return { user };
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "create") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const shortDescription = formData.get("shortDescription") as string;
    const heroVideoUrl = formData.get("heroVideoUrl") as string;
    const storyContent = formData.get("storyContent") as string;
    const fundingGoal = parseInt(formData.get("fundingGoal") as string);
    const category = formData.get("category") as string;
    const estimatedShippingDate = formData.get("estimatedShippingDate") as string;
    const endsAt = formData.get("endsAt") as string;

    // Validation
    if (!title || !fundingGoal || fundingGoal <= 0) {
      return {
        error: "Title and valid funding goal are required",
        values: { title, description, shortDescription, heroVideoUrl, storyContent, fundingGoal, category, estimatedShippingDate, endsAt }
      };
    }

    // Generate and validate slug
    let slug = generateSlug(title);
    const slugAvailable = await isSlugAvailable(db, slug);

    if (!slugAvailable) {
      // Add a number to make it unique
      let counter = 1;
      let uniqueSlug = `${slug}-${counter}`;
      while (!(await isSlugAvailable(db, uniqueSlug))) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
      slug = uniqueSlug;
    }

    try {
      const campaignData: CreateCampaignData = {
        title,
        slug,
        description: description || undefined,
        short_description: shortDescription || undefined,
        hero_video_url: heroVideoUrl || undefined,
        story_content: storyContent || undefined,
        funding_goal: fundingGoal,
        category: category || undefined,
        estimated_shipping_date: estimatedShippingDate || undefined,
        ends_at: endsAt || undefined,
      };

      const campaign = await createCampaign(
        db,
        user.id,
        campaignData
      );

      return redirect(`/campaigns/${campaign.slug}/edit?success=Created`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      return {
        error: "Failed to create campaign. Please try again.",
        values: { title, description, shortDescription, heroVideoUrl, storyContent, fundingGoal, category, estimatedShippingDate, endsAt }
      };
    }
  }

  return { error: "Invalid action" };
}

export default function CampaignCreate({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = loaderData;
  const error = actionData?.error;
  const values = actionData?.values || {};

  return (
    <Layout>
      <Navigation user={user} />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                to="/profile/campaigns"
                className="text-secondary hover:text-primary transition-colors"
              >
                ← Back to Campaigns
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Create New Campaign
            </h1>
            <p className="text-secondary text-lg">
              Launch your project and bring it to life with backing from the Guild community.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Creation Form */}
          <Form method="post" className="space-y-8">
            <input type="hidden" name="_action" value="create" />

            {/* Basic Information */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Basic Information</h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-primary mb-2">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    defaultValue={values.title}
                    required
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="Enter your campaign title"
                  />
                </div>

                <div>
                  <label htmlFor="shortDescription" className="block text-sm font-medium text-primary mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    id="shortDescription"
                    name="shortDescription"
                    defaultValue={values.shortDescription}
                    maxLength={160}
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="Brief description for campaign cards (max 160 characters)"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-primary mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={values.description}
                    rows={4}
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="Describe your campaign"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-primary mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      defaultValue={values.category}
                      className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    >
                      <option value="">Select a category</option>
                      <option value="electronics">Electronics</option>
                      <option value="software">Software</option>
                      <option value="hardware">Hardware</option>
                      <option value="art">Art & Design</option>
                      <option value="music">Music</option>
                      <option value="education">Education</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fundingGoal" className="block text-sm font-medium text-primary mb-2">
                      Funding Goal (₹) *
                    </label>
                    <input
                      type="number"
                      id="fundingGoal"
                      name="fundingGoal"
                      defaultValue={values.fundingGoal}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                      placeholder="Enter funding goal"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Media</h2>

              <div>
                <label htmlFor="heroVideoUrl" className="block text-sm font-medium text-primary mb-2">
                  Hero Video URL
                </label>
                <input
                  type="url"
                  id="heroVideoUrl"
                  name="heroVideoUrl"
                  defaultValue={values.heroVideoUrl}
                  className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  placeholder="YouTube or Vimeo URL"
                />
                <p className="text-xs text-secondary mt-2">
                  Add a YouTube or Vimeo URL to showcase your project. This will be automatically embedded and thumbnails will be generated.
                </p>
              </div>
            </div>

            {/* Story Content */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Campaign Story</h2>

              <div>
                <label htmlFor="storyContent" className="block text-sm font-medium text-primary mb-2">
                  Story Content
                </label>
                <textarea
                  id="storyContent"
                  name="storyContent"
                  defaultValue={values.storyContent}
                  rows={10}
                  className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  placeholder="Tell the story of your project. You can use Markdown formatting."
                />
                <p className="text-xs text-secondary mt-2">
                  Supports Markdown formatting. Tell backers what makes your project special, your inspiration, and how you plan to deliver.
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Timeline</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="estimatedShippingDate" className="block text-sm font-medium text-primary mb-2">
                    Estimated Shipping Date
                  </label>
                  <input
                    type="date"
                    id="estimatedShippingDate"
                    name="estimatedShippingDate"
                    defaultValue={values.estimatedShippingDate}
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  />
                </div>

                <div>
                  <label htmlFor="endsAt" className="block text-sm font-medium text-primary mb-2">
                    Campaign End Date
                  </label>
                  <input
                    type="date"
                    id="endsAt"
                    name="endsAt"
                    defaultValue={values.endsAt}
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Link
                to="/profile/campaigns"
                className="px-6 py-3 border border-theme rounded-lg text-primary hover:bg-tertiary transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-3 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Create Campaign
              </button>
            </div>
          </Form>
        </div>
      </main>
    </Layout>
  );
}
import { json, redirect } from "react-router";
import type { Route } from "./+types/campaigns.$slug.edit";
import { Form, Link, useSearchParams } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import {
  getCampaignBySlug,
  updateCampaign,
  generateSlug,
  isSlugAvailable,
  type UpdateCampaignData,
} from "~/lib/campaigns.server";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);
  const campaign = await getCampaignBySlug(db, params.slug);

  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }

  // Check if user owns this campaign
  if (campaign.creator_id !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const url = new URL(request.url);
  const success = url.searchParams.get("success");

  return { user, campaign, success };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);
  const campaign = await getCampaignBySlug(db, params.slug);

  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }

  if (campaign.creator_id !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "update") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const shortDescription = formData.get("shortDescription") as string;
    const heroVideoUrl = formData.get("heroVideoUrl") as string;
    const storyContent = formData.get("storyContent") as string;
    const fundingGoal = parseInt(formData.get("fundingGoal") as string);
    const category = formData.get("category") as string;
    const estimatedShippingDate = formData.get("estimatedShippingDate") as string;
    const endsAt = formData.get("endsAt") as string;
    const status = formData.get("status") as string;

    // Validation
    if (!title || !fundingGoal || fundingGoal <= 0) {
      return {
        error: "Title and valid funding goal are required",
        values: { title, description, shortDescription, heroVideoUrl, storyContent, fundingGoal, category, estimatedShippingDate, endsAt, status }
      };
    }

    try {
      const updateData: UpdateCampaignData = {
        id: campaign.id,
        title,
        description: description || undefined,
        short_description: shortDescription || undefined,
        hero_video_url: heroVideoUrl || undefined,
        story_content: storyContent || undefined,
        funding_goal: fundingGoal,
        category: category || undefined,
        estimated_shipping_date: estimatedShippingDate || undefined,
        ends_at: endsAt || undefined,
      };

      // Handle slug change if title changed
      if (title !== campaign.title) {
        const newSlug = generateSlug(title);
        if (newSlug !== campaign.slug) {
          const slugAvailable = await isSlugAvailable(db, newSlug, campaign.id);
          if (slugAvailable) {
            updateData.slug = newSlug;
          }
        }
      }

      // Only update status if it's a valid transition
      if (status && ["draft", "active", "funded", "shipped", "cancelled"].includes(status)) {
        (updateData as any).status = status;
      }

      const updatedCampaign = await updateCampaign(db, updateData);

      const finalSlug = updateData.slug || campaign.slug;
      return redirect(`/campaigns/${finalSlug}/edit?success=Updated`);
    } catch (error) {
      console.error("Error updating campaign:", error);
      return {
        error: "Failed to update campaign. Please try again.",
        values: { title, description, shortDescription, heroVideoUrl, storyContent, fundingGoal, category, estimatedShippingDate, endsAt, status }
      };
    }
  }

  return { error: "Invalid action" };
}

export default function CampaignEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { user, campaign, success } = loaderData;
  const [searchParams] = useSearchParams();
  const error = actionData?.error;
  const values = actionData?.values || {};

  // Use form values if available, otherwise use campaign data
  const currentValues = {
    title: values.title ?? campaign.title,
    description: values.description ?? campaign.description,
    shortDescription: values.shortDescription ?? campaign.short_description,
    heroVideoUrl: values.heroVideoUrl ?? campaign.hero_video_url,
    storyContent: values.storyContent ?? campaign.story_content,
    fundingGoal: values.fundingGoal ?? campaign.funding_goal,
    category: values.category ?? campaign.category,
    estimatedShippingDate: values.estimatedShippingDate ?? campaign.estimated_shipping_date,
    endsAt: values.endsAt ?? campaign.ends_at,
    status: values.status ?? campaign.status,
  };

  return (
    <Layout>
      <Navigation user={user} />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/profile/campaigns"
                className="text-secondary hover:text-primary transition-colors"
              >
                ← Back to Campaigns
              </Link>
              <div className="flex items-center space-x-4">
                <Link
                  to={`/campaigns/${campaign.slug}`}
                  className="px-4 py-2 border border-theme rounded-lg text-primary hover:bg-tertiary transition-colors"
                >
                  View Campaign
                </Link>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  campaign.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                  campaign.status === 'funded' ? 'bg-blue-500/20 text-blue-400' :
                  campaign.status === 'shipped' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {campaign.status}
                </span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Edit Campaign
            </h1>
            <p className="text-secondary text-lg">
              Update your campaign details and content.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center justify-between">
              <p className="text-green-400">{success}</p>
              <Link
                to={`/campaigns/${campaign.slug}/edit`}
                className="text-green-400 hover:text-green-300"
              >
                ✕
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-secondary border border-theme rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">₹{campaign.current_funding.toLocaleString()}</div>
              <div className="text-sm text-secondary">of ₹{campaign.funding_goal.toLocaleString()} raised</div>
            </div>
            <div className="bg-secondary border border-theme rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{Math.round((campaign.current_funding / campaign.funding_goal) * 100)}%</div>
              <div className="text-sm text-secondary">funded</div>
            </div>
            <div className="bg-secondary border border-theme rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{campaign.views_count || 0}</div>
              <div className="text-sm text-secondary">views</div>
            </div>
          </div>

          {/* Editing Form */}
          <Form method="post" className="space-y-8">
            <input type="hidden" name="_action" value="update" />

            {/* Status Management */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Campaign Status</h2>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-primary mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={currentValues.status}
                  className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                >
                  <option value="draft">Draft - Not visible to public</option>
                  <option value="active">Active - Accepting backers</option>
                  <option value="funded">Funded - Goal reached</option>
                  <option value="shipped">Shipped - Orders fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

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
                    defaultValue={currentValues.title}
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
                    defaultValue={currentValues.shortDescription}
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
                    defaultValue={currentValues.description}
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
                      defaultValue={currentValues.category}
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
                      defaultValue={currentValues.fundingGoal}
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
                  defaultValue={currentValues.heroVideoUrl}
                  className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  placeholder="YouTube or Vimeo URL"
                />
                <p className="text-xs text-secondary mt-2">
                  Add a YouTube or Vimeo URL to showcase your project. This will be automatically embedded and thumbnails will be generated.
                </p>
                {campaign.hero_video_embed && (
                  <div className="mt-4 p-4 bg-tertiary rounded-lg">
                    <p className="text-xs text-secondary mb-2">Current video preview:</p>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <iframe
                        src={campaign.hero_video_embed}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
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
                  defaultValue={currentValues.storyContent}
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
                    defaultValue={currentValues.estimatedShippingDate?.split('T')[0]}
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
                    defaultValue={currentValues.endsAt?.split('T')[0]}
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Link
                to={`/campaigns/${campaign.slug}`}
                className="px-6 py-3 border border-theme rounded-lg text-primary hover:bg-tertiary transition-colors text-center"
              >
                View Campaign
              </Link>
              <button
                type="submit"
                className="px-6 py-3 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Update Campaign
              </button>
            </div>
          </Form>
        </div>
      </main>
    </Layout>
  );
}
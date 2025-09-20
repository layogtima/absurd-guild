import { json } from "react-router";
import type { Route } from "./+types/campaigns.$slug";
import { useSearchParams } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { getCampaignBySlug, incrementCampaignViews } from "~/lib/campaigns.server";
import { getOptionalAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { CampaignHero } from "~/components/campaigns/CampaignHero";
import { BackingPanel } from "~/components/campaigns/BackingPanel";
import { StorySection } from "~/components/campaigns/StorySection";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await getOptionalAuth(request, authService);
  const campaign = await getCampaignBySlug(db, params.slug);

  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }

  // Only show if campaign is active or user is the creator
  if (campaign.status === 'draft' && (!user || campaign.creator_id !== user.id)) {
    throw new Response("Campaign not found", { status: 404 });
  }

  // Increment view count (could be optimized to avoid on every request)
  try {
    await incrementCampaignViews(db, campaign.id);
  } catch (error) {
    console.error("Failed to increment view count:", error);
  }

  return { user, campaign };
}

export default function CampaignSlug({ loaderData }: Route.ComponentProps) {
  const { user, campaign } = loaderData;
  const [searchParams] = useSearchParams();

  // Calculate progress
  const fundingPercentage = Math.round((campaign.current_funding / campaign.funding_goal) * 100);
  const isOwner = user && user.id === campaign.creator_id;

  return (
    <Layout>
      <Navigation user={user} />

      <main className="relative">
        {/* Hero Section */}
        <CampaignHero campaign={campaign} isOwner={isOwner} />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12 lg:pr-96 mb-20">
          {/* Campaign Info */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-primary">
                  {campaign.title}
                </h1>
                {campaign.status === 'draft' && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                    Draft
                  </span>
                )}
              </div>
            </div>

            {campaign.description && (
              <p className="text-xl text-secondary leading-relaxed max-w-4xl">
                {campaign.description}
              </p>
            )}

            {/* Campaign Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-secondary border border-theme rounded-xl p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  ₹{campaign.current_funding.toLocaleString()}
                </div>
                <div className="text-sm text-secondary">
                  raised of ₹{campaign.funding_goal.toLocaleString()} goal
                </div>
                <div className="w-full bg-tertiary rounded-full h-2 mt-3">
                  <div
                    className="bg-accent-orange h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-secondary border border-theme rounded-xl p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {fundingPercentage}%
                </div>
                <div className="text-sm text-secondary">funded</div>
              </div>

              <div className="bg-secondary border border-theme rounded-xl p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {campaign.views_count || 0}
                </div>
                <div className="text-sm text-secondary">views</div>
              </div>
            </div>
          </div>

          {/* Story Section */}
          <StorySection campaign={campaign} />

          {/* Additional sections would go here: FAQ, Updates, etc. */}
        </div>

        {/* Floating Backing Panel */}
        <BackingPanel campaign={campaign} user={user} />
      </main>
    </Layout>
  );
}
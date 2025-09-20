import { json } from "react-router";
import type { Route } from "./+types/campaigns._index";
import { Link, useSearchParams } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { getActiveCampaigns } from "~/lib/campaigns.server";
import { getOptionalAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await getOptionalAuth(request, authService);

  // For now, get active campaigns. In the future, we could add filtering/search
  const campaigns = await getActiveCampaigns(db, 50);

  return { user, campaigns };
}

function CampaignCard({ campaign }: { campaign: any }) {
  const fundingPercentage = Math.round((campaign.current_funding / campaign.funding_goal) * 100);
  const commitmentAmount = Math.round((campaign.funding_goal * campaign.commitment_percentage) / 100 / 100); // Rough estimate

  return (
    <Link to={`/campaigns/${campaign.slug}`} className="group">
      <div className="bg-secondary border border-theme rounded-2xl overflow-hidden hover:border-accent-orange transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Image/Video Thumbnail */}
        <div className="aspect-video bg-tertiary relative overflow-hidden">
          {campaign.hero_video_thumbnail ? (
            <img
              src={campaign.hero_video_thumbnail}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-secondary">
              <div className="text-center">
                <div className="text-4xl mb-2">🚀</div>
                <p className="text-sm">No image</p>
              </div>
            </div>
          )}

          {/* Progress Badge */}
          <div className="absolute top-4 left-4 bg-accent-orange text-on-accent px-3 py-1 rounded-full text-sm font-bold">
            {fundingPercentage}% funded
          </div>

          {/* Category Badge */}
          {campaign.category && (
            <div className="absolute top-4 right-4 bg-secondary/90 text-primary px-3 py-1 rounded-full text-xs font-medium capitalize backdrop-blur-sm">
              {campaign.category}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-primary mb-2 line-clamp-2 group-hover:text-accent-orange transition-colors">
            {campaign.title}
          </h3>

          {campaign.short_description && (
            <p className="text-secondary text-sm mb-4 line-clamp-3">
              {campaign.short_description}
            </p>
          )}

          {/* Funding Progress */}
          <div className="space-y-3 mb-4">
            <div className="w-full bg-tertiary rounded-full h-2">
              <div
                className="bg-accent-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-secondary">₹{campaign.current_funding.toLocaleString()}</span>
              <span className="text-primary font-medium">₹{campaign.funding_goal.toLocaleString()}</span>
            </div>
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-3 gap-4 text-center border-t border-theme pt-4">
            <div>
              <div className="text-lg font-bold text-accent-orange">₹{commitmentAmount.toLocaleString()}</div>
              <div className="text-xs text-secondary">commitment</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{fundingPercentage}%</div>
              <div className="text-xs text-secondary">funded</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{campaign.views_count || 0}</div>
              <div className="text-xs text-secondary">views</div>
            </div>
          </div>

          {/* India-First Badge */}
          <div className="mt-4 flex items-center justify-center">
            <div className="bg-gradient-to-r from-accent-orange/20 to-orange-600/20 text-accent-orange px-3 py-1 rounded-full text-xs font-medium border border-accent-orange/30">
              <i className="fas fa-shield-alt mr-1"></i>
              India-First Commitment
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CampaignsIndex({ loaderData }: Route.ComponentProps) {
  const { user, campaigns } = loaderData;
  const [searchParams] = useSearchParams();

  return (
    <Layout>
      <Navigation user={user} />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-primary mb-6">
              Discover Amazing{" "}
              <span className="text-accent-orange">Campaigns</span>
            </h1>
            <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
              Support innovative projects from creators across India with our unique commitment system.
              Pay only 40% upfront, rest on delivery.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <span className="text-secondary">
                {campaigns.length} active campaigns
              </span>
            </div>

            {user && (
              <Link
                to="/campaigns/create"
                className="px-6 py-3 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Create Campaign
              </Link>
            )}
          </div>

          {/* Campaigns Grid */}
          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20">
              <div className="text-8xl mb-8">🚀</div>
              <h2 className="text-3xl font-bold text-primary mb-4">
                No Active Campaigns Yet
              </h2>
              <p className="text-xl text-secondary mb-8 max-w-2xl mx-auto">
                Be the first to launch an innovative project on our platform.
                With our India-first commitment system, it's easier than ever to get started.
              </p>
              {user ? (
                <Link
                  to="/campaigns/create"
                  className="inline-flex items-center px-8 py-4 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
                >
                  Launch Your Campaign
                </Link>
              ) : (
                <Link
                  to="/auth/login"
                  className="inline-flex items-center px-8 py-4 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
                >
                  Join & Create Campaign
                </Link>
              )}
            </div>
          )}

          {/* Info Section */}
          <section className="mt-20 bg-gradient-to-r from-accent-orange/10 to-orange-600/10 rounded-3xl p-12 border border-accent-orange/20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-primary mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-secondary max-w-3xl mx-auto">
                We've reimagined crowdfunding for the Indian market with features that protect both creators and backers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-alt text-accent-orange text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">India-First Commitment</h3>
                <p className="text-secondary">
                  Pay only 40% upfront, rest on delivery. Full refund if project doesn't deliver.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-accent-orange text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Community Driven</h3>
                <p className="text-secondary">
                  Join a community of innovators, makers, and supporters who believe in Indian creativity.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-rocket text-accent-orange text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Innovation Focus</h3>
                <p className="text-secondary">
                  We support cutting-edge projects that push boundaries and solve real problems.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
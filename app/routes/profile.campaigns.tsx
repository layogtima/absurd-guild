import { json } from "react-router";
import type { Route } from "./+types/profile.campaigns";
import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { getCampaignsByCreator } from "~/lib/campaigns.server";
import { requireAuth, createAuthService } from "~/lib/auth.server";
import { getDB, getKV, getEnv } from "~/lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await requireAuth(request, authService);
  const campaigns = await getCampaignsByCreator(db, user.id, 50);

  return { user, campaigns };
}

function CampaignCard({ campaign }: { campaign: any }) {
  const fundingPercentage = Math.round((campaign.current_funding / campaign.funding_goal) * 100);

  return (
    <div className="bg-secondary border border-theme rounded-2xl p-6 hover:border-accent-orange transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-primary truncate">
              {campaign.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
              campaign.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
              campaign.status === 'funded' ? 'bg-blue-500/20 text-blue-400' :
              campaign.status === 'shipped' ? 'bg-purple-500/20 text-purple-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {campaign.status}
            </span>
          </div>

          {campaign.short_description && (
            <p className="text-secondary text-sm mb-4 line-clamp-2">
              {campaign.short_description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Funding Progress</span>
              <span className="text-primary font-medium">{fundingPercentage}%</span>
            </div>
            <div className="w-full bg-tertiary rounded-full h-2">
              <div
                className="bg-accent-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-secondary">
              <span>₹{campaign.current_funding.toLocaleString()}</span>
              <span>₹{campaign.funding_goal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {campaign.hero_video_thumbnail && (
          <div className="ml-4 flex-shrink-0">
            <img
              src={campaign.hero_video_thumbnail}
              alt={campaign.title}
              className="w-20 h-12 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-secondary mb-4">
        <span>{campaign.views_count || 0} views</span>
        <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex space-x-2">
        <Link
          to={`/campaigns/${campaign.slug}`}
          className="flex-1 px-3 py-2 text-center bg-tertiary border border-theme rounded-lg text-primary hover:bg-accent-orange hover:text-on-accent transition-colors text-sm font-medium"
        >
          View
        </Link>
        <Link
          to={`/campaigns/${campaign.slug}/edit`}
          className="flex-1 px-3 py-2 text-center bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

export default function ProfileCampaigns({ loaderData }: Route.ComponentProps) {
  const { user, campaigns } = loaderData;

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const draftCampaigns = campaigns.filter(c => c.status === 'draft');
  const fundedCampaigns = campaigns.filter(c => c.status === 'funded');
  const otherCampaigns = campaigns.filter(c => !['active', 'draft', 'funded'].includes(c.status));

  const totalFunding = campaigns.reduce((sum, c) => sum + c.current_funding, 0);
  const totalGoal = campaigns.reduce((sum, c) => sum + c.funding_goal, 0);
  const totalViews = campaigns.reduce((sum, c) => sum + (c.views_count || 0), 0);

  return (
    <Layout>
      <Navigation user={user} />

      <main className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/profile"
                className="text-secondary hover:text-primary transition-colors"
              >
                ← Back to Profile
              </Link>
              <Link
                to="/campaigns/create"
                className="px-6 py-3 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Create Campaign
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              My Campaigns
            </h1>
            <p className="text-secondary text-lg">
              Manage your campaigns and track their progress.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-secondary border border-theme rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{campaigns.length}</div>
              <div className="text-sm text-secondary">Total Campaigns</div>
            </div>
            <div className="bg-secondary border border-theme rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">₹{totalFunding.toLocaleString()}</div>
              <div className="text-sm text-secondary">Total Raised</div>
            </div>
            <div className="bg-secondary border border-theme rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{Math.round((totalFunding / Math.max(totalGoal, 1)) * 100)}%</div>
              <div className="text-sm text-secondary">Average Success</div>
            </div>
            <div className="bg-secondary border border-theme rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{totalViews.toLocaleString()}</div>
              <div className="text-sm text-secondary">Total Views</div>
            </div>
          </div>

          {campaigns.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-primary mb-2">
                No campaigns yet
              </h2>
              <p className="text-secondary mb-6 max-w-md mx-auto">
                Ready to launch your first project? Create a campaign and start building something amazing with the Guild community.
              </p>
              <Link
                to="/campaigns/create"
                className="inline-flex items-center px-6 py-3 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Create Your First Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Campaigns */}
              {activeCampaigns.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-4">
                    Active Campaigns ({activeCampaigns.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeCampaigns.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                </div>
              )}

              {/* Draft Campaigns */}
              {draftCampaigns.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-4">
                    Drafts ({draftCampaigns.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {draftCampaigns.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                </div>
              )}

              {/* Funded Campaigns */}
              {fundedCampaigns.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-4">
                    Funded Campaigns ({fundedCampaigns.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fundedCampaigns.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Campaigns */}
              {otherCampaigns.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-4">
                    Other Campaigns ({otherCampaigns.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherCampaigns.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
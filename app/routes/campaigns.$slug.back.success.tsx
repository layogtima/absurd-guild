import { json } from "react-router";
import type { Route } from "./+types/campaigns.$slug.back.success";
import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { getCampaignBySlug } from "~/lib/campaigns.server";
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

  const url = new URL(request.url);
  const backingId = url.searchParams.get("backingId");

  return { user, campaign, backingId };
}

export default function CampaignBackSuccess({ loaderData }: Route.ComponentProps) {
  const { user, campaign, backingId } = loaderData;

  return (
    <Layout>
      <Navigation user={user} />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-white text-3xl"></i>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4">
              Congratulations!
            </h1>
            <p className="text-xl text-secondary max-w-2xl mx-auto">
              You've successfully backed <strong>{campaign.title}</strong> with our India-first commitment system.
            </p>
          </div>

          {/* Backing Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* What Happens Next */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">What Happens Next?</h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">Confirmation Email</h3>
                    <p className="text-secondary text-sm">
                      We've sent a confirmation email to {user.email} with your backing details.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">Stay Updated</h3>
                    <p className="text-secondary text-sm">
                      The creator will post updates about the campaign progress. You'll be notified of major milestones.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">Production & Delivery</h3>
                    <p className="text-secondary text-sm">
                      When your reward is ready to ship, we'll charge the remaining amount and send tracking details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Backing Summary */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Your Backing</h2>

              <div className="space-y-4">
                <div className="bg-tertiary rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-secondary">Backing ID:</span>
                    <span className="text-primary font-mono">{backingId}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-secondary">Campaign:</span>
                    <span className="text-primary font-medium">{campaign.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Date:</span>
                    <span className="text-primary">{new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-accent-orange/10 to-orange-600/10 rounded-lg p-4 border border-accent-orange/20">
                  <div className="text-center mb-3">
                    <div className="text-xs font-bold text-secondary tracking-wider">
                      INDIA-FIRST COMMITMENT
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Paid now:</span>
                      <span className="text-xl font-bold text-accent-orange">₹2,222</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-secondary">Pay on delivery:</span>
                      <span className="text-primary font-medium">₹3,333</span>
                    </div>
                    <div className="border-t border-accent-orange/20 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">Total reward:</span>
                        <span className="text-primary font-bold">₹5,555</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <Link
                to={`/campaigns/${campaign.slug}`}
                className="px-6 py-3 border border-theme rounded-lg text-primary hover:bg-tertiary transition-colors font-medium text-center"
              >
                View Campaign
              </Link>
              <Link
                to="/campaigns"
                className="px-6 py-3 border border-theme rounded-lg text-primary hover:bg-tertiary transition-colors font-medium text-center"
              >
                Browse Campaigns
              </Link>
              <Link
                to="/profile"
                className="px-6 py-3 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-medium text-center"
              >
                View Profile
              </Link>
            </div>

            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-primary mb-4">Share the Love</h3>
              <p className="text-secondary mb-4">
                Help this campaign reach more supporters by sharing it with your network.
              </p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/campaigns/${campaign.slug}`;
                    const text = `Check out this amazing campaign: ${campaign.title}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                >
                  <i className="fab fa-twitter"></i>
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/campaigns/${campaign.slug}`;
                    const text = `Check out this amazing campaign: ${campaign.title}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                  }}
                  className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                >
                  <i className="fab fa-whatsapp"></i>
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/campaigns/${campaign.slug}`;
                    navigator.clipboard.writeText(url);
                    // Could add a toast notification here
                  }}
                  className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                >
                  <i className="fas fa-link"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-primary mb-2">Need Help?</h3>
            <p className="text-secondary mb-4">
              If you have any questions about your backing or the campaign, we're here to help.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/support"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                to="/faq"
                className="px-4 py-2 border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
              >
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
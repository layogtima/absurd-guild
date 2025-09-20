import { json, redirect } from "react-router";
import type { Route } from "./+types/campaigns.$slug.back.confirm";
import { Form, Link } from "react-router";
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

  // Get backing details from URL params
  const url = new URL(request.url);
  const rewardTier = url.searchParams.get("rewardTier");
  const shippingName = url.searchParams.get("shippingName");
  const shippingAddress = url.searchParams.get("shippingAddress");
  const shippingCity = url.searchParams.get("shippingCity");
  const shippingState = url.searchParams.get("shippingState");
  const shippingPincode = url.searchParams.get("shippingPincode");
  const shippingPhone = url.searchParams.get("shippingPhone");

  if (!rewardTier || !shippingName) {
    throw redirect(`/campaigns/${campaign.slug}/back`);
  }

  const backingDetails = {
    rewardTier,
    shippingName,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingPincode,
    shippingPhone,
  };

  return { user, campaign, backingDetails };
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

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "confirm_payment") {
    // In a real implementation, you would:
    // 1. Create payment session with Razorpay
    // 2. Store the backing in database with 'pending' status
    // 3. Redirect to payment gateway
    // 4. Handle payment webhook to update status

    // For now, simulate successful payment and redirect to success
    const backingId = Math.random().toString(36).substr(2, 9); // Generate fake backing ID
    return redirect(`/campaigns/${campaign.slug}/back/success?backingId=${backingId}`);
  }

  return { error: "Invalid action" };
}

export default function CampaignBackConfirm({ loaderData, actionData }: Route.ComponentProps) {
  const { user, campaign, backingDetails } = loaderData;
  const error = actionData?.error;

  // Sample reward tiers (should match the ones in back.tsx)
  const rewardTiers = [
    {
      id: "early-bird",
      title: "Early Bird Special",
      price: 5555,
      description: "Get the product at a special early bird price. Limited quantity.",
      estimatedDelivery: "March 2024",
    },
    {
      id: "standard",
      title: "Standard Edition",
      price: 7777,
      description: "The full product experience with all standard features.",
      estimatedDelivery: "April 2024",
    },
    {
      id: "premium",
      title: "Premium Package",
      price: 11111,
      description: "Premium version with extras, priority support, and exclusive content.",
      estimatedDelivery: "April 2024",
    },
  ];

  const selectedReward = rewardTiers.find(r => r.id === backingDetails.rewardTier) || rewardTiers[0];
  const commitmentAmount = Math.round(selectedReward.price * (campaign.commitment_percentage / 100));
  const deliveryAmount = selectedReward.price - commitmentAmount;

  return (
    <Layout>
      <Navigation user={user} />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <Link
              to={`/campaigns/${campaign.slug}/back`}
              className="text-secondary hover:text-primary transition-colors mb-4 inline-block"
            >
              ← Back to Backing Details
            </Link>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Confirm Your Backing
            </h1>
            <p className="text-secondary text-lg">
              Review your order and payment details before proceeding.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Summary */}
              <div className="bg-secondary border border-theme rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-primary mb-4">Campaign</h2>
                <div className="flex items-start space-x-4">
                  {campaign.hero_video_thumbnail && (
                    <img
                      src={campaign.hero_video_thumbnail}
                      alt={campaign.title}
                      className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-2">{campaign.title}</h3>
                    <p className="text-secondary text-sm line-clamp-2">
                      {campaign.description || "Support this innovative project"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Reward */}
              <div className="bg-secondary border border-theme rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-primary mb-4">Your Reward</h2>
                <div className="border border-accent-orange bg-accent-orange/5 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-primary">{selectedReward.title}</h3>
                    <div className="text-2xl font-bold text-accent-orange">
                      ₹{selectedReward.price.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-secondary mb-3">{selectedReward.description}</p>
                  <div className="text-sm text-secondary">
                    <i className="fas fa-calendar mr-2"></i>
                    Estimated delivery: {selectedReward.estimatedDelivery}
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-secondary border border-theme rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-primary mb-4">Shipping Address</h2>
                <div className="bg-tertiary rounded-lg p-4">
                  <div className="text-primary font-medium mb-2">{backingDetails.shippingName}</div>
                  <div className="text-secondary text-sm space-y-1">
                    <div>{backingDetails.shippingAddress}</div>
                    <div>
                      {backingDetails.shippingCity}, {backingDetails.shippingState} {backingDetails.shippingPincode}
                    </div>
                    <div>Phone: {backingDetails.shippingPhone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-secondary border border-theme rounded-2xl p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-primary mb-6">Payment Summary</h2>

                {/* India-First Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gradient-to-r from-accent-orange/10 to-orange-600/10 rounded-lg p-4 border border-accent-orange/20">
                    <div className="text-center mb-3">
                      <div className="text-xs font-bold text-secondary tracking-wider">
                        INDIA-FIRST COMMITMENT
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">Commit now:</span>
                        <span className="text-xl font-bold text-accent-orange">
                          ₹{commitmentAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary">On delivery:</span>
                        <span className="text-primary font-medium">
                          ₹{deliveryAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-theme pt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-secondary">Total Order:</span>
                      <span className="text-primary font-bold">
                        ₹{selectedReward.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-primary mb-3">Payment Method</h3>
                  <div className="bg-tertiary rounded-lg p-4 border border-theme">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">RP</span>
                      </div>
                      <div>
                        <div className="text-primary font-medium">Razorpay</div>
                        <div className="text-secondary text-xs">UPI, Cards, Net Banking</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <i className="fas fa-shield-alt text-green-400 mt-1"></i>
                    <div className="text-sm">
                      <div className="text-green-400 font-medium mb-1">Secure Payment</div>
                      <div className="text-secondary">
                        Your payment is protected. Full refund if project doesn't deliver.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="confirm_payment" />

                  <button
                    type="submit"
                    className="w-full py-4 bg-accent-orange text-on-accent rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors"
                  >
                    Pay ₹{commitmentAmount.toLocaleString()} Now
                  </button>

                  <div className="text-xs text-secondary text-center">
                    By confirming, you agree to our terms and conditions.
                    You'll be charged ₹{commitmentAmount.toLocaleString()} now and ₹{deliveryAmount.toLocaleString()} on delivery.
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
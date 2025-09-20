import { json, redirect } from "react-router";
import type { Route } from "./+types/campaigns.$slug.back";
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

  if (campaign.status !== 'active') {
    throw redirect(`/campaigns/${campaign.slug}?error=Campaign is not accepting backers`);
  }

  return { user, campaign };
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

  if (action === "proceed") {
    const rewardTier = formData.get("rewardTier") as string;
    const shippingName = formData.get("shippingName") as string;
    const shippingAddress = formData.get("shippingAddress") as string;
    const shippingCity = formData.get("shippingCity") as string;
    const shippingState = formData.get("shippingState") as string;
    const shippingPincode = formData.get("shippingPincode") as string;
    const shippingPhone = formData.get("shippingPhone") as string;

    // Validation
    if (!rewardTier || !shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingPincode || !shippingPhone) {
      return {
        error: "Please fill in all required fields",
        values: { rewardTier, shippingName, shippingAddress, shippingCity, shippingState, shippingPincode, shippingPhone }
      };
    }

    // In a real implementation, you would:
    // 1. Create a backing record in the database
    // 2. Store shipping information
    // 3. Generate a payment session
    // 4. Redirect to payment processor

    // For now, redirect to confirmation with the data
    const params = new URLSearchParams({
      rewardTier,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPincode,
      shippingPhone,
    });

    return redirect(`/campaigns/${campaign.slug}/back/confirm?${params}`);
  }

  return { error: "Invalid action" };
}

export default function CampaignBack({ loaderData, actionData }: Route.ComponentProps) {
  const { user, campaign } = loaderData;
  const error = actionData?.error;
  const values = actionData?.values || {};

  // Sample reward tiers (in a real app, these would come from the database)
  const rewardTiers = [
    {
      id: "early-bird",
      title: "Early Bird Special",
      price: 5555,
      description: "Get the product at a special early bird price. Limited quantity.",
      estimatedDelivery: "March 2024",
      available: 45
    },
    {
      id: "standard",
      title: "Standard Edition",
      price: 7777,
      description: "The full product experience with all standard features.",
      estimatedDelivery: "April 2024",
      available: 200
    },
    {
      id: "premium",
      title: "Premium Package",
      price: 11111,
      description: "Premium version with extras, priority support, and exclusive content.",
      estimatedDelivery: "April 2024",
      available: 50
    },
  ];

  const selectedReward = rewardTiers.find(r => r.id === values.rewardTier) || rewardTiers[0];
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
              to={`/campaigns/${campaign.slug}`}
              className="text-secondary hover:text-primary transition-colors mb-4 inline-block"
            >
              ← Back to Campaign
            </Link>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Back This Campaign
            </h1>
            <p className="text-secondary text-lg">
              Support <strong>{campaign.title}</strong> with our India-first commitment system.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <Form method="post" className="space-y-8">
            <input type="hidden" name="_action" value="proceed" />

            {/* Reward Selection */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Choose Your Reward</h2>

              <div className="space-y-4">
                {rewardTiers.map((reward) => (
                  <label key={reward.id} className="block">
                    <input
                      type="radio"
                      name="rewardTier"
                      value={reward.id}
                      defaultChecked={reward.id === (values.rewardTier || rewardTiers[0].id)}
                      className="sr-only peer"
                    />
                    <div className="p-6 border-2 border-theme rounded-xl cursor-pointer peer-checked:border-accent-orange peer-checked:bg-accent-orange/5 hover:border-accent-orange/50 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-primary">{reward.title}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent-orange">₹{reward.price.toLocaleString()}</div>
                          <div className="text-sm text-secondary">{reward.available} left</div>
                        </div>
                      </div>

                      <p className="text-secondary mb-4">{reward.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-secondary">Estimated delivery:</span>
                          <div className="font-medium text-primary">{reward.estimatedDelivery}</div>
                        </div>
                        <div>
                          <span className="text-secondary">Shipping location:</span>
                          <div className="font-medium text-primary">India only</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* India-First Commitment Breakdown */}
            <div className="bg-gradient-to-r from-accent-orange/10 to-orange-600/10 border border-accent-orange/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">India-First Commitment</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-6 bg-secondary rounded-xl border border-theme">
                  <div className="text-lg text-secondary mb-2">Commit Now</div>
                  <div className="text-3xl font-bold text-accent-orange mb-2">
                    ₹{commitmentAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-secondary">
                    {campaign.commitment_percentage}% of total amount
                  </div>
                </div>

                <div className="text-center p-6 bg-secondary rounded-xl border border-theme">
                  <div className="text-lg text-secondary mb-2">Pay on Delivery</div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    ₹{deliveryAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-secondary">
                    {100 - campaign.commitment_percentage}% of total amount
                  </div>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-shield-alt text-accent-orange mt-1"></i>
                  <div className="text-sm text-secondary">
                    <strong className="text-primary">Money-back guarantee:</strong> If this project doesn't deliver as promised, you'll get a full refund of your commitment amount.
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Shipping Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="shippingName" className="block text-sm font-medium text-primary mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="shippingName"
                    name="shippingName"
                    defaultValue={values.shippingName}
                    required
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="shippingPhone" className="block text-sm font-medium text-primary mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="shippingPhone"
                    name="shippingPhone"
                    defaultValue={values.shippingPhone}
                    required
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="shippingAddress" className="block text-sm font-medium text-primary mb-2">
                    Address *
                  </label>
                  <textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    defaultValue={values.shippingAddress}
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="Enter your full address"
                  />
                </div>

                <div>
                  <label htmlFor="shippingCity" className="block text-sm font-medium text-primary mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="shippingCity"
                    name="shippingCity"
                    defaultValue={values.shippingCity}
                    required
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label htmlFor="shippingState" className="block text-sm font-medium text-primary mb-2">
                    State *
                  </label>
                  <select
                    id="shippingState"
                    name="shippingState"
                    defaultValue={values.shippingState}
                    required
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  >
                    <option value="">Select State</option>
                    <option value="AN">Andaman and Nicobar Islands</option>
                    <option value="AP">Andhra Pradesh</option>
                    <option value="AR">Arunachal Pradesh</option>
                    <option value="AS">Assam</option>
                    <option value="BR">Bihar</option>
                    <option value="CH">Chandigarh</option>
                    <option value="CT">Chhattisgarh</option>
                    <option value="DN">Dadra and Nagar Haveli</option>
                    <option value="DD">Daman and Diu</option>
                    <option value="DL">Delhi</option>
                    <option value="GA">Goa</option>
                    <option value="GJ">Gujarat</option>
                    <option value="HR">Haryana</option>
                    <option value="HP">Himachal Pradesh</option>
                    <option value="JK">Jammu and Kashmir</option>
                    <option value="JH">Jharkhand</option>
                    <option value="KA">Karnataka</option>
                    <option value="KL">Kerala</option>
                    <option value="LD">Lakshadweep</option>
                    <option value="MP">Madhya Pradesh</option>
                    <option value="MH">Maharashtra</option>
                    <option value="MN">Manipur</option>
                    <option value="ML">Meghalaya</option>
                    <option value="MZ">Mizoram</option>
                    <option value="NL">Nagaland</option>
                    <option value="OR">Odisha</option>
                    <option value="PY">Puducherry</option>
                    <option value="PB">Punjab</option>
                    <option value="RJ">Rajasthan</option>
                    <option value="SK">Sikkim</option>
                    <option value="TN">Tamil Nadu</option>
                    <option value="TG">Telangana</option>
                    <option value="TR">Tripura</option>
                    <option value="UP">Uttar Pradesh</option>
                    <option value="UT">Uttarakhand</option>
                    <option value="WB">West Bengal</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="shippingPincode" className="block text-sm font-medium text-primary mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    id="shippingPincode"
                    name="shippingPincode"
                    defaultValue={values.shippingPincode}
                    required
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 bg-tertiary border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange"
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>

            {/* Summary & Actions */}
            <div className="bg-secondary border border-theme rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-secondary">Reward:</span>
                  <span className="text-primary font-medium">{selectedReward.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Total Amount:</span>
                  <span className="text-primary font-medium">₹{selectedReward.price.toLocaleString()}</span>
                </div>
                <div className="border-t border-theme pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="text-secondary">Commitment Amount:</span>
                    <span className="text-accent-orange font-bold">₹{commitmentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary mt-1">
                    <span>Charged now</span>
                    <span>₹{deliveryAmount.toLocaleString()} on delivery</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={`/campaigns/${campaign.slug}`}
                  className="flex-1 px-6 py-3 border border-theme rounded-lg text-primary hover:bg-tertiary transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </Form>
        </div>
      </main>
    </Layout>
  );
}
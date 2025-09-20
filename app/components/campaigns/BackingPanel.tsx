import { useState } from "react";
import { Link, Form } from "react-router";

interface BackingPanelProps {
  campaign: {
    id: number;
    title: string;
    slug: string;
    funding_goal: number;
    current_funding: number;
    commitment_percentage: number;
    status: string;
  };
  user?: {
    id: number;
    email: string;
  } | null;
}

export function BackingPanel({ campaign, user }: BackingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedReward, setSelectedReward] = useState<{ price: number; title: string } | null>(null);

  const fundingPercentage = Math.round((campaign.current_funding / campaign.funding_goal) * 100);
  const commitmentAmount = selectedReward ? Math.round(selectedReward.price * (campaign.commitment_percentage / 100)) : 2222;
  const deliveryAmount = selectedReward ? Math.round(selectedReward.price * ((100 - campaign.commitment_percentage) / 100)) : 3333;

  // Sample reward tiers (in a real app, these would come from the database)
  const rewardTiers = [
    { id: 1, title: "Early Bird Special", price: 5555, description: "Get the product at a special early bird price" },
    { id: 2, title: "Standard Edition", price: 7777, description: "The full product experience" },
    { id: 3, title: "Premium Package", price: 11111, description: "Premium version with extras" },
  ];

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRewardSelect = (reward: { price: number; title: string }) => {
    setSelectedReward(reward);
  };

  return (
    <>
      {/* Overlay for mobile when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Panel */}
      <div className={`
        fixed z-50 bg-secondary border-2 border-theme rounded-2xl shadow-2xl transition-all duration-300 ease-out
        ${isExpanded ? 'expanded' : 'collapsed'}
        lg:bottom-8 lg:right-8 lg:max-w-md
        max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:rounded-b-none max-lg:rounded-t-2xl
        ${isExpanded ? 'max-lg:translate-y-0' : 'max-lg:translate-y-[calc(100%-80px)]'}
      `}>
        {/* Collapsed State Header */}
        <div
          className="p-4 lg:p-6 cursor-pointer"
          onClick={!isExpanded ? togglePanel : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Progress Ring */}
              <div className="relative w-12 h-12 lg:w-16 lg:h-16">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-tertiary"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${fundingPercentage}, 100`}
                    strokeLinecap="round"
                    className="text-accent-orange"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{fundingPercentage}%</span>
                </div>
              </div>

              <div>
                <div className="text-xl lg:text-2xl font-bold text-primary">
                  ₹{commitmentAmount.toLocaleString()}
                </div>
                <div className="text-sm text-secondary">
                  commitment • 23 days left
                </div>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePanel();
              }}
              className="text-secondary hover:text-primary transition-colors lg:hidden"
            >
              <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-up'} text-lg`}></i>
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t-2 border-theme animate-slide-up max-h-[70vh] lg:max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Campaign Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">₹{campaign.current_funding.toLocaleString()}</div>
                  <div className="text-sm text-secondary">raised</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">147</div>
                  <div className="text-sm text-secondary">backers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-orange">{fundingPercentage}%</div>
                  <div className="text-sm text-secondary">funded</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-tertiary rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-accent-orange to-orange-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                />
              </div>

              {/* India-First Commitment System */}
              <div className="bg-gradient-to-r from-accent-orange/10 to-orange-600/10 rounded-xl p-4 border border-accent-orange/20">
                <div className="text-xs font-bold text-secondary mb-3 text-center tracking-wider">
                  INDIA-FIRST COMMITMENT
                </div>
                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                  <div>
                    <div className="font-bold text-primary">Commit now</div>
                    <div className="text-xl font-bold text-accent-orange">
                      ₹{commitmentAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-primary">Pay on delivery</div>
                    <div className="text-xl font-bold text-primary">
                      ₹{deliveryAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward Selection */}
              <div>
                <h3 className="font-bold text-primary mb-3">Select your reward:</h3>
                <div className="space-y-3">
                  {rewardTiers.map((reward) => (
                    <div
                      key={reward.id}
                      onClick={() => handleRewardSelect(reward)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${selectedReward?.price === reward.price
                          ? 'border-accent-orange bg-accent-orange/10'
                          : 'border-theme bg-tertiary hover:border-accent-orange/50'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-primary">{reward.title}</h4>
                        <span className="font-bold text-accent-orange">₹{reward.price.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-secondary">{reward.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Back This Campaign Button */}
              <div className="space-y-4">
                {user ? (
                  campaign.status === 'active' ? (
                    <Link
                      to={`/campaigns/${campaign.slug}/back`}
                      className="w-full py-4 bg-accent-orange text-on-accent rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                    >
                      Back This Campaign
                    </Link>
                  ) : (
                    <div className="w-full py-4 bg-gray-500 text-white rounded-lg font-bold text-lg text-center opacity-50 cursor-not-allowed">
                      Campaign Not Active
                    </div>
                  )
                ) : (
                  <Link
                    to={`/auth/login?redirectTo=${encodeURIComponent(`/campaigns/${campaign.slug}`)}`}
                    className="w-full py-4 bg-accent-orange text-on-accent rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    Sign In to Back
                  </Link>
                )}

                <div className="text-xs text-secondary text-center">
                  <i className="fas fa-shield-alt text-accent-orange mr-1"></i>
                  Full refund if campaign doesn't deliver
                </div>
              </div>

              {/* Campaign Creator Info */}
              <div className="border-t border-theme pt-4">
                <div className="text-sm text-secondary text-center">
                  Campaign by <span className="text-primary font-medium">Creator Name</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
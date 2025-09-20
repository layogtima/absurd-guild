import { Link } from "react-router";

interface CampaignHeroProps {
  campaign: {
    title: string;
    hero_video_embed?: string;
    hero_video_thumbnail?: string;
    slug: string;
  };
  isOwner?: boolean;
}

export function CampaignHero({ campaign, isOwner }: CampaignHeroProps) {
  return (
    <section className="relative min-h-[60vh] lg:min-h-[70vh] bg-secondary">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12 lg:py-20">
        {/* Owner Actions */}
        {isOwner && (
          <div className="absolute top-6 right-6 z-10">
            <Link
              to={`/campaigns/${campaign.slug}/edit`}
              className="px-4 py-2 bg-accent-orange text-on-accent rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Edit Campaign
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Video/Image */}
          <div className="relative">
            {campaign.hero_video_embed ? (
              <div className="aspect-video rounded-2xl overflow-hidden bg-tertiary border border-theme shadow-2xl">
                <iframe
                  src={campaign.hero_video_embed}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title={`${campaign.title} video`}
                />
              </div>
            ) : campaign.hero_video_thumbnail ? (
              <div className="aspect-video rounded-2xl overflow-hidden bg-tertiary border border-theme shadow-2xl">
                <img
                  src={campaign.hero_video_thumbnail}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-tertiary border-2 border-dashed border-theme flex items-center justify-center">
                <div className="text-center text-secondary">
                  <div className="text-4xl mb-4">🎬</div>
                  <p>No video uploaded yet</p>
                </div>
              </div>
            )}

            {/* Video Play Overlay */}
            {campaign.hero_video_thumbnail && !campaign.hero_video_embed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-accent-orange/90 rounded-full flex items-center justify-center text-on-accent text-2xl hover:bg-accent-orange transition-colors cursor-pointer">
                  <i className="fas fa-play ml-1"></i>
                </div>
              </div>
            )}
          </div>

          {/* Right: Campaign Preview */}
          <div className="lg:pl-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                  Experience the Future
                </h2>
                <p className="text-lg text-secondary leading-relaxed">
                  Join our campaign and be part of something extraordinary.
                  With the India-first commitment system, you only pay 40% upfront
                  and the rest on delivery.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 rounded-lg p-4 border border-theme/50">
                  <div className="text-sm text-secondary mb-1">Commitment</div>
                  <div className="text-2xl font-bold text-accent-orange">40%</div>
                  <div className="text-xs text-secondary">Pay now</div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 border border-theme/50">
                  <div className="text-sm text-secondary mb-1">On Delivery</div>
                  <div className="text-2xl font-bold text-primary">60%</div>
                  <div className="text-xs text-secondary">Pay later</div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-secondary">
                  <i className="fas fa-shield-alt text-accent-orange mr-2"></i>
                  Full refund guarantee if project doesn't deliver
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
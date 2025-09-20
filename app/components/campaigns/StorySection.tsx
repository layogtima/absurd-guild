interface StorySectionProps {
  campaign: {
    story_content?: string;
    description?: string;
    category?: string;
    estimated_shipping_date?: string;
    created_at: string;
  };
}

export function StorySection({ campaign }: StorySectionProps) {
  // Simple markdown-like rendering (for MVP - could use a proper markdown library later)
  const renderContent = (content: string) => {
    if (!content) return null;

    // Simple processing for line breaks and basic formatting
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <br key={index} />;
      }

      // Simple bold and italic handling
      let processed = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      return (
        <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  return (
    <div className="space-y-12">
      {/* Campaign Story */}
      <section>
        <h2 className="text-3xl font-bold text-primary mb-8">About This Campaign</h2>

        <div className="prose prose-lg max-w-none">
          {campaign.story_content ? (
            <div className="text-primary leading-relaxed">
              {renderContent(campaign.story_content)}
            </div>
          ) : campaign.description ? (
            <p className="text-xl text-secondary leading-relaxed">
              {campaign.description}
            </p>
          ) : (
            <div className="bg-tertiary border-2 border-dashed border-theme rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-secondary">No story content has been added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Campaign Details */}
      <section>
        <h2 className="text-3xl font-bold text-primary mb-8">Campaign Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-secondary border border-theme rounded-xl p-6">
            <h3 className="text-xl font-bold text-primary mb-4">Project Info</h3>
            <div className="space-y-3">
              {campaign.category && (
                <div className="flex justify-between">
                  <span className="text-secondary">Category:</span>
                  <span className="text-primary capitalize">{campaign.category}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-secondary">Created:</span>
                <span className="text-primary">
                  {new Date(campaign.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {campaign.estimated_shipping_date && (
                <div className="flex justify-between">
                  <span className="text-secondary">Est. Shipping:</span>
                  <span className="text-primary">
                    {new Date(campaign.estimated_shipping_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-secondary border border-theme rounded-xl p-6">
            <h3 className="text-xl font-bold text-primary mb-4">India-First Promise</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <i className="fas fa-check-circle text-green-400 mt-1"></i>
                <span className="text-secondary">Pay only 40% upfront commitment</span>
              </div>
              <div className="flex items-start space-x-3">
                <i className="fas fa-check-circle text-green-400 mt-1"></i>
                <span className="text-secondary">Remaining 60% on delivery</span>
              </div>
              <div className="flex items-start space-x-3">
                <i className="fas fa-check-circle text-green-400 mt-1"></i>
                <span className="text-secondary">Full refund if project doesn't deliver</span>
              </div>
              <div className="flex items-start space-x-3">
                <i className="fas fa-check-circle text-green-400 mt-1"></i>
                <span className="text-secondary">Support Indian innovation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risks & Challenges */}
      <section>
        <h2 className="text-3xl font-bold text-primary mb-8">Risks & Challenges</h2>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
            <div className="text-secondary">
              <p className="mb-4">
                Like any ambitious project, this campaign comes with inherent risks and challenges.
                We're committed to transparency about potential obstacles.
              </p>
              <p>
                Our India-first commitment system minimizes your risk by requiring only 40% upfront,
                with the remainder due on delivery. If we can't deliver, you get a full refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section Placeholder */}
      <section>
        <h2 className="text-3xl font-bold text-primary mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="bg-secondary border border-theme rounded-xl">
            <summary className="p-6 cursor-pointer text-primary font-medium hover:text-accent-orange transition-colors">
              How does the India-first commitment system work?
            </summary>
            <div className="px-6 pb-6 text-secondary">
              <p>
                You pay 40% of the reward amount as a commitment when you back the campaign.
                The remaining 60% is only charged when we're ready to ship your reward.
                This reduces your upfront cost and our risk.
              </p>
            </div>
          </details>

          <details className="bg-secondary border border-theme rounded-xl">
            <summary className="p-6 cursor-pointer text-primary font-medium hover:text-accent-orange transition-colors">
              What happens if the campaign doesn't deliver?
            </summary>
            <div className="px-6 pb-6 text-secondary">
              <p>
                If we can't deliver on our promises, you'll receive a full refund of your commitment amount.
                We believe in accountability and transparency.
              </p>
            </div>
          </details>

          <details className="bg-secondary border border-theme rounded-xl">
            <summary className="p-6 cursor-pointer text-primary font-medium hover:text-accent-orange transition-colors">
              When will I be charged the remaining amount?
            </summary>
            <div className="px-6 pb-6 text-secondary">
              <p>
                We'll charge the remaining 60% only when your reward is ready to ship.
                You'll receive advance notice and tracking information.
              </p>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
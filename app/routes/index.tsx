import { type LoaderFunctionArgs } from "react-router";
import { Link } from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { createAuthService, getOptionalAuth } from "~/lib/auth.server";
import { Navigation } from "~/components/Navigation";
import { Layout } from "~/components/Layout";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const authService = createAuthService(db, kv, env);

  const user = await getOptionalAuth(request, authService);

  return { user };
}

export default function Index({ loaderData }: { loaderData: { user: any } }) {
  const { user } = loaderData;

  return (
    <Layout>
      <Navigation user={user} />

      <main>
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 md:px-6 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://absurd.industries/assets/images/workdesk.jpg')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b dark:from-black/40 dark:to-black/30 from-white/40  to-white/30"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="space-y-8 text-center">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-primary">
                Handcrafted products for nerds!
              </h2>
              <p className="text-lg md:text-xl leading-relaxed font-semibold">
                We're building open-source hardware.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/campaigns"
                  className="accent-orange text-on-accent px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600 transition-transform transform hover:scale-105"
                >
                  Explore Campaigns
                </Link>
                <Link
                  to="/shop"
                  className="border-2 border-theme text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:accent-orange hover:text-on-accent hover:border-transparent transition-all"
                >
                  Shop Inventions
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Campaigns Section */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
                Maker <span className="accent-orange-text">Magic</span> in
                Progress
              </h2>
              <p className="text-lg text-secondary max-w-3xl mx-auto">
                Discover what happens when makers are free to make things that
                are probably a bad idea, but brilliant nonetheless.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Sample Campaign Card */}
              <div className="bg-primary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="aspect-video bg-tertiary relative">
                  <img
                    src="https://shop.absurd.industries/cdn/shop/files/lampy-shopabsurdindustries-shopabsurdindustries-968591.jpg?v=1731505856&width=1206"
                    alt="Lampy Campaign"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-green-500 text-sm font-semibold">
                      89% Funded
                    </span>
                    <span className="text-secondary text-sm">12 days left</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-primary">
                    Lampy Mood Light
                  </h3>
                  <p className="text-secondary text-sm mb-4">
                    Mesmerizing ambient lighting that's 100% open source.
                  </p>
                  <div className="w-full bg-tertiary rounded-full h-2.5 mb-4">
                    <div
                      className="accent-orange h-2.5 rounded-full"
                      style={{ width: "89%" }}
                    ></div>
                  </div>
                  <Link
                    to="/campaigns/lampy"
                    className="w-full accent-orange text-on-accent py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors block text-center"
                  >
                    Back This Project
                  </Link>
                </div>
              </div>

              {/* Placeholder Cards */}
              <div className="bg-primary rounded-2xl overflow-hidden shadow-lg">
                <div className="aspect-video bg-tertiary flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-plus text-4xl text-secondary mb-4"></i>
                    <p className="text-lg text-secondary">Coming Soon</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-4 w-3/4 bg-tertiary rounded animate-pulse"></div>
                  <div className="h-6 w-1/2 bg-tertiary rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-tertiary rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-tertiary rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full bg-tertiary rounded-xl animate-pulse"></div>
                </div>
              </div>

              <div className="bg-primary rounded-2xl overflow-hidden shadow-lg hidden lg:block">
                <div className="aspect-video bg-tertiary flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-plus text-4xl text-secondary mb-4"></i>
                    <p className="text-lg text-secondary">Coming Soon</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-4 w-3/4 bg-tertiary rounded animate-pulse"></div>
                  <div className="h-6 w-1/2 bg-tertiary rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-tertiary rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-tertiary rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 w-full bg-tertiary rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight text-primary">
                Open Source is About
                <span className="accent-orange-text"> Collaboration</span>
              </h2>
              <p className="text-lg md:text-xl text-secondary leading-relaxed">
                We believe the best innovations happen when makers share
                knowledge, support each other, and build on each other's work.
                Every project here comes with complete documentation,
                schematics, and code. Progress is a team sport.
              </p>
              <Link
                to="/guild"
                className="inline-flex items-center justify-center accent-orange text-on-accent px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600 transition-transform transform hover:scale-105"
              >
                <i className="fab fa-github mr-3"></i>
                Explore on GitHub
              </Link>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="bg-secondary rounded-2xl p-6 relative overflow-hidden shadow-lg">
                <div className="aspect-square bg-tertiary rounded-xl flex items-center justify-center text-center">
                  <div className="text-primary">
                    <i className="fab fa-github text-6xl mb-4 accent-orange-text"></i>
                    <p className="text-lg">Open Source in Action</p>
                    <p className="text-sm text-secondary mt-2">
                      Schematics • Code • Community
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
              Ready to Make Something
              <span className="accent-orange-text"> Absurd</span>?
            </h2>
            <p className="text-lg text-secondary mb-12 max-w-2xl mx-auto">
              Join a community where your wildest hardware dreams get the
              support, funding, and collaboration they deserve. Because the
              future belongs to makers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="accent-orange text-on-accent px-10 py-5 rounded-xl text-lg font-bold hover:bg-orange-600 transition-transform transform hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/auth/login"
                  className="accent-orange text-on-accent px-10 py-5 rounded-xl text-lg font-bold hover:bg-orange-600 transition-transform transform hover:scale-105"
                >
                  Join the Guild
                </Link>
              )}
              <Link
                to="/campaigns/create"
                className="border-2 border-theme text-primary px-10 py-5 rounded-xl text-lg font-bold hover:accent-orange hover:text-on-accent hover:border-transparent transition-all"
              >
                Launch a Campaign
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-tertiary py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 accent-orange rounded-full flex items-center justify-center">
                    <svg
                      viewBox="0 0 200 200"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8"
                    >
                      <defs>
                        <radialGradient
                          id="footerNucleusGradient"
                          cx="50%"
                          cy="50%"
                          r="50%"
                        >
                          <stop offset="0%" stopColor="#FFB347" />
                          <stop offset="100%" stopColor="#FF6B35" />
                        </radialGradient>
                      </defs>
                      <g transform="translate(100,100)">
                        <ellipse
                          cx="0"
                          cy="0"
                          rx="50"
                          ry="15"
                          fill="none"
                          stroke="#40E0D0"
                          strokeWidth="2"
                          opacity="0.8"
                        />
                        <ellipse
                          cx="0"
                          cy="0"
                          rx="50"
                          ry="15"
                          fill="none"
                          stroke="#40E0D0"
                          strokeWidth="2"
                          opacity="0.8"
                          transform="rotate(60)"
                        />
                        <ellipse
                          cx="0"
                          cy="0"
                          rx="50"
                          ry="15"
                          fill="none"
                          stroke="#40E0D0"
                          strokeWidth="2"
                          opacity="0.8"
                          transform="rotate(120)"
                        />
                      </g>
                      <circle
                        cx="100"
                        cy="100"
                        r="15"
                        fill="url(#footerNucleusGradient)"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-primary">ABSURD</h3>
              </div>
              <p className="text-secondary leading-relaxed">
                Building the future, one maker at a time.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-lg font-semibold accent-orange-text">
                Platform
              </h4>
              <nav className="space-y-3">
                <Link
                  to="/campaigns"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Campaigns
                </Link>
                <Link
                  to="/shop"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Shop
                </Link>
                <Link
                  to="/guild"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Guild
                </Link>
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-lg font-semibold accent-orange-text">
                Community
              </h4>
              <nav className="space-y-3">
                <a
                  href="#"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Discord
                </a>
                <a
                  href="https://bytes.absurd.industries/"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Journal
                </a>
                <a
                  href="#"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Newsletter
                </a>
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-lg font-semibold accent-orange-text">
                Support
              </h4>
              <nav className="space-y-3">
                <a
                  href="#"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Help Center
                </a>
                <a
                  href="#"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="block text-secondary hover:text-primary transition-colors"
                >
                  Terms
                </a>
              </nav>
            </div>
          </div>
          <div className="border-t border-theme mt-12 pt-8 text-center">
            <p className="text-secondary text-sm">
              © 2025 Absurd Explorations (OPC) Private Limited. Made with ❤️ in
              Bengaluru.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}

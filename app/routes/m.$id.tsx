import { type LoaderFunctionArgs, useLoaderData, Link } from "react-router";
import { getDB, getKV, getEnv } from "~/lib/db.server";
import { getMakerByIdOrName, getFullMakerProfile } from "~/lib/makers.server";
import {
  getReadyProducts,
  getDevelopmentProjects,
} from "~/lib/products.server";
import { createAuthService, getOptionalAuth } from "~/lib/auth.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { ProductList } from "~/components/profile/ProductList";
import { type Product } from "~/types/product";

export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const db = getDB(context);
  const kv = getKV(context);
  const env = getEnv(context);
  const { id } = params;

  if (!id) {
    throw new Response("Maker not found", { status: 404 });
  }

  // Try to get maker by ID first, then by maker_name
  let maker;
  const numericId = parseInt(id, 10);
  if (!isNaN(numericId)) {
    maker = await getMakerByIdOrName(db, numericId);
  }

  // If not found by ID or if ID is not numeric, try by maker_name
  if (!maker) {
    maker = await getMakerByIdOrName(db, id);
  }

  if (!maker) {
    throw new Response("Maker not found", { status: 404 });
  }

  // Get full maker profile with links
  const profile = await getFullMakerProfile(db, maker.id);

  // Get maker's products split by type
  const readyProducts = await getReadyProducts(db, maker.id);
  const developmentProjects = await getDevelopmentProjects(db, maker.id);

  // Check if the current user is the owner of this profile
  const authService = createAuthService(db, kv, env);
  const currentUser = await getOptionalAuth(request, authService);
  const isOwner = currentUser && currentUser.id === maker.id;

  // Get current user's profile for navigation
  let currentUserProfile = null;
  if (currentUser) {
    currentUserProfile = await getFullMakerProfile(db, currentUser.id);
  }

  return {
    maker,
    profile,
    readyProducts,
    developmentProjects,
    isOwner,
    currentUser,
    currentUserProfile,
  };
}

export default function MakerProfile() {
  const {
    maker,
    profile,
    readyProducts,
    developmentProjects,
    isOwner,
    currentUser,
    currentUserProfile,
  } = useLoaderData<typeof loader>();

  if (!profile) {
    return (
      <Layout>
        <Navigation user={currentUser} userProfile={currentUserProfile} />
        <div className="min-h-screen bg-primary py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-secondary rounded-lg shadow-md p-6 text-center">
              <h1 className="text-2xl font-bold text-primary mb-4">
                Maker Profile Not Found
              </h1>
              <p className="text-secondary">
                This maker hasn't set up their profile yet.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation user={currentUser} userProfile={currentUserProfile} />

      {/* Hero Section - matching html/profile.html */}
      <section className="relative flex items-center justify-center">
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 text-center">
          <div className="flex flex-col items-center mb-8 animate-fade-in">
            {/* Avatar */}
            <div className="w-32 h-32 lg:w-40 lg:h-40 accent-orange rounded-3xl flex items-center justify-center text-4xl lg:text-5xl font-bold overflow-hidden text-on-accent mb-6 hover-lift">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.maker_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-secondary text-6xl">👤</span>
              )}
            </div>

            {/* Name and tagline */}
            <h1 className="font-jura text-6xl lg:text-8xl font-bold text-primary mb-4">
              {profile.display_name || profile.maker_name}
            </h1>
            <p className="text-xl lg:text-2xl text-secondary mb-6">
              @{profile.maker_name}
            </p>

            {/* Bio */}
            {profile.bio && (
              <div className="max-w-4xl mx-auto">
                <p className="text-xl lg:text-2xl text-secondary leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Social Links */}
            {profile.links && profile.links.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 mt-12">
                {profile.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary border-2 border-theme rounded-xl p-4 hover-lift transition-all flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-tertiary">
                      <i className="fas fa-link text-xl accent-orange-text"></i>
                    </div>
                    <div className="flex-grow">
                      <div className="font-bold text-primary text-base flex items-center gap-2">
                        {link.title}
                      </div>
                    </div>
                    <i className="fas fa-external-link-alt text-secondary group-hover:accent-orange-text transition-colors"></i>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Products Section */}
        {readyProducts.length > 0 && (
          <section id="products" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="font-jura text-4xl lg:text-5xl font-bold text-primary mb-4">
                Shop
              </h2>
              <p className="text-xl text-secondary max-w-3xl mx-auto">
                These are ready to ship within two weeks of ordering!
              </p>
            </div>

            <ProductList
              products={readyProducts}
              showAdminActions={false}
              mode="showcase"
              gridCols="md:grid-cols-2"
            />
          </section>
        )}

        {/* Workbench Section */}
        {developmentProjects.length > 0 && (
          <section id="workbench" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="font-jura text-4xl lg:text-5xl font-bold text-primary mb-4">
                Workbench
              </h2>
              <p className="text-xl text-secondary max-w-3xl mx-auto">
                Projects currently being cooked.
              </p>
            </div>

            <ProductList
              products={developmentProjects}
              showAdminActions={false}
              mode="showcase"
              gridCols="md:grid-cols-2 lg:grid-cols-3"
            />
          </section>
        )}

        {/* No content state */}
        {readyProducts.length === 0 && developmentProjects.length === 0 && (
          <section className="text-center pb-20">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="font-jura text-3xl font-bold text-primary mb-4">
              Coming Soon
            </h2>
            <p className="text-xl text-secondary">
              {profile.display_name || profile.maker_name} is working on
              something amazing!
            </p>
          </section>
        )}
      </main>

      {/* Edit Profile Button - only show for profile owner */}
      {isOwner && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            to="/profile"
            className="accent-orange text-on-accent px-6 py-3 rounded-full text-base font-semibold hover-lift transition-all shadow-lg flex items-center"
          >
            <i className="fas fa-edit mr-2"></i>
            Edit Profile
          </Link>
        </div>
      )}
    </Layout>
  );
}

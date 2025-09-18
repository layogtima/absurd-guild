import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { getDB } from "~/lib/db.server";
import { getMakerByIdOrName, getFullMakerProfile } from "~/lib/makers.server";
import { getUserProducts } from "~/lib/products.server";
import { Layout } from "~/components/Layout";
import { Navigation } from "~/components/Navigation";
import { type Product } from "~/types/product";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context);
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

  // Get maker's products
  const products = await getUserProducts(db, maker.id);

  return { maker, profile, products };
}

export default function MakerProfile() {
  const { maker, profile, products } = useLoaderData<typeof loader>();

  if (!profile) {
    return (
      <Layout>
        <Navigation />
        <div className="min-h-screen bg-primary py-8">
          <div className="max-w-4xl mx-auto px-4">
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
      <Navigation />

      {/* Hero Section - matching html/profile.html */}
      <section className="relative min-h-[70vh] flex items-center justify-center">
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="flex flex-col items-center mb-12 animate-fade-in">
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
              <div className="max-w-4xl mx-auto mb-12">
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
        {products.length > 0 && (
          <section id="products" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="font-jura text-4xl lg:text-5xl font-bold text-primary mb-4">
                Shop
              </h2>
              <p className="text-xl text-secondary max-w-3xl mx-auto">
                These are ready to ship within two weeks of ordering!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-secondary border-2 border-theme rounded-3xl overflow-hidden hover-lift transition-all"
                >
                  {/* Product Image */}
                  <div className="aspect-square relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-tertiary flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      In Stock
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-6">
                    <h3 className="font-jura text-2xl font-bold text-primary mb-2">
                      {product.title}
                    </h3>

                    {product.description && (
                      <p className="text-secondary leading-relaxed mb-4">
                        {product.description}
                      </p>
                    )}

                    {product.category && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 text-sm bg-tertiary text-secondary rounded-full">
                          {product.category}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold accent-orange-text">
                        ₹{(product.price / 100).toLocaleString()}
                      </div>
                      {product.shopify_url && (
                        <a
                          href={product.shopify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="accent-orange text-on-accent px-6 py-3 rounded-xl font-bold hover-lift transition-all"
                        >
                          <i className="fas fa-shopping-cart mr-2"></i>
                          GET ONE
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No content state */}
        {products.length === 0 && (
          <section className="text-center py-20">
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
    </Layout>
  );
}

import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),

  // Authentication routes
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/verify", "routes/auth.verify.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),

  // Profile routes
  route("profile", "routes/profile.tsx"),

  // Maker public profiles
  route("m/:id", "routes/m.$id.tsx"),

  // Campaign routes
  route("campaigns", "routes/campaigns._index.tsx"),
  route("campaigns/create", "routes/campaigns.create.tsx"),
  route("campaigns/:slug", "routes/campaigns.$slug.tsx"),
  route("campaigns/:slug/edit", "routes/campaigns.$slug.edit.tsx"),
  route("campaigns/:slug/back", "routes/campaigns.$slug.back.tsx"),
  route("campaigns/:slug/back/confirm", "routes/campaigns.$slug.back.confirm.tsx"),
  route("campaigns/:slug/back/success", "routes/campaigns.$slug.back.success.tsx"),
  route("profile/campaigns", "routes/profile.campaigns.tsx"),

  // Future routes (placeholder comments)
  // route("shop", "routes/shop/_index.tsx"),
  // route("guild", "routes/guild/_index.tsx"),
  // route("makers/:username", "routes/makers/$username.tsx"),
  // route("dashboard", "routes/dashboard/_index.tsx"),
] satisfies RouteConfig;

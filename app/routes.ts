import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),

  // Authentication routes
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/verify", "routes/auth.verify.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),

  // Profile routes
  route("profile", "routes/profile.tsx"),
  // route("dashboard", "routes/dashboard.tsx"),

  // Maker public profiles
  route("m/:id", "routes/m.$id.tsx"),

  // Items (Workbench Phase 1A)
  route("items", "routes/items.tsx"),
  route("items/new", "routes/items.new.tsx"),
  route("items/:itemId", "routes/items.$itemId.tsx"),

  // Workbench (Workbench Phase 1B)
  route("workbench", "routes/workbench.tsx"),
  route("workbench/new", "routes/workbench.new.tsx"),
  route("workbench/:projectId", "routes/workbench.$projectId.tsx"),

  // Future routes (placeholder comments)
  // route("campaigns", "routes/campaigns/_index.tsx"),
  // route("campaigns/:slug", "routes/campaigns/$slug.tsx"),
  // route("campaigns/create", "routes/campaigns/create.tsx"),
  // route("shop", "routes/shop/_index.tsx"),
  // route("guild", "routes/guild/_index.tsx"),
  // route("makers/:username", "routes/makers/$username.tsx"),
  // route("dashboard", "routes/dashboard/_index.tsx"),
] satisfies RouteConfig;

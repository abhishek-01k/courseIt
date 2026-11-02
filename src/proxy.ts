export { auth as proxy } from "@/lib/auth";

// Add every new (protected) route here so signed-out visitors are sent to /login.
// A course page (/courses/<slug>) and a roadmap (/roadmaps/<slug>) are left out on purpose: shared links
// open signed out, and those pages ask visitors to sign in for anything that saves. A course's link-preview
// image (/courses/<slug>/opengraph-image-…) is left out too: crawlers fetch it signed out.
export const config = {
  matcher: ["/login", "/dashboard/:path*", "/courses", "/courses/:slug/:lesson((?!opengraph-image).*)", "/notes/:path*", "/community/:path*", "/roadmaps", "/new", "/build/:path*", "/settings", "/admin/:path*"],
};

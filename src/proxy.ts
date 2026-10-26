export { auth as proxy } from "@/lib/auth";

// Add every new (protected) route here so signed-out visitors are sent to /login.
// A course page (/courses/<slug>) and a roadmap (/roadmaps/<slug>) are left out on purpose: shared links
// open signed out, and those pages ask visitors to sign in for anything that saves.
export const config = {
  matcher: ["/login", "/dashboard/:path*", "/courses", "/courses/:slug/:lesson", "/notes/:path*", "/community/:path*", "/roadmaps", "/new", "/build/:path*", "/settings", "/admin/:path*"],
};

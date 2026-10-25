export { auth as proxy } from "@/lib/auth";

// Add every new (protected) route here so signed-out visitors are sent to /login.
export const config = {
  matcher: ["/login", "/dashboard/:path*", "/courses/:path*", "/notes/:path*", "/community/:path*", "/new", "/build/:path*", "/settings"],
};

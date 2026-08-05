import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes qui nécessitent d'avoir une photo
const PROTECTED_ROUTES = [
  "/dashboard",
  "/discover",
  "/matches",
  "/messages",
  "/likes-recus",
  "/preferences",
  "/boost",
  "/verification",
  "/parrainage",
  "/premium",
];

// Routes autorisées SANS photo
const ALLOWED_WITHOUT_PHOTO = ["/welcome", "/profile", "/login", "/register"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Ignorer les API routes, les fichiers statiques, etc.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/gabriel-boss") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Vérifier si l'utilisateur essaie d'accéder à une route protégée
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Récupérer le token d'auth
  const authToken = request.cookies.get("auth_token")?.value;

  if (!authToken) {
    // Pas de token → laisse le layout gérer (redirection vers /login)
    return NextResponse.next();
  }

  // Vérifier si l'user a une photo via l'API
  try {
    const meResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/me`,
      {
        headers: {
          Cookie: `auth_token=${authToken}`,
        },
      }
    );

    if (!meResponse.ok) {
      return NextResponse.next();
    }

    const meData = await meResponse.json();
    const user = meData.user;

    // Si pas de photo ET pas déjà sur /welcome → redirection forcée
    if (user && (!user.photoUrl || user.photoUrl.trim() === "")) {
      const welcomeUrl = new URL("/welcome", request.url);
      return NextResponse.redirect(welcomeUrl);
    }
  } catch (error) {
    console.error("[Middleware] Erreur vérification photo:", error);
  }

  return NextResponse.next();
}

// Configurer les routes sur lesquelles le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     * - api (API routes)
     * - _next/static (fichiers statiques)
     * - _next/image (images)
     * - favicon.ico, manifest.json, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
  ],
};

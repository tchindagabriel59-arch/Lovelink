import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

  // Le middleware ne peut pas facilement accéder à la BDD
  // On laisse le layout côté client faire la vérification photo
  // C'est plus fiable et évite les blocages
  return NextResponse.next();
}

// Configurer les routes sur lesquelles le middleware s'applique
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
  ],
};

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const demoProfiles = [
  {
    email: "sophie@demo.com",
    firstName: "Sophie",
    lastName: "Martin",
    birthDate: "1995-03-15",
    gender: "female" as const,
    bio: "Passionnée de voyages et de photographie. J'adore découvrir de nouvelles cultures et partager des moments authentiques. Toujours un livre dans mon sac !",
    city: "Paris",
    country: "France",
    interests: "Voyages, Photographie, Lecture, Cuisine, Art",
    occupation: "Graphiste freelance",
    lookingFor: "relationship" as const,
  },
  {
    email: "marc@demo.com",
    firstName: "Marc",
    lastName: "Dupont",
    birthDate: "1992-07-22",
    gender: "male" as const,
    bio: "Ingénieur le jour, musicien la nuit. Je cherche quelqu'un avec qui partager mes passions et construire quelque chose de beau.",
    city: "Lyon",
    country: "France",
    interests: "Musique, Tech, Sport, Cinema, Gastronomie",
    occupation: "Ingénieur logiciel",
    lookingFor: "relationship" as const,
  },
  {
    email: "camille@demo.com",
    firstName: "Camille",
    lastName: "Leroy",
    birthDate: "1997-11-08",
    gender: "female" as const,
    bio: "Danseuse professionnelle et amoureuse de la vie. Je crois aux rencontres qui changent la vie. Spontanée et curieuse de nature.",
    city: "Bordeaux",
    country: "France",
    interests: "Danse, Yoga, Nature, Mode, Musique",
    occupation: "Professeure de danse",
    lookingFor: "relationship" as const,
  },
  {
    email: "thomas@demo.com",
    firstName: "Thomas",
    lastName: "Bernard",
    birthDate: "1990-01-30",
    gender: "male" as const,
    bio: "Chef cuisinier passionné. Je voyage à travers le monde pour découvrir de nouvelles saveurs. Fan de randonnées en montagne.",
    city: "Marseille",
    country: "France",
    interests: "Cuisine, Voyages, Nature, Photographie, Sport",
    occupation: "Chef cuisinier",
    lookingFor: "relationship" as const,
  },
  {
    email: "julie@demo.com",
    firstName: "Julie",
    lastName: "Moreau",
    birthDate: "1994-05-20",
    gender: "female" as const,
    bio: "Médecin et passionnée d'art. Je cherche quelqu'un d'authentique avec qui rire et grandir ensemble.",
    city: "Toulouse",
    country: "France",
    interests: "Art, Lecture, Cinema, Yoga, Animaux",
    occupation: "Médecin généraliste",
    lookingFor: "marriage" as const,
  },
  {
    email: "nicolas@demo.com",
    firstName: "Nicolas",
    lastName: "Petit",
    birthDate: "1993-09-12",
    gender: "male" as const,
    bio: "Architecte et passionné de design. J'adore les balades en vélo, les expos d'art et les bons restaurants.",
    city: "Nantes",
    country: "France",
    interests: "Art, Photographie, Sport, Gastronomie, Tech",
    occupation: "Architecte",
    lookingFor: "relationship" as const,
  },
  {
    email: "emma@demo.com",
    firstName: "Emma",
    lastName: "Dubois",
    birthDate: "1996-12-03",
    gender: "female" as const,
    bio: "Journaliste et globe-trotteuse. Je cherche un partenaire d'aventure qui n'a pas peur de sortir de sa zone de confort.",
    city: "Nice",
    country: "France",
    interests: "Voyages, Lecture, Cinema, Nature, Musique",
    occupation: "Journaliste",
    lookingFor: "relationship" as const,
  },
  {
    email: "lucas@demo.com",
    firstName: "Lucas",
    lastName: "Robert",
    birthDate: "1991-04-18",
    gender: "male" as const,
    bio: "Prof de sport et coach de vie. Optimiste et énergique, je cherche ma partenaire pour partager des moments intenses.",
    city: "Strasbourg",
    country: "France",
    interests: "Sport, Nature, Yoga, Cuisine, Jeux vidéo",
    occupation: "Coach sportif",
    lookingFor: "relationship" as const,
  },
];

export async function POST() {
  try {
    // Check if demo users already exist
    const existing = await db.select({ id: users.id }).from(users).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ message: "Les profils de démo existent déjà" });
    }

    const passwordHash = await bcrypt.hash("demo1234", 12);

    for (const profile of demoProfiles) {
      await db.insert(users).values({
        ...profile,
        passwordHash,
        isOnline: Math.random() > 0.5,
      });
    }

    return NextResponse.json({
      message: `${demoProfiles.length} profils de démonstration créés !`,
      hint: "Connectez-vous avec n'importe quel email @demo.com et le mot de passe: demo1234",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Erreur lors du seeding" },
      { status: 500 }
    );
  }
}

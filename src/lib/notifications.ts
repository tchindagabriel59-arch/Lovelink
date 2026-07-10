import { db } from "@/db";
import { notifications } from "@/db/schema";

export type NotificationType =
  | "like"
  | "super_like"
  | "match"
  | "message";

export async function createNotification({
  userId,
  type,
  fromUserId,
  content = "",
}: {
  userId: number;
  type: NotificationType;
  fromUserId?: number;
  content?: string;
}) {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      fromUserId: fromUserId || null,
      content,
    });
  } catch (error) {
    console.error("Erreur création notification:", error);
  }
}

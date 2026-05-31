import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const authData = await auth();
    if (!authData.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(authData.userId);

    // Generate a unique slug
    const slug = `solo-${Math.random().toString(36).substring(2, 9)}`;

      const room = await prisma.room.create({
      data: {
        slug,
        name: `${user.username || user.firstName || 'User'}'s Solo Space`,
        subject: "Focus",
        capacity: 1,
        visibility: "PRIVATE",
        creatorId: authData.userId,
        isDefaultRoom: false,
        globalChatEnabled: false,
        allowMic: false,
        allowCam: true,
        temporary: true,
      }
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error creating solo room:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

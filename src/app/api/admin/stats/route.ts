import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const authData = await auth();
  if (!authData.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(authData.userId);

  if (user.publicMetadata?.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalRooms = await prisma.room.count();
    
    // As rooms don't have an "isActive" status in the current Prisma schema, 
    // we'll return totalRooms (or this can be updated later if schema changes).
    const activeRooms = totalRooms; 

    return NextResponse.json({ 
      totalUsers, 
      totalRooms,
      activeRooms
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

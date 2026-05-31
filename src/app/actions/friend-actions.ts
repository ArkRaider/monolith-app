'use server';

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Send a friend request
export async function sendFriendRequest(targetUserId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return { error: 'Unauthorized' };

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: clerkUser.id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: clerkUser.id },
        ]
      }
    });

    if (existing) {
      return { error: 'Friendship or request already exists' };
    }

    await prisma.friendship.create({
      data: {
        requesterId: clerkUser.id,
        addresseeId: targetUserId,
        status: 'PENDING',
      }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[friend-actions] sendFriendRequest error:', error);
    return { error: 'Failed to send request' };
  }
}

// Accept a friend request
export async function acceptFriendRequest(requestId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return { error: 'Unauthorized' };

    const request = await prisma.friendship.findUnique({
      where: { id: requestId }
    });

    if (!request || request.addresseeId !== clerkUser.id) {
      return { error: 'Request not found or unauthorized' };
    }

    await prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[friend-actions] acceptFriendRequest error:', error);
    return { error: 'Failed to accept request' };
  }
}

// Reject or ignore a friend request (deletes it)
export async function rejectFriendRequest(requestId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return { error: 'Unauthorized' };

    const request = await prisma.friendship.findUnique({
      where: { id: requestId }
    });

    if (!request || request.addresseeId !== clerkUser.id) {
      return { error: 'Request not found or unauthorized' };
    }

    await prisma.friendship.delete({
      where: { id: requestId }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[friend-actions] rejectFriendRequest error:', error);
    return { error: 'Failed to reject request' };
  }
}

// Get pending friend requests for the current user
export async function getFriendRequests() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return [];

    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: clerkUser.id,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests;
  } catch (error) {
    console.error('[friend-actions] getFriendRequests error:', error);
    return [];
  }
}

// Get friends who have been active recently
export async function getOnlineFriends() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return [];

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: clerkUser.id },
          { addresseeId: clerkUser.id }
        ]
      },
      include: {
        requester: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true, lastActive: true }
        },
        addressee: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true, lastActive: true }
        }
      }
    });

    const friends = friendships.map(f => {
      if (f.requesterId === clerkUser.id) return f.addressee;
      return f.requester;
    });

    // Only return those active within the last 24 hours, sorted by lastActive desc
    // (LiveActivityPanel will handle the "Online vs Active just now" UI)
    const activeCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    return friends
      .filter(f => f.lastActive >= activeCutoff)
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());

  } catch (error) {
    console.error('[friend-actions] getOnlineFriends error:', error);
    return [];
  }
}

// Check friendship status between current user and a target user
export async function getFriendshipStatus(targetUserId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return 'NONE';
    if (clerkUser.id === targetUserId) return 'SELF';

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: clerkUser.id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: clerkUser.id },
        ]
      }
    });

    if (!friendship) return 'NONE';
    if (friendship.status === 'ACCEPTED') return 'ACCEPTED';
    if (friendship.requesterId === clerkUser.id) return 'PENDING_SENT';
    return 'PENDING_RECEIVED';
  } catch (error) {
    console.error('[friend-actions] getFriendshipStatus error:', error);
    return 'NONE';
  }
}

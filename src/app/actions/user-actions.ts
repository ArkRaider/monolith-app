'use server';

import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  ensureUserExists as ensureUserExistsService,
  getRecentUsers as getRecentUsersService,
  getUserProfile as getUserProfileService,
} from '@/services/user-service';
import { prisma } from '@/lib/prisma';

export async function ensureUserExists(
  clerkUserId: string,
  email: string,
  displayName: string,
  handle: string
) {
  try {
    return await ensureUserExistsService({
      id: clerkUserId,
      emailAddresses: email ? [{ emailAddress: email }] : undefined,
      username: handle,
      firstName: displayName,
      lastName: undefined,
      imageUrl: undefined,
    });
  } catch (error) {
    console.error('[user-actions] ensureUserExists error:', error);
    return { error: 'Database lookup failed' };
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return { error: 'Unauthorized' };

    const displayName = formData.get('displayName') as string;
    const bio = formData.get('bio') as string | null;
    const instagram = formData.get('instagram') as string | null;
    const twitter = formData.get('twitter') as string | null;
    const github = formData.get('github') as string | null;
    const bannerUrl = formData.get('bannerUrl') as string | null;
    const currentGrind = formData.get('currentGrind') as string | null;

    const parseArray = (input: string | null) => {
      if (!input) return [];
      return input
        .split(/[ ,]+/)
        .filter(Boolean)
        .map((item) => item.trim());
    };

    await prisma.user.update({
      where: { id: clerkUser.id },
      data: {
        displayName,
        bio,
        instagram,
        twitter,
        github,
        bannerUrl,
        currentGrind,
        programmingTools: parseArray(
          formData.get('programmingTools') as string | null
        ),
        activeGoals: parseArray(formData.get('activeGoals') as string | null),
        customLinks: parseArray(formData.get('customLinks') as string | null),
        updatedAt: new Date(),
      },
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/profile', 'layout');
    return { success: true };
  } catch (error) {
    console.error('[user-actions] updateProfile error:', error);
    return { error: 'Failed to update profile' };
  }
}

export async function pingActiveStatus() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return { success: false };

    await ensureUserExistsService({
      id: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses as
        | { emailAddress: string }[]
        | undefined,
      username: clerkUser.username,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    });

    return { success: true };
  } catch (error) {
    console.error('[user-actions] pingActiveStatus error:', error);
    return { error: 'Failed to update status' };
  }
}

export async function getRecentUsers() {
  try {
    return await getRecentUsersService();
  } catch (error) {
    console.error('[user-actions] getRecentUsers error:', error);
    return { error: 'Failed to get recent users' };
  }
}

export async function getUserProfile(handle: string) {
  try {
    return await getUserProfileService(handle);
  } catch (error) {
    console.error('[user-actions] getUserProfile error:', error);
    return { error: 'Failed to get user profile' };
  }
}
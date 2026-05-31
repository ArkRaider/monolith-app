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
  return ensureUserExistsService({
    id: clerkUserId,
    emailAddresses: email ? [{ emailAddress: email }] : undefined,
    username: handle,
    firstName: displayName,
    lastName: undefined,
    imageUrl: undefined,
  });
}

export async function updateProfile(formData: FormData) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error('Unauthorized');

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
  return { success: true };
}

export async function pingActiveStatus() {
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
}

export async function getRecentUsers() {
  return getRecentUsersService();
}

export async function getUserProfile(handle: string) {
  return getUserProfileService(handle);
}
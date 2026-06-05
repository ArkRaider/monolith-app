import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import MinimalSettingsClient from './MinimalSettingsClient';

export default async function MinimalSettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser) {
    redirect('/dashboard/minimal');
  }

  return <MinimalSettingsClient dbUser={dbUser} />;
}

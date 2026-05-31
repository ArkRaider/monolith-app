const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure a System Admin user exists to own the default rooms
  const adminId = 'system-admin-001';
  
  const adminUser = await prisma.user.upsert({
    where: { id: adminId },
    update: {},
    create: {
      id: adminId,
      email: 'admin@monolithstudios.com',
      displayName: 'System Admin',
      handle: 'admin',
      subjects: ['System'],
      focusPreference: 'DEEP_WORK',
      defaultAmbience: 'Silence',
    },
  });

  const defaultRooms = [
    {
      slug: 'global-study-hall',
      name: 'Global Study Hall',
      subject: 'Co-working',
      capacity: 1000,
      visibility: 'PUBLIC',
      vibe: 'Focus',
      lockOnJoin: false,
      defaultAmbience: 'Lo-Fi',
      allowMic: false, // Mic off by default in high capacity
      allowCam: true,
      isDefaultRoom: true,
      globalChatEnabled: true,
      creatorId: adminUser.id,
    },
    {
      slug: 'deep-focus-room',
      name: 'Deep Focus Room',
      subject: 'Deep Work',
      capacity: 1000,
      visibility: 'PUBLIC',
      vibe: 'Intense',
      lockOnJoin: false,
      defaultAmbience: 'Brown Noise',
      allowMic: false,
      allowCam: true,
      isDefaultRoom: true,
      globalChatEnabled: false, // Strict focus
      creatorId: adminUser.id,
    },
    {
      slug: 'chill-lounge',
      name: 'Chill Lounge',
      subject: 'Social',
      capacity: 500,
      visibility: 'PUBLIC',
      vibe: 'Relaxed',
      lockOnJoin: false,
      defaultAmbience: 'Rain',
      allowMic: true, // Allow mic here
      allowCam: true,
      isDefaultRoom: true,
      globalChatEnabled: true,
      creatorId: adminUser.id,
    }
  ];

  for (const room of defaultRooms) {
    await prisma.room.upsert({
      where: { slug: room.slug },
      update: {
        allowMic: room.allowMic,
        capacity: room.capacity,
        isDefaultRoom: true,
        globalChatEnabled: room.globalChatEnabled
      },
      create: room,
    });
  }

  console.log('Seeded 3 default high-capacity rooms successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

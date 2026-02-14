import { db, Events } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
  // Add sample events for testing
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await db.insert(Events).values([
    {
      title: 'Weekly Meetup at Cafe Nord',
      description: 'Join us for our weekly Thursday meetup at Cafe Nord!',
      dateTime: tomorrow,
      location: 'Cafe Nord, Oslo',
      mapLink: 'https://maps.google.com/?q=Cafe+Nord+Oslo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: 'Board Game Night',
      description: "Bring your favorite board games and let's have fun!",
      dateTime: nextWeek,
      location: 'Community Center',
      mapLink: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: 'Past Meetup - January Edition',
      description: 'This was our January meetup.',
      dateTime: lastWeek,
      location: 'Cafe Syd',
      mapLink: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

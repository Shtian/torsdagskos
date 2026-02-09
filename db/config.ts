import { defineDb, defineTable, column } from 'astro:db';

// https://astro.build/db/config

const Users = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    clerkUserId: column.text({ unique: true }),
    email: column.text({ unique: true }),
    name: column.text(),
    createdAt: column.date({ default: new Date() }),
  },
  indexes: {
    clerkUserIdIdx: { on: ['clerkUserId'], unique: true },
    emailIdx: { on: ['email'], unique: true },
  },
});

const Events = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    title: column.text(),
    description: column.text(),
    dateTime: column.date(),
    location: column.text(),
    mapLink: column.text({ optional: true }),
    createdAt: column.date({ default: new Date() }),
    updatedAt: column.date({ default: new Date() }),
  },
  indexes: {
    dateTimeIdx: { on: ['dateTime'] },
    createdAtIdx: { on: ['createdAt'] },
  },
});

const Rsvps = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.number({ references: () => Users.columns.id }),
    eventId: column.number({ references: () => Events.columns.id }),
    status: column.text(), // 'going' | 'maybe' | 'not_going'
    createdAt: column.date({ default: new Date() }),
    updatedAt: column.date({ default: new Date() }),
  },
  indexes: {
    userEventIdx: { on: ['userId', 'eventId'], unique: true },
    eventIdIdx: { on: ['eventId'] },
    userIdIdx: { on: ['userId'] },
  },
});

const Invites = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    email: column.text(),
    invitedBy: column.number({ references: () => Users.columns.id }),
    createdAt: column.date({ default: new Date() }),
    acceptedAt: column.date({ optional: true }),
  },
  indexes: {
    emailIdx: { on: ['email'] },
    invitedByIdx: { on: ['invitedBy'] },
  },
});

const NotificationLog = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.number({ references: () => Users.columns.id }),
    eventId: column.number({ references: () => Events.columns.id }),
    type: column.text(), // 'new_event' | 'event_update' | 'reminder'
    channel: column.text(), // 'email' | 'push'
    sentAt: column.date({ default: new Date() }),
  },
  indexes: {
    userIdIdx: { on: ['userId'] },
    eventIdIdx: { on: ['eventId'] },
    sentAtIdx: { on: ['sentAt'] },
  },
});

export default defineDb({
  tables: {
    Users,
    Events,
    Rsvps,
    Invites,
    NotificationLog,
  },
});

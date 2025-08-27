import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  modelUrl: text('model_url').notNull(),
  textureUrl: text('texture_url'),
  personalityTraits: text('personality_traits').array(), // Storing as array of text
  backstory: text('backstory'),
  voiceType: text('voice_type').notNull(), // 'cloned' or 'preset'
  voiceSampleUrl: text('voice_sample_url'), // For cloned voices
  voicePresetId: text('voice_preset_id'), // For preset voices
  emoteDefinitions: text('emote_definitions'), // JSON string of emote map
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CharacterSelect = InferSelectModel<typeof characters>;
export type CharacterInsert = InferInsertModel<typeof characters>;

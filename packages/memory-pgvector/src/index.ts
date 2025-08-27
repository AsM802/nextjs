import process from 'node:process'

import { Format, LogLevel, setGlobalFormat, setGlobalLogLevel } from '@guiiai/logg'
import { Client } from '@proj-airi/server-sdk'
import { runUntilSignal } from '@proj-airi/server-sdk/utils/node'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { characters } from './schema'

import { eq } from 'drizzle-orm';
import type { Character } from '@proj-airi/server-shared/types';

setGlobalFormat(Format.Pretty)
setGlobalLogLevel(LogLevel.Log)

function dbCharToApiChar(dbChar: typeof characters.$inferSelect): Character {
  return {
    id: dbChar.id,
    name: dbChar.name,
    description: dbChar.description || '',
    appearance: {
      modelUrl: dbChar.modelUrl,
      textureUrl: dbChar.textureUrl || undefined,
    },
    personality: {
      traits: dbChar.personalityTraits || [],
      backstory: dbChar.backstory || '',
    },
    voice: {
      type: dbChar.voiceType as 'cloned' | 'preset',
      sampleUrl: dbChar.voiceSampleUrl || undefined,
      presetId: dbChar.voicePresetId || undefined,
    },
    emotes: JSON.parse(dbChar.emoteDefinitions || '{}'),
  };
}

function apiCharToDbChar(apiChar: Partial<Character>): Omit<typeof characters.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> {
  const dbChar: Omit<typeof characters.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> = {
    name: apiChar.name || '',
    description: apiChar.description || null,
    modelUrl: apiChar.appearance?.modelUrl || '',
    textureUrl: apiChar.appearance?.textureUrl || null,
    personalityTraits: apiChar.personality?.traits || null,
    backstory: apiChar.personality?.backstory || null,
    voiceType: apiChar.voice?.type || 'preset',
    voiceSampleUrl: apiChar.voice?.sampleUrl || null,
    voicePresetId: apiChar.voice?.presetId || null,
    emoteDefinitions: JSON.stringify(apiChar.emotes || {}),
  };
  return dbChar;
}

async function main() {
  // Database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set.');
    // Do not exit here, allow the service to run without database if not critical for other parts
    // process.exit(1);
  }
  const client = connectionString ? postgres(connectionString) : undefined;
  const db = client ? drizzle(client, { schema: { characters } }) : undefined;

  const airiClient = new Client<{ connectionString: string }>({
    name: 'memory-pgvector',
  })

  airiClient.onEvent('module:configure', (_event) => {
    // Handle configuration if needed
  })

  // Character CRUD operations (already implemented)
  airiClient.onEvent('character:get', async (event) => {
    if (!db) {
      airiClient.send({ type: 'error', data: { message: 'Database not configured' } });
      return;
    }
    const character = await db.query.characters.findFirst({
      where: eq(characters.id, event.data.id),
    });
    if (character) {
      airiClient.send({ type: 'character:data', data: { character: dbCharToApiChar(character) } });
    } else {
      airiClient.send({ type: 'error', data: { message: 'Character not found' } });
    }
  });

  airiClient.onEvent('character:create', async (event) => {
    if (!db) {
      airiClient.send({ type: 'error', data: { message: 'Database not configured' } });
      return;
    }
    try {
      const dbChar = apiCharToDbChar(event.data.character);
      const [newCharacter] = await db.insert(characters).values(dbChar).returning();
      airiClient.send({ type: 'character:created', data: { character: dbCharToApiChar(newCharacter) } });
    } catch (error: any) {
      airiClient.send({ type: 'error', data: { message: error.message } });
    }
  });

  airiClient.onEvent('character:update', async (event) => {
    if (!db) {
      airiClient.send({ type: 'error', data: { message: 'Database not configured' } });
      return;
    }
    try {
      const dbChar = apiCharToDbChar(event.data.data);
      const [updatedCharacter] = await db.update(characters)
        .set(dbChar)
        .where(eq(characters.id, event.data.id))
        .returning();
      if (updatedCharacter) {
        airiClient.send({ type: 'character:updated', data: { character: dbCharToApiChar(updatedCharacter) } });
      } else {
        airiClient.send({ type: 'error', data: { message: 'Character not found for update' } });
      }
    } catch (error: any) {
      airiClient.send({ type: 'error', data: { message: error.message } });
    }
  });

  airiClient.onEvent('character:delete', async (event) => {
    if (!db) {
      airiClient.send({ type: 'error', data: { message: 'Database not configured' } });
      return;
    }
    try {
      const [deletedCharacter] = await db.delete(characters)
        .where(eq(characters.id, event.data.id))
        .returning();
      if (deletedCharacter) {
        airiClient.send({ type: 'character:deleted', data: { id: event.data.id } });
      } else {
        airiClient.send({ type: 'error', data: { message: 'Character not found for deletion' } });
      }
    } catch (error: any) {
      airiClient.send({ type: 'error', data: { message: error.message } });
    }
  });

  // Handle chat:message event for AI interaction (now a placeholder)
  airiClient.onEvent('input:text', async (event) => {
    console.log(`Received input: ${event.data.text}. AI interaction is currently disabled in this service.`);
    airiClient.send({ type: 'error', data: { message: 'AI interaction is currently disabled in this service.' } });
  });

  // New: Handle voice:uploadSample event (placeholder for voice cloning)
  airiClient.onEvent('voice:uploadSample', async (event) => {
    console.log(`Received voice sample for character ${event.data.characterId}. Format: ${event.data.format}`);
    // In a real scenario, this would involve:
    // 1. Storing the audio data (e.g., in cloud storage).
    // 2. Processing the audio for voice cloning (e.g., training a model, using a voice cloning API).
    // 3. Updating the character's voice settings in the database.
    airiClient.send({ type: 'voice:sampleUploaded', data: {
      characterId: event.data.characterId,
      sampleUrl: 'https://example.com/cloned-voice-sample.mp3', // Placeholder URL
    }});
  });

  // New: Handle voice:selectPreset event
  airiClient.onEvent('voice:selectPreset', async (event) => {
    console.log(`Selected voice preset ${event.data.presetId} for character ${event.data.characterId}`);
    // In a real scenario, this would involve:
    // 1. Updating the character's voice settings in the database.
    if (!db) {
      airiClient.send({ type: 'error', data: { message: 'Database not configured' } });
      return;
    }
    const character = await db.query.characters.findFirst({ where: eq(characters.id, event.data.characterId) });
    if (character) {
        const apiChar = dbCharToApiChar(character);
        apiChar.voice.type = 'preset';
        apiChar.voice.presetId = event.data.presetId;
        const dbChar = apiCharToDbChar(apiChar);
        const [updatedCharacter] = await db.update(characters).set(dbChar).where(eq(characters.id, event.data.characterId)).returning();
        airiClient.send({ type: 'character:updated', data: { character: dbCharToApiChar(updatedCharacter) } });
    }
  });

  // New: Handle emote:trigger event
  airiClient.onEvent('emote:trigger', async (event) => {
    console.log(`Triggering emote "${event.data.emoteName}" for character ${event.data.characterId}`);
    // In a real scenario, this would involve:
    // 1. Potentially validating the emote name.
    // 2. Sending the emote trigger to the frontend.
    airiClient.send({ type: 'emote:triggered', data: {
      characterId: event.data.characterId,
      emoteName: event.data.emoteName,
    }});
  });


  runUntilSignal()

  process.on('SIGINT', () => airiClient.close())
  process.on('SIGTERM', () => airiClient.close())
}

main()

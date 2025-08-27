export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: {
    modelUrl: string;
    textureUrl?: string;
    // Add more appearance properties as needed
  };
  personality: {
    traits: string[];
    backstory: string;
    // Add more personality properties as needed
  };
  voice: {
    type: 'cloned' | 'preset';
    sampleUrl?: string; // For cloned voices
    presetId?: string; // For preset voices
    // Add more voice properties as needed
  };
  emotes: {
    [key: string]: string; // Map emote name to animation data/trigger
  };
}

import { audioManager } from './audioManager';

export const playSound = (src: string, volume = 1, delay = 0) => {
  audioManager.play(src, { volume, delay });
};

export const stopAllSounds = () => {
  audioManager.stopAll();
};

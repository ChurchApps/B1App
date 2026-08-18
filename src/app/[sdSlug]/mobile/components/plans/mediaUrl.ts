export function isAudioUrl(url: string): boolean {
  const audioExtensions = [".mp3", ".m4a", ".aac", ".wav", ".flac", ".oga"];
  return audioExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Floating global audio mute/unmute button — shown on every screen.
import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/lib/audio";

export const GlobalAudioToggle = () => {
  const { muted, toggleMute } = useAudio();
  return (
    <button
      onClick={toggleMute}
      title={muted ? "Activer le son" : "Couper le son"}
      aria-label="Toggle audio"
      className="fixed bottom-4 right-4 z-[60] w-12 h-12 grid place-items-center rounded-full bg-ink text-surface border-[3px] border-ink shadow-pop hover:scale-110 active:scale-95 transition-transform"
    >
      {muted ? <VolumeX size={18} strokeWidth={3} /> : <Volume2 size={18} strokeWidth={3} />}
    </button>
  );
};

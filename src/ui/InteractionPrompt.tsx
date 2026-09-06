import { useGameStats } from "./useGameStats";

/**
 * The line telling the player what the thing in front of them can do.
 *
 * Doors need no prompt to open, since walking into one is the whole control.
 * This is only for what a body cannot do on its own: barring and bolting.
 */
export function InteractionPrompt() {
  const { interactionPrompt, paused, firstPerson } = useGameStats();
  if (!interactionPrompt || paused || !firstPerson) return null;

  return <p className="overlay__prompt">{interactionPrompt}</p>;
}

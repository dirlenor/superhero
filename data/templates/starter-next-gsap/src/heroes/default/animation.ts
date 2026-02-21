export default function applyHeroAnimation(config: { preset?: string; speed?: number; intensity?: number }) {
  return {
    preset: config.preset ?? "fadeUp",
    speed: config.speed ?? 1,
    intensity: config.intensity ?? 60,
    applied: false,
  };
}

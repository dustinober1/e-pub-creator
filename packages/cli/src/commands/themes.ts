export function themesCommand(): string {
  return JSON.stringify(
    {
      themes: ["classic-literary", "modern-clean"]
    },
    null,
    2
  );
}

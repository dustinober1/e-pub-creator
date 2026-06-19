export function themesRoute(): Response {
  return Response.json({
    themes: [
      { id: "classic-literary", name: "Classic Literary" },
      { id: "modern-clean", name: "Modern Clean" }
    ]
  });
}

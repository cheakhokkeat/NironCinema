export const movieFormats = ["2D", "3D", "4DX", "IMAX"];
export const formatFields = [
  ["audioLanguage", "Audio language", ["KH", "EN", "KR", "JP", "ZH", "HI"]],
  ["subtitleLanguage", "Subtitles", ["None", "KH", "EN", "KR", "JP", "ZH"]],
  [
    "sound",
    "Sound",
    ["Standard", "Dolby 5.1", "Dolby 7.1", "Dolby Atmos", "IMAX Sound"],
  ],
];
export function validateFormatProfiles(profiles) {
  if (!Array.isArray(profiles) || profiles.length > movieFormats.length)
    throw new Error("Choose valid movie formats.");
  const seen = new Set();
  return profiles.map((profile) => {
    if (!movieFormats.includes(profile.format) || seen.has(profile.format))
      throw new Error("Each movie format must be unique.");
    seen.add(profile.format);
    const result = { format: profile.format };
    for (const [key, label, options] of formatFields) {
      if (!options.includes(profile[key]))
        throw new Error(
          `Choose a valid ${label.toLowerCase()} for ${profile.format}.`,
        );
      result[key] = profile[key];
    }
    return result;
  });
}
export function profilesFor(movie, showtimes = []) {
  if (Array.isArray(movie?.formatProfiles)) return movie.formatProfiles;
  const profiles = [];
  for (const show of showtimes.filter((show) => show.movieId === movie?.id)) {
    if (
      !movieFormats.includes(show.format) ||
      profiles.some((p) => p.format === show.format)
    )
      continue;
    profiles.push({
      format: show.format,
      ...Object.fromEntries(
        formatFields.map(([key, , options]) => [
          key,
          options.includes(show[key]) ? show[key] : options[0],
        ]),
      ),
    });
  }
  return profiles;
}

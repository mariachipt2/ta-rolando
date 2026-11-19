type Profile = { id: string; name: string };
export const normalizedArtistName = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function resolveDraftArtists(names: string[], ids: string[], profiles: Profile[]) {
  const selected = new Map<string, Profile>();
  const unknown: string[] = [];
  const ambiguous: string[] = [];
  const invalidIds: string[] = [];
  for (const id of new Set(ids)) {
    const profile = profiles.find(profile => profile.id === id);
    if (profile) selected.set(profile.id, profile);
    else invalidIds.push(id);
  }
  for (const name of names) {
    const key = normalizedArtistName(name);
    const matches = profiles.filter(profile => normalizedArtistName(profile.name) === key);
    if (!matches.length) unknown.push(name);
    else if (matches.length > 1) ambiguous.push(name);
    else selected.set(matches[0].id, matches[0]);
  }
  return {
    ids: [...selected.keys()], names: [...selected.values()].map(profile => profile.name),
    unknown: [...new Set(unknown)], ambiguous: [...new Set(ambiguous)], invalidIds,
  };
}

import type { MyProfile, ProfileUpdateInput } from '@portfolio/shared';
import { api } from '@/lib/client-api';

// PUT /profile/me replaces every field it is given and clears the ones it is not, so a
// step that edits two fields must send the others back as they are.
export function saveProfile(profile: MyProfile, changes: Partial<ProfileUpdateInput>) {
  const { fullName, tagline, about, location, avatarUrl, theme, accentColor } = profile;
  const { availabilityEnabled, availabilityStatus, availabilityMessage } = profile;
  return api<MyProfile>('/profile/me', {
    method: 'PUT',
    body: {
      fullName,
      tagline,
      about,
      location,
      avatarUrl,
      theme,
      accentColor,
      availabilityEnabled,
      availabilityStatus,
      availabilityMessage,
      ...changes,
    },
  });
}

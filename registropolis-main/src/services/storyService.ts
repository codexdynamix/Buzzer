export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  media: { type: 'image' | 'video'; url: string }[];
  timestamp: string;
  viewers: string[];
  isExpired: boolean;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, method = 'GET', body?: any) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export async function saveStory(story: Story) {
  try {
    await apiFetch('/stories', 'POST', { media: story.media });
    return true;
  } catch (error) {
    console.error('Error saving story:', error);
    return false;
  }
}

export async function getActiveStories(): Promise<Story[]> {
  try {
    const data = await apiFetch('/stories');
    return data.stories || [];
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

export async function markStoryAsViewed(storyId: string, _userId: string) {
  try {
    await apiFetch(`/stories/${storyId}/view`, 'PATCH');
    return true;
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    return false;
  }
}

export async function markStoryAsExpired(storyId: string) {
  try {
    await apiFetch(`/stories/${storyId}/expire`, 'PATCH');
    return true;
  } catch (error) {
    console.error('Error marking story as expired:', error);
    return false;
  }
}

import type { UserTour } from '@/types/auth';

const LS_KEY = 'evoai:user_tours';

function loadFromStorage(): UserTour[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(tours: UserTour[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(tours));
  } catch {}
}

class TourService {
  async getTours(): Promise<UserTour[]> {
    return loadFromStorage();
  }

  async completeTour(tourKey: string, status: 'completed' | 'skipped' = 'completed'): Promise<UserTour> {
    const tour: UserTour = { id: tourKey, tour_key: tourKey, completed_at: new Date().toISOString(), status };
    const tours = loadFromStorage().filter(t => t.tour_key !== tourKey);
    saveToStorage([...tours, tour]);
    return tour;
  }

  async resetTour(tourKey: string): Promise<void> {
    saveToStorage(loadFromStorage().filter(t => t.tour_key !== tourKey));
  }
}

export const tourService = new TourService();

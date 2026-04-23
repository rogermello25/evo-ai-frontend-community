import api from '@/services/core/api';
import { extractData } from '@/utils/apiHelpers';
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
    try {
      const response = await api.get('/user_tours');
      return extractData<UserTour[]>(response);
    } catch {
      return loadFromStorage();
    }
  }

  async completeTour(tourKey: string, status: 'completed' | 'skipped' = 'completed'): Promise<UserTour> {
    const fallback: UserTour = { id: tourKey, tour_key: tourKey, completed_at: new Date().toISOString(), status };
    try {
      const response = await api.post('/user_tours', {
        tour: { tour_key: tourKey, status },
      });
      return extractData<UserTour>(response);
    } catch {
      const tours = loadFromStorage().filter(t => t.tour_key !== tourKey);
      saveToStorage([...tours, fallback]);
      return fallback;
    }
  }

  async resetTour(tourKey: string): Promise<void> {
    try {
      await api.delete(`/user_tours/${tourKey}`);
    } catch {
      saveToStorage(loadFromStorage().filter(t => t.tour_key !== tourKey));
    }
  }
}

export const tourService = new TourService();

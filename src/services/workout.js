const API_BASE_URL = 'http://localhost:8000';

export const fetchExercises = async (muscleGroup = '') => {
  let url = `${API_BASE_URL}/exercises/`;
  if (muscleGroup) {
    url += `?muscle_group=${muscleGroup}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch exercises');
  }
  return response.json();
};

export const createWorkoutSession = async (sessionData, token) => {
  const response = await fetch(`${API_BASE_URL}/workouts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create workout session');
  }
  return response.json();
};

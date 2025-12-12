import config from '../config';

const { API_BASE_URL } = config;

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

export const getLastUserWorkouts = async (token, limit) => {
  const response = await fetch(`${API_BASE_URL}/users/me/workouts/?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch workout sessions');
  }
  return response.json();
};

export const deleteWorkoutSession = async (sessionId, token) => {
  const response = await fetch(`${API_BASE_URL}/workouts/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete workout session');
  }
  // No content is expected on a successful delete
};

export const updateWorkoutSession = async (sessionId, sessionData, token) => {
  const response = await fetch(`${API_BASE_URL}/workouts/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update workout session');
  }
  return response.json();
};

export const fetchMajorMuscleGroups = async (token) => {
  const response = await fetch(`${API_BASE_URL}/major_muscle_groups/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch workout plans');
  }

  return response.json();
};

export const fetchMuscleGroups = async (majorMuscleGroup,token) => {
  const response = await fetch(`${API_BASE_URL}/muscle_groups/?major_muscle_group=${majorMuscleGroup}`, {
    method: 'GET',
    headers: {
      'Content-Type':'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create workout plan');
  }

  return response.json();
};

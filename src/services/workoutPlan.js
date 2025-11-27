const API_BASE_URL = 'http://localhost:8000';


export const getWorkoutUserPlans = async (token) => {
  console.log('Token in getWorkoutUserPlans:', token);
  const response = await fetch(`${API_BASE_URL}/users/me/workoutplans/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    console.log('Response:', response);
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch workout plans');
  }
  return response.json();
};


export const getWorkoutPlans = async (token) => {
  const response = await fetch(`${API_BASE_URL}/workoutplans/`, {
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

export const createWorkoutPlan = async (plan, token) => {
  const response = await fetch(`${API_BASE_URL}/workoutplans/`, {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(plan),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create workout plan');
  }
  return response.json();
};

export const updateWorkoutPlan = async (plan, token) => {
  const response = await fetch(`${API_BASE_URL}/workoutplans/${plan.id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(plan),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update workout plan');
  }
  return response.json();
};


export const deleteWorkoutPlan = async (planId, token) => {
  const response = await fetch(`${API_BASE_URL}/workoutplans/${planId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete workout plan');
  }
  // No content is expected on a successful delete
};

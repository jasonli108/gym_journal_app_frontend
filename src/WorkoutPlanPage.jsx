import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.js';
import { getWorkoutUserPlans, createWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan } from './services/workoutPlan';
import { fetchExercises } from './services/workout';

// Hardcoded MuscleGroup enum values from backend/enums.py
const MUSCLE_GROUPS = [
  'ABDUCTORS',
  'ABS',
  'ADDUCTORS',
  'BICEPS',
  'CALVES',
  'CHEST',
  'FOREARMS',
  'GLUTES',
  'HAMSTRUNGS',
  'HIP_FLEXORS',
  'IT_BAND',
  'LATS',
  'LOWER_BACK',
  'UPPER_BACK',
  'NECK',
  'OBLIQUES',
  'PALMAR_FASCIA',
  'PLANTAR_FASCIA',
  'QUADS',
  'SHOULDERS',
  'TRAPS',
  'TRICEPS',
];

const formatMuscleGroupForAPI = (group) => {
  if (!group) return '';
  // Convert "ABDUCTORS" to "Abductors"
  return group.charAt(0).toUpperCase() + group.slice(1).toLowerCase();
};

const WorkoutPlanPage = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [dailySelectedMuscleGroups, setDailySelectedMuscleGroups] = useState({
    Monday: '',
    Tuesday: '',
    Wednesday: '',
    Thursday: '',
    Friday: '',
    Saturday: '',
    Sunday: '',
  });
  const [dailyExercises, setDailyExercises] = useState({
    Monday: { exercises: [], loading: false, error: '' },
    Tuesday: { exercises: [], loading: false, error: '' },
    Wednesday: { exercises: [], loading: false, error: '' },
    Thursday: { exercises: [], loading: false, error: '' },
    Friday: { exercises: [], loading: false, error: '' },
    Saturday: { exercises: [], loading: false, error: '' },
    Sunday: { exercises: [], loading: false, error: '' },
  });
  const [dailySelectedExercises, setDailySelectedExercises] = useState({
    Monday: '',
    Tuesday: '',
    Wednesday: '',
    Thursday: '',
    Friday: '',
    Saturday: '',
    Sunday: '',
  });

  const fetchPlans = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const plans = await getWorkoutUserPlans(token);
      setWorkoutPlans(plans);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const fetchDailyExercises = async (day) => {
      const muscleGroup = dailySelectedMuscleGroups[day];
      if (!muscleGroup) {
        setDailyExercises(prev => ({ ...prev, [day]: { exercises: [], loading: false, error: '' } }));
        return;
      }

      setDailyExercises(prev => ({ ...prev, [day]: { ...prev[day], loading: true, error: '' } }));
      try {
        const formattedMuscleGroup = formatMuscleGroupForAPI(muscleGroup);
        const fetchedExercises = await fetchExercises(formattedMuscleGroup);
        setDailyExercises(prev => ({ ...prev, [day]: { exercises: fetchedExercises, loading: false, error: '' } }));
        if (fetchedExercises.length > 0) {
          setDailySelectedExercises(prev => ({ ...prev, [day]: fetchedExercises[0].display_name }));
        } else {
          setDailySelectedExercises(prev => ({ ...prev, [day]: '' }));
        }
      } catch (err) {
        setDailyExercises(prev => ({ ...prev, [day]: { ...prev[day], loading: false, error: err.message } }));
      }
    };

    Object.keys(dailySelectedMuscleGroups).forEach(day => {
      fetchDailyExercises(day);
    });
  }, [dailySelectedMuscleGroups]);

  const handleAddPlan = async () => {
    setError('');
    setEditingPlan({
      name: 'New Workout Plan',
      workoutplan_summary: {
        goal: 'New Plan',
        workout_type: '',
        training_level: '',
        program_duration: '',
        days_per_week: 0,
        time_per_workout: '',
        equipments: [],
        target_gender: '',
        recommended_supplements: [],
      },
      schedule: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      },
    });
  };

  const handleRemovePlan = async (planId) => {
    setError('');
    try {
      await deleteWorkoutPlan(planId, token);
      await fetchPlans(); // Refetch plans to reflect the deletion
    } catch (err) {
      setError(err.message);
    }
  };

  const handleModifyPlan = (plan) => {
    setEditingPlan({ 
        ...plan, 
        schedule: plan.workoutplan_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        }
    });
  };

  const handleSavePlan = async () => {
    setError('');
    try {
      const planToSave = {
        user_id: user.username,
        name: editingPlan.name,
        workoutplan_summary: editingPlan.workoutplan_summary,
        workoutplan_schedule: editingPlan.schedule,
      };

      if (editingPlan.workoutplan_id) {
        await updateWorkoutPlan({ ...planToSave, id: editingPlan.workoutplan_id }, token);
      } else {
        await createWorkoutPlan(planToSave, token);
      }
      setEditingPlan(null);
      await fetchPlans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    setEditingPlan(prev => ({
        ...prev,
        name: value
    }));
  };

  const handleSummaryChange = (e) => {
    const { name, value } = e.target;
    setEditingPlan(prev => ({
        ...prev,
        workoutplan_summary: {
            ...prev.workoutplan_summary,
            [name]: value
        }
    }));
  };

  const handleAddToSchedule = (day) => {
    const exerciseName = dailySelectedExercises[day];
    if (!exerciseName) return;

    setEditingPlan(prevPlan => ({
      ...prevPlan,
      schedule: {
        ...prevPlan.schedule,
        [day]: [...prevPlan.schedule[day], { name: exerciseName }]
      }
    }));
  };

  const handleRemoveFromSchedule = (day, index) => {
    setEditingPlan(prevPlan => ({
      ...prevPlan,
      schedule: {
        ...prevPlan.schedule,
        [day]: prevPlan.schedule[day].filter((_, i) => i !== index)
      }
    }));
  };

  if (authLoading) return <p>Loading authentication status...</p>;
  
  if (!user) {
    return (
      <div>
        <h1>Workout Plan Page</h1>
        <p>Please log in to manage your workout plans.</p>
      </div>
    );
  }

  if (editingPlan) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const summary = editingPlan.workoutplan_summary;

    return (
      <div>
        <h1>Edit Workout Plan</h1>
        
        <div>
          <h2>Workout Plan Summary</h2>
          <div><label>Name: <input type="text" name="name" value={editingPlan.name} onChange={handleNameChange} /></label></div>
          <div><label>Goal: <input type="text" name="goal" value={summary.goal} onChange={handleSummaryChange} /></label></div>
          <div><label>Workout Type: <input type="text" name="workout_type" value={summary.workout_type} onChange={handleSummaryChange} /></label></div>
          <div><label>Training Level: <input type="text" name="training_level" value={summary.training_level} onChange={handleSummaryChange} /></label></div>
          <div><label>Program Duration: <input type="text" name="program_duration" value={summary.program_duration} onChange={handleSummaryChange} /></label></div>
          <div><label>Days Per Week: <input type="number" name="days_per_week" value={summary.days_per_week} onChange={handleSummaryChange} /></label></div>
          <div><label>Time Per Workout: <input type="text" name="time_per_workout" value={summary.time_per_workout} onChange={handleSummaryChange} /></label></div>
          <div><label>Equipments: <input type="text" name="equipments" value={summary.equipments.join(', ')} onChange={(e) => handleSummaryChange({target: {name: 'equipments', value: e.target.value.split(', ')}})} /></label></div>
          <div><label>Target Gender: <input type="text" name="target_gender" value={summary.target_gender} onChange={handleSummaryChange} /></label></div>
          <div><label>Recommended Supplements: <input type="text" name="recommended_supplements" value={summary.recommended_supplements.join(', ')} onChange={(e) => handleSummaryChange({target: {name: 'recommended_supplements', value: e.target.value.split(', ')}})} /></label></div>
        </div>

        <div>
          <h2>Workout Schedule (7 Days)</h2>
          {daysOfWeek.map(day => (
            <div key={day}>
              <h3>{day}</h3>
              <ul>
                {editingPlan.schedule[day].map((exercise, index) => (
                  <li key={index}>
                    {exercise.name}
                    <button onClick={() => handleRemoveFromSchedule(day, index)}>Remove</button>
                  </li>
                ))}
              </ul>
              <div>
                <label htmlFor={`muscle-group-select-${day}`}>Muscle Group:</label>
                <select
                  id={`muscle-group-select-${day}`}
                  value={dailySelectedMuscleGroups[day]}
                  onChange={(e) => setDailySelectedMuscleGroups({ ...dailySelectedMuscleGroups, [day]: e.target.value })}
                >
                  <option value="">All Muscle Groups</option>
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </option>
                  ))}
                </select>

                <label htmlFor={`exercise-select-${day}`}>Exercise:</label>
                <select
                  id={`exercise-select-${day}`}
                  value={dailySelectedExercises[day]}
                  onChange={(e) => setDailySelectedExercises({ ...dailySelectedExercises, [day]: e.target.value })}
                  disabled={dailyExercises[day].loading}
                >
                  {dailyExercises[day].loading && <option>Loading exercises...</option>}
                  {dailyExercises[day].error && <option>Error loading exercises</option>}
                  {!dailyExercises[day].loading && dailyExercises[day].exercises.length === 0 && (
                    <option>No exercises available</option>
                  )}
                  {!dailyExercises[day].loading &&
                    dailyExercises[day].exercises.length > 0 &&
                    dailyExercises[day].exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.display_name}>
                        {exercise.display_name}
                      </option>
                    ))}
                </select>
                <button onClick={() => handleAddToSchedule(day)}>Add to {day}</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <button onClick={handleSavePlan}>Save Plan</button>
          <button onClick={() => setEditingPlan(null)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Workout Plan Page</h1>
      <p>
        Welcome, {user.username}! Here you can create and view your workout plans.
      </p>

      <div>
        <button onClick={handleAddPlan}>Add New Workout Plan</button>
      </div>

      <h2>Your Workout Plans</h2>
      {loading ? (
        <p>Loading workout plans...</p>
      ) : (
        <ul>
          {workoutPlans.slice(-5).map((plan) => (
            <li key={plan.workoutplan_id}>
              {plan.name}
              <button onClick={() => handleModifyPlan(plan)}>Modify</button>
              <button onClick={() => handleRemovePlan(plan.workoutplan_id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

    </div>
  );
};

export default WorkoutPlanPage;

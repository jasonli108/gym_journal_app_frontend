import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { fetchExercises, createWorkoutSession, getLastUserWorkouts, deleteWorkoutSession, updateWorkoutSession } from './services/workout';

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

const WorkoutPage = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exerciseError, setExerciseError] = useState('');
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // State for the new workout session form
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [currentExerciseLogs, setCurrentExerciseLogs] = useState([]);
  const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [workoutCreationMessage, setWorkoutCreationMessage] = useState('');
  const [workoutCreationError, setWorkoutCreationError] = useState('');
  
  // State for recent workouts
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentWorkoutsError, setRecentWorkoutsError] = useState('');

  const fetchRecentWorkouts = async () => {
      if (!token || !user) return;
      setLoadingRecent(true);
      setRecentWorkoutsError('');
      try {
          const workouts = await getLastUserWorkouts(token, 5);
          setRecentWorkouts(workouts);
      } catch (err) {
          setRecentWorkoutsError(err.message);
      } finally {
          setLoadingRecent(false);
      }
  };

  useEffect(() => {
    fetchRecentWorkouts();
  }, [token, user]);

  const handleEditWorkout = (session) => {
    setEditingSession(session);
    setSessionDate(session.session_date);
    setCurrentExerciseLogs(session.exercises);
    setIsCreatingWorkout(false); // Close creation form if open
  };

  const handleDeleteWorkout = async (sessionId) => {
    setRecentWorkoutsError('');
    try {
      await deleteWorkoutSession(sessionId, token);
      await fetchRecentWorkouts(); // Refetch recent workouts after deletion
    } catch (err) {
      setRecentWorkoutsError(err.message);
    }
  };

  useEffect(() => {
    const getExercises = async () => {
      setLoadingExercises(true);
      setExerciseError('');
      try {
        const formattedMuscleGroup =
          formatMuscleGroupForAPI(selectedMuscleGroup);
        const fetchedExercises = await fetchExercises(formattedMuscleGroup);
        setExercises(fetchedExercises);
        if (fetchedExercises.length > 0) {
          setSelectedExerciseForAdd(fetchedExercises[0].display_name);
        } else {
          setSelectedExerciseForAdd('');
        }
      } catch (err) {
        setExerciseError(err.message);
      } finally {
        setLoadingExercises(false);
      }
    };

    getExercises();
  }, [selectedMuscleGroup]);

  const handleAddExercise = () => {
    if (!selectedExerciseForAdd || !sets || !reps) {
      setWorkoutCreationError('Please select an exercise and enter sets/reps.');
      return;
    }
    const newLog = {
      exercise: selectedExerciseForAdd,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight_kg: weight ? parseFloat(weight) : null,
    };
    setCurrentExerciseLogs([...currentExerciseLogs, newLog]);
    setSets('');
    setReps('');
    setWeight('');
    setWorkoutCreationError('');
  };

  const handleRemoveExercise = (index) => {
    setCurrentExerciseLogs(currentExerciseLogs.filter((_, i) => i !== index));
  };

  const handleCreateOrUpdateWorkoutSession = async () => {
    setWorkoutCreationError('');
    setWorkoutCreationMessage('');
    if (!sessionDate || currentExerciseLogs.length === 0) {
      setWorkoutCreationError('Please select a date and add at least one exercise.');
      return;
    }
    if (!user || !token) {
      setWorkoutCreationError('You must be logged in to perform this action.');
      return;
    }

    const sessionData = {
      user_id: user.username,
      session_date: sessionDate,
      exercises: currentExerciseLogs,
    };

    try {
      if (editingSession) {
        await updateWorkoutSession(editingSession.session_id, sessionData, token);
        setWorkoutCreationMessage('Workout session updated successfully!');
        setEditingSession(null);
      } else {
        await createWorkoutSession(sessionData, token);
        setWorkoutCreationMessage('Workout session created successfully!');
      }
      // Reset form
      setSessionDate(new Date().toISOString().split('T')[0]);
      setCurrentExerciseLogs([]);
      setIsCreatingWorkout(false);
      await fetchRecentWorkouts();
    } catch (err) {
      setWorkoutCreationError(err.message);
    }
  };

  if (authLoading) return <p>Loading authentication status...</p>;

  if (!user) {
    return (
      <div>
        <h1>Workout Page</h1>
        <p>Please log in to view and create workout sessions.</p>
      </div>
    );
  }

  const workoutForm = (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', marginBottom: '20px' }}>
      <h3>{editingSession ? 'Edit Workout Session' : 'New Workout Session'}</h3>
      {workoutCreationError && <p style={{ color: 'red' }}>{workoutCreationError}</p>}
      {workoutCreationMessage && <p style={{ color: 'green' }}>{workoutCreationMessage}</p>}

      <div>
        <label htmlFor="session-date">Session Date:</label>
        <input type="date" id="session-date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
      </div>

      <h4 style={{ marginTop: '20px' }}>Add Exercises</h4>
      <div>
        <label htmlFor="muscle-group-select">Muscle Group:</label>
        <select id="muscle-group-select" value={selectedMuscleGroup} onChange={(e) => setSelectedMuscleGroup(e.target.value)}>
          <option value="">All Muscle Groups</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            </option>
          ))}
        </select>

        <label htmlFor="exercise-select">Exercise:</label>
        <select id="exercise-select" value={selectedExerciseForAdd} onChange={(e) => setSelectedExerciseForAdd(e.target.value)} disabled={loadingExercises}>
          {loadingExercises && <option>Loading exercises...</option>}
          {!loadingExercises && exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.display_name}>{exercise.display_name}</option>
          ))}
        </select>

        <label>Sets:</label>
        <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} min="1" required />
        <label>Reps:</label>
        <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} min="1" required />
        <label>Weight (kg):</label>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min="0" step="0.1" />
        <button onClick={handleAddExercise}>Add Exercise</button>
      </div>

      <h4 style={{ marginTop: '20px' }}>Exercises in Current Session:</h4>
      <ul>
        {currentExerciseLogs.map((log, index) => (
          <li key={index}>
            {log.exercise} - {log.sets} sets x {log.reps} reps {log.weight_kg ? `x ${log.weight_kg}kg` : ''}
            <button onClick={() => handleRemoveExercise(index)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={handleCreateOrUpdateWorkoutSession}>{editingSession ? 'Update Workout Session' : 'Submit Workout Session'}</button>
    </div>
  );

  return (
    <div>
      <h1>Workout Page</h1>
      <p>Welcome, {user.username}! Here you can create and view your workouts.</p>

      {!editingSession && (
        <button onClick={() => { setIsCreatingWorkout(!isCreatingWorkout); if (isCreatingWorkout) { setSessionDate(new Date().toISOString().split('T')[0]); setCurrentExerciseLogs([]); setWorkoutCreationError(''); setWorkoutCreationMessage(''); } }}>
          {isCreatingWorkout ? 'Cancel Workout Creation' : 'Create New Workout Session'}
        </button>
      )}

      {isCreatingWorkout && !editingSession && workoutForm}
      {editingSession && workoutForm}
      
      <div style={{ marginTop: '20px' }}>
        <h2>Last 5 Workout Sessions</h2>
        {loadingRecent && <p>Loading recent workouts...</p>}
        {recentWorkoutsError && <p style={{ color: 'red' }}>{recentWorkoutsError}</p>}
        {recentWorkouts.length > 0 ? (
          <ul>
            {recentWorkouts.map((session) => (
              <li key={session.session_id}>
                <strong>{session.session_date}</strong>
                <button onClick={() => handleEditWorkout(session)} style={{ marginLeft: '10px' }}>Edit</button>
                <button onClick={() => handleDeleteWorkout(session.session_id)} style={{ marginLeft: '10px' }}>Delete</button>
                <ul>
                  {session.exercises.map((ex, index) => (
                    <li key={index}>
                      {ex.exercise} - {ex.sets} sets x {ex.reps} reps {ex.weight_kg ? `x ${ex.weight_kg}kg` : ''}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          !loadingRecent && <p>No recent workouts found.</p>
        )}
      </div>
    </div>
  );
};

export default WorkoutPage;
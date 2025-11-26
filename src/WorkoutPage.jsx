import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { fetchExercises, createWorkoutSession } from './services/workout';

// Hardcoded MuscleGroup enum values from backend/enums.py
const MUSCLE_GROUPS = [
  "ABDUCTORS", "ABS", "ADDUCTORS", "BICEPS", "CALVES", "CHEST",
  "FOREARMS", "GLUTES", "HAMSTRUNGS", "HIP_FLEXORS", "IT_BAND", "LATS",
  "LOWER_BACK", "UPPER_BACK", "NECK", "OBLIQUES", "PALMAR_FASCIA",
  "PLANTAR_FASCIA", "QUADS", "SHOULDERS", "TRAPS", "TRICEPS"
];

const WorkoutPage = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exerciseError, setExerciseError] = useState('');
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);

  // State for the new workout session form
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentExerciseLogs, setCurrentExerciseLogs] = useState([]);
  const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [workoutCreationMessage, setWorkoutCreationMessage] = useState('');
  const [workoutCreationError, setWorkoutCreationError] = useState('');

  useEffect(() => {
    const getExercises = async () => {
      setLoadingExercises(true);
      setExerciseError('');
      try {
        const fetchedExercises = await fetchExercises(selectedMuscleGroup);
        setExercises(fetchedExercises);
        // Set a default selected exercise if any are fetched
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
    // Reset add exercise form fields
    setSets('');
    setReps('');
    setWeight('');
    setWorkoutCreationError('');
  };

  const handleRemoveExercise = (index) => {
    setCurrentExerciseLogs(currentExerciseLogs.filter((_, i) => i !== index));
  };

  const handleCreateWorkoutSession = async () => {
    setWorkoutCreationError('');
    setWorkoutCreationMessage('');
    if (!sessionDate || currentExerciseLogs.length === 0) {
      setWorkoutCreationError('Please select a date and add at least one exercise.');
      return;
    }
    if (!user || !token) {
      setWorkoutCreationError('You must be logged in to create a workout session.');
      return;
    }

    try {
      const sessionData = {
        user_id: user.username, // Using username as user_id as per backend logic
        session_date: sessionDate,
        exercises: currentExerciseLogs,
      };
      await createWorkoutSession(sessionData, token);
      setWorkoutCreationMessage('Workout session created successfully!');
      // Reset form
      setSessionDate(new Date().toISOString().split('T')[0]);
      setCurrentExerciseLogs([]);
      setIsCreatingWorkout(false);
    } catch (err) {
      setWorkoutCreationError(err.message);
    }
  };

  if (authLoading) {
    return <p>Loading authentication status...</p>;
  }

  if (!user) {
    return (
      <div>
        <h1>Workout Page</h1>
        <p>Please log in to view and create workout sessions.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Workout Page</h1>
      <p>Welcome, {user.username}! Here you can create and view your workouts.</p>

      <button onClick={() => {
        setIsCreatingWorkout(!isCreatingWorkout);
        // Reset form when toggling off
        if (isCreatingWorkout) {
          setSessionDate(new Date().toISOString().split('T')[0]);
          setCurrentExerciseLogs([]);
          setWorkoutCreationError('');
          setWorkoutCreationMessage('');
        }
      }}>
        {isCreatingWorkout ? 'Cancel Workout Creation' : 'Create New Workout Session'}
      </button>

      {/* Workout Creation Form */}
      {isCreatingWorkout && (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', marginBottom: '20px' }}>
          <h3>New Workout Session</h3>
          {workoutCreationError && <p style={{ color: 'red' }}>{workoutCreationError}</p>}
          {workoutCreationMessage && <p style={{ color: 'green' }}>{workoutCreationMessage}</p>}
          
          <div>
            <label htmlFor="session-date">Session Date:</label>
            <input
              type="date"
              id="session-date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>

          <h4 style={{ marginTop: '20px' }}>Add Exercises</h4>
          <div>
            <label htmlFor="exercise-select">Exercise:</label>
            <select
              id="exercise-select"
              value={selectedExerciseForAdd}
              onChange={(e) => setSelectedExerciseForAdd(e.target.value)}
              disabled={loadingExercises}
            >
              {loadingExercises && <option>Loading exercises...</option>}
              {!loadingExercises && exercises.length === 0 && <option>No exercises available</option>}
              {!loadingExercises && exercises.length > 0 && exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.display_name}>
                  {exercise.display_name}
                </option>
              ))}
            </select>
            <label htmlFor="sets" style={{ marginLeft: '10px' }}>Sets:</label>
            <input
              type="number"
              id="sets"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              min="1"
              required
              style={{ width: '60px' }}
            />
            <label htmlFor="reps" style={{ marginLeft: '10px' }}>Reps:</label>
            <input
              type="number"
              id="reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              min="1"
              required
              style={{ width: '60px' }}
            />
            <label htmlFor="weight" style={{ marginLeft: '10px' }}>Weight (kg):</label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0"
              step="0.1"
              style={{ width: '80px' }}
            />
            <button onClick={handleAddExercise} style={{ marginLeft: '10px' }}>Add Exercise</button>
          </div>

          <h4 style={{ marginTop: '20px' }}>Exercises in Current Session:</h4>
          {currentExerciseLogs.length === 0 ? (
            <p>No exercises added yet.</p>
          ) : (
            <ul>
              {currentExerciseLogs.map((log, index) => (
                <li key={index}>
                  {log.exercise} - {log.sets} sets x {log.reps} reps {log.weight_kg ? `x ${log.weight_kg}kg` : ''}
                  <button onClick={() => handleRemoveExercise(index)} style={{ marginLeft: '10px' }}>Remove</button>
                </li>
              ))}
            </ul>
          )}

          <button onClick={handleCreateWorkoutSession} style={{ marginTop: '20px' }}>Submit Workout Session</button>
        </div>
      )}

      {/* Muscle Group Selection */}
      <div style={{ marginTop: '20px' }}>
        <label htmlFor="muscle-group-select">Filter Exercises by Muscle Group:</label>
        <select
          id="muscle-group-select"
          value={selectedMuscleGroup}
          onChange={(e) => setSelectedMuscleGroup(e.target.value)}
        >
          <option value="">All Muscle Groups</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Display Exercises */}
      <div style={{ marginTop: '20px' }}>
        <h2>Available Exercises</h2>
        {loadingExercises && <p>Loading exercises...</p>}
        {exerciseError && <p style={{ color: 'red' }}>Error: {exerciseError}</p>}
        {!loadingExercises && exercises.length === 0 && !exerciseError && (
          <p>No exercises found for the selected muscle group.</p>
        )}
        {!loadingExercises && exercises.length > 0 && (
          <ul>
            {exercises.map((exercise) => (
              <li key={exercise.id}>
                <strong>{exercise.display_name}</strong> - {exercise.muscle_group}
                {exercise.url && <a href={exercise.url} target="_blank" rel="noopener noreferrer"> (Info)</a>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WorkoutPage;
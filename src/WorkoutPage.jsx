import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.js';
import { fetchExercises, createWorkoutSession, getLastUserWorkouts, deleteWorkoutSession, updateWorkoutSession } from './services/workout';

const MAJOR_MUSCLE_GROUPS = {
  ARMS: ['BICEPS', 'TRICEPS', 'FOREARMS'],
  BACK: ['LATS', 'LOWER_BACK', 'UPPER_BACK', 'TRAPS'],
  CHEST: ['CHEST'],
  LEGS: ['ABDUCTORS', 'ADDUCTORS', 'CALVES', 'GLUTES', 'HAMSTRINGS', 'QUADS'],
  ABS: ['ABS', 'OBLIQUES'],
  SHOULDER: ['SHOULDERS'],
};

const ALL_MUSCLE_GROUPS = [
  'ABDUCTORS',
  'ABS',
  'ADDUCTORS',
  'BICEPS',
  'CALVES',
  'CHEST',
  'FOREARMS',
  'GLUTES',
  'HAMSTRINGS',
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
  const [selectedMajorMuscleGroup, setSelectedMajorMuscleGroup] = useState('');
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
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [workoutCreationMessage, setWorkoutCreationMessage] = useState('');
  const [workoutCreationError, setWorkoutCreationError] = useState('');
  
  // State for recent workouts
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentWorkoutsError, setRecentWorkoutsError] = useState('');

  const fetchRecentWorkouts = useCallback(async () => {
      if (!token || !user) return;
      setLoadingRecent(true);
      setRecentWorkoutsError('');
      try {
          const workouts = await getLastUserWorkouts(token, 8);
          setRecentWorkouts(workouts);
      } catch (err) {
          setRecentWorkoutsError(err.message);
      } finally {
          setLoadingRecent(false);
      }
  }, [token, user]);

  useEffect(() => {
    fetchRecentWorkouts();
  }, [token, user, fetchRecentWorkouts]);

  const handleEditWorkout = (session) => {
    setEditingSession(session);
    setSessionDate(session.session_date);
    setCurrentExerciseLogs(session.exercises);
    setIsCreatingWorkout(false); // Close creation form if open
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setSessionDate(new Date().toISOString().split('T')[0]);
    setCurrentExerciseLogs([]);
    setWorkoutCreationError('');
    setWorkoutCreationMessage('');
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

  const handleCopyWorkout = (session) => {
    const newDate = prompt("Please enter the new date for the workout session (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (newDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newDate)) {
        alert("Invalid date format. Please use YYYY-MM-DD.");
        return;
      }
      
      setEditingSession(null);
      setIsCreatingWorkout(true);
      setSessionDate(newDate);
      // Deep copy exercises to avoid reference issues
      const copiedExercises = JSON.parse(JSON.stringify(session.exercises));
      setCurrentExerciseLogs(copiedExercises);
      setWorkoutCreationMessage('Workout session copied. Adjust as needed and save.');
      setWorkoutCreationError('');
      // Scroll to the form
      window.scrollTo(0, 0);
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
      weight: weight ? { value: parseInt(weight), unit: weightUnit } : null,
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
      <div className="main-content">
        <h1>Workout Page</h1>
        <p>Please log in to view and create workout sessions.</p>
      </div>
    );
  }

  const muscleGroupsForSelectedMajor = selectedMajorMuscleGroup
    ? MAJOR_MUSCLE_GROUPS[selectedMajorMuscleGroup]
    : ALL_MUSCLE_GROUPS;

  const workoutForm = (
    <div className="form-container" style={{ marginTop: '20px', marginBottom: '20px' }}>
      <div className="form-section">
        <h3>{editingSession ? 'Edit Workout Session' : 'New Workout Session'}</h3>
        {workoutCreationError && <p style={{ color: '#cf6679' }}>{workoutCreationError}</p>}
        {workoutCreationMessage && <p style={{ color: '#bb86fc' }}>{workoutCreationMessage}</p>}

        <div className="form-group">
          <label className="form-label" htmlFor="session-date">Session Date:</label>
          <input type="date" id="session-date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required className="form-input" />
        </div>
      </div>

      <div className="form-section">
        <h4>Add Exercises</h4>
        <div className="form-group">
          <label className="form-label" htmlFor="major-muscle-group-select">Major Muscle Group:</label>
          <select id="major-muscle-group-select" value={selectedMajorMuscleGroup} onChange={(e) => {
            setSelectedMajorMuscleGroup(e.target.value);
            setSelectedMuscleGroup('');
          }} className="form-select">
            <option value="">All Major Groups</option>
            {Object.keys(MAJOR_MUSCLE_GROUPS).map((group) => (
              <option key={group} value={group}>
                {group.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="muscle-group-select">Muscle Group:</label>
          <select id="muscle-group-select" value={selectedMuscleGroup} onChange={(e) => setSelectedMuscleGroup(e.target.value)} className="form-select">
            <option value="">All Muscle Groups</option>
            {muscleGroupsForSelectedMajor.map((group) => (
              <option key={group} value={group}>
                {group.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="exercise-select">Exercise:</label>
          <select id="exercise-select" value={selectedExerciseForAdd} onChange={(e) => setSelectedExerciseForAdd(e.target.value)} disabled={loadingExercises} className="form-select">
            {loadingExercises && <option>Loading exercises...</option>}
            {!loadingExercises && exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.display_name}>{exercise.display_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Sets:</label>
          <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} min="1" required className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Reps:</label>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} min="1" required className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Weight:</label>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min="0" step="0.1" className="form-input" />
          <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="form-select" style={{ marginLeft: '10px' }}>
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
        </div>
        <button onClick={handleAddExercise} className="btn btn-primary">Add Exercise</button>
      </div>

      <div className="form-section">
        <h4>Exercises in Current Session:</h4>
        <ul className="exercise-list">
          {currentExerciseLogs.map((log, index) => (
            <li key={index} className="exercise-list-item">
              <span>{log.exercise} - {log.sets} sets x {log.reps} reps {log.weight ? `x ${log.weight.value}${log.weight.unit}` : ''}</span>
              <button onClick={() => handleRemoveExercise(index)} className="btn btn-danger btn-sm">Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="btn-group">
        <button onClick={handleCreateOrUpdateWorkoutSession} className="btn btn-primary">
          {editingSession ? 'Update Workout Session' : 'Submit Workout Session'}
        </button>
        {editingSession && <button onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>}
        {!editingSession && isCreatingWorkout && (
            <button onClick={() => {
                setIsCreatingWorkout(false);
                setSessionDate(new Date().toISOString().split('T')[0]);
                setCurrentExerciseLogs([]);
                setWorkoutCreationError('');
                setWorkoutCreationMessage('');
            }} className="btn btn-secondary">Cancel</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="main-content">
      <h1>Workout Page</h1>
      <p>Welcome, {user.username}! Here you can create and view your workouts.</p>

      {!isCreatingWorkout && !editingSession && (
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setIsCreatingWorkout(true)} className="btn btn-primary">
            Create New Workout Session
          </button>
        </div>
      )}

      {isCreatingWorkout && !editingSession && workoutForm}
      {editingSession && workoutForm}
      
      <div className="form-container" style={{ marginTop: '20px' }}>
        <h2>Last 8 Workout Sessions</h2>
        {loadingRecent && <p>Loading recent workouts...</p>}
        {recentWorkoutsError && <p style={{ color: '#cf6679' }}>{recentWorkoutsError}</p>}
        {recentWorkouts.length > 0 ? (
          <ul className="exercise-list">
            {recentWorkouts.map((session) => (
              <li key={session.session_id} className="exercise-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <strong>{session.session_date}</strong>
                <ul className="exercise-list" style={{ width: '100%'}}>
                  {session.exercises.map((ex, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>
                      {ex.exercise} - {ex.sets} sets x {ex.reps} reps {ex.weight ? `x ${ex.weight.value}${ex.weight.unit}` : ''}
                    </li>
                  ))}
                </ul>
                <div className="btn-group">
                  <button onClick={() => handleEditWorkout(session)} className="btn btn-secondary btn-sm">Edit</button>
                  <button onClick={() => handleDeleteWorkout(session.session_id)} className="btn btn-danger btn-sm">Delete</button>
                  <button onClick={() => handleCopyWorkout(session)} className="btn btn-secondary btn-sm">Copy</button>
                </div>
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

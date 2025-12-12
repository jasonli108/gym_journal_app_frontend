import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.js';
import { fetchExercises, fetchMajorMuscleGroups, fetchMuscleGroups, createWorkoutSession, getLastUserWorkouts, deleteWorkoutSession, updateWorkoutSession } from './services/workout';

const formatMuscleGroupForAPI = (group) => {
  if (!group) return '';
  // Convert "ABDUCTORS" to "Abductors"
  return group.charAt(0).toUpperCase() + group.slice(1).toLowerCase();
};

const WorkoutPage = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [majorMuscleGroups, setMajorMuscleGroups] = useState([]);
  const [subMuscleGroups, setsubMuscleGroups] = useState([]);
  const [allMuscleGroups, setAllMuscleGroups] = useState([]);
  const [selectedMajorMuscleGroup, setSelectedMajorMuscleGroup] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState(false);
  const [exerciseMap, setExerciseMap] = useState({});

  // Form state
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentExerciseLogs, setCurrentExerciseLogs] = useState([]);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [workoutCreationMessage, setWorkoutCreationMessage] = useState('');
  const [workoutCreationError, setWorkoutCreationError] = useState('');
  
  // Recent workouts state
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentWorkoutsError, setRecentWorkoutsError] = useState('');

  useEffect(() => {
    const getInitialMuscleGroups = async () => {
      try {
        // Fetch major muscle groups
        const majorGroups = await fetchMajorMuscleGroups();
        setMajorMuscleGroups(majorGroups);

        // Fetch all exercises to derive all possible minor muscle groups
        const fetchedAllExercises = await fetchExercises();
        const newMap = fetchedAllExercises.reduce((acc, ex) => {
          acc[ex.display_name] = ex; // Use display_name as key for quick lookup
          return acc;
        }, {});
        setExerciseMap(newMap);
        const uniqueMuscleGroups = [...new Set(fetchedAllExercises.map(ex => ex.muscle_group))];
        setAllMuscleGroups(uniqueMuscleGroups);
      } catch (error) {
        console.error("Failed to fetch initial muscle groups:", error);
      }
    };
    getInitialMuscleGroups();
  }, [token]);

  useEffect(() => {
    const getSubMuscleGroups = async () => {
      if (selectedMajorMuscleGroup) {
        try {
          const minorGroups = await fetchMuscleGroups(selectedMajorMuscleGroup);
          setsubMuscleGroups(minorGroups);
        } catch (error) {
          console.error(`Failed to fetch minor muscle groups for ${selectedMajorMuscleGroup}:`, error);
          setsubMuscleGroups([]); // Reset on error
        }
      } else {
        setsubMuscleGroups([]); // Reset if no major group is selected
      }
    };
    getSubMuscleGroups();
  }, [selectedMajorMuscleGroup]);

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
    setIsCreatingWorkout(false);
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
      await fetchRecentWorkouts();
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
      const copiedExercises = JSON.parse(JSON.stringify(session.exercises));
      setCurrentExerciseLogs(copiedExercises);
      setWorkoutCreationMessage('Workout session copied. Adjust as needed and save.');
      setWorkoutCreationError('');
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const getExercises = async () => {
      setLoadingExercises(true);
      try {
        const formattedMuscleGroup = formatMuscleGroupForAPI(selectedMuscleGroup);
        const fetchedExercises = await fetchExercises(formattedMuscleGroup);
        setExercises(fetchedExercises);
        if (fetchedExercises.length > 0) {
          setSearchTerm(fetchedExercises[0].display_name);
        } else {
          setSearchTerm('');
        }
      } catch (err) {
        console.error("Failed to fetch exercises:", err);
      } finally {
        setLoadingExercises(false);
      }
    };
    if(selectedMuscleGroup){
        getExercises();
    } else {
        setExercises([]);
        setSearchTerm('');
    }
  }, [selectedMuscleGroup]);

  const handleAddExercise = () => {
    if (!searchTerm || !sets || !reps) {
      setWorkoutCreationError('Please select an exercise and enter sets/reps.');
      return;
    }

    const newLog = {
      exercise: searchTerm,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: weight ? { value: parseFloat(weight), unit: weightUnit } : null,
    };

    if (editingExerciseIndex !== null) {
      const updatedLogs = [...currentExerciseLogs];
      updatedLogs[editingExerciseIndex] = newLog;
      setCurrentExerciseLogs(updatedLogs);
      setEditingExerciseIndex(null);
    } else {
      setCurrentExerciseLogs([...currentExerciseLogs, newLog]);
    }

    setSearchTerm('');
    setSets('');
    setReps('');
    setWeight('');
    setWorkoutCreationError('');
  };

  const handleRemoveExercise = (index) => {
    setCurrentExerciseLogs(currentExerciseLogs.filter((_, i) => i !== index));
  };

  const handleEditExercise = (index) => {
    const exerciseToEdit = currentExerciseLogs[index];
    setEditingExerciseIndex(index);
    setSearchTerm(exerciseToEdit.exercise);
    setSets(exerciseToEdit.sets);
    setReps(exerciseToEdit.reps);
    if (exerciseToEdit.weight) {
      setWeight(exerciseToEdit.weight.value);
      setWeightUnit(exerciseToEdit.weight.unit);
    } else {
      setWeight('');
      setWeightUnit('lbs');
    }
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
    ? subMuscleGroups
    : allMuscleGroups;

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
            {majorMuscleGroups.map((group) => (
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
          <label className="form-label" htmlFor="exercise-search">Exercise:</label>
          <div className="autocomplete">
            <input
              id="exercise-search"
              type="text"
              placeholder="Search for an exercise"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsExerciseDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsExerciseDropdownOpen(false), 200)}
              className="form-input"
            />
            {isExerciseDropdownOpen && (
              <ul className="autocomplete-items">
                {loadingExercises && <li>Loading exercises...</li>}
                {!loadingExercises && exercises
                  .filter(exercise => exercise.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .sort((a, b) => a.display_name.localeCompare(b.display_name))
                  .map((exercise) => (
                    <li
                      key={exercise.id}
                      onClick={() => {
                        setSearchTerm(exercise.display_name);
                        setIsExerciseDropdownOpen(false);
                      }}
                    >
                      {exercise.display_name}
                    </li>
                  ))}
              </ul>
            )}
          </div>
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
        <button onClick={handleAddExercise} className="btn btn-primary">
          {editingExerciseIndex !== null ? 'Update Exercise' : 'Add Exercise'}
        </button>
      </div>

      <div className="form-section">
        <h4>Exercises in Current Session:</h4>
        <ul className="exercise-list">
          {currentExerciseLogs.map((log, index) => {
            const exerciseDetails = exerciseMap[log.exercise];
            return (
              <li key={index} className="exercise-list-item">
                <span>
                  {exerciseDetails ? `[${exerciseDetails.major_muscle_group} - ${exerciseDetails.muscle_group}] ` : ''}
                  {log.exercise} - {log.sets} sets x {log.reps} reps {log.weight ? `x ${log.weight.value}${log.weight.unit}` : ''}
                </span>
                <div>
                  <button onClick={() => handleEditExercise(index)} className="btn btn-secondary btn-sm">Edit</button>
                  <button onClick={() => handleRemoveExercise(index)} className="btn btn-danger btn-sm">Remove</button>
                </div>
              </li>
            );
          })}
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
                  {session.exercises.map((ex, index) => {
                    let exerciseDetails = exerciseMap[ex.exercise]; // Try lookup by display_name
                    if (!exerciseDetails && !isNaN(ex.exercise)) { // If not found and ex.exercise is a number (potential ID)
                      exerciseDetails = Object.values(exerciseMap).find(e => e.id === parseInt(ex.exercise));
                    }
                    return (
                      <li key={index} style={{ marginBottom: '5px' }}>
                        {exerciseDetails ? `[${exerciseDetails.major_muscle_group} - ${exerciseDetails.muscle_group}] ` : ''}
                        {ex.exercise} - {ex.sets} sets x {ex.reps} reps {ex.weight ? `x ${ex.weight.value}${ex.weight.unit}` : ''}
                      </li>
                    );
                  })}
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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './context/AuthContext.js';
import { getWorkoutUserPlans, createWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan } from './services/workoutPlan';
import { fetchExercises, fetchMajorMuscleGroups, fetchMuscleGroups } from './services/workout';

const formatMuscleGroupForAPI = (group) => {
  if (!group) return '';
  return group.charAt(0).toUpperCase() + group.slice(1).toLowerCase();
};

const WorkoutPlanPage = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [majorMuscleGroups, setMajorMuscleGroups] = useState([]);
  const [allMuscleGroups, setAllMuscleGroups] = useState([]);
  const [dailySelectedMajorMuscleGroups, setDailySelectedMajorMuscleGroups] = useState({
    Monday: '',
    Tuesday: '',
    Wednesday: '',
    Thursday: '',
    Friday: '',
    Saturday: '',
    Sunday: '',
  });
  const [dailySubMuscleGroups, setDailySubMuscleGroups] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
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
  const [dailySearchTerms, setDailySearchTerms] = useState({
    Monday: '',
    Tuesday: '',
    Wednesday: '',
    Thursday: '',
    Friday: '',
    Saturday: '',
    Sunday: '',
  });
  const [dailyEditingExerciseIndex, setDailyEditingExerciseIndex] = useState({
    Monday: null,
    Tuesday: null,
    Wednesday: null,
    Thursday: null,
    Friday: null,
    Saturday: null,
    Sunday: null,
  });
  const [dailyIsExerciseDropdownOpen, setDailyIsExerciseDropdownOpen] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });
  const [allExercises, setAllExercises] = useState([]);
  const [exerciseMap, setExerciseMap] = useState({});

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const majorGroups = await fetchMajorMuscleGroups(token);
        setMajorMuscleGroups(majorGroups);

        const exercises = await fetchExercises();
        setAllExercises(exercises);

        const uniqueMuscleGroups = [...new Set(exercises.map(ex => ex.muscle_group))];
        setAllMuscleGroups(uniqueMuscleGroups);

        const newMap = exercises.reduce((acc, ex) => {
          acc[ex.id] = ex;
          return acc;
        }, {});
        setExerciseMap(newMap);
      } catch (err) {
        setError(err.message);
      }
    };
    if (token) {
      getInitialData();
    }
  }, [token]);

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

  const prevDailySelectedMuscleGroupsRef = useRef();

  useEffect(() => {
    const fetchSubMuscleGroups = async (day) => {
      const majorMuscleGroup = dailySelectedMajorMuscleGroups[day];
      if (majorMuscleGroup) {
        try {
          const subGroups = await fetchMuscleGroups(majorMuscleGroup, token);
          setDailySubMuscleGroups(prev => ({ ...prev, [day]: subGroups }));
        } catch (err) {
          setError(err.message);
        }
      } else {
        setDailySubMuscleGroups(prev => ({ ...prev, [day]: [] }));
      }
    };

    if (token) {
      Object.keys(dailySelectedMajorMuscleGroups).forEach(day => {
        if (dailySelectedMajorMuscleGroups[day]) {
          fetchSubMuscleGroups(day);
        }
      });
    }
  }, [dailySelectedMajorMuscleGroups, token]);

  useEffect(() => {
    const fetchDailyExercises = async (day) => {
      const muscleGroup = dailySelectedMuscleGroups[day];
      setDailyExercises(prev => ({ ...prev, [day]: { ...prev[day], loading: true, error: '' } }));
      try {
        const formattedMuscleGroup = formatMuscleGroupForAPI(muscleGroup);
        const fetchedExercises = await fetchExercises(formattedMuscleGroup);
        setDailyExercises(prev => ({ ...prev, [day]: { exercises: fetchedExercises, loading: false, error: '' } }));
        
        setDailySelectedExercises(prev => {
          const currentlySelectedId = prev[day];
          const isSelectedStillAvailable = fetchedExercises.some(ex => ex.id === currentlySelectedId);
          if (!isSelectedStillAvailable) {
            const firstExerciseId = fetchedExercises.length > 0 ? fetchedExercises[0].id : '';
            if (fetchedExercises.length > 0) {
              setDailySearchTerms(prev => ({ ...prev, [day]: fetchedExercises[0].display_name }));
            } else {
              setDailySearchTerms(prev => ({ ...prev, [day]: '' }));
            }
            return { ...prev, [day]: firstExerciseId };
          }
          return prev;
        });

      } catch (err) {
        setDailyExercises(prev => ({ ...prev, [day]: { ...prev[day], loading: false, error: err.message } }));
      }
    };

    const prevDailySelectedMuscleGroups = prevDailySelectedMuscleGroupsRef.current;
    if (prevDailySelectedMuscleGroups) {
      Object.keys(dailySelectedMuscleGroups).forEach(day => {
        if (prevDailySelectedMuscleGroups[day] !== dailySelectedMuscleGroups[day]) {
          fetchDailyExercises(day);
        }
      });
    }

    prevDailySelectedMuscleGroupsRef.current = dailySelectedMuscleGroups;
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
    const scheduleData = plan.workoutplan_schedule || {};
    const normalizedSchedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach(day => {
      const daySchedule = scheduleData[day] || [];
      if (Array.isArray(daySchedule)) {
        normalizedSchedule[day] = daySchedule.map(item => {
          if (item.exercise && Array.isArray(item.exercise[0])) { // This is the format from the server
            const exerciseDisplayName = item.exercise[0][0];
            const exercise = allExercises.find(ex => ex.display_name === exerciseDisplayName);
            if (exercise) {
              return {
                muscle_group: [exercise.muscle_group],
                exercise: [exercise.id]
              };
            }
          }
          return item; // Assume it's already in the correct frontend format
        });
      } else {
        normalizedSchedule[day] = [];
      }
    });

    setEditingPlan({
        ...plan,
        schedule: normalizedSchedule,
        workoutplanScheduleId: scheduleData.workoutplanScheduleId
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
        // Add workoutplanScheduleId to the schedule object if it exists
        if (editingPlan.workoutplanScheduleId) {
          planToSave.workoutplan_schedule.workoutplanScheduleId = editingPlan.workoutplanScheduleId;
        }
        await updateWorkoutPlan({ ...planToSave, workoutplan_id: editingPlan.workoutplan_id }, token);
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
    const exerciseId = dailySelectedExercises[day];
    if (!exerciseId) return;

    const exercise = allExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newScheduleEntry = {
      muscle_group: [exercise.muscle_group],
      exercise: [exercise.id],
      sets: 0,
      reps: 0,
      weight: { value: 0.0, unit: 'lbs' }
    };

    if (dailyEditingExerciseIndex[day] !== null) {
      const updatedSchedule = [...editingPlan.schedule[day]];
      updatedSchedule[dailyEditingExerciseIndex[day]] = newScheduleEntry;
      setEditingPlan(prevPlan => ({
        ...prevPlan,
        schedule: {
          ...prevPlan.schedule,
          [day]: updatedSchedule
        }
      }));
      setDailyEditingExerciseIndex({ ...dailyEditingExerciseIndex, [day]: null });
    } else {
      setEditingPlan(prevPlan => ({
        ...prevPlan,
        schedule: {
          ...prevPlan.schedule,
          [day]: [...prevPlan.schedule[day], newScheduleEntry]
        }
      }));
    }
    setDailySearchTerms({ ...dailySearchTerms, [day]: '' });
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

  const handleEditExercise = (day, index) => {
    const exerciseToEdit = editingPlan.schedule[day][index];
    const exercise = allExercises.find(ex => ex.id === exerciseToEdit.exercise[0]);
    setDailyEditingExerciseIndex({ ...dailyEditingExerciseIndex, [day]: index });
    setDailySearchTerms({ ...dailySearchTerms, [day]: exercise.display_name });
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
      <div className="form-container">
        <h1>Edit Workout Plan</h1>

        <div className="form-section">
          <h2>Workout Plan Summary</h2>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Name:</label>
            <input id="name" type="text" name="name" value={editingPlan.name} onChange={handleNameChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="goal">Goal:</label>
            <textarea id="goal" name="goal" value={summary.goal} onChange={handleSummaryChange} rows="4" className="form-textarea"></textarea>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="workout_type">Workout Type:</label>
            <input id="workout_type" type="text" name="workout_type" value={summary.workout_type} onChange={handleSummaryChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="training_level">Training Level:</label>
            <input id="training_level" type="text" name="training_level" value={summary.training_level} onChange={handleSummaryChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="program_duration">Program Duration:</label>
            <input id="program_duration" type="text" name="program_duration" value={summary.program_duration} onChange={handleSummaryChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="days_per_week">Days Per Week:</label>
            <input id="days_per_week" type="number" name="days_per_week" value={summary.days_per_week} onChange={handleSummaryChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="time_per_workout">Time Per Workout:</label>
            <input id="time_per_workout" type="text" name="time_per_workout" value={summary.time_per_workout} onChange={handleSummaryChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="equipments">Equipments:</label>
            <textarea id="equipments" name="equipments" value={summary.equipments.join(', ')} onChange={(e) => handleSummaryChange({target: {name: 'equipments', value: e.target.value.split(', ')}})} rows="4" className="form-textarea"></textarea>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="target_gender">Target Gender:</label>
            <input id="target_gender" type="text" name="target_gender" value={summary.target_gender} onChange={handleSummaryChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="recommended_supplements">Recommended Supplements:</label>
            <textarea id="recommended_supplements" name="recommended_supplements" value={summary.recommended_supplements.join(', ')} onChange={(e) => handleSummaryChange({target: {name: 'recommended_supplements', value: e.target.value.split(', ')}})} rows="4" className="form-textarea"></textarea>
          </div>
        </div>

        <div className="form-section">
          <h2>Workout Schedule (7 Days)</h2>
          <div className="schedule-container">
            {daysOfWeek.map(day => {
              const muscleGroupsForSelectedMajor = dailySelectedMajorMuscleGroups[day]
                ? dailySubMuscleGroups[day]
                : allMuscleGroups;

              return (
                <div key={day} className="schedule-day">
                  <h3>{day}</h3>
                  <ul className="exercise-list">
                    {(editingPlan.schedule[day] || []).map((item, index) => {
                      const exercise = exerciseMap[item.exercise[0]];
                      return (
                        <li key={index} className="exercise-list-item">
                          <span>{exercise ? `[${exercise.muscle_group}] ${exercise.display_name}` : (typeof item.exercise[0] === 'object' ? item.exercise[0].display_name : item.exercise[0])}</span>
                          <div>
                            <button onClick={() => handleEditExercise(day, index)} className="btn btn-secondary btn-sm">Edit</button>
                            <button onClick={() => handleRemoveFromSchedule(day, index)} className="btn btn-danger btn-sm">Remove</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="add-exercise-controls">
                    <div className="form-group">
                      <label className="form-label" htmlFor={`major-muscle-group-select-${day}`}>Major Muscle Group:</label>
                      <select
                        id={`major-muscle-group-select-${day}`}
                        value={dailySelectedMajorMuscleGroups[day]}
                        onChange={(e) => {
                          setDailySelectedMajorMuscleGroups({ ...dailySelectedMajorMuscleGroups, [day]: e.target.value });
                          setDailySelectedMuscleGroups({ ...dailySelectedMuscleGroups, [day]: '' });
                        }}
                        className="form-select"
                      >
                        <option value="">All Major Groups</option>
                        {majorMuscleGroups.map((group) => (
                          <option key={group} value={group}>
                            {group.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor={`muscle-group-select-${day}`}>Muscle Group:</label>
                      <select
                        id={`muscle-group-select-${day}`}
                        value={dailySelectedMuscleGroups[day]}
                        onChange={(e) => setDailySelectedMuscleGroups({ ...dailySelectedMuscleGroups, [day]: e.target.value })}
                        className="form-select"
                      >
                        <option value="">All Muscle Groups</option>
                        {muscleGroupsForSelectedMajor.map((group) => (
                          <option key={group} value={group}>
                            {group.replace(/_/g, ' ').split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor={`exercise-search-${day}`}>Exercise:</label>
                      <div className="autocomplete">
                        <input
                          id={`exercise-search-${day}`}
                          type="text"
                          placeholder="Search for an exercise"
                          value={dailySearchTerms[day]}
                          onChange={(e) => setDailySearchTerms({ ...dailySearchTerms, [day]: e.target.value })}
                          onFocus={() => setDailyIsExerciseDropdownOpen({ ...dailyIsExerciseDropdownOpen, [day]: true })}
                          onBlur={() => setTimeout(() => setDailyIsExerciseDropdownOpen({ ...dailyIsExerciseDropdownOpen, [day]: false }), 200)}
                          className="form-input"
                        />
                        {dailyIsExerciseDropdownOpen[day] && (
                          <ul className="autocomplete-items">
                            {dailyExercises[day].loading && <li>Loading exercises...</li>}
                            {dailyExercises[day].error && <li>Error loading exercises</li>}
                            {!dailyExercises[day].loading && dailyExercises[day].exercises.length === 0 && (
                              <li>No exercises available</li>
                            )}
                            {!dailyExercises[day].loading &&
                              dailyExercises[day].exercises
                                .filter(exercise => exercise.display_name.toLowerCase().includes(dailySearchTerms[day].toLowerCase()))
                                .sort((a, b) => a.display_name.localeCompare(b.display_name))
                                .map((exercise) => (
                                  <li
                                    key={exercise.id}
                                    onClick={() => {
                                      setDailySelectedExercises({ ...dailySelectedExercises, [day]: exercise.id });
                                      setDailySearchTerms({ ...dailySearchTerms, [day]: exercise.display_name });
                                      setDailyIsExerciseDropdownOpen({ ...dailyIsExerciseDropdownOpen, [day]: false });
                                    }}
                                  >
                                    {exercise.display_name}
                                  </li>
                                ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleAddToSchedule(day)} className="btn btn-primary">
                      {dailyEditingExerciseIndex[day] !== null ? 'Update Exercise' : `Add to ${day}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="btn-group">
          <button onClick={handleSavePlan} className="btn btn-primary">Save Plan</button>
          <button onClick={() => setEditingPlan(null)} className="btn btn-secondary">Cancel</button>
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

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Your Workout Plans</h2>
      {loading ? (
        <p>Loading workout plans...</p>
      ) : (
        <ul>
          {workoutPlans.length > 0 ? (
            workoutPlans.map((plan) => (
              <li key={plan.workoutplan_id}>
                <strong>{plan.name || plan.workoutplan_summary.goal}</strong>
                <button onClick={() => handleModifyPlan(plan)} style={{ marginLeft: '10px' }}>Modify</button>
                <button onClick={() => handleRemovePlan(plan.workoutplan_id)} style={{ marginLeft: '10px' }}>Delete</button>
              </li>
            ))
          ) : (
            !loading && <p>No workout plans found.</p>
          )}
        </ul>
      )}


    </div>
  );
};

export default WorkoutPlanPage;

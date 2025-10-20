import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import mlService from '../../MLEngine/MLService';
import { useAuth } from '../../../context/AuthContext';
import simulationService from '../../Simulation/SimulationService'; // Add this import

// --- Helper Calculation Functions (Moved from original component) ---

// Typical usage patterns for different appliance types
const getTypicalUsagePattern = (applianceType) => {
  const patterns = {
    refrigerator: Array(24).fill(0.3), // Always running at low power
    air_conditioner: [0,0,0,0,0,0,0.1,0.3,0.5,0.7,0.8,0.9,1,0.9,0.8,0.7,0.6,0.8,0.9,0.8,0.6,0.4,0.2,0.1],
    tv: [0,0,0,0,0,0,0,0.1,0.2,0.3,0.4,0.5,0.6,0.5,0.4,0.3,0.7,0.9,1,0.9,0.7,0.4,0.2,0.1],
    light: [0,0,0,0,0,0,0.1,0.3,0.2,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.4,0.8,1,0.9,0.7,0.5,0.3,0.1],
    computer: [0,0,0,0,0,0,0,0.1,0.4,0.7,0.8,0.9,0.9,0.8,0.7,0.6,0.7,0.8,0.9,0.8,0.6,0.4,0.2,0.1],
    washing_machine: [0,0,0,0,0,0,0.1,0.3,0.5,0.2,0.1,0.1,0.1,0.1,0.2,0.3,0.4,0.3,0.2,0.1,0,0,0,0],
    // Default pattern for other devices
    default: [0,0,0,0,0,0,0,0.1,0.3,0.5,0.7,0.8,0.9,0.8,0.7,0.6,0.8,0.9,0.8,0.6,0.4,0.2,0.1,0]
  };
  return patterns[applianceType] || patterns.default;
};

// Calculate peak hours based on ACTIVE device usage patterns only
const calculatePeakHours = (activeAppliances) => {
  const timeSlots = [
    { time: '12-2 AM', usage: 0, category: 'Night' },
    { time: '2-4 AM', usage: 0, category: 'Night' },
    { time: '4-6 AM', usage: 0, category: 'Morning' },
    { time: '6-8 AM', usage: 0, category: 'Morning' },
    { time: '8-10 AM', usage: 0, category: 'Morning' },
    { time: '10-12 PM', usage: 0, category: 'Day' },
    { time: '12-2 PM', usage: 0, category: 'Lunch' },
    { time: '2-4 PM', usage: 0, category: 'Day' },
    { time: '4-6 PM', usage: 0, category: 'Evening' },
    { time: '6-8 PM', usage: 0, category: 'Evening' },
    { time: '8-10 PM', usage: 0, category: 'Night' },
    { time: '10-12 AM', usage: 0, category: 'Night' },
  ];

  // Only process active appliances
  activeAppliances.forEach(appliance => {
    const power = appliance.normal_usage || 0;
    const typicalUsagePattern = getTypicalUsagePattern(appliance.type);

    typicalUsagePattern.forEach((usageMultiplier, hour) => {
      const slotIndex = Math.floor(hour / 2);
      if (slotIndex < timeSlots.length) {
        timeSlots[slotIndex].usage += power * usageMultiplier;
      }
    });
  });

  // Return top 4 peak hours
  return timeSlots
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 4)
    .map(slot => ({
      ...slot,
      usage: Math.round(slot.usage)
    }));
};

// Calculate efficiency score based on device usage and status
const calculateEfficiencyScore = (appliances, activeAppliances) => {
  if (appliances.length === 0) return 0;

  let score = 100;
  const totalPower = appliances.reduce((sum, app) => sum + (app.normal_usage || 0), 0);
  const activePower = activeAppliances.reduce((sum, app) => sum + (app.normal_usage || 0), 0);

  // Reward for turning off unused devices
  const turnedOffDevices = appliances.filter(app => app.status === 'off' && app.normal_usage > 100).length;
  score += turnedOffDevices * 5;

  // Penalize for high-power devices left on
  const highPowerDevicesOn = activeAppliances.filter(app => app.normal_usage > 500).length;
  score -= highPowerDevicesOn * 10;

  // Penalize for inefficient usage patterns (devices that should be off but are on)
  const alwaysOnDevices = activeAppliances.filter(app =>
    app.average_hours_per_day >= 20 && app.normal_usage > 50
  ).length;
  score -= alwaysOnDevices * 15;

  // Reward for energy-efficient active devices
  const efficientActiveDevices = activeAppliances.filter(app => app.normal_usage <= 100).length;
  score += efficientActiveDevices * 3;

  // Adjust based on active vs total power ratio (lower is better)
  const activeRatio = totalPower > 0 ? activePower / totalPower : 0;
  if (activeRatio > 0.8) score -= 20;
  else if (activeRatio > 0.5) score -= 10;
  else if (activeRatio < 0.2) score += 10; // Reward for turning off most devices

  return Math.max(20, Math.min(100, score));
};

// --- Custom Hooks ---

/**
 * Hook to calculate core energy usage and efficiency stats.
 * @param {Array} appliances - The list of all devices.
 * @returns {Object} - Core stats (totalEnergy, totalCost, efficiencyScore, etc.)
 */
const useEnergyStats = (appliances) => {
  // Use useCallback to memoize the calculation function
  const calculateStats = useCallback(() => {
    if (!appliances || appliances.length === 0) {
      return {
        totalEnergy: 0,
        totalCost: 0,
        peakUsage: 0,
        averageDaily: 0,
        efficiencyScore: 0,
        monthlyProjection: 0,
        carbonFootprint: 0,
        activeAppliances: 0,
        totalAppliances: 0,
        inactiveAppliances: 0,
        categoryUsage: [],
        roomUsage: [],
        peakHours: [],
      };
    }

    const activeAppliances = appliances.filter(app => app.status === 'on');
    const totalAppliances = appliances.length;

    let totalEnergy = 0; // In kWh (Monthly projection)
    let peakUsage = 0; // In Watts (Highest single device power)
    let categoryUsage = {};
    let roomUsage = {};

    appliances.forEach(appliance => {
      // Only calculate energy for devices that are ON
      if (appliance.status === 'on') {
        const powerWatts = appliance.normal_usage || 0;
        const hoursPerDay = appliance.average_hours_per_day || 8;

        // Daily energy in kWh
        const dailyEnergy = (powerWatts / 1000) * hoursPerDay;
        totalEnergy += dailyEnergy * 30; // Monthly projection

        // Track peak usage (only for active devices)
        if (powerWatts > peakUsage) {
          peakUsage = powerWatts;
        }

        // Category usage (only for active devices)
        if (!categoryUsage[appliance.type]) {
          categoryUsage[appliance.type] = 0;
        }
        categoryUsage[appliance.type] += dailyEnergy * 30;

        // Room usage (only for active devices)
        if (!roomUsage[appliance.room]) {
          roomUsage[appliance.room] = 0;
        }
        roomUsage[appliance.room] += dailyEnergy * 30;
      }
    });

    // Calculate costs (assuming R2.50 per kWh)
    const totalCost = totalEnergy * 2.50;
    const averageDaily = totalEnergy / 30;

    const peakHours = calculatePeakHours(activeAppliances);
    const carbonFootprint = Math.round(totalEnergy * 0.5); // approx 0.5kg CO2 per kWh
    const efficiencyScore = calculateEfficiencyScore(appliances, activeAppliances);

    return {
      totalEnergy: Math.round(totalEnergy),
      totalCost: Math.round(totalCost),
      peakUsage: Math.round(peakUsage),
      averageDaily: Math.round(averageDaily * 100) / 100,
      efficiencyScore: Math.max(0, Math.min(100, efficiencyScore)),
      monthlyProjection: Math.round(totalCost),
      carbonFootprint,
      activeAppliances: activeAppliances.length,
      totalAppliances: totalAppliances,
      inactiveAppliances: totalAppliances - activeAppliances.length,
      categoryUsage: Object.entries(categoryUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      roomUsage: Object.entries(roomUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 4),
      peakHours,
    };
  }, [appliances]); // Recalculate if appliances change

  const [analytics, setAnalytics] = useState(calculateStats());

  useEffect(() => {
    setAnalytics(calculateStats());
  }, [calculateStats]);

  return analytics;
};

/**
 * Hook to manage and retrieve all Machine Learning related data.
 * @param {Array} appliances - The list of all devices.
 * @param {Function} setLoadingML - Function to set the loading state in the main component.
 * @returns {Object} - ML data and functions.
 */
const useMLInsights = (appliances, setLoadingML) => {
  const { user, supabase } = useAuth();

  // ML States
  const [mlInsights, setMLInsights] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [anomalies, setAnomalies] = useState({ hasAnomaly: false, anomalies: [] });
  const [trainingProgress, setTrainingProgress] = useState({ progress: 0, status: 'not_initialized', current: 0, required: 0, canTrain: false });
  const [energyForecast, setEnergyForecast] = useState(null);

  // Function to get all ML data from mlService
  const refreshMLInsights = useCallback(async () => {
    try {
      if (!mlService.hasCurrentUser()) {
        console.warn('⚠️ Cannot refresh ML insights: No user set');
        return;
      }

      // Get comprehensive insights & progress
      const insights = mlService.getMLInsights(appliances);
      setMLInsights(insights);
      const progress = mlService.getTrainingProgress();
      setTrainingProgress(progress);

      if (insights.ready) {
        // Get predictions
        const predsResult = await mlService.getAllPredictions(appliances);
        setPredictions(predsResult.success ? predsResult.predictions || [] : []);

        // Get recommendations
        setRecommendations(mlService.getRecommendations(appliances) || []);

        // Check for anomalies
        setAnomalies(mlService.detectAnomalies(appliances) || { hasAnomaly: false, anomalies: [] });

        // Get energy forecast
        setEnergyForecast(mlService.getEnergyForecast(appliances, 12) || { success: false, forecast: [] });
      } else {
        // Reset ML data if not ready
        setPredictions([]);
        setRecommendations([]);
        setAnomalies({ hasAnomaly: false, anomalies: [] });
        setEnergyForecast(null);
      }
    } catch (error) {
      console.error('Error refreshing ML insights:', error);
      // Reset on error
      setPredictions([]);
      setRecommendations([]);
      setAnomalies({ hasAnomaly: false, anomalies: [] });
      setEnergyForecast(null);
    }
  }, [appliances]);


  // Initialize ML Service
  const initializeML = useCallback(async () => {
    try {
      setLoadingML(true);

      if (!user || !user.id) {
        console.warn('⚠️ Cannot initialize ML: No user logged in');
        return;
      }

      console.log(`👤 Setting ML user: ${user.id}`);
      mlService.setCurrentUser(user.id, supabase);

      const result = await mlService.initialize();

      if (result.success) {
        console.log('✅ ML initialized in hook for user:', user.id);
        await refreshMLInsights();
      } else {
        console.warn('⚠️ ML initialization had issues:', result.error);
      }
    } catch (error) {
      console.error('ML initialization error:', error);
    } finally {
      setLoadingML(false);
    }
  }, [user, supabase, refreshMLInsights, setLoadingML]);


  // Effect for user changes & initial load
  useEffect(() => {
    if (user && user.id) {
      initializeML();
    } else {
      // Reset ML states on logout
      setMLInsights(null);
      setPredictions([]);
      setRecommendations([]);
      setAnomalies({ hasAnomaly: false, anomalies: [] });
      setEnergyForecast(null);
      setTrainingProgress({ progress: 0, status: 'not_initialized', current: 0, required: 0, canTrain: false });
    }
  }, [user, initializeML]);


  // Effect for appliance changes (updates MLService)
  useEffect(() => {
    if (appliances.length > 0 && mlService.hasCurrentUser()) {
      mlService.updateAppliances(appliances);
      refreshMLInsights();
    }
  }, [appliances, refreshMLInsights]);


  // Handler to manually train models
  const handleRetrain = useCallback(async () => {
    Alert.alert(
      'Train ML Models',
      'This will train the prediction models with your current data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Train',
          onPress: async () => {
            setLoadingML(true);
            const result = await mlService.trainModels();
            setLoadingML(false);

            if (result.success) {
              Alert.alert(
                'Training Complete',
                `Models trained successfully!\nAccuracy: ${(result.accuracy * 100).toFixed(1)}%`
              );
              await refreshMLInsights();
            } else {
              Alert.alert('Training Failed', result.error || 'Unknown error');
            }
          },
        },
      ]
    );
  }, [refreshMLInsights, setLoadingML]);

  // Handler to reset ML training data
  const handleReset = useCallback(async (openSimulationModal) => {
    Alert.alert(
      'Reset ML Data',
      'This will clear all recorded usage data and retrain your models. You will need to start collecting data again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setLoadingML(true);
            const result = await mlService.clearUserData();
            setLoadingML(false);

            if (result.success) {
              Alert.alert('Data Cleared', 'ML training data has been reset.');
              await initializeML(); // Re-initialize to reflect reset status
              if (openSimulationModal) {
                console.log('Attempting to open simulation modal after reset...');
                // We'll handle this via a callback pattern
              }
            } else {
              Alert.alert('Reset Failed', result.error || 'Unknown error');
            }
          },
        },
      ]
    );
  }, [initializeML, setLoadingML]);

  // NEW: Connect Simulation Service to ML Service
  const handleQuickTrainWithSimulator = useCallback(async () => {
    Alert.alert(
      'Quick Train with Simulator',
      'This will generate 30 days of simulated usage data and train the ML models. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate & Train',
          onPress: async () => {
            setLoadingML(true);
            try {
              // Use SimulationService to generate data
              const simulationResult = await simulationService.generateHistoricalData(
                appliances, 
                30, // 30 days
                user.id
              );
              
              if (simulationResult.success) {
                // Now train with the simulated data
                const trainResult = await mlService.trainModels();
                
                if (trainResult.success) {
                  Alert.alert(
                    'Training Complete',
                    `Models trained with simulated data!\nAccuracy: ${(trainResult.accuracy * 100).toFixed(1)}%`
                  );
                  await refreshMLInsights();
                } else {
                  Alert.alert('Training Failed', trainResult.error || 'Unknown error');
                }
              } else {
                Alert.alert('Simulation Failed', simulationResult.error || 'Failed to generate simulation data');
              }
            } catch (error) {
              console.error('Quick train error:', error);
              Alert.alert('Error', 'Failed to generate training data');
            } finally {
              setLoadingML(false);
            }
          },
        },
      ]
    );
  }, [appliances, user?.id, refreshMLInsights, setLoadingML]);

  return {
    mlInsights,
    predictions,
    recommendations,
    anomalies,
    trainingProgress,
    energyForecast,
    refreshMLInsights,
    handleRetrain,
    handleReset,
    handleQuickTrainWithSimulator, // NEW: Export the quick train function
  };
};

// Function to generate predictive chart data
const generatePredictiveChartData = (appliances, analytics, selectedTimeFrame) => {
  const activeAppliances = appliances.filter(app => app.status === 'on');

  switch (selectedTimeFrame) {
    case 'day':
      // Generate hourly data based on CURRENTLY ACTIVE device usage patterns
      const hourlyData = Array(24).fill(0);
      activeAppliances.forEach(appliance => {
        const pattern = getTypicalUsagePattern(appliance.type);
        pattern.forEach((multiplier, hour) => {
          hourlyData[hour] += (appliance.normal_usage || 0) * multiplier;
        });
      });

      return {
        labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'],
        datasets: [{
          data: [
            Math.round(hourlyData[6] / 100), // 6AM
            Math.round(hourlyData[9] / 100), // 9AM
            Math.round(hourlyData[12] / 100), // 12PM
            Math.round(hourlyData[15] / 100), // 3PM
            Math.round(hourlyData[18] / 100), // 6PM
            Math.round(hourlyData[21] / 100), // 9PM
            Math.round(hourlyData[0] / 100),  // 12AM
          ],
        }],
      };

    case 'week':
      // Weekly projection based on current ACTIVE device usage
      const dailyAverage = analytics.averageDaily;
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data: [
            Math.round(dailyAverage * 0.9),  // Monday
            Math.round(dailyAverage * 0.95), // Tuesday
            Math.round(dailyAverage),         // Wednesday
            Math.round(dailyAverage * 1.05), // Thursday
            Math.round(dailyAverage * 1.1),  // Friday
            Math.round(dailyAverage * 1.2),  // Saturday
            Math.round(dailyAverage * 1.1),  // Sunday
          ],
        }],
      };

    case 'month':
      // Monthly trend based on current ACTIVE device usage
      const weeklyAverage = analytics.totalEnergy / 4;
      return {
        labels: ['W1', 'W2', 'W3', 'W4'],
        datasets: [{
          data: [
            Math.round(weeklyAverage * 0.95),
            Math.round(weeklyAverage),
            Math.round(weeklyAverage * 1.05),
            Math.round(weeklyAverage * 1.1),
          ],
        }],
      };

    case 'year':
      // Yearly trend with seasonal variations based on current ACTIVE devices
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [
            Math.round(analytics.totalEnergy * 1.1), // Winter
            Math.round(analytics.totalEnergy),
            Math.round(analytics.totalEnergy * 0.9),
            Math.round(analytics.totalEnergy * 0.8),
            Math.round(analytics.totalEnergy * 0.9), // Summer
            Math.round(analytics.totalEnergy),
          ],
        }],
      };

    default:
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
  }
};

const getRandomColor = () => {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Function to generate device usage data for pie chart - ONLY ACTIVE DEVICES
const generateDeviceUsageData = (appliances) => {
  const activeAppliances = appliances.filter(app => app.status === 'on');
  return activeAppliances.slice(0, 6).map(app => ({
    name: app.name.substring(0, 8) + (app.name.length > 8 ? '...' : ''),
    usage: app.normal_usage || 0,
    color: getRandomColor(),
    legendFontColor: '#ffffff',
    legendFontSize: 10,
  }));
};

/**
 * Hook to process and return all data required for charts.
 * @param {Array} appliances - The list of all devices.
 * @param {Object} analytics - The core energy stats object.
 * @param {string} selectedTimeFrame - Current time frame for the line/bar chart.
 * @returns {Object} - Chart data and configs.
 */
const useChartData = (appliances, analytics, selectedTimeFrame) => {
  const predictiveChartData = generatePredictiveChartData(appliances, analytics, selectedTimeFrame);
  const deviceUsageData = generateDeviceUsageData(appliances);

  const chartConfig = {
    backgroundGradientFrom: '#18181b',
    backgroundGradientTo: '#18181b',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#10b981',
    },
  };

  return {
    predictiveChartData,
    deviceUsageData,
    chartConfig,
  };
};

// Enhanced insights generation based on real device data with status consideration
const generateInsights = (appliances, analytics) => {
  if (!appliances || appliances.length === 0) return [];

  const activeAppliances = appliances.filter(app => app.status === 'on');

  const newInsights = [];

  // High usage insight - only for active devices
  const highUsageDevices = activeAppliances.filter(app => app.normal_usage > 300);
  if (highUsageDevices.length > 0) {
    const potentialSavings = Math.round(analytics.totalCost * 0.15);
    newInsights.push({
      id: 1,
      type: 'warning',
      icon: 'warning',
      title: 'High Energy Devices Active',
      description: `${highUsageDevices.length} high-power devices currently on`,
      action: 'Optimize now',
      impact: `Save R${potentialSavings}/month`,
      color: '#ef4444',
      details: 'These high-power devices are currently consuming significant energy. Consider turning them off when not in use.',
      devices: highUsageDevices.map(d => d.name),
    });
  }

  // Always-on devices insight - only for active devices
  const alwaysOnDevices = activeAppliances.filter(app =>
    app.average_hours_per_day >= 20
  );
  if (alwaysOnDevices.length > 0) {
    newInsights.push({
      id: 2,
      type: 'info',
      icon: 'info',
      title: 'Always-On Devices',
      description: `${alwaysOnDevices.length} devices running continuously`,
      action: 'Set schedule',
      impact: 'Reduce usage by 20%',
      color: '#3b82f6',
      details: 'Devices running 24/7 can account for up to 25% of your energy bill. Schedule them to turn off automatically.',
      devices: alwaysOnDevices.map(d => d.name),
    });
  }

  // Inactive high-power devices insight
  const inactiveHighPowerDevices = appliances.filter(app =>
    app.status === 'off' && app.normal_usage > 300
  );
  if (inactiveHighPowerDevices.length > 0) {
    newInsights.push({
      id: 3,
      type: 'success',
      icon: 'power-off',
      title: 'Energy Saving',
      description: `${inactiveHighPowerDevices.length} high-power devices are off`,
      action: 'Good job!',
      impact: `Saving R${Math.round(inactiveHighPowerDevices.reduce((sum, app) => sum + (app.normal_usage * 0.18), 0))}/month`,
      color: '#10b981',
      details: 'You are saving significant energy by keeping high-power devices turned off when not needed.',
      devices: inactiveHighPowerDevices.map(d => d.name),
    });
  }

  // Efficiency insight
  if (analytics.efficiencyScore >= 80) {
    newInsights.push({
      id: 4,
      type: 'success',
      icon: 'eco',
      title: 'Great Efficiency!',
      description: 'Your energy usage is very efficient',
      action: 'View details',
      impact: 'Better than 75% of users',
      color: '#10b981',
      details: 'Your energy efficiency is excellent! You are managing your device usage well.',
      devices: [],
    });
  } else if (analytics.efficiencyScore <= 50) {
    newInsights.push({
      id: 5,
      type: 'warning',
      icon: 'trending-down',
      title: 'Improve Efficiency',
      description: 'Opportunities to optimize energy usage',
      action: 'Optimize devices',
      impact: `Save R${Math.round(analytics.totalCost * 0.25)}/month`,
      color: '#f59e0b',
      details: 'You can significantly reduce your energy bill by turning off unused high-power devices.',
      devices: highUsageDevices.map(d => d.name),
    });
  }

  // Cost savings insight
  const potentialSavings = Math.round(analytics.totalCost * 0.18);
  if (potentialSavings > 50) {
    newInsights.push({
      id: 6,
      type: 'savings',
      icon: 'savings',
      title: 'Potential Savings',
      description: `Optimize your device usage patterns`,
      action: 'View details',
      impact: `Save R${potentialSavings}/month`,
      color: '#10b981',
      details: 'You can reduce your energy costs by scheduling high-power devices during off-peak hours and turning them off when not in use.',
      devices: highUsageDevices.map(d => d.name),
    });
  }

  return newInsights;
};

/**
 * Main hook to combine all data logic.
 * @param {Array} appliances - The list of all devices.
 * @returns {Object} - All state and functions needed by the main component.
 */
export const useAnalyticsData = (appliances) => {
  // UI/State from original file
  const [refreshing, setRefreshing] = useState(false);
  const [loadingML, setLoadingML] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('week');
  const [selectedChart, setSelectedChart] = useState('energy');
  const [expandedSection, setExpandedSection] = useState(null);

  // Data Hooks
  const analytics = useEnergyStats(appliances);
  const mlData = useMLInsights(appliances, setLoadingML);
  const { predictiveChartData, deviceUsageData, chartConfig } = useChartData(
    appliances,
    analytics,
    selectedTimeFrame
  );
  const generatedInsights = generateInsights(appliances, analytics);

  // Handlers for UI state
  const handleTimeFramePress = useCallback((frame) => setSelectedTimeFrame(frame), []);
  const handleChartTypePress = useCallback((chart) => setSelectedChart(chart), []);
  const toggleSection = useCallback((section) => {
    setExpandedSection(expandedSection === section ? null : section);
  }, [expandedSection]);

  // Combined Refresh Handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Refresh ML insights
    await mlData.refreshMLInsights();

    // Collect current data for ML
    if (appliances.length > 0) {
      await mlService.forceCollection(appliances);
    }

    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('✅ Data Updated', 'Your analytics have been refreshed with the latest device status and ML predictions.');
    }, 1000);
  }, [appliances, mlData]);


  return {
    // State
    refreshing,
    loadingML,
    selectedTimeFrame,
    selectedChart,
    expandedSection,

    // Handlers
    onRefresh,
    toggleSection,
    handleTimeFramePress,
    handleChartTypePress,

    // Analytics Data
    analytics,
    generatedInsights,
    chartConfig,

    // ML Data & Handlers
    mlData: {
      ...mlData,
      predictiveChartData,
      deviceUsageData, // Pie chart data
    },
  };
};
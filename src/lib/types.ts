// Type definitions for the gym tracker application

export interface ExerciseSession {
  date: string;
  sessionNumber: number;
  weight: number;
  reps: number;
  originalWeight: number;
  originalUnit: string;
  isTime?: boolean;
  isPR?: boolean;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  weight: number;
  reps: number;
  originalWeight: number;
  originalUnit: string;
  setNumber: number;
  isTime?: boolean;
}

export interface Exercise {
  name: string;
  sessions: ExerciseSession[];
  parseErrors: string[];
}

export interface ExercisesResponse {
  exercises: Record<string, Exercise>;
}

export interface ErrorResponse {
  error: string;
}

export interface ParsedExerciseData {
  weight: number;
  reps: number;
  originalUnit: string;
  originalWeight: number;
  isTime?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    pointRadius: number;
    pointHoverRadius: number;
  }[];
}

export type ChartViewMode = 'volume' | 'totalVolume' | 'weight' | 'reps' | 'both';

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  interaction: {
    mode: 'index' | 'point';
    intersect: boolean;
  };
  plugins: {
    title: {
      display: boolean;
      text: string;
      font: {
        size: number;
        weight: string;
      };
      color: string;
      padding: {
        bottom: number;
      };
    };
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
      labels: {
        color: string;
        font: {
          size: number;
        };
        padding: number;
      };
    };
    tooltip: {
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      borderColor: string;
      borderWidth: number;
      cornerRadius: number;
      padding: number;
      displayColors: boolean;
      callbacks: {
        label: (context: any) => string;
      };
    };
  };
  scales: {
    x: {
      ticks: {
        color: string;
        font: {
          size: number;
        };
      };
      grid: {
        color: string;
        drawBorder: boolean;
      };
    };
    y: {
      beginAtZero: boolean;
      ticks: {
        color: string;
        font: {
          size: number;
        };
        callback?: (value: any) => string;
      };
      grid: {
        color: string;
        drawBorder: boolean;
      };
      title?: {
        display: boolean;
        text: string;
        color: string;
        font: {
          size: number;
          weight: string;
        };
      };
    };
  };
}
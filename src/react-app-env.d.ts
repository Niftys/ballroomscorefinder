/// <reference types="react-scripts" />

declare namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_BACKEND_URL: string; // Declare REACT_APP_BACKEND_URL explicitly
    }
  }
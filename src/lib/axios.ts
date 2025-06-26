import axios from 'axios';


const baseUrl = process.env.REACT_APP_TEST_ENV ? 'http://127.0.0.1:5001/fitbase-60cab/us-central1' : process.env.REACT_APP_FUNCTIONS_BASE_URL;
const apiClient = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_FIREBASE_API_KEY}`,
  },
});

// 4. Export the configured instance to be used throughout the app
export default apiClient;
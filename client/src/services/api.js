import axios from "axios";

// Create axios instance with proper base URL
const api = axios.create({
  baseURL: "/api", // Relative URL for same-origin requests
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const uploadFiles = async (files, jobDescription) => {
  try {
    console.log(
      "Uploading files:",
      files.length,
      "Job description length:",
      jobDescription.length
    );

    const formData = new FormData();
    files.forEach((file) => formData.append("resumes", file));
    formData.append("jobDescription", jobDescription);

    const { data } = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 second timeout
    });

    console.log("Upload successful, session ID:", data.sessionId);
    return data.sessionId;
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error(error.response?.data?.message || "Upload failed");
  }
};

export const fetchResults = async (sessionId) => {
  try {
    console.log("Fetching results for session:", sessionId);

    const { data } = await api.get(`/analysis/${sessionId}`);
    console.log("Results fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Fetch results failed:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch results");
  }
};

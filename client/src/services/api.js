import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const uploadFiles = async (files, jd) => {
  const form = new FormData();
  files.forEach(f => form.append('resumes', f));
  form.append('jobDescription', jd);

  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data.sessionId;
};

export const fetchResults = async (sessionId) => {
  const { data } = await api.get(`/analyse/${sessionId}`);
  return data;
};
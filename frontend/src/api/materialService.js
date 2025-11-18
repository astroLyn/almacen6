import axios from "axios";

const API_URL = "http://localhost:3000/api/materiales";

export const getMateriales = async (filtros = {}) => {
  const params = new URLSearchParams(filtros);
  const response = await axios.get(`${API_URL}?${params.toString()}`);
  return response.data;
};

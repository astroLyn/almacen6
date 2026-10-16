import axios from "../api/axiosConfig"; 

export const getMateriales = async (filtros = {}) => {
  try {
    const params = new URLSearchParams(filtros);
    // 💡 Ruta limpia: axios ya sabe que debe anteponer '/api'
    const response = await axios.get(`/materiales?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    throw error;
  }
};
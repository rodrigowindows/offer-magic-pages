import axios, { AxiosInstance, AxiosError } from 'axios';

// URL base da API (configurável via .env)
// Em desenvolvimento com proxy: use '/api/marketing'
// Em produção: use 'https://marketing.workfaraway.com'
const DEFAULT_API_URL = import.meta.env.VITE_MARKETING_API_URL ||
  (import.meta.env.DEV ? '/api/marketing' : 'https://marketing.workfaraway.com');

// Instância do Axios
let apiInstance: AxiosInstance;

// Criar instância do Axios
export const createApiInstance = (baseURL: string = DEFAULT_API_URL): AxiosInstance => {
  apiInstance = axios.create({
    baseURL,
    timeout: 30000, // 30 segundos
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor de request
  apiInstance.interceptors.request.use(
    (config) => {
      // Aqui você pode adicionar autenticação se necessário
      // const token = localStorage.getItem('auth_token');
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de response
  apiInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // Tratamento de erros global
      if (error.response) {
        // Servidor respondeu com um status de erro
        console.error('API Error:', error.response.status, error.response.data);
      } else if (error.request) {
        // Requisição foi feita mas não houve resposta
        console.error('Network Error:', error.message);
      } else {
        // Erro ao configurar a requisição
        console.error('Request Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
};

// Obter instância atual
export const getApiInstance = (): AxiosInstance => {
  if (!apiInstance) {
    return createApiInstance();
  }
  return apiInstance;
};

// Atualizar URL base
export const updateApiBaseURL = (newBaseURL: string): void => {
  if (apiInstance) {
    apiInstance.defaults.baseURL = newBaseURL;
  } else {
    createApiInstance(newBaseURL);
  }
  // Salvar no localStorage
  localStorage.setItem('marketing_api_url', newBaseURL);
};

// Obter URL base atual
export const getApiBaseURL = (): string => {
  const savedURL = localStorage.getItem('marketing_api_url');
  return savedURL || DEFAULT_API_URL;
};

// Helper para criar FormData (para uploads)
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value instanceof File) {
      formData.append(key, value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });
  return formData;
};

// Inicializar instância com URL salva
createApiInstance(getApiBaseURL());

export default getApiInstance;

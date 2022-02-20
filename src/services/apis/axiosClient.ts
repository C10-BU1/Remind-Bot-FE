import axios from 'axios';



const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        'content-type': 'application/json',
    },
  //  paramsSerializer: params => queryString.stringify(params),
});

axiosClient.interceptors.request.use((config) => {
    const token = JSON.parse(localStorage.getItem('token') || '{}');
    config.headers = {
        "Authorization": `Bearer ${token.accessToken}`
    }
    return config;
})

axiosClient.interceptors.response.use((response) => {
    if (response && response.data) {
        return response;
    }
    return response;
}, (error) => {
    // Handle errors
    throw error;
});

export default axiosClient;
import axios from 'axios';
import { BASE_URL } from '../config';

/**
 * Calls the backend AI endpoint to strictly parse a medical prescription.
 * @param {string} text - The raw prescription text
 * @param {string} token - The user's authentication token
 * @returns {Promise<Array>} A structured array of parsed medicine JSON objects.
 */
export const parsePrescription = async (text, token) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/ai/parse-prescription`, { text }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error parsing prescription with AI:', error);
        throw new Error(error.response?.data?.message || 'Failed to parse prescription. Please try again.');
    }
};

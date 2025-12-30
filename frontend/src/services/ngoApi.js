// frontend/src/services/ngoApi.js

const API_BASE_URL = '/api/ngo';

export const ngoApi = {
  /**
   * Get all active crises available for NGOs to accept
   * @returns {Promise<Object>} Object containing array of crises
   */
  getActiveCrises: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/active-crises`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching active crises:', error);
      throw error;
    }
  },

  /**
   * Accept a crisis and commit organization resources
   * @param {string} crisisId - The ID of the crisis to accept
   * @returns {Promise<Object>} Confirmation object
   */
  acceptCrisis: async (crisisId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crisisId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error accepting crisis:', error);
      throw error;
    }
  },

  /**
   * Get all tasks this NGO has accepted
   * @returns {Promise<Object>} Object containing array of accepted tasks
   */
  getAcceptedTasks: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching accepted tasks:', error);
      throw error;
    }
  },

  /**
   * Update the status of an accepted task
   * @param {string} taskId - The ID of the task to update
   * @param {string} status - New status (Pending, In Progress, Completed)
   * @returns {Promise<Object>} Updated task object
   */
  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },
};
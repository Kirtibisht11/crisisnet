// frontend/src/utils/ngoFormatter.js

export const ngoFormatter = {
  /**
   * Get Tailwind classes for severity badge background and text
   * @param {string} severity - HIGH, MEDIUM, or LOW
   * @returns {string} Tailwind CSS classes
   */
  getSeverityColor: (severity) => {
    const colors = {
      HIGH: 'bg-red-100 text-red-800 border-red-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  },

  /**
   * Get Tailwind classes for severity indicator dot
   * @param {string} severity - HIGH, MEDIUM, or LOW
   * @returns {string} Tailwind CSS classes
   */
  getSeverityIcon: (severity) => {
    const icons = {
      HIGH: 'bg-red-500',
      MEDIUM: 'bg-yellow-500',
      LOW: 'bg-green-500',
    };
    return icons[severity] || 'bg-gray-500';
  },

  /**
   * Format crisis type for display
   * @param {string} type - Crisis type
   * @returns {string} Formatted type
   */
  formatCrisisType: (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  /**
   * Format timestamp to relative time
   * @param {string} timestamp - ISO timestamp or relative string
   * @returns {string} Human-readable time
   */
  formatTimestamp: (timestamp) => {
    if (typeof timestamp === 'string' && timestamp.includes('ago')) {
      return timestamp;
    }

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } catch (error) {
      return timestamp;
    }
  },

  /**
   * Format resource list for display
   * @param {Array<string>} resources - Array of resource types
   * @returns {string} Comma-separated list
   */
  formatResources: (resources) => {
    if (!resources || resources.length === 0) return 'No resources specified';
    return resources.join(', ');
  },

  /**
   * Get priority order for sorting
   * @param {string} severity - HIGH, MEDIUM, or LOW
   * @returns {number} Sort priority (lower = higher priority)
   */
  getSeverityPriority: (severity) => {
    const priorities = {
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    return priorities[severity] || 999;
  },

  /**
   * Format trust score as percentage
   * @param {number} trust - Trust score between 0 and 1
   * @returns {string} Formatted percentage
   */
  formatTrustScore: (trust) => {
    return `${Math.round(trust * 100)}%`;
  },

  /**
   * Get trust level description
   * @param {number} trust - Trust score between 0 and 1
   * @returns {string} Trust level description
   */
  getTrustLevel: (trust) => {
    if (trust >= 0.8) return 'Very High';
    if (trust >= 0.6) return 'High';
    if (trust >= 0.4) return 'Medium';
    return 'Low';
  },

  /**
   * Format location for compact display
   * @param {string} location - Full location string
   * @returns {string} Shortened location if too long
   */
  formatLocation: (location) => {
    if (location.length <= 30) return location;
    return location.substring(0, 27) + '...';
  },
};
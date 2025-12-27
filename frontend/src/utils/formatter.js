export const formatTrustScore = (score) => {
  const numScore = parseFloat(score);
  
  if (isNaN(numScore)) return { value: 'N/A', color: 'gray', label: 'Unknown' };
  
  const percentage = (numScore * 100).toFixed(1);

  if (numScore >= 0.65) {
    return { 
      value: percentage, 
      color: 'green', 
      label: 'High Trust',
      bgColor: '#d4edda',
      textColor: '#155724'
    };
  } else if (numScore >= 0.45) {
    return { 
      value: percentage, 
      color: 'yellow', 
      label: 'Review Needed',
      bgColor: '#fff3cd',
      textColor: '#856404'
    };
  } else if (numScore >= 0.30) {
    return { 
      value: percentage, 
      color: 'orange', 
      label: 'Low Confidence',
      bgColor: '#f8d7da',
      textColor: '#721c24'
    };
  } else {
    return { 
      value: percentage, 
      color: 'red', 
      label: 'Rejected',
      bgColor: '#f8d7da',
      textColor: '#721c24'
    };
  }
};

export const formatDecision = (decision) => {
  const decisionMap = {
    'VERIFIED': { 
      text: 'Verified', 
      color: '#155724',
      bgColor: '#d4edda',
    },
    'REVIEW': { 
      text: 'Needs Review', 
      color: '#856404',
      bgColor: '#fff3cd',
    },
    'UNCERTAIN': { 
      text: 'Uncertain', 
      color: '#721c24',
      bgColor: '#f8d7da',
    },
    'REJECTED': { 
      text: 'Rejected', 
      color: '#721c24',
      bgColor: '#f8d7da',
    }
  };
  
  return decisionMap[decision] || { 
    text: decision, 
    color: '#6c757d',
    bgColor: '#e2e3e5',
  };
};

export const formatReputation = (reputation) => {
  const score = parseFloat(reputation);
  
  if (isNaN(score)) return { value: 'N/A', tier: 'Unknown', color: 'gray' };
  
  const percentage = (score * 100).toFixed(0);
  
  if (score >= 0.8) {
    return { value: percentage, tier: 'Excellent', color: 'green' };
  } else if (score >= 0.6) {
    return { value: percentage, tier: 'Good', color: 'blue' };
  } else if (score >= 0.4) {
    return { value: percentage, tier: 'Fair', color: 'yellow' };
  } else if (score >= 0.2) {
    return { value: percentage, tier: 'Poor', color: 'orange' };
  } else {
    return { value: percentage, tier: 'Very Poor', color: 'red' };
  }
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return diffMins <= 0 ? 'Just now' : `${diffMins}m ago`;
  }
 
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

export const formatCrisisType = (crisisType) => {
  const crisisMap = {
    'flood': {  label: 'Flood', color: '#0066cc' },
    'fire': {  label: 'Fire', color: '#ff4444' },
    'earthquake': {  label: 'Earthquake', color: '#8b4513' },
    'accident': {  label: 'Accident', color: '#ff6600' },
    'medical': {  label: 'Medical Emergency', color: '#cc0000' },
    'violence': {  label: 'Violence', color: '#990000' },
    'storm': {  label: 'Storm', color: '#4d4d4d' },
    'landslide': {  label: 'Landslide', color: '#8b6914' },
    'other': {  label: 'Other Emergency', color: '#666666' }
  };
  
  const crisis = crisisMap[crisisType?.toLowerCase()] || crisisMap['other'];
  return crisis;
};


export const formatLocation = (location, lat, lon) => {
  if (!location) return { display: 'Unknown Location', hasCoordinates: false };
  
  const hasCoords = lat != null && lon != null;
  return {
    display: location,
    hasCoordinates: hasCoords,
    coordinates: hasCoords ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}` : null
  };
};

export const formatScoreBreakdown = (components) => {
  if (!components) return [];
  
  return [
    {
      label: 'Cross-Verification',
      value: components.cross_verification || 0,
      weight: '40%',
      color: '#3b82f6'
    },
    {
      label: 'Source Reputation',
      value: components.source_reputation || 0,
      weight: '25%',
      color: '#8b5cf6'
    },
    {
      label: 'Duplicate Check',
      value: components.duplicate_adjustment || 0,
      weight: '20%',
      color: components.duplicate_adjustment < 0 ? '#ef4444' : '#10b981'
    },
    {
      label: 'Rate Limit',
      value: components.rate_limit_penalty || 0,
      weight: '15%',
      color: components.rate_limit_penalty < 0 ? '#ef4444' : '#6b7280'
    },
    {
      label: 'Bonus Signals',
      value: components.bonus_signals || 0,
      weight: 'Extra',
      color: '#10b981'
    }
  ];
};

export const formatSourceCount = (count) => {
  if (!count || count === 0) {
    return { text: 'No sources', color: '#6b7280', badge: '0', level: 'none' };
  } else if (count === 1) {
    return { text: '1 source', color: '#f59e0b', badge: '1', level: 'low' };
  } else if (count < 5) {
    return { text: `${count} sources`, color: '#3b82f6', badge: count.toString(), level: 'medium' };
  } else {
    return { text: `${count} sources`, color: '#10b981', badge: `${count}+`, level: 'high' };
  }
};

export const formatPercentage = (value, showSign = true) => {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  
  const percentage = (num * 100).toFixed(1);
  const sign = showSign && num > 0 ? '+' : '';
  
  return `${sign}${percentage}%`;
};

export const getScoreColor = (score) => {
  if (score >= 0.65) return '#10b981'; 
  if (score >= 0.45) return '#f59e0b'; 
  if (score >= 0.30) return '#ef4444'; 
  return '#6b7280'; 
};

export const formatPriority = (trustScore, crisisType) => {
  const score = parseFloat(trustScore);
  const urgentCrises = ['fire', 'medical', 'violence', 'earthquake'];
  const isUrgent = urgentCrises.includes(crisisType?.toLowerCase());
  
  if (score >= 0.65 && isUrgent) {
    return { level: 'CRITICAL', color: '#dc2626', priority: 1 };
  } else if (score >= 0.65) {
    return { level: 'HIGH', color: '#ea580c', priority: 2 };
  } else if (score >= 0.45) {
    return { level: 'MEDIUM', color: '#f59e0b', priority: 3 };
  } else {
    return { level: 'LOW', color: '#6b7280', priority: 4 };
  }
};

export const sanitizeText = (text, maxLength = 200) => {
  if (!text) return '';
  
  const cleaned = String(text).replace(/[<>]/g, '').trim();
  
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
};

export const formatNumber = (num) => {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

export const getUserTypeBadge = (reputation) => {
  const rep = parseFloat(reputation);
  if (isNaN(rep)) return { label: 'Unknown', color: '#6b7280' };
  
  if (rep >= 0.8) return { label: 'Trusted', color: '#10b981' };
  if (rep >= 0.6) return { label: 'Verified', color: '#3b82f6' };
  if (rep >= 0.4) return { label: 'New User', color: '#f59e0b' };
  return { label: 'Suspicious', color: '#ef4444' };
};
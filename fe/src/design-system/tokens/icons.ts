/**
 * Icon Design Tokens
 * Hệ thống icons cho Zalo Mini App Nông nghiệp
 * 
 * Requirements: 4.1-4.6, 8.4
 */

export interface IconToken {
  name: string;
  source: 'zaui' | 'custom';
  style: 'outline' | 'filled';
  sizes: string[];
}

// Navigation Icons (Custom Outline Style) - Requirement 4.2
export const navigationIcons = {
  home: 'custom-icon-home',
  user: 'custom-icon-user',
  settings: 'custom-icon-settings',
  notification: 'custom-icon-notification',
} as const;

// Agriculture Icons (Custom Outline Style) - Requirements 4.3-4.6
export const agricultureIcons = {
  temperature: 'custom-icon-thermometer',
  humidity: 'custom-icon-droplet',
  light: 'custom-icon-sun',
  alert: 'custom-icon-alert-triangle',
  plant: 'custom-icon-plant',
  farm: 'custom-icon-farm',
  droplet: 'custom-icon-droplet',
  wind: 'custom-icon-wind',
  sun: 'custom-icon-sun',
} as const;

// Action Icons
export const actionIcons = {
  add: 'zaui-icon-plus',
  edit: 'zaui-icon-edit',
  delete: 'zaui-icon-trash',
  search: 'zaui-icon-search',
  filter: 'custom-icon-filter',
  camera: 'custom-icon-camera',
  check: 'custom-icon-check',
  info: 'custom-icon-info',
  play: 'custom-icon-play',
  close: 'custom-icon-close',
  'alert-triangle': 'custom-icon-alert-triangle',
  'trending-up': 'custom-icon-trending-up',
  'map-pin': 'custom-icon-map-pin',
  'qr-code': 'custom-icon-qr-code',
  battery: 'custom-icon-battery',
  wifi: 'custom-icon-wifi',
  'dollar-sign': 'custom-icon-dollar-sign',
  users: 'custom-icon-users',
  package: 'custom-icon-package',
  'shopping-cart': 'custom-icon-shopping-cart',
  crop: 'custom-icon-crop',
  clock: 'custom-icon-clock',
  map: 'custom-icon-map',
  book: 'custom-icon-book',
  list: 'custom-icon-list',
  'plus-circle': 'custom-icon-plus-circle',
  trash: 'custom-icon-trash',
  eye: 'custom-icon-eye',
  heart: 'custom-icon-heart',
  calendar: 'custom-icon-calendar',
  'message-circle': 'custom-icon-message-circle',
  'chevron-left': 'custom-icon-chevron-left',
  'chevron-right': 'custom-icon-chevron-right',
  star: 'custom-icon-star',
  'star-filled': 'custom-icon-star-filled',
  image: 'custom-icon-image',
  location: 'custom-icon-location',
} as const;

// Icon Sizes
export const iconSizes = {
  sm: '16px',
  md: '24px',
  lg: '32px',
} as const;

// Combined icon system
export const icons = {
  navigation: navigationIcons,
  agriculture: agricultureIcons,
  actions: actionIcons,
  sizes: iconSizes,
} as const;

// Icon tokens with metadata
export const iconTokens: IconToken[] = [
  // Navigation Icons (Custom)
  {
    name: 'home',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'user',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'settings',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'notification',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  // Agriculture Icons
  {
    name: 'temperature',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'humidity',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'light',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'alert',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'plant',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'farm',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'droplet',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'wind',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'sun',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
  {
    name: 'filter',
    source: 'custom',
    style: 'outline',
    sizes: ['16px', '24px', '32px'],
  },
];

/**
 * Sensor icon mapping - Requirement 4.3-4.6
 */
export const sensorIconMapping = {
  temperature: agricultureIcons.temperature,
  humidity: agricultureIcons.humidity,
  light: agricultureIcons.light,
} as const;

export type SensorType = keyof typeof sensorIconMapping;

/**
 * Get icon for sensor type
 */
export const getSensorIcon = (sensorType: SensorType): string => {
  return sensorIconMapping[sensorType];
};

export default icons;

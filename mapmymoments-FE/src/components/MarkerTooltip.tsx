import React from 'react';

interface MarkerTooltipProps {
  type: 'origin' | 'stop' | 'destination';
  name: string;
  address?: string;
  index?: number;
}

const MarkerTooltip = ({ type, name, address, index }: MarkerTooltipProps): string => {
  const getIcon = () => {
    switch (type) {
      case 'origin':
        return '🚩';
      case 'stop':
        return '📍';
      case 'destination':
        return '🏁';
      default:
        return '📍';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'origin':
        return 'Starting Point';
      case 'stop':
        return `Stop ${index}`;
      case 'destination':
        return 'Destination';
      default:
        return 'Location';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'origin':
        return '#22c55e';
      case 'stop':
        return '#f59e0b';
      case 'destination':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  return `
    <div style="padding: 8px; max-width: 250px; font-family: Arial, sans-serif;">
      <div style="font-weight: bold; color: ${getColor()}; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
        <span>${getIcon()}</span>
        <span>${getTitle()}</span>
      </div>
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px; color: #1f2937;">${name}</div>
      ${address ? `<div style="font-size: 12px; color: #6b7280; line-height: 1.3;">${address}</div>` : ''}
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e5e7eb;">
        <span style="font-size: 11px; color: #9ca3af;">Click for more details</span>
      </div>
    </div>
  `;
};

export default MarkerTooltip;

import React from 'react';
import { Box, Typography, Paper, Checkbox, FormControlLabel } from '@mui/material';

interface CodDivisionSelectorProps {
  availableDivisions: string[];
  unavailableDivisions: string[];
  onChange: (available: string[], unavailable: string[]) => void;
}

export const CodDivisionSelector: React.FC<CodDivisionSelectorProps> = ({
  availableDivisions,
  unavailableDivisions,
  onChange
}) => {
  const divisions = [
    { value: 'dhaka', label: 'Dhaka' },
    { value: 'chittagong', label: 'Chittagong' },
    { value: 'khulna', label: 'Khulna' },
    { value: 'rajshahi', label: 'Rajshahi' },
    { value: 'sylhet', label: 'Sylhet' },
    { value: 'barishal', label: 'Barishal' },
    { value: 'rangpur', label: 'Rangpur' },
    { value: 'mymensingh', label: 'Mymensingh' },
  ];

  const handleAvailableToggle = (division: string) => {
    const newAvailable = availableDivisions.includes(division)
      ? availableDivisions.filter(d => d !== division)
      : [...availableDivisions, division];
    
    const newUnavailable = unavailableDivisions.includes(division)
      ? unavailableDivisions.filter(d => d !== division)
      : [...unavailableDivisions, division];
    
    onChange(newAvailable, newUnavailable);
  };

  const handleUnavailableToggle = (division: string) => {
    const newAvailable = availableDivisions.includes(division)
      ? availableDivisions.filter(d => d !== division)
      : [...availableDivisions, division];
    
    const newUnavailable = unavailableDivisions.includes(division)
      ? unavailableDivisions.filter(d => d !== division)
      : [...unavailableDivisions, division];
    
    onChange(newAvailable, newUnavailable);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Division Settings
      </Typography>

      {/* Available Divisions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Available Divisions
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {divisions.map((division) => (
            <Box
              key={division.value}
              sx={{ display: 'flex', alignItems: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}
            >
              <Checkbox
                checked={availableDivisions.includes(division.value)}
                onChange={() => handleAvailableToggle(division.value)}
              />
              <Typography variant="body1">
                {division.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Unavailable Divisions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Unavailable Divisions
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {divisions.map((division) => (
            <Box
              key={division.value}
              sx={{ display: 'flex', alignItems: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}
            >
              <Checkbox
                checked={unavailableDivisions.includes(division.value)}
                onChange={() => handleUnavailableToggle(division.value)}
              />
              <Typography variant="body1">
                {division.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default CodDivisionSelector;

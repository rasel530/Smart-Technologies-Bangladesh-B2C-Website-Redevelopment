import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';

interface EmiProvider {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  interestRate: number;
  createdAt: string;
  updatedAt: string;
  emiPlans?: any[];
}

interface EmiProviderTableProps {
  providers: EmiProvider[];
  onEdit: (provider: EmiProvider) => void;
  onDelete: (provider: EmiProvider) => void;
  onToggleStatus: (provider: EmiProvider) => void;
}

export const EmiProviderTable: React.FC<EmiProviderTableProps> = ({
  providers,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Provider</TableCell>
          <TableCell>Website</TableCell>
          <TableCell>Min Amount</TableCell>
          <TableCell>Max Amount</TableCell>
          <TableCell>Processing Fee</TableCell>
          <TableCell>Interest Rate</TableCell>
          <TableCell>Plans</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {providers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} align="center">
              No EMI providers found
            </TableCell>
          </TableRow>
        ) : (
          providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {provider.logoUrl && (
                    <img
                      src={provider.logoUrl}
                      alt={provider.name}
                      style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }}
                    />
                  )}
                  <Typography variant="body2">{provider.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                {provider.website ? (
                  <Tooltip title={provider.website}>
                    <Typography
                      variant="body2"
                      component="a"
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textDecoration: 'none', color: 'primary.main' }}
                    >
                      Visit
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    N/A
                  </Typography>
                )}
              </TableCell>
              <TableCell>{formatCurrency(provider.minAmount)}</TableCell>
              <TableCell>{formatCurrency(provider.maxAmount)}</TableCell>
              <TableCell>{formatCurrency(provider.processingFee)}</TableCell>
              <TableCell>{provider.interestRate}%</TableCell>
              <TableCell>
                <Chip label={provider.emiPlans?.length || 0} size="small" />
              </TableCell>
              <TableCell>
                <Chip
                  label={provider.isActive ? 'Active' : 'Inactive'}
                  color={provider.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Tooltip title="Toggle Status">
                  <IconButton
                    size="small"
                    onClick={() => onToggleStatus(provider)}
                  >
                    {provider.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(provider)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(provider)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default EmiProviderTable;

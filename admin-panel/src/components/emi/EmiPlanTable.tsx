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
  isActive: boolean;
}

interface EmiPlan {
  id: string;
  providerId: string;
  name: string;
  duration: number;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  downPayment: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  provider: EmiProvider;
}

interface EmiPlanTableProps {
  plans: EmiPlan[];
  onEdit: (plan: EmiPlan) => void;
  onDelete: (plan: EmiPlan) => void;
  onToggleStatus: (plan: EmiPlan) => void;
}

export const EmiPlanTable: React.FC<EmiPlanTableProps> = ({
  plans,
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

  const getInterestRateColor = (rate: number) => {
    if (rate === 0) return 'success';
    if (rate < 5) return 'success';
    if (rate < 10) return 'warning';
    return 'error';
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Plan</TableCell>
          <TableCell>Provider</TableCell>
          <TableCell>Duration</TableCell>
          <TableCell>Interest Rate</TableCell>
          <TableCell>Min Amount</TableCell>
          <TableCell>Max Amount</TableCell>
          <TableCell>Processing Fee</TableCell>
          <TableCell>Down Payment</TableCell>
          <TableCell>Display Order</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {plans.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} align="center">
              No EMI plans found
            </TableCell>
          </TableRow>
        ) : (
          plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {plan.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {plan.provider.logoUrl && (
                    <img
                      src={plan.provider.logoUrl}
                      alt={plan.provider.name}
                      style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }}
                    />
                  )}
                  <Typography variant="body2">{plan.provider.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>{plan.duration} months</TableCell>
              <TableCell>
                <Chip
                  label={`${plan.interestRate}%`}
                  color={getInterestRateColor(plan.interestRate) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatCurrency(plan.minAmount)}</TableCell>
              <TableCell>{formatCurrency(plan.maxAmount)}</TableCell>
              <TableCell>{formatCurrency(plan.processingFee)}</TableCell>
              <TableCell>{formatCurrency(plan.downPayment)}</TableCell>
              <TableCell>{plan.displayOrder}</TableCell>
              <TableCell>
                <Chip
                  label={plan.isActive ? 'Active' : 'Inactive'}
                  color={plan.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Tooltip title="Toggle Status">
                  <IconButton
                    size="small"
                    onClick={() => onToggleStatus(plan)}
                  >
                    {plan.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(plan)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(plan)}
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

export default EmiPlanTable;

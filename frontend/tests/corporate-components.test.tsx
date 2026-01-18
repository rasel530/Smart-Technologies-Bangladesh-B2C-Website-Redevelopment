/**
 * Corporate Account Management - Frontend Component Tests
 * 
 * Tests for all corporate account frontend components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock API client
jest.mock('@/lib/api/corporate', () => ({
  CorporateAPI: {
    register: jest.fn(),
    getAccount: jest.fn(),
    getAccountStatus: jest.fn(),
    getDashboardStats: jest.fn(),
  },
  CorporateUserAPI: {
    getUsers: jest.fn(),
    addUser: jest.fn(),
    updateUserRole: jest.fn(),
    removeUser: jest.fn(),
  },
  CorporatePricingAPI: {
    getProducts: jest.fn(),
    getCategories: jest.fn(),
  },
  PurchaseOrderAPI: {
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    approveOrder: jest.fn(),
    rejectOrder: jest.fn(),
    cancelOrder: jest.fn(),
  },
  InvoiceAPI: {
    getInvoices: jest.fn(),
    downloadInvoice: jest.fn(),
  },
  CreditAPI: {
    getCreditLimit: jest.fn(),
    getCreditHistory: jest.fn(),
    requestCreditIncrease: jest.fn(),
  },
}));

// Mock components
jest.mock('@/components/ui/BangladeshAddress', () => ({
  BangladeshAddress: ({ onDivisionChange, onDistrictChange, onUpazilaChange }) => (
    <div data-testid="bangladesh-address">
      <select onChange={(e) => onDivisionChange(e.target.value)}>
        <option value="">Select Division</option>
        <option value="DHAKA">Dhaka</option>
      </select>
      <select onChange={(e) => onDistrictChange(e.target.value)}>
        <option value="">Select District</option>
        <option value="Dhaka">Dhaka</option>
      </select>
      <select onChange={(e) => onUpazilaChange(e.target.value)}>
        <option value="">Select Upazila</option>
        <option value="Dhaka North">Dhaka North</option>
      </select>
    </div>
  ),
}));

jest.mock('@/components/ui/PhoneInput', () => ({
  PhoneInput: ({ value, onChange, error }) => (
    <div data-testid="phone-input">
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'error' : ''}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  ),
}));

jest.mock('@/components/ui/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Import components to test
import CorporateRegistrationPage from '@/app/register/corporate/page';
import CorporateAccountPage from '@/app/account/corporate/page';
import CorporateDashboardPage from '@/app/account/corporate/dashboard/page';
import CorporateUsersPage from '@/app/account/corporate/users/page';
import CorporatePricingPage from '@/app/account/corporate/pricing/page';
import CorporatePurchaseOrdersPage from '@/app/account/corporate/purchase-orders/page';
import CorporateInvoicesPage from '@/app/account/corporate/invoices/page';
import CorporateCreditPage from '@/app/account/corporate/credit/page';

const mockPush = jest.fn();
const mockRouter = { push: mockPush };

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  jest.clearAllMocks();
  localStorage.clear();
});

describe('Corporate Registration Page', () => {
  describe('Rendering', () => {
    it('should render corporate registration page correctly', () => {
      render(<CorporateRegistrationPage />);
      
      expect(screen.getByText(/Corporate Account Registration|কর্পোরেট অ্যাকাউন্ট নিবন্ধন/)).toBeInTheDocument();
      expect(screen.getByTestId('bangladesh-address')).toBeInTheDocument();
      expect(screen.getByTestId('phone-input')).toBeInTheDocument();
    });

    it('should display all registration steps', () => {
      render(<CorporateRegistrationPage />);
      
      expect(screen.getByText(/Company Information|কোম্পানি তথ্যসংক্রান্তি/)).toBeInTheDocument();
      expect(screen.getByText(/Address Details|ঠিকানার বিবরণ/)).toBeInTheDocument();
      expect(screen.getByText(/Authorized Person|অনুমতিকৃত ব্যক্তির বিবরণ/)).toBeInTheDocument();
      expect(screen.getByText(/Documents|ডকুমেন্ট আপলোড করুন/)).toBeInTheDocument();
    });

    it('should display language toggle buttons', () => {
      render(<CorporateRegistrationPage />);
      
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('বাংলা')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields in company information step', async () => {
      const user = userEvent.setup();
      render(<CorporateRegistrationPage />);
      
      // Try to proceed without filling required fields
      const nextButton = screen.getByText(/Next|পরবর্তী/);
      await user.click(nextButton);
      
      expect(screen.getByText(/Company name is required|কোম্পানির নাম প্রয়োজন/)).toBeInTheDocument();
      expect(screen.getByText(/Company registration number is required|কোম্পানি নিবন্ধন নম্বর প্রয়োজন/)).toBeInTheDocument();
    });

    it('should validate TIN number format', async () => {
      const user = userEvent.setup();
      render(<CorporateRegistrationPage />);
      
      const tinInput = screen.getByPlaceholderText(/Enter 12-digit TIN number|১২ ডিজিট টিআইএন নম্বর লিখুন/);
      await user.type(tinInput, '123');
      
      expect(screen.getByText(/Invalid TIN number|অবৈধ টিআইএন নম্বর/)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<CorporateRegistrationPage />);
      
      // Navigate to authorized person step
      const nextButton = screen.getByText(/Next|পরবর্তী/);
      await user.click(nextButton);
      await user.click(nextButton);
      
      const emailInput = screen.getByPlaceholderText(/Enter email address|ইমেইল ঠিকানা লিখুন/);
      await user.type(emailInput, 'invalid-email');
      
      expect(screen.getByText(/Invalid email format|অবৈধ ইমেইল ফরম্যাট/)).toBeInTheDocument();
    });

    it('should validate Bangladesh phone number format', async () => {
      const user = userEvent.setup();
      render(<CorporateRegistrationPage />);
      
      // Navigate to authorized person step
      const nextButton = screen.getByText(/Next|পরবর্তী/);
      await user.click(nextButton);
      await user.click(nextButton);
      
      const phoneInput = screen.getByPlaceholderText(/Enter phone number|ফোন নম্বর লিখুন/);
      await user.type(phoneInput, '1234567890');
      
      expect(screen.getByText(/Invalid Bangladesh phone number|অবৈধ বাংলাদেশ ফোন নম্বর/)).toBeInTheDocument();
    });

    it('should validate terms acceptance', async () => {
      const user = userEvent.setup();
      render(<CorporateRegistrationPage />);
      
      // Navigate to documents step
      const nextButton = screen.getByText(/Next|পরবর্তী/);
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);
      
      // Try to submit without accepting terms
      const submitButton = screen.getByText(/Submit Registration|নিবন্ধন জমা দিন/);
      await user.click(submitButton);
      
      expect(screen.getByText(/You must accept the terms and conditions|আপনি শর্তাব ও শর্তগুলো গ্রহণ করতে হবেন/)).toBeInTheDocument();
    });
  });

  describe('Language Toggle', () => {
    it('should switch to Bengali language', async () => {
      const user = userEvent.setup();
      render(<CorporateRegistrationPage />);
      
      const banglaButton = screen.getByText('বাংলা');
      await user.click(banglaButton);
      
      expect(screen.getByText('কর্পোরেট অ্যাকাউন্ট নিবন্ধন')).toBeInTheDocument();
    });

    it('should switch to English language', async () => {
      const user = userEvent.setup();
      render(<CorporateRegistrationPage />);
      
      const englishButton = screen.getByText('English');
      await user.click(englishButton);
      
      expect(screen.getByText('Corporate Account Registration')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit registration successfully', async () => {
      const user = userEvent.setup();
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.register.mockResolvedValue({
        accountId: 'test-account-id',
        status: 'PENDING'
      });
      
      render(<CorporateRegistrationPage />);
      
      // Fill out form (simplified)
      const companyNameInput = screen.getByPlaceholderText(/Enter company name|কোম্পানির নাম লিখুন/);
      await user.type(companyNameInput, 'Test Corporation Ltd.');
      
      const regNumberInput = screen.getByPlaceholderText(/Enter registration number|নিবন্ধন নম্বর লিখুন/);
      await user.type(regNumberInput, 'REG-2024-TEST-001');
      
      // Navigate through steps
      const nextButton = screen.getByText(/Next|পরবর্তী/);
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);
      
      // Upload document
      const fileInput = screen.getByLabelText(/Trade License|ট্রেড লাইসেন্স/);
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);
      
      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);
      
      // Submit
      const submitButton = screen.getByText(/Submit Registration|নিবন্ধন জমা দিন/);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(CorporateAPI.register).toHaveBeenCalled();
        expect(screen.getByText(/Registration Successful|নিবন্ধন সফল হয়েছে/)).toBeInTheDocument();
      });
    });

    it('should redirect to dashboard after successful registration', async () => {
      const user = userEvent.setup();
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.register.mockResolvedValue({
        accountId: 'test-account-id',
        status: 'PENDING'
      });
      
      render(<CorporateRegistrationPage />);
      
      // Submit form (simplified)
      await waitFor(() => {
        expect(screen.getByText(/Registration Successful|নিবন্ধন সফল হয়েছে/)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/account/corporate/dashboard');
      }, { timeout: 4000 });
    });
  });
});

describe('Corporate Account Page', () => {
  describe('Rendering', () => {
    it('should render corporate account page correctly', async () => {
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.getAccount.mockResolvedValue({
        id: 'test-id',
        companyName: 'Test Corporation',
        companyRegistrationNumber: 'REG-2024-001',
        status: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        businessAddress: '123 Business Street',
        division: 'DHAKA',
        district: 'Dhaka',
        authorizedPersonName: 'John Doe',
        companyEmail: 'info@testcorp.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      CorporateAPI.getDashboardStats.mockResolvedValue({
        accountStatus: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        pendingApprovals: 3,
        recentOrders: [],
        pendingInvoices: [],
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateAccountPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Corporation')).toBeInTheDocument();
        expect(screen.getByText('Account ID: test-id')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      });
    });

    it('should display dashboard stats', async () => {
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.getAccount.mockResolvedValue({
        id: 'test-id',
        companyName: 'Test Corporation',
        status: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      CorporateAPI.getDashboardStats.mockResolvedValue({
        accountStatus: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        pendingApprovals: 3,
        recentOrders: [],
        pendingInvoices: [],
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateAccountPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Available Credit/)).toBeInTheDocument();
        expect(screen.getByText(/৳75,000/)).toBeInTheDocument();
        expect(screen.getByText(/Credit Limit/)).toBeInTheDocument();
        expect(screen.getByText(/৳100,000/)).toBeInTheDocument();
        expect(screen.getByText(/Pending Approvals/)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display quick action buttons', async () => {
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.getAccount.mockResolvedValue({
        id: 'test-id',
        companyName: 'Test Corporation',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      CorporateAPI.getDashboardStats.mockResolvedValue({
        accountStatus: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        pendingApprovals: 3,
        recentOrders: [],
        pendingInvoices: [],
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateAccountPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
        expect(screen.getByText('Pricing')).toBeInTheDocument();
        expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
        expect(screen.getByText('Invoices')).toBeInTheDocument();
        expect(screen.getByText('Credit Management')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard when clicked', async () => {
      const user = userEvent.setup();
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.getAccount.mockResolvedValue({
        id: 'test-id',
        companyName: 'Test Corporation',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      CorporateAPI.getDashboardStats.mockResolvedValue({
        accountStatus: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        pendingApprovals: 3,
        recentOrders: [],
        pendingInvoices: [],
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateAccountPage />);
      
      await waitFor(() => {
        const dashboardButton = screen.getByText('Dashboard');
        expect(dashboardButton).toBeInTheDocument();
      });
      
      const dashboardButton = await screen.findByText('Dashboard');
      await user.click(dashboardButton);
      
      expect(mockPush).toHaveBeenCalledWith('/account/corporate/dashboard');
    });

    it('should navigate to users page when clicked', async () => {
      const user = userEvent.setup();
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.getAccount.mockResolvedValue({
        id: 'test-id',
        companyName: 'Test Corporation',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      CorporateAPI.getDashboardStats.mockResolvedValue({
        accountStatus: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        pendingApprovals: 3,
        recentOrders: [],
        pendingInvoices: [],
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateAccountPage />);
      
      const usersButton = await screen.findByText('Manage Users');
      await user.click(usersButton);
      
      expect(mockPush).toHaveBeenCalledWith('/account/corporate/users');
    });
  });

  describe('Error Handling', () => {
    it('should redirect to registration if no corporate account', async () => {
      localStorage.removeItem('corporate_account_id');
      
      render(<CorporateAccountPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/register/corporate');
      });
    });

    it('should display error message on API failure', async () => {
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.getAccount.mockRejectedValue(new Error('Failed to load account'));
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateAccountPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load corporate account')).toBeInTheDocument();
      });
    });
  });
});

describe('Corporate Dashboard Page', () => {
  describe('Rendering', () => {
    it('should render dashboard with account status', async () => {
      const { CorporateAPI } = require('@/lib/api/corporate');
      
      CorporateAPI.getDashboardStats.mockResolvedValue({
        accountStatus: 'ACTIVE',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        pendingApprovals: 3,
        recentOrders: [],
        pendingInvoices: [],
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Account Status/)).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      });
    });
  });
});

describe('Corporate Users Page', () => {
  describe('Rendering', () => {
    it('should render users list', async () => {
      const { CorporateUserAPI } = require('@/lib/api/corporate');
      
      CorporateUserAPI.getUsers.mockResolvedValue([
        {
          id: 'user-1',
          userId: 'uid-1',
          role: 'CORPORATE_ADMIN',
          status: 'ACTIVE',
          user: {
            id: 'uid-1',
            email: 'admin@testcorp.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateUsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('admin@testcorp.com')).toBeInTheDocument();
        expect(screen.getByText('CORPORATE_ADMIN')).toBeInTheDocument();
      });
    });
  });

  describe('User Management', () => {
    it('should add new user successfully', async () => {
      const user = userEvent.setup();
      const { CorporateUserAPI } = require('@/lib/api/corporate');
      
      CorporateUserAPI.getUsers.mockResolvedValue([]);
      CorporateUserAPI.addUser.mockResolvedValue({
        id: 'new-user-id',
        userId: 'new-uid',
        role: 'REQUESTER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateUsersPage />);
      
      await waitFor(() => {
        const addButton = screen.getByText(/Add User|ব্যবহারক যোগ করুন/);
        expect(addButton).toBeInTheDocument();
      });
      
      const addButton = await screen.findByText(/Add User|ব্যবহারক যোগ করুন/);
      await user.click(addButton);
      
      await waitFor(() => {
        expect(CorporateUserAPI.addUser).toHaveBeenCalled();
      });
    });

    it('should update user role', async () => {
      const { CorporateUserAPI } = require('@/lib/api/corporate');
      
      CorporateUserAPI.getUsers.mockResolvedValue([
        {
          id: 'user-1',
          userId: 'uid-1',
          role: 'REQUESTER',
          status: 'ACTIVE',
          user: { id: 'uid-1', firstName: 'John', lastName: 'Doe' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      
      CorporateUserAPI.updateUserRole.mockResolvedValue({
        id: 'user-1',
        userId: 'uid-1',
        role: 'APPROVER',
        status: 'ACTIVE',
        user: { id: 'uid-1', firstName: 'John', lastName: 'Doe' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateUsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
});

describe('Corporate Pricing Page', () => {
  describe('Rendering', () => {
    it('should render products with corporate pricing', async () => {
      const { CorporatePricingAPI } = require('@/lib/api/corporate');
      
      CorporatePricingAPI.getProducts.mockResolvedValue({
        products: [
          {
            id: 'prod-1',
            name: 'Test Product',
            category: 'Electronics',
            regularPrice: 10000,
            corporatePrice: 8500,
            discountPercentage: 15,
          },
        ],
        total: 1,
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporatePricingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText(/৳8,500/)).toBeInTheDocument();
        expect(screen.getByText(/15% off/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter products by category', async () => {
      const user = userEvent.setup();
      const { CorporatePricingAPI } = require('@/lib/api/corporate');
      
      CorporatePricingAPI.getProducts.mockResolvedValue({
        products: [],
        total: 0,
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporatePricingPage />);
      
      await waitFor(() => {
        const categoryFilter = screen.getByPlaceholderText(/Filter by category|ক্যাটাগরি দিয়ে ফিল্টার করুন/);
        expect(categoryFilter).toBeInTheDocument();
      });
      
      const categoryFilter = await screen.findByPlaceholderText(/Filter by category|ক্যাটাগরি দিয়ে ফিল্টার করুন/);
      await user.type(categoryFilter, 'Electronics');
      
      await waitFor(() => {
        expect(CorporatePricingAPI.getProducts).toHaveBeenCalledWith(
          'test-id',
          expect.objectContaining({ category: 'Electronics' })
        );
      });
    });
  });
});

describe('Corporate Purchase Orders Page', () => {
  describe('Rendering', () => {
    it('should render purchase orders list', async () => {
      const { PurchaseOrderAPI } = require('@/lib/api/corporate');
      
      PurchaseOrderAPI.getOrders.mockResolvedValue([
        {
          id: 'po-1',
          poNumber: 'PO-2024-001',
          totalAmount: 50000,
          status: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString(),
          items: [],
        },
      ]);
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporatePurchaseOrdersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('PO-2024-001')).toBeInTheDocument();
        expect(screen.getByText(/৳50,000/)).toBeInTheDocument();
        expect(screen.getByText('PENDING_APPROVAL')).toBeInTheDocument();
      });
    });
  });

  describe('Order Management', () => {
    it('should create new purchase order', async () => {
      const user = userEvent.setup();
      const { PurchaseOrderAPI } = require('@/lib/api/corporate');
      
      PurchaseOrderAPI.getOrders.mockResolvedValue([]);
      PurchaseOrderAPI.createOrder.mockResolvedValue({
        id: 'new-po-id',
        poNumber: 'PO-2024-002',
        totalAmount: 25000,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        items: [],
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporatePurchaseOrdersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText(/Create PO|নতুন পিও তৈরি করুন/);
        expect(createButton).toBeInTheDocument();
      });
      
      const createButton = await screen.findByText(/Create PO|নতুন পিও তৈরি করুন/);
      await user.click(createButton);
      
      await waitFor(() => {
        expect(PurchaseOrderAPI.createOrder).toHaveBeenCalled();
      });
    });
  });
});

describe('Corporate Invoices Page', () => {
  describe('Rendering', () => {
    it('should render invoices list', async () => {
      const { InvoiceAPI } = require('@/lib/api/corporate');
      
      InvoiceAPI.getInvoices.mockResolvedValue([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-001',
          amount: 45000,
          vatAmount: 6750,
          totalAmount: 51750,
          status: 'PAID',
          dueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateInvoicesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
        expect(screen.getByText(/৳51,750/)).toBeInTheDocument();
        expect(screen.getByText('PAID')).toBeInTheDocument();
      });
    });
  });

  describe('Invoice Actions', () => {
    it('should download invoice PDF', async () => {
      const user = userEvent.setup();
      const { InvoiceAPI } = require('@/lib/api/corporate');
      
      InvoiceAPI.getInvoices.mockResolvedValue([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-001',
          amount: 45000,
          totalAmount: 51750,
          status: 'PAID',
          dueDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
      
      InvoiceAPI.downloadInvoice.mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }));
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateInvoicesPage />);
      
      await waitFor(() => {
        const downloadButton = screen.getByText(/Download|ডাউনলোড/);
        expect(downloadButton).toBeInTheDocument();
      });
      
      const downloadButton = await screen.findByText(/Download|ডাউনলোড/);
      await user.click(downloadButton);
      
      await waitFor(() => {
        expect(InvoiceAPI.downloadInvoice).toHaveBeenCalled();
      });
    });
  });
});

describe('Corporate Credit Page', () => {
  describe('Rendering', () => {
    it('should render credit limit information', async () => {
      const { CreditAPI } = require('@/lib/api/corporate');
      
      CreditAPI.getCreditLimit.mockResolvedValue({
        accountId: 'test-id',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        lastUpdated: new Date().toISOString(),
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateCreditPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Credit Limit/)).toBeInTheDocument();
        expect(screen.getByText(/৳100,000/)).toBeInTheDocument();
        expect(screen.getByText(/Used Credit/)).toBeInTheDocument();
        expect(screen.getByText(/৳25,000/)).toBeInTheDocument();
        expect(screen.getByText(/Available Credit/)).toBeInTheDocument();
        expect(screen.getByText(/৳75,000/)).toBeInTheDocument();
      });
    });
  });

  describe('Credit Request', () => {
    it('should submit credit increase request', async () => {
      const user = userEvent.setup();
      const { CreditAPI } = require('@/lib/api/corporate');
      
      CreditAPI.getCreditLimit.mockResolvedValue({
        accountId: 'test-id',
        creditLimit: 100000,
        usedCredit: 25000,
        availableCredit: 75000,
        lastUpdated: new Date().toISOString(),
      });
      
      CreditAPI.requestCreditIncrease.mockResolvedValue({
        id: 'credit-req-1',
        accountId: 'test-id',
        requestedLimit: 150000,
        requestedAmount: 50000,
        reason: 'Business expansion',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
      
      localStorage.setItem('corporate_account_id', 'test-id');
      
      render(<CorporateCreditPage />);
      
      await waitFor(() => {
        const requestButton = screen.getByText(/Request Increase|বৃদ্ধি অনুরোধ করুন/);
        expect(requestButton).toBeInTheDocument();
      });
      
      const requestButton = await screen.findByText(/Request Increase|বৃদ্ধি অনুরোধ করুন/);
      await user.click(requestButton);
      
      await waitFor(() => {
        expect(CreditAPI.requestCreditIncrease).toHaveBeenCalled();
      });
    });
  });
});

// Test utilities
const createMockFile = (name: string, type: string): File => {
  return new File(['test content'], name, { type });
};

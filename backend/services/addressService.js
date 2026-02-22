const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Bangladesh Division and District Mapping
 */
const BANGLADESH_DIVISIONS = {
  dhaka: {
    name: 'Dhaka',
    nameBn: 'ঢাকা',
    districts: [
      'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur',
      'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'
    ]
  },
  chittagong: {
    name: 'Chittagong',
    nameBn: 'চট্টগ্রাম',
    districts: [
      'Bandarban', 'Brahmanbaria', 'Chandpur', 'Chittagong', 'Comilla', 'Coxs Bazar',
      'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'
    ]
  },
  khulna: {
    name: 'Khulna',
    nameBn: 'খুলনা',
    districts: [
      'Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Khulna', 'Kushtia',
      'Magura', 'Meherpur', 'Narail', 'Satkhira'
    ]
  },
  rajshahi: {
    name: 'Rajshahi',
    nameBn: 'রাজশাহী',
    districts: [
      'Bogra', 'Jaipurhat', 'Naogaon', 'Natore', 'Nawabganj', 'Pabna', 'Rajshahi', 'Sirajganj'
    ]
  },
  sylhet: {
    name: 'Sylhet',
    nameBn: 'সিলেট',
    districts: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet']
  },
  barishal: {
    name: 'Barishal',
    nameBn: 'বরিশাল',
    districts: ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur']
  },
  rangpur: {
    name: 'Rangpur',
    nameBn: 'রংপুর',
    districts: ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon']
  },
  mymensingh: {
    name: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    districts: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur']
  }
};

/**
 * Get available address types
 * @returns {Array} Array of address types
 */
const getAddressTypes = () => {
  return ['shipping', 'billing', 'home', 'work', 'other'];
};

/**
 * Validate Bangladesh phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} Validation result with isValid and error
 */
const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: true, error: null }; // Phone is optional
  }

  // Remove spaces and common separators
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Bangladesh phone number regex
  // Accepts: +8801XXXXXXXXX, 01XXXXXXXXX, or 1XXXXXXXXX
  const bdPhoneRegex = /^(?:\+880|0)?1[3-9]\d{8}$/;

  if (!bdPhoneRegex.test(cleanedPhone)) {
    return {
      isValid: false,
      error: {
        field: 'phone',
        message: 'Please enter a valid Bangladesh phone number',
        messageBn: 'অনুগ্রহ করে একটি সঠিক বাংলাদেশী ফোন নম্বর দিন'
      }
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate postal code
 * @param {string} postalCode - Postal code to validate
 * @returns {object} Validation result with isValid and error
 */
const validatePostalCode = (postalCode) => {
  if (!postalCode) {
    return { isValid: true, error: null }; // Postal code is optional
  }

  // Bangladesh postal code: 4 digits (1000-9999)
  const postalCodeRegex = /^\d{4}$/;

  if (!postalCodeRegex.test(postalCode)) {
    return {
      isValid: false,
      error: {
        field: 'postalCode',
        message: 'Postal code must be 4 digits',
        messageBn: 'পোস্টাল কোড ৪ সংখ্যার হতে হবে'
      }
    };
  }

  const code = parseInt(postalCode, 10);
  if (code < 1000 || code > 9999) {
    return {
      isValid: false,
      error: {
        field: 'postalCode',
        message: 'Invalid postal code',
        messageBn: 'অবৈধ পোস্টাল কোড'
      }
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate division
 * @param {string} division - Division to validate
 * @returns {object} Validation result with isValid and error
 */
const validateDivision = (division) => {
  if (!division) {
    return {
      isValid: false,
      error: {
        field: 'division',
        message: 'Division is required',
        messageBn: 'বিভাগ প্রয়োজন'
      }
    };
  }

  const normalizedDivision = division.toLowerCase();
  const validDivisions = Object.keys(BANGLADESH_DIVISIONS);

  if (!validDivisions.includes(normalizedDivision)) {
    return {
      isValid: false,
      error: {
        field: 'division',
        message: `Invalid division. Valid divisions are: ${validDivisions.join(', ')}`,
        messageBn: `অবৈধ বিভাগ। বৈধ বিভাগগুলো হলো: ${validDivisions.join(', ')}`
      }
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate district for given division
 * @param {string} district - District to validate
 * @param {string} division - Division that the district should belong to
 * @returns {object} Validation result with isValid and error
 */
const validateDistrict = (district, division) => {
  if (!district) {
    return {
      isValid: false,
      error: {
        field: 'district',
        message: 'District is required',
        messageBn: 'জেলা প্রয়োজন'
      }
    };
  }

  if (!division) {
    return { isValid: true, error: null }; // Skip district validation if division is not provided
  }

  const normalizedDivision = division.toLowerCase();
  const divisionData = BANGLADESH_DIVISIONS[normalizedDivision];

  if (!divisionData) {
    return { isValid: true, error: null }; // Skip if division is invalid (will be caught by validateDivision)
  }

  const validDistricts = divisionData.districts.map(d => d.toLowerCase());
  const normalizedDistrict = district.toLowerCase();

  if (!validDistricts.includes(normalizedDistrict)) {
    return {
      isValid: false,
      error: {
        field: 'district',
        message: `Invalid district for ${divisionData.name}. Valid districts are: ${divisionData.districts.join(', ')}`,
        messageBn: `${divisionData.nameBn} এর জন্য অবৈধ জেলা। বৈধ জেলাগুলো হলো: ${divisionData.districts.join(', ')}`
      }
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate address line
 * @param {string} addressLine - Address line to validate
 * @param {string} fieldName - Field name for error messages
 * @param {boolean} required - Whether the field is required
 * @returns {object} Validation result with isValid and error
 */
const validateAddressLine = (addressLine, fieldName, required = true) => {
  if (required && !addressLine) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: `${fieldName} is required`,
        messageBn: `${fieldName} প্রয়োজন`
      }
    };
  }

  if (addressLine) {
    if (required && addressLine.length < 3) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          message: `${fieldName} must be at least 3 characters`,
          messageBn: `${fieldName} অন্তত ৩ অক্ষরের হতে হবে`
        }
      };
    }

    if (addressLine.length > 100) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          message: `${fieldName} must not exceed 100 characters`,
          messageBn: `${fieldName} ১০০ অক্ষরের বেশি হতে পারবে না`
        }
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validate address type
 * @param {string} type - Address type to validate
 * @returns {object} Validation result with isValid and error
 */
const validateAddressType = (type) => {
  if (!type) {
    return { isValid: true, error: null }; // Type is optional, defaults to 'shipping'
  }

  const validTypes = getAddressTypes();
  const normalizedType = type.toLowerCase();

  if (!validTypes.includes(normalizedType)) {
    return {
      isValid: false,
      error: {
        field: 'type',
        message: `Invalid address type. Valid types are: ${validTypes.join(', ')}`,
        messageBn: `অবৈধ ঠিকানার ধরন। বৈধ ধরনগুলো হলো: ${validTypes.join(', ')}`
      }
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate Bangladesh address
 * @param {object} address - Address object to validate
 * @returns {object} Validation result with isValid, errors, and validated address
 */
const validateBangladeshAddress = (address) => {
  const errors = [];
  const validatedAddress = { ...address };

  // Validate address type
  const typeValidation = validateAddressType(address.type);
  if (!typeValidation.isValid) {
    errors.push(typeValidation.error);
  } else if (address.type) {
    validatedAddress.type = address.type.toLowerCase();
  }

  // Validate first name
  if (!address.firstName || address.firstName.trim().length === 0) {
    errors.push({
      field: 'firstName',
      message: 'First name is required',
      messageBn: 'নামের প্রথম অংশ প্রয়োজন'
    });
  } else if (address.firstName.length > 50) {
    errors.push({
      field: 'firstName',
      message: 'First name must not exceed 50 characters',
      messageBn: 'নামের প্রথম অংশ ৫০ অক্ষরের বেশি হতে পারবে না'
    });
  }

  // Validate last name
  if (!address.lastName || address.lastName.trim().length === 0) {
    errors.push({
      field: 'lastName',
      message: 'Last name is required',
      messageBn: 'নামের শেষ অংশ প্রয়োজন'
    });
  } else if (address.lastName.length > 50) {
    errors.push({
      field: 'lastName',
      message: 'Last name must not exceed 50 characters',
      messageBn: 'নামের শেষ অংশ ৫০ অক্ষরের বেশি হতে পারবে না'
    });
  }

  // Validate phone
  const phoneValidation = validatePhone(address.phone);
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.error);
  }

  // Validate address line 1
  const addressLine1Validation = validateAddressLine(address.address, 'address', true);
  if (!addressLine1Validation.isValid) {
    errors.push(addressLine1Validation.error);
  }

  // Validate address line 2 (optional)
  const addressLine2Validation = validateAddressLine(address.addressLine2, 'addressLine2', false);
  if (!addressLine2Validation.isValid) {
    errors.push(addressLine2Validation.error);
  }

  // Validate city
  if (!address.city || address.city.trim().length === 0) {
    errors.push({
      field: 'city',
      message: 'City is required',
      messageBn: 'শহর প্রয়োজন'
    });
  } else if (address.city.length > 50) {
    errors.push({
      field: 'city',
      message: 'City must not exceed 50 characters',
      messageBn: 'শহর ৫০ অক্ষরের বেশি হতে পারবে না'
    });
  }

  // Validate district
  const districtValidation = validateDistrict(address.district, address.division);
  if (!districtValidation.isValid) {
    errors.push(districtValidation.error);
  }

  // Validate division
  const divisionValidation = validateDivision(address.division);
  if (!divisionValidation.isValid) {
    errors.push(divisionValidation.error);
  } else {
    validatedAddress.division = address.division.toLowerCase();
  }

  // Validate upazila (optional)
  if (address.upazila && address.upazila.length > 50) {
    errors.push({
      field: 'upazila',
      message: 'Upazila must not exceed 50 characters',
      messageBn: 'উপজেলা ৫০ অক্ষরের বেশি হতে পারবে না'
    });
  }

  // Validate postal code
  const postalCodeValidation = validatePostalCode(address.postalCode);
  if (!postalCodeValidation.isValid) {
    errors.push(postalCodeValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedAddress
  };
};

/**
 * Get addresses for checkout filtered by type
 * @param {string} userId - User ID
 * @param {string} addressType - Address type filter
 * @returns {Promise<Array>} Array of addresses
 */
const getAddressesForCheckout = async (userId, addressType) => {
  const where = { userId };

  if (addressType) {
    const normalizedType = addressType.toLowerCase();
    const validTypes = getAddressTypes();

    if (!validTypes.includes(normalizedType)) {
      throw new Error(`Invalid address type: ${addressType}`);
    }

    where.type = normalizedType;
  }

  const addresses = await prisma.address.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Add validation status to each address
  return addresses.map(address => ({
    ...address,
    validationStatus: getValidationStatus(address)
  }));
};

/**
 * Get validation status for an address
 * @param {object} address - Address object
 * @returns {object} Validation status
 */
const getValidationStatus = (address) => {
  const validation = validateBangladeshAddress(address);
  return {
    isValid: validation.isValid,
    errors: validation.errors
  };
};

/**
 * Create address for checkout
 * @param {string} userId - User ID
 * @param {object} addressData - Address data
 * @returns {Promise<object>} Created address
 */
const createAddressForCheckout = async (userId, addressData) => {
  // Validate address
  const validation = validateBangladeshAddress(addressData);
  if (!validation.isValid) {
    const error = new Error('Address validation failed');
    error.validationErrors = validation.errors;
    throw error;
  }

  const { validatedAddress } = validation;

  // If isDefault is true, set all other addresses of same type to false
  if (validatedAddress.isDefault === true) {
    const whereClause = { userId };
    if (validatedAddress.type) {
      whereClause.type = validatedAddress.type;
    }

    await prisma.address.updateMany({
      where: whereClause,
      data: { isDefault: false }
    });
  }

  // Create address
  const newAddress = await prisma.address.create({
    data: {
      userId,
      ...validatedAddress,
      type: validatedAddress.type || 'shipping'
    }
  });

  return {
    ...newAddress,
    validationStatus: { isValid: true, errors: [] }
  };
};

/**
 * Update address for checkout
 * @param {string} userId - User ID
 * @param {string} addressId - Address ID
 * @param {object} addressData - Address data to update
 * @returns {Promise<object>} Updated address
 */
const updateAddressForCheckout = async (userId, addressId, addressData) => {
  // Check if address exists and belongs to user
  const existingAddress = await prisma.address.findUnique({
    where: { id: addressId }
  });

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  if (existingAddress.userId !== userId) {
    throw new Error('Access denied');
  }

  // Merge existing address with updates
  const mergedAddress = { ...existingAddress, ...addressData };

  // Validate merged address
  const validation = validateBangladeshAddress(mergedAddress);
  if (!validation.isValid) {
    const error = new Error('Address validation failed');
    error.validationErrors = validation.errors;
    throw error;
  }

  const { validatedAddress } = validation;

  // If isDefault is true, set all other addresses of same type to false
  if (validatedAddress.isDefault === true) {
    const whereClause = { userId, NOT: { id: addressId } };
    if (validatedAddress.type) {
      whereClause.type = validatedAddress.type;
    }

    await prisma.address.updateMany({
      where: whereClause,
      data: { isDefault: false }
    });
  }

  // Update address
  const updatedAddress = await prisma.address.update({
    where: { id: addressId },
    data: validatedAddress
  });

  return {
    ...updatedAddress,
    validationStatus: { isValid: true, errors: [] }
  };
};

/**
 * Set default address by type
 * @param {string} userId - User ID
 * @param {string} addressId - Address ID
 * @param {string} addressType - Address type
 * @returns {Promise<object>} Updated address
 */
const setDefaultAddress = async (userId, addressId, addressType) => {
  // Validate address type
  const validTypes = getAddressTypes();
  const normalizedType = addressType.toLowerCase();

  if (!validTypes.includes(normalizedType)) {
    throw new Error(`Invalid address type: ${addressType}`);
  }

  // Check if address exists and belongs to user
  const existingAddress = await prisma.address.findUnique({
    where: { id: addressId }
  });

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  if (existingAddress.userId !== userId) {
    throw new Error('Access denied');
  }

  // Set all other addresses of same type to false
  await prisma.address.updateMany({
    where: {
      userId,
      type: normalizedType,
      NOT: { id: addressId }
    },
    data: { isDefault: false }
  });

  // Set this address as default
  const updatedAddress = await prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true }
  });

  return updatedAddress;
};

/**
 * Get address by ID with ownership verification
 * @param {string} addressId - Address ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Address object
 */
const getAddressById = async (addressId, userId) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId }
  });

  if (!address) {
    throw new Error('Address not found');
  }

  if (address.userId !== userId) {
    throw new Error('Access denied');
  }

  return {
    ...address,
    validationStatus: getValidationStatus(address)
  };
};

/**
 * Delete address with ownership verification
 * @param {string} addressId - Address ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const deleteAddress = async (addressId, userId) => {
  // Check if address exists and belongs to user
  const existingAddress = await prisma.address.findUnique({
    where: { id: addressId },
    include: {
      _count: {
        select: {
          orders: true
        }
      }
    }
  });

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  if (existingAddress.userId !== userId) {
    throw new Error('Access denied');
  }

  // Check if address is used in orders
  if (existingAddress._count.orders > 0) {
    throw new Error('Cannot delete address that is used in orders');
  }

  await prisma.address.delete({
    where: { id: addressId }
  });
};

/**
 * Get user addresses with filtering and pagination
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Addresses with pagination info
 */
const getUserAddresses = async (userId, options = {}) => {
  const {
    type,
    page = 1,
    limit = 20
  } = options;

  const where = { userId };

  if (type) {
    const normalizedType = type.toLowerCase();
    const validTypes = getAddressTypes();

    if (!validTypes.includes(normalizedType)) {
      throw new Error(`Invalid address type: ${type}`);
    }

    where.type = normalizedType;
  }

  const skip = (page - 1) * limit;

  const [addresses, total] = await Promise.all([
    prisma.address.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.address.count({ where })
  ]);

  // Add validation status to each address
  const addressesWithValidation = addresses.map(address => ({
    ...address,
    validationStatus: getValidationStatus(address)
  }));

  return {
    addresses: addressesWithValidation,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getAddressTypes,
  validateBangladeshAddress,
  getAddressesForCheckout,
  createAddressForCheckout,
  updateAddressForCheckout,
  setDefaultAddress,
  getAddressById,
  deleteAddress,
  getUserAddresses,
  BANGLADESH_DIVISIONS
};

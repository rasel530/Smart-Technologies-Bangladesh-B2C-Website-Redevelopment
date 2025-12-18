export interface Division {
  id: string;
  name: string;
  nameBn: string;
}

export interface District {
  id: string;
  name: string;
  nameBn: string;
  divisionId: string;
}

export interface Upazila {
  id: string;
  name: string;
  nameBn: string;
  districtId: string;
}

export const divisions: Division[] = [
  { id: '1', name: 'Barishal', nameBn: 'বরিশাল' },
  { id: '2', name: 'Chattogram', nameBn: 'চট্টগ্রাম' },
  { id: '3', name: 'Dhaka', nameBn: 'ঢাকা' },
  { id: '4', name: 'Khulna', nameBn: 'খুলনা' },
  { id: '5', name: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
  { id: '6', name: 'Rajshahi', nameBn: 'রাজশাহী' },
  { id: '7', name: 'Rangpur', nameBn: 'রংপুর' },
  { id: '8', name: 'Sylhet', nameBn: 'সিলেট' }
];

export const districts: District[] = [
  // Barishal Division
  { id: '101', name: 'Barguna', nameBn: 'বরগুনা', divisionId: '1' },
  { id: '102', name: 'Barishal', nameBn: 'বরিশাল', divisionId: '1' },
  { id: '103', name: 'Bhola', nameBn: 'ভোলা', divisionId: '1' },
  { id: '104', name: 'Jhalokati', nameBn: 'ঝালকাঠি', divisionId: '1' },
  { id: '105', name: 'Patuakhali', nameBn: 'পটুয়াখালী', divisionId: '1' },
  { id: '106', name: 'Pirojpur', nameBn: 'পিরোজপুর', divisionId: '1' },
  
  // Chattogram Division
  { id: '201', name: 'Bandarban', nameBn: 'বান্দরবান', divisionId: '2' },
  { id: '202', name: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', divisionId: '2' },
  { id: '203', name: 'Chandpur', nameBn: 'চাঁদপুর', divisionId: '2' },
  { id: '204', name: 'Chattogram', nameBn: 'চট্টগ্রাম', divisionId: '2' },
  { id: '205', name: 'Cumilla', nameBn: 'কুমিল্লা', divisionId: '2' },
  { id: '206', name: "Cox's Bazar", nameBn: 'কক্সবাজার', divisionId: '2' },
  { id: '207', name: 'Feni', nameBn: 'ফেনী', divisionId: '2' },
  { id: '208', name: 'Khagrachari', nameBn: 'খাগড়াছড়ি', divisionId: '2' },
  { id: '209', name: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', divisionId: '2' },
  { id: '210', name: 'Noakhali', nameBn: 'নোয়াখালী', divisionId: '2' },
  { id: '211', name: 'Rangamati', nameBn: 'রাঙামাটি', divisionId: '2' },
  
  // Dhaka Division
  { id: '301', name: 'Dhaka', nameBn: 'ঢাকা', divisionId: '3' },
  { id: '302', name: 'Faridpur', nameBn: 'ফরিদপুর', divisionId: '3' },
  { id: '303', name: 'Gazipur', nameBn: 'গাজীপুর', divisionId: '3' },
  { id: '304', name: 'Gopalganj', nameBn: 'গোপালগঞ্জ', divisionId: '3' },
  { id: '305', name: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', divisionId: '3' },
  { id: '306', name: 'Madaripur', nameBn: 'মাদারীপুর', divisionId: '3' },
  { id: '307', name: 'Manikganj', nameBn: 'মানিকগঞ্জ', divisionId: '3' },
  { id: '308', name: 'Munshiganj', nameBn: 'মুন্সিগঞ্জ', divisionId: '3' },
  { id: '309', name: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', divisionId: '3' },
  { id: '310', name: 'Narsingdi', nameBn: 'নরসিংদী', divisionId: '3' },
  { id: '311', name: 'Rajbari', nameBn: 'রাজবাড়ী', divisionId: '3' },
  { id: '312', name: 'Shariatpur', nameBn: 'শরীয়তপুর', divisionId: '3' },
  { id: '313', name: 'Tangail', nameBn: 'টাঙ্গাইল', divisionId: '3' },
  
  // Khulna Division
  { id: '401', name: 'Bagerhat', nameBn: 'বাগেরহাট', divisionId: '4' },
  { id: '402', name: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', divisionId: '4' },
  { id: '403', name: 'Jashore', nameBn: 'যশোর', divisionId: '4' },
  { id: '404', name: 'Jhenaidah', nameBn: 'ঝিনাইদহ', divisionId: '4' },
  { id: '405', name: 'Khulna', nameBn: 'খুলনা', divisionId: '4' },
  { id: '406', name: 'Kushtia', nameBn: 'কুষ্টিয়া', divisionId: '4' },
  { id: '407', name: 'Magura', nameBn: 'মাগুরা', divisionId: '4' },
  { id: '408', name: 'Meherpur', nameBn: 'মেহেরপুর', divisionId: '4' },
  { id: '409', name: 'Narail', nameBn: 'নড়াইল', divisionId: '4' },
  { id: '410', name: 'Satkhira', nameBn: 'সাতক্ষীরা', divisionId: '4' },
  
  // Mymensingh Division
  { id: '501', name: 'Jamalpur', nameBn: 'জামালপুর', divisionId: '5' },
  { id: '502', name: 'Mymensingh', nameBn: 'ময়মনসিংহ', divisionId: '5' },
  { id: '503', name: 'Netrokona', nameBn: 'নেত্রকোনা', divisionId: '5' },
  { id: '504', name: 'Sherpur', nameBn: 'শেরপুর', divisionId: '5' },
  
  // Rajshahi Division
  { id: '601', name: 'Bogura', nameBn: 'বগুড়া', divisionId: '6' },
  { id: '602', name: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', divisionId: '6' },
  { id: '603', name: 'Joypurhat', nameBn: 'জয়পুরহাট', divisionId: '6' },
  { id: '604', name: 'Naogaon', nameBn: 'নওগাঁ', divisionId: '6' },
  { id: '605', name: 'Natore', nameBn: 'নাটোর', divisionId: '6' },
  { id: '606', name: 'Pabna', nameBn: 'পাবনা', divisionId: '6' },
  { id: '607', name: 'Rajshahi', nameBn: 'রাজশাহী', divisionId: '6' },
  { id: '608', name: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', divisionId: '6' },
  
  // Rangpur Division
  { id: '701', name: 'Dinajpur', nameBn: 'দিনাজপুর', divisionId: '7' },
  { id: '702', name: 'Gaibandha', nameBn: 'গাইবান্ধা', divisionId: '7' },
  { id: '703', name: 'Kurigram', nameBn: 'কুড়িগ্রাম', divisionId: '7' },
  { id: '704', name: 'Lalmonirhat', nameBn: 'লালমনিরহাট', divisionId: '7' },
  { id: '705', name: 'Nilphamari', nameBn: 'নীলফামারী', divisionId: '7' },
  { id: '706', name: 'Panchagarh', nameBn: 'পঞ্চগড়', divisionId: '7' },
  { id: '707', name: 'Rangpur', nameBn: 'রংপুর', divisionId: '7' },
  { id: '708', name: 'Thakurgaon', nameBn: 'ঠাকুরগাঁ', divisionId: '7' },
  
  // Sylhet Division
  { id: '801', name: 'Habiganj', nameBn: 'হবিগঞ্জ', divisionId: '8' },
  { id: '802', name: 'Moulvibazar', nameBn: 'মৌলভীবাজার', divisionId: '8' },
  { id: '803', name: 'Sunamganj', nameBn: 'সুনামগঞ্জ', divisionId: '8' },
  { id: '804', name: 'Sylhet', nameBn: 'সিলেট', divisionId: '8' }
];

// Sample upazilas for major districts (full list would be too long)
export const upazilas: Upazila[] = [
  // Dhaka District
  { id: '30101', name: 'Dhamrai', nameBn: 'ধামরাই', districtId: '301' },
  { id: '30102', name: 'Dohar', nameBn: 'দোহার', districtId: '301' },
  { id: '30103', name: 'Keraniganj', nameBn: 'কেরানীগঞ্জ', districtId: '301' },
  { id: '30104', name: 'Nawabganj', nameBn: 'নবাবগঞ্জ', districtId: '301' },
  { id: '30105', name: 'Savar', nameBn: 'সাভার', districtId: '301' },
  { id: '30106', name: 'Dhaka Sadar', nameBn: 'ঢাকা সদর', districtId: '301' },
  
  // Chattogram District
  { id: '20401', name: 'Anwara', nameBn: 'আনোয়ারা', districtId: '204' },
  { id: '20402', name: 'Banshkhali', nameBn: 'বাঁশখালী', districtId: '204' },
  { id: '20403', name: 'Boalkhali', nameBn: 'বোয়ালখালী', districtId: '204' },
  { id: '20404', name: 'Chattogram Sadar', nameBn: 'চট্টগ্রাম সদর', districtId: '204' },
  { id: '20405', name: 'Fatikchhari', nameBn: 'ফটিকছড়ি', districtId: '204' },
  { id: '20406', name: 'Hathazari', nameBn: 'হাটহাজারী', districtId: '204' },
  { id: '20407', name: 'Lohagara', nameBn: 'লোহাগাড়া', districtId: '204' },
  { id: '20408', name: 'Mirsharai', nameBn: 'মীরসরাই', districtId: '204' },
  { id: '20409', name: 'Patiya', nameBn: 'পটিয়া', districtId: '204' },
  { id: '20410', name: 'Rangunia', nameBn: 'রাঙ্গুনিয়া', districtId: '204' },
  { id: '20411', name: 'Raozan', nameBn: 'রাউজান', districtId: '204' },
  { id: '20412', name: 'Sandwip', nameBn: 'সন্দ্বীপ', districtId: '204' },
  { id: '20413', name: 'Satkania', nameBn: 'সাতকানিয়া', districtId: '204' },
  { id: '20414', name: 'Sitakunda', nameBn: 'সীতাকুণ্ড', districtId: '204' },
  
  // Cumilla District
  { id: '20501', name: 'Barura', nameBn: 'বরুড়া', districtId: '205' },
  { id: '20502', name: 'Brahmanpara', nameBn: 'ব্রাহ্মণপাড়া', districtId: '205' },
  { id: '20503', name: 'Burichang', nameBn: 'বুড়িচাং', districtId: '205' },
  { id: '20504', name: 'Chandina', nameBn: 'চান্দিনা', districtId: '205' },
  { id: '20505', name: 'Chauddagram', nameBn: 'চৌদ্দগ্রাম', districtId: '205' },
  { id: '20506', name: 'Daudkandi', nameBn: 'দাউদকান্দি', districtId: '205' },
  { id: '20507', name: 'Debidwar', nameBn: 'দেবীদ্বার', districtId: '205' },
  { id: '20508', name: 'Homna', nameBn: 'হোমনা', districtId: '205' },
  { id: '20509', name: 'Laksam', nameBn: 'লাকসাম', districtId: '205' },
  { id: '20510', name: 'Muradnagar', nameBn: 'মুরাদনগর', districtId: '205' },
  { id: '20511', name: 'Nangalkot', nameBn: 'নাঙ্গলকোট', districtId: '205' },
  { id: '20512', name: 'Cumilla Sadar', nameBn: 'কুমিল্লা সদর', districtId: '205' },
  { id: '20513', name: 'Titas', nameBn: 'তিতাস', districtId: '205' },
  
  // Gazipur District
  { id: '30301', name: 'Gazipur Sadar', nameBn: 'গাজীপুর সদর', districtId: '303' },
  { id: '30302', name: 'Kaliakair', nameBn: 'কালিয়াকৈর', districtId: '303' },
  { id: '30303', name: 'Kaliganj', nameBn: 'কালীগঞ্জ', districtId: '303' },
  { id: '30304', name: 'Kapasia', nameBn: 'কাপাসিয়া', districtId: '303' },
  { id: '30305', name: 'Sreepur', nameBn: 'শ্রীপুর', districtId: '303' },
  
  // Narayanganj District
  { id: '30901', name: 'Araihazar', nameBn: 'আড়াইহাজার', districtId: '309' },
  { id: '30902', name: 'Bandar', nameBn: 'বন্দর', districtId: '309' },
  { id: '30903', name: 'Narayanganj Sadar', nameBn: 'নারায়ণগঞ্জ সদর', districtId: '309' },
  { id: '30904', name: 'Rupganj', nameBn: 'রূপগঞ্জ', districtId: '309' },
  { id: '30905', name: 'Sonargaon', nameBn: 'সোনারগাঁ', districtId: '309' },
  
  // Rajshahi District
  { id: '60701', name: 'Bagha', nameBn: 'বাঘা', districtId: '607' },
  { id: '60702', name: 'Bagmara', nameBn: 'বাগমারা', districtId: '607' },
  { id: '60703', name: 'Charghat', nameBn: 'চারঘাট', districtId: '607' },
  { id: '60704', name: 'Durgapur', nameBn: 'দুর্গাপুর', districtId: '607' },
  { id: '60705', name: 'Godagari', nameBn: 'গোদাগাড়ী', districtId: '607' },
  { id: '60706', name: 'Mohanpur', nameBn: 'মোহনপুর', districtId: '607' },
  { id: '60707', name: 'Paba', nameBn: 'পবা', districtId: '607' },
  { id: '60708', name: 'Puthia', nameBn: 'পুঠিয়া', districtId: '607' },
  { id: '60709', name: 'Rajshahi Sadar', nameBn: 'রাজশাহী সদর', districtId: '607' },
  { id: '60710', name: 'Tanore', nameBn: 'তানোর', districtId: '607' }
];

// Helper functions to get data
export const getDistrictsByDivision = (divisionId: string): District[] => {
  return districts.filter(district => district.divisionId === divisionId);
};

export const getUpazilasByDistrict = (districtId: string): Upazila[] => {
  return upazilas.filter(upazila => upazila.districtId === districtId);
};

export const getDivisionById = (id: string): Division | undefined => {
  return divisions.find(division => division.id === id);
};

export const getDistrictById = (id: string): District | undefined => {
  return districts.find(district => district.id === id);
};

export const getUpazilaById = (id: string): Upazila | undefined => {
  return upazilas.find(upazila => upazila.id === id);
};
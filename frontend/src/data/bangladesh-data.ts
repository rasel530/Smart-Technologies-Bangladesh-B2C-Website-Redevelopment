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
  // Barishal Division
  { id: '10101', name: 'Amtali', nameBn: 'আমতলী', districtId: '101' },
  { id: '10102', name: 'Babuganj', nameBn: 'বাবুগঞ্জ', districtId: '101' },
  { id: '10103', name: 'Bakerganj', nameBn: 'বাকেরগঞ্জ', districtId: '101' },
  { id: '10104', name: 'Barguna Sadar', nameBn: 'বরগুনা সদর', districtId: '101' },
  { id: '10105', name: 'Betagi', nameBn: 'বেতাগী', districtId: '101' },
  { id: '10106', name: 'Bamna', nameBn: 'বামনা', districtId: '101' },
  { id: '10107', name: 'Patharghata', nameBn: 'পাঠরঘাটা', districtId: '101' },
  { id: '10108', name: 'Pirojpur Sadar', nameBn: 'পিরোজপুর সদর', districtId: '101' },
  { id: '10109', name: 'Taltali', nameBn: 'তালতলী', districtId: '101' },
  { id: '10110', name: 'Muladi', nameBn: 'মুলাদী', districtId: '101' },
  
  // Barishal District
  { id: '10201', name: 'Banaripara', nameBn: 'বানারীপাড়া', districtId: '102' },
  { id: '10202', name: 'Babuganj', nameBn: 'বাবুগঞ্জ', districtId: '102' },
  { id: '10203', name: 'Hizla', nameBn: 'হিজলা', districtId: '102' },
  { id: '10204', name: 'Muladi', nameBn: 'মুলাদী', districtId: '102' },
  { id: '10205', name: 'Mehendiganj', nameBn: 'মেহেন্দীগঞ্জ', districtId: '102' },
  { id: '10206', name: 'Wazirpur', nameBn: 'ওয়াজীরপুর', districtId: '102' },
  { id: '10207', name: 'Jhalokati Sadar', nameBn: 'ঝালকাঠি সদর', districtId: '102' },
  { id: '10208', name: 'Kathalia', nameBn: 'কাঠালিয়া', districtId: '102' },
  { id: '10209', name: 'Rajapur', nameBn: 'রাজাপুর', districtId: '102' },
  { id: '10210', name: 'Nalchity', nameBn: 'নলচিটি', districtId: '102' },
  
  // Bhola District
  { id: '10301', name: 'Bhola Sadar', nameBn: 'ভোলা সদর', districtId: '103' },
  { id: '10302', name: 'Burhanuddin', nameBn: 'বুরহানউদ্দিন', districtId: '103' },
  { id: '10303', name: 'Tazumuddin', nameBn: 'তাজুমুদ্দিন', districtId: '103' },
  { id: '10304', name: 'Lalmohan', nameBn: 'লালমোহন', districtId: '103' },
  { id: '10305', name: 'Charfasson', nameBn: 'চরফাসন', districtId: '103' },
  { id: '10306', name: 'Daulatkhan', nameBn: 'দৌলতখান', districtId: '103' },
  { id: '10307', name: 'Monpura', nameBn: 'মনপুরা', districtId: '103' },
  
  // Jhalokati District
  { id: '10401', name: 'Jhalokati Sadar', nameBn: 'ঝালকাঠি সদর', districtId: '104' },
  { id: '10402', name: 'Kathalia', nameBn: 'কাঠালিয়া', districtId: '104' },
  { id: '10403', name: 'Rajapur', nameBn: 'রাজাপুর', districtId: '104' },
  { id: '10404', name: 'Nalchity', nameBn: 'নলচিটি', districtId: '104' },
  
  // Patuakhali District
  { id: '10501', name: 'Patuakhali Sadar', nameBn: 'পটুয়াখালী সদর', districtId: '105' },
  { id: '10502', name: 'Bauphal', nameBn: 'বাউফল', districtId: '105' },
  { id: '10503', name: 'Dashmina', nameBn: 'দশমিনা', districtId: '105' },
  { id: '10504', name: 'Galachipa', nameBn: 'গালাচিপা', districtId: '105' },
  { id: '10505', name: 'Kalapara', nameBn: 'কালাপাড়া', districtId: '105' },
  { id: '10506', name: 'Lalmohan', nameBn: 'লালমোহন', districtId: '105' },
  { id: '10507', name: 'Mirzaganj', nameBn: 'মির্জাগঞ্জ', districtId: '105' },
  { id: '10508', name: 'Dumki', nameBn: 'দুমকী', districtId: '105' },
  
  // Pirojpur District
  { id: '10601', name: 'Pirojpur Sadar', nameBn: 'পিরোজপুর সদর', districtId: '106' },
  { id: '10602', name: 'Bhandaria', nameBn: 'ভান্দারিয়া', districtId: '106' },
  { id: '10603', name: 'Kaukhali', nameBn: 'কাউখালী', districtId: '106' },
  { id: '10604', name: 'Mozampur', nameBn: 'মোজামপুর', districtId: '106' },
  { id: '10605', name: 'Nazirpur', nameBn: 'নাজিরপুর', districtId: '106' },
  { id: '10606', name: 'Indurkani', nameBn: 'ইন্দুরকানী', districtId: '106' },
  
  // Dhaka District
  { id: '30101', name: 'Dhamrai', nameBn: 'ধামরাই', districtId: '301' },
  { id: '30102', name: 'Dohar', nameBn: 'দোহার', districtId: '301' },
  { id: '30103', name: 'Keraniganj', nameBn: 'কেরানীগঞ্জ', districtId: '301' },
  { id: '30104', name: 'Nawabganj', nameBn: 'নবাবগঞ্জ', districtId: '301' },
  { id: '30105', name: 'Savar', nameBn: 'সাভার', districtId: '301' },
  { id: '30106', name: 'Dhaka Sadar', nameBn: 'ঢাকা সদর', districtId: '301' },
  
  // Faridpur District
  { id: '30201', name: 'Faridpur Sadar', nameBn: 'ফরিদপুর সদর', districtId: '302' },
  { id: '30202', name: 'Alfadanga', nameBn: 'আলফাডাঙ্গা', districtId: '302' },
  { id: '30203', name: 'Bhanga', nameBn: 'ভাঙ্গা', districtId: '302' },
  { id: '30204', name: 'Boalmari', nameBn: 'বোয়ালমারী', districtId: '302' },
  { id: '30205', name: 'Charbhadrasan', nameBn: 'চরভদ্রাসন', districtId: '302' },
  { id: '30206', name: 'Madhukhali', nameBn: 'মধুখালী', districtId: '302' },
  { id: '30207', name: 'Nagarkanda', nameBn: 'নগরকান্দা', districtId: '302' },
  { id: '30208', name: 'Sadarpur', nameBn: 'সদরপুর', districtId: '302' },
  { id: '30209', name: 'Saltha', nameBn: 'সালথা', districtId: '302' },
  
  // Gazipur District
  { id: '30301', name: 'Gazipur Sadar', nameBn: 'গাজীপুর সদর', districtId: '303' },
  { id: '30302', name: 'Kaliakair', nameBn: 'কালিয়াকৈর', districtId: '303' },
  { id: '30303', name: 'Kaliganj', nameBn: 'কালীগঞ্জ', districtId: '303' },
  { id: '30304', name: 'Kapasia', nameBn: 'কাপাসিয়া', districtId: '303' },
  { id: '30305', name: 'Sreepur', nameBn: 'শ্রীপুর', districtId: '303' },
  
  // Gopalganj District
  { id: '30401', name: 'Gopalganj Sadar', nameBn: 'গোপালগঞ্জ সদর', districtId: '304' },
  { id: '30402', name: 'Kashiani', nameBn: 'কাশিয়ানী', districtId: '304' },
  { id: '30403', name: 'Muksudpur', nameBn: 'মুকসুদপুর', districtId: '304' },
  { id: '30404', name: 'Tungipara', nameBn: 'টুঙীপাড়া', districtId: '304' },
  { id: '30405', name: 'Boalmari', nameBn: 'বোয়ালমারী', districtId: '304' },
  
  // Kishoreganj District
  { id: '30501', name: 'Kishoreganj Sadar', nameBn: 'কিশোরগঞ্জ সদর', districtId: '305' },
  { id: '30502', name: 'Bajitpur', nameBn: 'বাজিতপুর', districtId: '305' },
  { id: '30503', name: 'Bhairab', nameBn: 'ভৈরব', districtId: '305' },
  { id: '30504', name: 'Hossainpur', nameBn: 'হোসাইনপুর', districtId: '305' },
  { id: '30505', name: 'Itna', nameBn: 'ইটনা', districtId: '305' },
  { id: '30506', name: 'Karimganj', nameBn: 'করিমগঞ্জ', districtId: '305' },
  { id: '30507', name: 'Katiadi', nameBn: 'কাটিয়াদী', districtId: '305' },
  { id: '30508', name: 'Mithamain', nameBn: 'মিঠামইন', districtId: '305' },
  
  // Madaripur District
  { id: '30601', name: 'Madaripur Sadar', nameBn: 'মাদারীপুর সদর', districtId: '306' },
  { id: '30602', name: 'Rajoir', nameBn: 'রাজৈর', districtId: '306' },
  { id: '30603', name: 'Shibchar', nameBn: 'শিবচর', districtId: '306' },
  { id: '30604', name: 'Kalkini', nameBn: 'কালকিনী', districtId: '306' },
  
  // Manikganj District
  { id: '30701', name: 'Manikganj Sadar', nameBn: 'মানিকগঞ্জ সদর', districtId: '307' },
  { id: '30702', name: 'Saturia', nameBn: 'সাটুরিয়া', districtId: '307' },
  { id: '30703', name: 'Daulatpur', nameBn: 'দৌলতপুর', districtId: '307' },
  { id: '30704', name: 'Ghior', nameBn: 'ঘিওর', districtId: '307' },
  { id: '30705', name: 'Shivalaya', nameBn: 'শিবালয়া', districtId: '307' },
  { id: '30706', name: 'Harirampur', nameBn: 'হরিরামপুর', districtId: '307' },
  { id: '30707', name: 'Singair', nameBn: 'সিঙ্গাইর', districtId: '307' },
  
  // Munshiganj District
  { id: '30801', name: 'Munshiganj Sadar', nameBn: 'মুন্সিগঞ্জ সদর', districtId: '308' },
  { id: '30802', name: 'Sirajdikhan', nameBn: 'সিরাজদীখান', districtId: '308' },
  { id: '30803', name: 'Sreenagar', nameBn: 'শ্রীনগর', districtId: '308' },
  { id: '30804', name: 'Tongibari', nameBn: 'টঙ্গীবাড়ী', districtId: '308' },
  { id: '30805', name: 'Gazaria', nameBn: 'গাজারিয়া', districtId: '308' },
  { id: '30806', name: 'Louhajang', nameBn: 'লোহাজঞ্জ', districtId: '308' },
  
  // Narayanganj District
  { id: '30901', name: 'Araihazar', nameBn: 'আড়াইহাজার', districtId: '309' },
  { id: '30902', name: 'Bandar', nameBn: 'বন্দর', districtId: '309' },
  { id: '30903', name: 'Narayanganj Sadar', nameBn: 'নারায়ণগঞ্জ সদর', districtId: '309' },
  { id: '30904', name: 'Rupganj', nameBn: 'রূপগঞ্জ', districtId: '309' },
  { id: '30905', name: 'Sonargaon', nameBn: 'সোনারগাঁ', districtId: '309' },
  
  // Narsingdi District
  { id: '31001', name: 'Narsingdi Sadar', nameBn: 'নরসিংদী সদর', districtId: '310' },
  { id: '31002', name: 'Belabo', nameBn: 'বেলাবো', districtId: '310' },
  { id: '31003', name: 'Monohardi', nameBn: 'মনোহরদী', districtId: '310' },
  { id: '31004', name: 'Palash', nameBn: 'পলাশ', districtId: '310' },
  { id: '31005', name: 'Raipura', nameBn: 'রাইপুরা', districtId: '310' },
  { id: '31006', name: 'Shibpur', nameBn: 'শিবপুর', districtId: '310' },
  
  // Rajbari District
  { id: '31101', name: 'Rajbari Sadar', nameBn: 'রাজবাড়ী সদর', districtId: '311' },
  { id: '31102', name: 'Pangsha', nameBn: 'পাংশা', districtId: '311' },
  { id: '31103', name: 'Baliakandi', nameBn: 'বালিয়াকান্দী', districtId: '311' },
  { id: '31104', name: 'Kalukhali', nameBn: 'কালুখালী', districtId: '311' },
  { id: '31105', name: 'Goalanda', nameBn: 'গোলান্দা', districtId: '311' },
  
  // Shariatpur District
  { id: '31201', name: 'Shariatpur Sadar', nameBn: 'শরীয়তপুর সদর', districtId: '312' },
  { id: '31202', name: 'Naria', nameBn: 'নারিয়া', districtId: '312' },
  { id: '31203', name: 'Zanjira', nameBn: 'জাঞ্জিরা', districtId: '312' },
  { id: '31204', name: 'Bhedarganj', nameBn: 'ভেদারগঞ্জ', districtId: '312' },
  { id: '31205', name: 'Gosairhat', nameBn: 'গোসাইরহাট', districtId: '312' },
  { id: '31206', name: 'Damudya', nameBn: 'দামুদিয়া', districtId: '312' },
  
  // Tangail District
  { id: '31301', name: 'Tangail Sadar', nameBn: 'টাঙ্গাইল সদর', districtId: '313' },
  { id: '31302', name: 'Ghatail', nameBn: 'ঘাটাইল', districtId: '313' },
  { id: '31303', name: 'Kalihati', nameBn: 'কালিহাটী', districtId: '313' },
  { id: '31304', name: 'Madhupur', nameBn: 'মধুপুর', districtId: '313' },
  { id: '31305', name: 'Mirzapur', nameBn: 'মির্জাপুর', districtId: '313' },
  { id: '31306', name: 'Sakhipur', nameBn: 'সাখিপুর', districtId: '313' },
  { id: '31307', name: 'Basail', nameBn: 'বাসাইল', districtId: '313' },
  { id: '31308', name: 'Dhanbari', nameBn: 'ধনবাড়ী', districtId: '313' },
  { id: '31309', name: 'Nagarpur', nameBn: 'নগরপুর', districtId: '313' },
  { id: '31310', name: 'Delduar', nameBn: 'দেলদুয়ার', districtId: '313' },
  { id: '31311', name: 'Bhuapur', nameBn: 'ভুয়াপুর', districtId: '313' },
  { id: '31312', name: 'Ghior', nameBn: 'ঘিওর', districtId: '313' },
  
  // Bagerhat District
  { id: '40101', name: 'Bagerhat Sadar', nameBn: 'বাগেরহাট সদর', districtId: '401' },
  { id: '40102', name: 'Chitalmari', nameBn: 'চিতলমারী', districtId: '401' },
  { id: '40103', name: 'Fakirhat', nameBn: 'ফকিরহাট', districtId: '401' },
  { id: '40104', name: 'Bamna', nameBn: 'বামনা', districtId: '401' },
  { id: '40105', name: 'Mollahat', nameBn: 'মোল্লাহাট', districtId: '401' },
  { id: '40106', name: 'Morrelganj', nameBn: 'মোরেলগঞ্জ', districtId: '401' },
  { id: '40107', name: 'Sarail', nameBn: 'সরাইল', districtId: '401' },
  { id: '40108', name: 'Rampal', nameBn: 'রামপাল', districtId: '401' },
  { id: '40109', name: 'Morelganj', nameBn: 'মোরেলগঞ্জ', districtId: '401' },
  
  // Chuadanga District
  { id: '40201', name: 'Chuadanga Sadar', nameBn: 'চুয়াডাঙ্গা সদর', districtId: '402' },
  { id: '40202', name: 'Alamdanga', nameBn: 'আলামডাঙ্গা', districtId: '402' },
  { id: '40203', name: 'Damurhuda', nameBn: 'দামুরহুদা', districtId: '402' },
  { id: '40204', name: 'Jibannagar', nameBn: 'জীবননগর', districtId: '402' },
  
  // Jashore District
  { id: '40301', name: 'Jashore Sadar', nameBn: 'যশোর সদর', districtId: '403' },
  { id: '40302', name: 'Bagherpara', nameBn: 'বাঘেরপাড়া', districtId: '403' },
  { id: '40303', name: 'Chaugachha', nameBn: 'চৌগাছা', districtId: '403' },
  { id: '40304', name: 'Jhikargachha', nameBn: 'ঝিকরগাছা', districtId: '403' },
  { id: '40305', name: 'Keshabpur', nameBn: 'কেশবপুর', districtId: '403' },
  { id: '40306', name: 'Kotchandpur', nameBn: 'কোটচান্দপুর', districtId: '403' },
  { id: '40307', name: 'Manirampur', nameBn: 'মনিরামপুর', districtId: '403' },
  { id: '40308', name: 'Sailakupa', nameBn: 'শাইলাকুপা', districtId: '403' },
  
  // Jhenaidah District
  { id: '40401', name: 'Jhenaidah Sadar', nameBn: 'ঝিনাইদহ সদর', districtId: '404' },
  { id: '40402', name: 'Shailkupa', nameBn: 'শৈলকুপা', districtId: '404' },
  { id: '40403', name: 'Kaliganj', nameBn: 'কালিগঞ্জ', districtId: '404' },
  { id: '40404', name: 'Kotchandpur', nameBn: 'কোটচান্দপুর', districtId: '404' },
  { id: '40405', name: 'Harinakunda', nameBn: 'হরিনাকুন্দা', districtId: '404' },
  { id: '40406', name: 'Maheshpur', nameBn: 'মহেশপুর', districtId: '404' },
  
  // Khulna District
  { id: '40501', name: 'Khulna Sadar', nameBn: 'খুলনা সদর', districtId: '405' },
  { id: '40502', name: 'Batiaghata', nameBn: 'বাটিয়াঘাটা', districtId: '405' },
  { id: '40503', name: 'Dighalia', nameBn: 'দিঘালিয়া', districtId: '405' },
  { id: '40504', name: 'Dumuria', nameBn: 'দুমুরিয়া', districtId: '405' },
  { id: '40505', name: 'Dacope', nameBn: 'দাকোপে', districtId: '405' },
  { id: '40506', name: 'Paikgachha', nameBn: 'পাইকগাছা', districtId: '405' },
  { id: '40507', name: 'Phultala', nameBn: 'ফুলতলা', districtId: '405' },
  { id: '40508', name: 'Rupsha', nameBn: 'রূপশা', districtId: '405' },
  { id: '40509', name: 'Terokhada', nameBn: 'তেরখাড়া', districtId: '405' },
  
  // Kushtia District
  { id: '40601', name: 'Kushtia Sadar', nameBn: 'কুষ্টিয়া সদর', districtId: '406' },
  { id: '40602', name: 'Kumarkhali', nameBn: 'কুমারখালী', districtId: '406' },
  { id: '40603', name: 'Khoksa', nameBn: 'খোকসা', districtId: '406' },
  { id: '40604', name: 'Mirpur', nameBn: 'মীরপুর', districtId: '406' },
  { id: '40605', name: 'Daulatpur', nameBn: 'দৌলতপুর', districtId: '406' },
  { id: '40606', name: 'Bheramara', nameBn: 'ভেরামারা', districtId: '406' },
  
  // Magura District
  { id: '40701', name: 'Magura Sadar', nameBn: 'মাগুরা সদর', districtId: '407' },
  { id: '40702', name: 'Mohammadpur', nameBn: 'মোহাম্মদপুর', districtId: '407' },
  { id: '40703', name: 'Shalikha', nameBn: 'শালিখা', districtId: '407' },
  { id: '40704', name: 'Sreepur', nameBn: 'শ্রীপুর', districtId: '407' },
  
  // Meherpur District
  { id: '40801', name: 'Meherpur Sadar', nameBn: 'মেহেরপুর সদর', districtId: '408' },
  { id: '40802', name: 'Gangni', nameBn: 'গাঙ্গনী', districtId: '408' },
  { id: '40803', name: 'Shujanagar', nameBn: 'শুজানগর', districtId: '408' },
  
  // Narail District
  { id: '40901', name: 'Narail Sadar', nameBn: 'নড়াইল সদর', districtId: '409' },
  { id: '40902', name: 'Lohagara', nameBn: 'লোহাগাড়া', districtId: '409' },
  { id: '40903', name: 'Kalia', nameBn: 'কালিয়া', districtId: '409' },
  
  // Satkhira District
  { id: '41001', name: 'Satkhira Sadar', nameBn: 'সাতক্ষীরা সদর', districtId: '410' },
  { id: '41002', name: 'Assasuni', nameBn: 'আসাসুনী', districtId: '410' },
  { id: '41003', name: 'Kaliganj', nameBn: 'কালিগঞ্জ', districtId: '410' },
  { id: '41004', name: 'Debhata', nameBn: 'দেভহাটা', districtId: '410' },
  { id: '41005', name: 'Tala', nameBn: 'তালা', districtId: '410' },
  { id: '41006', name: 'Kolaroa', nameBn: 'কোলারোয়া', districtId: '410' },
  { id: '41007', name: 'Patkelghata', nameBn: 'পাটকেলঘাটা', districtId: '410' },
  { id: '41008', name: 'Kaligani', nameBn: 'কালিগানী', districtId: '410' },
  
  // Jamalpur District
  { id: '50101', name: 'Jamalpur Sadar', nameBn: 'জামালপুর সদর', districtId: '501' },
  { id: '50102', name: 'Melandaha', nameBn: 'মেলান্দাহা', districtId: '501' },
  { id: '50103', name: 'Islampur', nameBn: 'ইসলামপুর', districtId: '501' },
  { id: '50104', name: 'Sarishabari', nameBn: 'সরিশাবাড়ী', districtId: '501' },
  { id: '50105', name: 'Madarganj', nameBn: 'মাদারগঞ্জ', districtId: '501' },
  { id: '50106', name: 'Baksiganj', nameBn: 'বাকসীগঞ্জ', districtId: '501' },
  { id: '50107', name: 'Dewanganj', nameBn: 'দেওয়াগঞ্জ', districtId: '501' },
  
  // Mymensingh District
  { id: '50201', name: 'Mymensingh Sadar', nameBn: 'ময়মনসিংহ সদর', districtId: '502' },
  { id: '50202', name: 'Trishal', nameBn: 'ত্রিশাল', districtId: '502' },
  { id: '50203', name: 'Bhaluka', nameBn: 'ভালুকা', districtId: '502' },
  { id: '50204', name: 'Muktagachha', nameBn: 'মুক্তাগাছা', districtId: '502' },
  { id: '50205', name: 'Fulbaria', nameBn: 'ফুলবাড়িয়া', districtId: '502' },
  { id: '50206', name: 'Gaffargaon', nameBn: 'গফরগাঁও', districtId: '502' },
  { id: '50207', name: 'Haluaghat', nameBn: 'হালুয়াঘাট', districtId: '502' },
  { id: '50208', name: 'Dhobaura', nameBn: 'ধোবাউরা', districtId: '502' },
  
  // Netrokona District
  { id: '50301', name: 'Netrokona Sadar', nameBn: 'নেত্রকোনা সদর', districtId: '503' },
  { id: '50302', name: 'Kendua', nameBn: 'কেন্দুয়া', districtId: '503' },
  { id: '50303', name: 'Atpara', nameBn: 'আটপাড়া', districtId: '503' },
  { id: '50304', name: 'Barhatta', nameBn: 'বারহাট্টা', districtId: '503' },
  { id: '50305', name: 'Durgapur', nameBn: 'দুর্গাপুর', districtId: '503' },
  { id: '50306', name: 'Purbadhala', nameBn: 'পূর্বধলা', districtId: '503' },
  { id: '50307', name: 'Kalmakanda', nameBn: 'কালমাকান্দা', districtId: '503' },
  { id: '50308', name: 'Madan', nameBn: 'মাদন', districtId: '503' },
  { id: '50309', name: 'Gauripur', nameBn: 'গৌরীপুর', districtId: '503' },
  { id: '50310', name: 'Mohanganj', nameBn: 'মোহাগঞ্জ', districtId: '503' },
  
  // Sherpur District
  { id: '50401', name: 'Sherpur Sadar', nameBn: 'শেরপুর সদর', districtId: '504' },
  { id: '50402', name: 'Nakla', nameBn: 'নাকলা', districtId: '504' },
  { id: '50403', name: 'Sribardi', nameBn: 'শ্রীবাড়ী', districtId: '504' },
  { id: '50404', name: 'Nalitabari', nameBn: 'নলিতাবাড়ী', districtId: '504' },
  { id: '50405', name: 'Bhennagati', nameBn: 'ভেন্নাগতী', districtId: '504' },
  
  // Bogura District
  { id: '60101', name: 'Bogura Sadar', nameBn: 'বগুড়া সদর', districtId: '601' },
  { id: '60102', name: 'Shajahanpur', nameBn: 'শাজাহানপুর', districtId: '601' },
  { id: '60103', name: 'Sherpur', nameBn: 'শেরপুর', districtId: '601' },
  { id: '60104', name: 'Gabtali', nameBn: 'গাবতালী', districtId: '601' },
  { id: '60105', name: 'Sibganj', nameBn: 'শিবগঞ্জ', districtId: '601' },
  { id: '60106', name: 'Sonatala', nameBn: 'সোনাতলা', districtId: '601' },
  { id: '60107', name: 'Dupchanchia', nameBn: 'দুপচাঞ্চিয়া', districtId: '601' },
  { id: '60108', name: 'Dhunat', nameBn: 'ধুনাট', districtId: '601' },
  { id: '60109', name: 'Kahalu', nameBn: 'কাহালু', districtId: '601' },
  { id: '60110', name: 'Adamdighi', nameBn: 'আদমদীঘী', districtId: '601' },
  { id: '60111', name: 'Nandigram', nameBn: 'নন্দীগ্রাম', districtId: '601' },
  { id: '60112', name: 'Sahaganj', nameBn: 'সাহাগঞ্জ', districtId: '601' },
  
  // Chapainawabganj District
  { id: '60201', name: 'Shibganj', nameBn: 'শিবগঞ্জ', districtId: '602' },
  { id: '60202', name: 'Gomastapur', nameBn: 'গোমস্তাপুর', districtId: '602' },
  { id: '60203', name: 'Nachol', nameBn: 'নাচোল', districtId: '602' },
  { id: '60204', name: 'Bholahat', nameBn: 'ভোলাহাট', districtId: '602' },
  
  // Joypurhat District
  { id: '60301', name: 'Joypurhat Sadar', nameBn: 'জয়পুরহাট সদর', districtId: '603' },
  { id: '60302', name: 'Akkelpur', nameBn: 'আক্কেলপুর', districtId: '603' },
  { id: '60303', name: 'Kalukhali', nameBn: 'কালুখালী', districtId: '603' },
  { id: '60304', name: 'Khetlal', nameBn: 'খেতলাল', districtId: '603' },
  { id: '60305', name: 'Panchbibi', nameBn: 'পাঞ্চবিবী', districtId: '603' },
  
  // Naogaon District
  { id: '60401', name: 'Naogaon Sadar', nameBn: 'নওগাঁ সদর', districtId: '604' },
  { id: '60402', name: 'Atrai', nameBn: 'আত্রাই', districtId: '604' },
  { id: '60403', name: 'Manda', nameBn: 'মান্দা', districtId: '604' },
  { id: '60404', name: 'Mohadevpur', nameBn: 'মহাদেবপুর', districtId: '604' },
  { id: '60405', name: 'Badalgachhi', nameBn: 'বাদালগাছী', districtId: '604' },
  { id: '60406', name: 'Dhamoirhat', nameBn: 'ধামোইরহাট', districtId: '604' },
  { id: '60407', name: 'Niamatpur', nameBn: 'নিয়ামতপুর', districtId: '604' },
  { id: '60408', name: 'Patnitala', nameBn: 'পাটনীতলা', districtId: '604' },
  { id: '60409', name: 'Sapahar', nameBn: 'সাপাহার', districtId: '604' },
  { id: '60410', name: 'Raninagar', nameBn: 'রানীনগর', districtId: '604' },
  { id: '60411', name: 'Ullahpara', nameBn: 'উল্লাহাড়া', districtId: '604' },
  
  // Natore District
  { id: '60501', name: 'Natore Sadar', nameBn: 'নাটোর সদর', districtId: '605' },
  { id: '60502', name: 'Bagatipara', nameBn: 'বাগাটীপাড়া', districtId: '605' },
  { id: '60503', name: 'Lalpur', nameBn: 'লালপুর', districtId: '605' },
  { id: '60504', name: 'Baraigram', nameBn: 'বাড়াইগ্রাম', districtId: '605' },
  { id: '60505', name: 'Gurudaspur', nameBn: 'গুরুদাসপুর', districtId: '605' },
  { id: '60506', name: 'Singra', nameBn: 'সিংড়া', districtId: '605' },
  { id: '60507', name: 'Boraigram', nameBn: 'বোরাইগ্রাম', districtId: '605' },
  { id: '60508', name: 'Naldanga', nameBn: 'নালডাঙ্গা', districtId: '605' },
  
  // Pabna District
  { id: '60601', name: 'Pabna Sadar', nameBn: 'পাবনা সদর', districtId: '606' },
  { id: '60602', name: 'Sujanagar', nameBn: 'সুজানগর', districtId: '606' },
  { id: '60603', name: 'Ishwardi', nameBn: 'ইশ্বর্দী', districtId: '606' },
  { id: '60604', name: 'Bera', nameBn: 'বেরা', districtId: '606' },
  { id: '60605', name: 'Bhangura', nameBn: 'ভাঙ্গুরা', districtId: '606' },
  { id: '60606', name: 'Chatmohar', nameBn: 'চাটমোহার', districtId: '606' },
  { id: '60607', name: 'Faridpur', nameBn: 'ফরিদপুর', districtId: '606' },
  { id: '60608', name: 'Atgharia', nameBn: 'আটঘারিয়া', districtId: '606' },
  { id: '60609', name: 'Sathia', nameBn: 'সাথিয়া', districtId: '606' },
  { id: '60610', name: 'Pabna Sadar', nameBn: 'পাবনা সদর', districtId: '606' },
  
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
  { id: '60710', name: 'Tanore', nameBn: 'তানোর', districtId: '607' },
  
  // Sirajganj District
  { id: '60801', name: 'Sirajganj Sadar', nameBn: 'সিরাজগঞ্জ সদর', districtId: '608' },
  { id: '60802', name: 'Kazipur', nameBn: 'কাজীপুর', districtId: '608' },
  { id: '60803', name: 'Tarash', nameBn: 'তারাশ', districtId: '608' },
  { id: '60804', name: 'Shahjadpur', nameBn: 'শাহজাদপুর', districtId: '608' },
  { id: '60805', name: 'Raiganj', nameBn: 'রাইগঞ্জ', districtId: '608' },
  { id: '60806', name: 'Belkuchi', nameBn: 'বেলকুচী', districtId: '608' },
  { id: '60807', name: 'Kamarkhanda', nameBn: 'কামারখান্দা', districtId: '608' },
  { id: '60808', name: 'Ullapara', nameBn: 'উল্লাপাড়া', districtId: '608' },
  { id: '60809', name: 'Salanga', nameBn: 'সালাঙ্গা', districtId: '608' },
  
  // Dinajpur District
  { id: '70101', name: 'Dinajpur Sadar', nameBn: 'দিনাজপুর সদর', districtId: '701' },
  { id: '70102', name: 'Birganj', nameBn: 'বীরগঞ্জ', districtId: '701' },
  { id: '70103', name: 'Ghoraghat', nameBn: 'ঘোরাঘাট', districtId: '701' },
  { id: '70104', name: 'Chirirbandar', nameBn: 'চিরিরবন্দর', districtId: '701' },
  { id: '70105', name: 'Kaharole', nameBn: 'কাহারোল', districtId: '701' },
  { id: '70106', name: 'Bochaganj', nameBn: 'বোচাগঞ্জ', districtId: '701' },
  { id: '70107', name: 'Khetlal', nameBn: 'খেতলাল', districtId: '701' },
  { id: '70108', name: 'Fulbari', nameBn: 'ফুলবাড়ী', districtId: '701' },
  { id: '70109', name: 'Gobindaganj', nameBn: 'গোবিন্দাগঞ্জ', districtId: '701' },
  { id: '70110', name: 'Saidpur', nameBn: 'সাইদপুর', districtId: '701' },
  { id: '70111', name: 'Hakimpur', nameBn: 'হাকিমপুর', districtId: '701' },
  { id: '70112', name: 'Rampur', nameBn: 'রামপুর', districtId: '701' },
  { id: '70113', name: 'Birampur', nameBn: 'বীরামপুর', districtId: '701' },
  
  // Gaibandha District
  { id: '70201', name: 'Gaibandha Sadar', nameBn: 'গাইবান্ধা সদর', districtId: '702' },
  { id: '70202', name: 'Sundarganj', nameBn: 'সুন্দরগঞ্জ', districtId: '702' },
  { id: '70203', name: 'Gobindaganj', nameBn: 'গোবিন্দাগঞ্জ', districtId: '702' },
  { id: '70204', name: 'Palashbari', nameBn: 'পলাশবাড়ী', districtId: '702' },
  { id: '70205', name: 'Sadullapur', nameBn: 'সাদুল্লাপুর', districtId: '702' },
  { id: '70206', name: 'Phulchhari', nameBn: 'ফুলছড়ী', districtId: '702' },
  
  // Kurigram District
  { id: '70301', name: 'Kurigram Sadar', nameBn: 'কুড়িগ্রাম সদর', districtId: '703' },
  { id: '70302', name: 'Nageshwari', nameBn: 'নাগেশ্বারী', districtId: '703' },
  { id: '70303', name: 'Bhurungamari', nameBn: 'ভুরুঙ্গামারী', districtId: '703' },
  { id: '70304', name: 'Phulbari', nameBn: 'ফুলবাড়ী', districtId: '703' },
  { id: '70305', name: 'Rajibpur', nameBn: 'রাজীবপুর', districtId: '703' },
  { id: '70306', name: 'Chilmari', nameBn: 'চিলমারী', districtId: '703' },
  { id: '70307', name: 'Kurigram Sadar', nameBn: 'কুড়িগ্রাম সদর', districtId: '703' },
  { id: '70308', name: 'Nageshwari', nameBn: 'নাগেশ্বারী', districtId: '703' },
  { id: '70309', name: 'Ulipur', nameBn: 'উলীপুর', districtId: '703' },
  
  // Lalmonirhat District
  { id: '70401', name: 'Lalmonirhat Sadar', nameBn: 'লালমনিরহাট সদর', districtId: '704' },
  { id: '70402', name: 'Aditmari', nameBn: 'আদিতমারী', districtId: '704' },
  { id: '70403', name: 'Kaliganj', nameBn: 'কালিগঞ্জ', districtId: '704' },
  { id: '70404', name: 'Hatibandha', nameBn: 'হাটীবন্ধা', districtId: '704' },
  { id: '70405', name: 'Patgram', nameBn: 'পাটগ্রাম', districtId: '704' },
  
  // Nilphamari District
  { id: '70501', name: 'Nilphamari Sadar', nameBn: 'নীলফামারী সদর', districtId: '705' },
  { id: '70502', name: 'Dimla', nameBn: 'দিমলা', districtId: '705' },
  { id: '70503', name: 'Jaldhaka', nameBn: 'জলধাকা', districtId: '705' },
  { id: '70504', name: 'Chilahati', nameBn: 'চিলাহাটী', districtId: '705' },
  
  // Panchagarh District
  { id: '70601', name: 'Panchagarh Sadar', nameBn: 'পঞ্চগড় সদর', districtId: '706' },
  { id: '70602', name: 'Boda', nameBn: 'বোদা', districtId: '706' },
  { id: '70603', name: 'Debiganj', nameBn: 'দেবীগঞ্জ', districtId: '706' },
  { id: '70604', name: 'Tetulia', nameBn: 'তেতুলিয়া', districtId: '706' },
  
  // Rangpur District
  { id: '70701', name: 'Rangpur Sadar', nameBn: 'রংপুর সদর', districtId: '707' },
  { id: '70702', name: 'Badarganj', nameBn: 'বাদরগঞ্জ', districtId: '707' },
  { id: '70703', name: 'Pirganj', nameBn: 'পীরগঞ্জ', districtId: '707' },
  { id: '70704', name: 'Pirgachha', nameBn: 'পীরগাছা', districtId: '707' },
  { id: '70705', name: 'Gangachara', nameBn: 'গাঙ্গাছাড়া', districtId: '707' },
  { id: '70706', name: 'Taraganj', nameBn: 'তারাগঞ্জ', districtId: '707' },
  { id: '70707', name: 'Mithapukur', nameBn: 'মিঠাপুকুর', districtId: '707' },
  { id: '70708', name: 'Punargachha', nameBn: 'পুনারগাছা', districtId: '707' },
  
  // Thakurgaon District
  { id: '70801', name: 'Thakurgaon Sadar', nameBn: 'ঠাকুরগাঁ সদর', districtId: '708' },
  { id: '70802', name: 'Pirganj', nameBn: 'পীরগঞ্জ', districtId: '708' },
  { id: '70803', name: 'Ranisankail', nameBn: 'রানীসানকাইল', districtId: '708' },
  { id: '70804', name: 'Baliadangi', nameBn: 'বালিয়াদাঞ্গী', districtId: '708' },
  { id: '70805', name: 'Haripur', nameBn: 'হরিপুর', districtId: '708' },
  
  // Habiganj District
  { id: '80101', name: 'Habiganj Sadar', nameBn: 'হবিগঞ্জ সদর', districtId: '801' },
  { id: '80102', name: 'Ajmiriganj', nameBn: 'আজমীরীগঞ্জ', districtId: '801' },
  { id: '80103', name: 'Bhabaniganj', nameBn: 'ভাবানীগঞ্জ', districtId: '801' },
  { id: '80104', name: 'Chunarughat', nameBn: 'চুনারুঘাট', districtId: '801' },
  { id: '80105', name: 'Lakhai', nameBn: 'লাখাই', districtId: '801' },
  { id: '80106', name: 'Madhabpur', nameBn: 'মাধবপুর', districtId: '801' },
  { id: '80107', name: 'Nabiganj', nameBn: 'নবীগঞ্জ', districtId: '801' },
  { id: '80108', name: 'Shaistaganj', nameBn: 'শাইস্তাগঞ্জ', districtId: '801' },
  
  // Moulvibazar District
  { id: '80201', name: 'Moulvibazar Sadar', nameBn: 'মৌলভীবাজার সদর', districtId: '802' },
  { id: '80202', name: 'Barlekha', nameBn: 'বারলেখা', districtId: '802' },
  { id: '80203', name: 'Juri', nameBn: 'জুরী', districtId: '802' },
  { id: '80204', name: 'Kamalganj', nameBn: 'কামালগঞ্জ', districtId: '802' },
  { id: '80205', name: 'Kulaura', nameBn: 'কুলাউরা', districtId: '802' },
  { id: '80206', name: 'Rajnagar', nameBn: 'রাজনগর', districtId: '802' },
  { id: '80207', name: 'Sreemangal', nameBn: 'শ্রীমঙ্গল', districtId: '802' },
  
  // Sunamganj District
  { id: '80301', name: 'Sunamganj Sadar', nameBn: 'সুনামগঞ্জ সদর', districtId: '803' },
  { id: '80302', name: 'Dowarabazar', nameBn: 'দোয়ারাবাজার', districtId: '803' },
  { id: '80303', name: 'Derai', nameBn: 'দেরাই', districtId: '803' },
  { id: '80304', name: 'Jagannathpur', nameBn: 'জগন্নাথপুর', districtId: '803' },
  { id: '80305', name: 'Sulla', nameBn: 'সুল্লা', districtId: '803' },
  { id: '80306', name: 'South Sunamganj', nameBn: 'দক্ষিণ সুনামগঞ্জ', districtId: '803' },
  { id: '80307', name: 'Jamalganj', nameBn: 'জামালগঞ্জ', districtId: '803' },
  { id: '80308', name: 'Tahirpur', nameBn: 'তাহীরপুর', districtId: '803' },
  { id: '80309', name: 'Dharampasha', nameBn: 'ধরমপাশা', districtId: '803' },
  { id: '80310', name: 'Bajitpur', nameBn: 'বাজিতপুর', districtId: '803' },
  
  // Sylhet District
  { id: '80401', name: 'Sylhet Sadar', nameBn: 'সিলেট সদর', districtId: '804' },
  { id: '80402', name: 'Balaganj', nameBn: 'বালাগঞ্জ', districtId: '804' },
  { id: '80403', name: 'Beanibazar', nameBn: 'বিনীবাজার', districtId: '804' },
  { id: '80404', name: 'Bishwanath', nameBn: 'বিশ্বনাথ', districtId: '804' },
  { id: '80405', name: 'Dakshin Surma', nameBn: 'দক্ষিণ সুরমা', districtId: '804' },
  { id: '80406', name: 'Fenchuganj', nameBn: 'ফেঞ্চুগঞ্জ', districtId: '804' },
  { id: '80407', name: 'Golapganj', nameBn: 'গোলাপগঞ্জ', districtId: '804' },
  { id: '80408', name: 'Jaintiapur', nameBn: 'জৈন্তিয়াপুর', districtId: '804' },
  { id: '80409', name: 'Kanaighat', nameBn: 'কানাইঘাট', districtId: '804' },
  { id: '80410', name: 'Zakiganj', nameBn: 'জাকীগঞ্জ', districtId: '804' },
  { id: '80411', name: 'Osmaninagar', nameBn: 'ওসমানীনগর', districtId: '804' },
  { id: '80412', name: 'Companyganj', nameBn: 'কম্পানীগঞ্জ', districtId: '804' },
  { id: '80413', name: 'South Surma', nameBn: 'দক্ষিণ সুরমা', districtId: '804' },
  
  // Bandarban District
  { id: '21101', name: 'Bandarban Sadar', nameBn: 'বান্দরবান সদর', districtId: '211' },
  { id: '21102', name: 'Alikadam', nameBn: 'আলিকাদম', districtId: '211' },
  { id: '21103', name: 'Lama', nameBn: 'লামা', districtId: '211' },
  { id: '21104', name: 'Naikhongchhari', nameBn: 'নাইখংছড়ী', districtId: '211' },
  { id: '21105', name: 'Rowangchhari', nameBn: 'রোয়াংছড়ী', districtId: '211' },
  { id: '21106', name: 'Ruma', nameBn: 'রুমা', districtId: '211' },
  { id: '21107', name: 'Thanchi', nameBn: 'থাঞ্চী', districtId: '211' },
  
  // Brahmanbaria District
  { id: '20201', name: 'Brahmanbaria Sadar', nameBn: 'ব্রাহ্মণবাড়িয়া সদর', districtId: '202' },
  { id: '20202', name: 'Kasba', nameBn: 'কাসবা', districtId: '202' },
  { id: '20203', name: 'Nabinagar', nameBn: 'নবীনগর', districtId: '202' },
  { id: '20204', name: 'Nasirnagar', nameBn: 'নাসিরনগর', districtId: '202' },
  { id: '20205', name: 'Sarail', nameBn: 'সরাইল', districtId: '202' },
  { id: '20206', name: 'Ashuganj', nameBn: 'আশুগঞ্জ', districtId: '202' },
  { id: '20207', name: 'Bancharampur', nameBn: 'বাঞ্চারামপুর', districtId: '202' },
  { id: '20208', name: 'Bijoynagar', nameBn: 'বিজয়নগর', districtId: '202' },
  { id: '20209', name: 'Akhaura', nameBn: 'আখাউরা', districtId: '202' },
  
  // Chandpur District
  { id: '20301', name: 'Chandpur Sadar', nameBn: 'চাঁদপুর সদর', districtId: '203' },
  { id: '20302', name: 'Faridganj', nameBn: 'ফরিদগঞ্জ', districtId: '203' },
  { id: '20303', name: 'Hajiganj', nameBn: 'হাজীগঞ্জ', districtId: '203' },
  { id: '20304', name: 'Kachua', nameBn: 'কাছুয়া', districtId: '203' },
  { id: '20305', name: 'Shaharasti', nameBn: 'শাহারাস্তী', districtId: '203' },
  { id: '20306', name: 'Matlab', nameBn: 'মতলব', districtId: '203' },
  { id: '20307', name: 'Chandpur Sadar', nameBn: 'চাঁদপুর সদর', districtId: '203' },
  { id: '20308', name: 'Faridganj', nameBn: 'ফরিদগঞ্জ', districtId: '203' },
  { id: '20309', name: 'Hajiganj', nameBn: 'হাজীগঞ্জ', districtId: '203' },
  
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
  
  // Cox's Bazar District
  { id: '20601', name: 'Coxs Bazar Sadar', nameBn: 'কক্সবাজার সদর', districtId: '206' },
  { id: '20602', name: 'Chakaria', nameBn: 'চাকারিয়া', districtId: '206' },
  { id: '20603', name: 'Kutubdia', nameBn: 'কুতুবড়িয়া', districtId: '206' },
  { id: '20604', name: 'Maheshkhali', nameBn: 'মহেশখালী', districtId: '206' },
  { id: '20605', name: 'Pekua', nameBn: 'পেকুয়া', districtId: '206' },
  { id: '20606', name: 'Ramu', nameBn: 'রামু', districtId: '206' },
  { id: '20607', name: 'Ukhia', nameBn: 'উখিয়া', districtId: '206' },
  { id: '20608', name: 'Teknaf', nameBn: 'টেকনাফ', districtId: '206' },
  
  // Feni District
  { id: '20701', name: 'Feni Sadar', nameBn: 'ফেনী সদর', districtId: '207' },
  { id: '20702', name: 'Sonagazi', nameBn: 'সোনাগাজী', districtId: '207' },
  { id: '20703', name: 'Fulgazi', nameBn: 'ফুলগাজী', districtId: '207' },
  { id: '20704', name: 'Chhagalnaiya', nameBn: 'ছাগলনাইয়া', districtId: '207' },
  { id: '20705', name: 'Parshuram', nameBn: 'পারশুরাম', districtId: '207' },
  { id: '20706', name: 'Daganbhuiyan', nameBn: 'দাগনভুয়ান', districtId: '207' },
  
  // Khagrachari District
  { id: '20801', name: 'Khagrachari Sadar', nameBn: 'খাগড়াছড়ী সদর', districtId: '208' },
  { id: '20802', name: 'Dighinala', nameBn: 'দিঘীনালা', districtId: '208' },
  { id: '20803', name: 'Mahalchhari', nameBn: 'মহালছড়ী', districtId: '208' },
  { id: '20804', name: 'Ramgarh', nameBn: 'রামগড়হ', districtId: '208' },
  
  // Lakshmipur District
  { id: '20901', name: 'Lakshmipur Sadar', nameBn: 'লক্ষ্মীপুর সদর', districtId: '209' },
  { id: '20902', name: 'Raipur', nameBn: 'রাইপুর', districtId: '209' },
  { id: '20903', name: 'Ramgati', nameBn: 'রামগতী', districtId: '209' },
  { id: '20904', name: 'Ramganj', nameBn: 'রামগঞ্জ', districtId: '209' },
  
  // Noakhali District
  { id: '21001', name: 'Noakhali Sadar', nameBn: 'নোয়াখালী সদর', districtId: '210' },
  { id: '21002', name: 'Begumganj', nameBn: 'বেগমগঞ্জ', districtId: '210' },
  { id: '21003', name: 'Companiganj', nameBn: 'কম্পানীগঞ্জ', districtId: '210' },
  { id: '21004', name: 'Feni', nameBn: 'ফেনী', districtId: '210' },
  { id: '21005', name: 'Hatiya', nameBn: 'হাটিয়া', districtId: '210' },
  { id: '21006', name: 'Kabirhat', nameBn: 'কবীরহাট', districtId: '210' },
  { id: '21007', name: 'Senbagh', nameBn: 'সেনবাঘ', districtId: '210' },
  { id: '21008', name: 'Sonaimuri', nameBn: 'সোনাইমুরী', districtId: '210' },
  { id: '21009', name: 'Subarnachar', nameBn: 'সুবর্ণাচর', districtId: '210' },
  
  // Rangamati District
  { id: '21101', name: 'Rangamati Sadar', nameBn: 'রাঙামাটী সদর', districtId: '211' },
  { id: '21102', name: 'Rajnagar', nameBn: 'রাজনগর', districtId: '211' },
  { id: '21103', name: 'Kaukhali', nameBn: 'কাউখালী', districtId: '211' },
  { id: '21104', name: 'Jagannathpur', nameBn: 'জগন্নাথপুর', districtId: '211' },
  { id: '21105', name: 'Patiya', nameBn: 'পটিয়া', districtId: '211' },
  { id: '21106', name: 'Godagari', nameBn: 'গোদাগাড়ী', districtId: '211' },
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

// Helper functions to get ID by name (for converting backend names to frontend IDs)
export const getDivisionIdByName = (name: string): string | undefined => {
  const division = divisions.find(d =>
    d.name === name ||
    d.name.toUpperCase() === name.toUpperCase() ||
    d.name.toLowerCase() === name.toLowerCase()
  );
  return division?.id;
};

export const getDistrictIdByName = (name: string): string | undefined => {
  const district = districts.find(d =>
    d.name === name ||
    d.name.toUpperCase() === name.toUpperCase() ||
    d.name.toLowerCase() === name.toLowerCase()
  );
  return district?.id;
};

export const getUpazilaIdByName = (name: string): string | undefined => {
  const upazila = upazilas.find(u =>
    u.name === name ||
    u.name.toUpperCase() === name.toUpperCase() ||
    u.name.toLowerCase() === name.toLowerCase()
  );
  return upazila?.id;
};
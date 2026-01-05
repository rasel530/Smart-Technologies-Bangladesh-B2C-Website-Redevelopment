// Check phone number lengths
const examples = [
  '+880212345678',
  '0212345678',
  '+880311234567',
  '0311234567',
];

examples.forEach(phone => {
  const digits = phone.replace(/\+/g, '');
  console.log(`${phone}: ${phone.length} chars, ${digits.length} digits`);
});

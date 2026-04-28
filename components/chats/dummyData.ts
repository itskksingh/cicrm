export const conversations = [
  {
    id: 'LC-9921',
    name: 'Arjun Sharma',
    phone: '+91 98210 55678',
    priority: 'HOT',
    tag: 'PROCTOLOGY',
    lastMessage: 'When can I schedule the laser...',
    time: '10:42 AM',
    unread: true,
    location: 'Mumbai, MH',
    age: 42,
    gender: 'Male',
    problem: 'Acute Piles (Stage 3)',
    status: 'HOT LEAD',
    since: 'Oct 12, 2023',
    avatar: 'https://i.pravatar.cc/150?u=arjun'
  },
  {
    id: 'C-2',
    name: 'Priya Varma',
    phone: '+91 98210 11223',
    priority: 'COLD',
    tag: 'DERMATOLOGY',
    lastMessage: 'Thank you for the prescription...',
    time: '09:15 AM',
    unread: false,
    location: 'Pune, MH',
    avatar: 'https://i.pravatar.cc/150?u=priya'
  },
  {
    id: 'C-3',
    name: '+91 98765 43210',
    phone: '+91 98765 43210',
    priority: 'WARM',
    tag: 'ORTHOPEDICS',
    lastMessage: 'The knee pain has increased since...',
    time: 'Yesterday',
    unread: false,
    location: 'Delhi',
  },
  {
    id: 'C-4',
    name: 'Vikram Seth',
    phone: '+91 88888 77777',
    priority: 'COLD',
    tag: 'CARDIOLOGY',
    lastMessage: 'Attached are the blood report files.',
    time: 'Yesterday',
    unread: false,
    location: 'Bangalore',
    avatar: 'https://i.pravatar.cc/150?u=vikram'
  }
];

export const messages = [
  { id: 1, sender: 'bot', text: "Hello! I'm your Clinical Assistant. How can I help you today?", time: '10:30 AM' },
  { id: 2, sender: 'user', text: "I have been having severe pain for 3 days. I think I need a laser consultation.", time: '10:32 AM' },
  { id: 3, sender: 'staff', author: 'Dr. Amit (Clinical Lead)', text: "Based on your symptoms, we can schedule an urgent diagnostic today at 4 PM. Does that work?", time: '10:35 AM' },
  { id: 4, sender: 'user', text: "When can I schedule the laser procedure?", time: '10:42 AM' },
];

export const lead = conversations[0];

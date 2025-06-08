import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hireStaff } from '../../store/gameSlice';
import type { RootState } from '../../store';
import type { StaffMember } from '../../store/gameSlice';

interface HireStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_TEMPLATES = {
  'Pharmacist': {
    baseSalary: 120000,
    baseSkills: ['Medication Therapy Management', 'Immunization'],
    minExperience: 0,
    maxExperience: 20,
  },
  'Pharmacy Technician': {
    baseSalary: 45000,
    baseSkills: ['Inventory Management', 'Customer Service'],
    minExperience: 0,
    maxExperience: 15,
  },
  'Cashier': {
    baseSalary: 32000,
    baseSkills: ['Customer Service', 'Cash Handling'],
    minExperience: 0,
    maxExperience: 10,
  },
};

const HireStaffModal: React.FC<HireStaffModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { money } = useSelector((state: RootState) => state.game);
  
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLE_TEMPLATES>('Pharmacist');
  const [experience, setExperience] = useState<number>(0);
  const [schedule, setSchedule] = useState<{ [key: string]: boolean }>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateSalary = () => {
    const template = ROLE_TEMPLATES[selectedRole];
    const experienceMultiplier = 1 + (experience * 0.05); // 5% increase per year of experience
    return Math.round(template.baseSalary * experienceMultiplier);
  };

  const handleHire = () => {
    const template = ROLE_TEMPLATES[selectedRole];
    const salary = calculateSalary();

    if (salary > money) {
      alert('Insufficient funds to hire this staff member!');
      return;
    }

    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name: generateRandomName(),
      role: selectedRole,
      salary,
      experience,
      satisfaction: 90, // New hires start satisfied
      skills: [...template.baseSkills],
      schedule,
    };

    dispatch(hireStaff(newStaff));
    onClose();
  };

  const generateRandomName = () => {
    const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Emma'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Hire New Staff</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as keyof typeof ROLE_TEMPLATES)}
              className="w-full border rounded-lg p-2"
            >
              {Object.keys(ROLE_TEMPLATES).map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              min={ROLE_TEMPLATES[selectedRole].minExperience}
              max={ROLE_TEMPLATES[selectedRole].maxExperience}
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Schedule
            </label>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(schedule).map(([day, isWorking]) => (
                <div key={day} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </div>
                  <button
                    onClick={() => setSchedule(prev => ({
                      ...prev,
                      [day]: !prev[day],
                    }))}
                    className={`w-full h-8 rounded ${
                      isWorking
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isWorking ? '✓' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Annual Salary:</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(calculateSalary())}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Base salary + {experience} years of experience bonus
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLE_TEMPLATES[selectedRole].baseSkills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleHire}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={calculateSalary() > money}
            >
              Hire Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HireStaffModal; 
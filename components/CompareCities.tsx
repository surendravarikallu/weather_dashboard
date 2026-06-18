import React, { useState } from 'react';

export interface CompareCitiesProps {
  onCompare: (cityA: string, cityB: string) => void;
}

export const CompareCities: React.FC<CompareCitiesProps> = ({ onCompare }) => {
  const [cityA, setCityA] = useState('');
  const [cityB, setCityB] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityA && cityB) {
      onCompare(cityA, cityB);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 p-4 border rounded">
      <input value={cityA} onChange={e => setCityA(e.target.value)} placeholder="City A" className="border p-2" />
      <input value={cityB} onChange={e => setCityB(e.target.value)} placeholder="City B" className="border p-2" />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">Compare</button>
    </form>
  );
};

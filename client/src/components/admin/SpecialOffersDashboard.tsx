import React, { useState } from "react";

interface AdminProps {
  initialTitle: string;
  initialSubtitle: string;
  initialEndDate: string;
  onSave: (data: { title: string; subtitle: string; endDate: string }) => void;
}

const SpecialOffersDashboard: React.FC<AdminProps> = ({
  initialTitle,
  initialSubtitle,
  initialEndDate,
  onSave,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [endDate, setEndDate] = useState(initialEndDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, subtitle, endDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <div>
        <label className="block font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-700">Subtitle</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-700">End Date</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save
      </button>
    </form>
  );
};

export default SpecialOffersDashboard;

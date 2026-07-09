import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

interface Contact {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  sujet?: string;
  message?: string;
  created_at: string;
}

export const ContactsTable = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string>("");

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const data = await apiGet("/api/contacts");
        setContacts(data as Contact[]);
      } catch (error: any) {
        console.error("Error fetching contacts:", error.message);
      }
      setLoading(false);
    };

    fetchContacts();
  }, []);

  const getPreview = (text?: string) => {
    if (!text) return "-";
    const words = text.split(" ");
    return words.slice(0, 3).join(" ") + (words.length > 3 ? "..." : "");
  };

  const openMessageModal = (message: string) => {
    setSelectedMessage(message);
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Contacts</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sujet</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{contact.nom}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{contact.email}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{contact.telephone || "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{contact.sujet || "-"}</td>
                  <td
                    className="px-4 py-2 whitespace-nowrap cursor-pointer text-blue-600 hover:underline"
                    onClick={() => contact.message && openMessageModal(contact.message)}
                  >
                    {getPreview(contact.message)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                    >
                      Mail
                    </a>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-2 text-center text-gray-400">
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h3 className="text-lg font-bold mb-4">Message complet</h3>
            <p className="text-gray-700 mb-4">{selectedMessage}</p>
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              onClick={() => setModalOpen(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, uploadStorage } from '@/lib/api';

interface Conseil {
  id: number;
  title: string;
  content: string;
  image?: string;
  created_at?: string;
  categories?: string;
}

const ConseilManagement: React.FC = () => {
  const [conseils, setConseils] = useState<Conseil[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConseil, setEditingConseil] = useState<Conseil | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    image?: string;
    imageFile?: File;
  }>({
    title: '',
    content: '',
    image: '',
    imageFile: undefined
  });

  // Fetch conseils from the API
  const fetchConseils = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/conseils?sort=id&order=desc');
      setConseils(data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConseils();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    let imageUrl = formData.image || '';

    // Upload file if selected
    if (formData.imageFile) {
      try {
        const uploaded = await uploadStorage('conseils', formData.imageFile);
        imageUrl = uploaded.url;
      } catch (uploadError) {
        console.error(uploadError);
      }
    }

    try {
      if (editingConseil) {
        await apiPut(`/api/conseils/${editingConseil.id}`, { title: formData.title, content: formData.content, image: imageUrl });
      } else {
        await apiPost('/api/conseils', { title: formData.title, content: formData.content, image: imageUrl });
      }
    } catch (error) {
      console.error(error);
    }

    resetForm();
    fetchConseils();
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', image: '' });
    setEditingConseil(null);
    setShowModal(false);
  };

  const handleEdit = (conseil: Conseil) => {
    setEditingConseil(conseil);
    setFormData({
      title: conseil.title,
      content: conseil.content,
      image: conseil.image || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce conseil ?')) return;
    try {
      await apiDelete(`/api/conseils/${id}`);
      fetchConseils();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredConseils = conseils.filter(
    c =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Conseils</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter Conseil</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher un conseil..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-app-primary animate-spin mb-4" />
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filteredConseils.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {c.image && <img src={c.image} alt={c.title} className="w-full h-48 object-cover" />}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{c.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingConseil ? 'Modifier Conseil' : 'Ajouter Conseil'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenu</label>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData(prev => ({ ...prev, imageFile: e.target.files![0] }));
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all">
                  {editingConseil ? 'Mettre à Jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConseilManagement;

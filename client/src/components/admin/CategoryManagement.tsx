import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, uploadStorage } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

const CategoryManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // Form and modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    image?: string;
    imageFile?: File;
  }>({ name: '', description: '', image: '' });

  // Fetch categories with React Query
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await apiGet('/api/categories');
      return (data as Category[]).slice().sort((a, b) => b.id - a.id);
    },
  });

  // Upload image helper
  const uploadImage = async (file: File) => {
    const uploaded = await uploadStorage('categories', file);
    return uploaded.url;
  };

  // Add/Update category mutation
const saveCategory = useMutation({
  mutationFn: async (category: { name: string; description?: string; image?: string }) => {
    if (editingCategory) {
      const updated = await apiPut(`/api/categories/${editingCategory.id}`, category);
      return { ...category, ...updated, id: editingCategory.id };
    } else {
      const created = await apiPost('/api/categories', category);
      return created;
    }
  },
  onSuccess: (newCategory) => {
    queryClient.setQueryData(['categories'], (old: any) => {
      const safeOld = Array.isArray(old) ? old : [];
      if (editingCategory) {
        return safeOld.map((c: Category) => (c.id === newCategory.id ? newCategory : c));
      } else {
        return [newCategory, ...safeOld];
      }
    });
    toast.success(editingCategory ? 'Catégorie mise à jour !' : 'Catégorie ajoutée !');
    resetForm();
  },
  onError: (err: any) => {
    toast.error(`Erreur : ${err?.message || 'Action impossible'}`);
  },
});

  // Delete category mutation
const deleteCategory = useMutation({
  mutationFn: async (id: number) => {
    await apiDelete(`/api/categories/${id}`);
    return id;
  },
  onSuccess: (id) => {
    queryClient.setQueryData(['categories'], (old: any) =>
      old ? old.filter((c: Category) => c.id !== id) : []
    );
    toast.success('Catégorie supprimée avec succès !');
  },
  onError: (err: any) => {
    toast.error(`Erreur : ${err?.message || 'Erreur lors de la suppression de la catégorie'}`);
  },
});

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      let imageUrl = formData.image || '';
      if (formData.imageFile) imageUrl = await uploadImage(formData.imageFile);

      saveCategory.mutate({
        name: formData.name,
        description: formData.description,
        image: imageUrl,
      });
    } catch (err: any) {
      toast.error(`Erreur d'upload : ${err?.message || err}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', image: '' });
    setEditingCategory(null);
    setShowModal(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) deleteCategory.mutate(id);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Catégories</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter Catégorie</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-app-primary animate-spin mb-4" />
          <p className="text-gray-600 text-lg font-medium">Chargement en cours...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {cat.image && <img src={cat.image} alt={cat.name} className="w-full h-48 object-cover" />}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{cat.name}</h3>
                {cat.description && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{cat.description}</p>}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleEdit(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
              <h2 className="text-2xl font-bold text-gray-900">{editingCategory ? 'Modifier Catégorie' : 'Ajouter Catégorie'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la Catégorie</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image de la catégorie</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setFormData((prev) => ({ ...prev, imageFile: e.target.files![0] }));
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
                  {editingCategory ? 'Mettre à Jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;

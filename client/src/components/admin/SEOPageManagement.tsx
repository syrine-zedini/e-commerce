import React, { useState, useEffect } from 'react';
import { Plus, Edit, Search, Globe, Eye, EyeOff } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';

export interface SEOPage {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  content: string;
  isPublished: boolean;
  updated_at: string;
}

export const SEOPageManagement: React.FC = () => {
  const [seoPages, setSeoPages] = useState<SEOPage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<SEOPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    metaDescription: '',
    metaKeywords: '',
    content: '',
    isPublished: true,
  });

  useEffect(() => {
    fetchSEOPages();
  }, []);

  const fetchSEOPages = async () => {
    try {
      const data = await apiGet('/api/seo-pages');
      if (data) setSeoPages(data);
    } catch {
      // ignore, mirrors previous silent-fail behavior
    }
  };

  const filteredPages = seoPages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // NOTE: the backend/schema only supports slug, title, description and
    // isPublished — metaKeywords/content are kept as local-only UI state and
    // are not persisted (no matching DB columns exist).
    const payload = {
      slug: formData.slug,
      title: formData.title,
      description: formData.metaDescription,
      isPublished: formData.isPublished,
    };

    try {
      if (editingPage) {
        await apiPut(`/api/seo-pages/${editingPage.id}`, payload);
      } else {
        await apiPost('/api/seo-pages', payload);
      }
      fetchSEOPages();
    } catch {
      // ignore, mirrors previous silent-fail behavior
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      metaDescription: '',
      metaKeywords: '',
      content: '',
      isPublished: true,
    });
    setEditingPage(null);
    setShowModal(false);
  };

  const handleEdit = (page: SEOPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      metaDescription: page.metaDescription,
      metaKeywords: page.metaKeywords,
      content: page.content,
      isPublished: page.isPublished,
    });
    setShowModal(true);
  };

  const togglePublishStatus = async (pageId: string, isPublished: boolean) => {
    await apiPut(`/api/seo-pages/${pageId}`, { isPublished });
    fetchSEOPages();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Pages SEO</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter une page</span>
        </button>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher une page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des pages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière mise à jour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{page.metaDescription}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">/{page.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      page.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {page.isPublished ? <><Eye className="w-3 h-3 mr-1" />Publié</> : <><EyeOff className="w-3 h-3 mr-1" />Brouillon</>}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEdit(page)} className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => togglePublishStatus(page.id, !page.isPublished)}
                        className={`${page.isPublished ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {page.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajouter/Modifier */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPage ? 'Modifier la page SEO' : 'Ajouter une nouvelle page SEO'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Formulaire traduit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre de la page</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL (Slug)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description pour les moteurs de recherche (150-160 caractères)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="motclé1, motclé2, motclé3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contenu de la page (HTML)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="<h1>Titre de la page</h1><p>Contenu...</p>"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Publié</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  {editingPage ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

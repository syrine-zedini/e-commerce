import React, { useEffect, useState } from 'react';
import { Image, Type, MousePointer, Star } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ContentBlock } from '../../types';
import { apiGet, apiPost, apiPut, apiDelete, uploadStorage } from '@/lib/api';

export const ContentManagement: React.FC = () => {
  const { updateContentBlock } = useData();
  const [selectedPage, setSelectedPage] = useState('1'); // Default to home page
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageFormData, setPageFormData] = useState({
    name: '',
    slug: '',
    title: '',
    description: '',
  });
  const [formData, setFormData] = useState({
    type: 'text' as ContentBlock['type'],
    title: '',
    content: '',
    imageUrl: '',
    buttonText: '',
    buttonUrl: '',
  });
 const [galleryImages, setGalleryImages] = useState<{id: number, image_url: string}[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [editingImage, setEditingImage] = useState<{id: number, image_url: string} | null>(null);
  const pages = [
    { id: '1', name: 'Home Page', slug: 'home', title: 'Welcome to Our Store', description: 'Main landing page' },
    // { id: '2', name: 'About Page', slug: 'about', title: 'About Us', description: 'Company information' },
    // { id: '3', name: 'Contact Page', slug: 'contact', title: 'Contact Us', description: 'Contact information' },
    // { id: '4', name: 'Products Page', slug: 'products', title: 'Our Products', description: 'Product catalog' },
    // { id: '5', name: 'Services Page', slug: 'services', title: 'Our Services', description: 'Service offerings' },
    // { id: '6', name: 'Blog Page', slug: 'blog', title: 'Blog', description: 'Latest news and articles' },
    // { id: '7', name: 'FAQ Page', slug: 'faq', title: 'FAQ', description: 'Frequently asked questions' },
    // { id: '8', name: 'Privacy Policy', slug: 'privacy', title: 'Privacy Policy', description: 'Privacy policy page' },
    // { id: '9', name: 'Terms of Service', slug: 'terms', title: 'Terms of Service', description: 'Terms and conditions' },
    // { id: '10', name: 'Shipping Info', slug: 'shipping', title: 'Shipping Information', description: 'Shipping details' },
  ];

  const currentPage = pages.find(p => p.id === selectedPage);

  useEffect(() => {
    fetchGalleryImages();
  }, []);



const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // 1️⃣ Upload file to storage
  let publicUrl: string;
  try {
    const uploaded = await uploadStorage('sliders', file);
    publicUrl = uploaded.url;
  } catch (uploadError: any) {
    console.error('Error uploading file:', uploadError.message);
    return;
  }

  // 2️⃣ Insert into gallery_images table
  try {
    const created = await apiPost('/api/gallery-images', { image_url: publicUrl });
    setGalleryImages(prev => [...prev, created]);
  } catch (insertError: any) {
    console.error('Error saving image to DB:', insertError.message);
    return;
  }
};

  const fetchGalleryImages = async () => {
    try {
      const data = await apiGet('/api/gallery-images');
      setGalleryImages(data || []);
    } catch (error: any) {
      console.error('Error fetching images:', error.message);
    }
  };

  const addImage = async () => {
    if (!newImageUrl) return;

    try {
      const created = await apiPost('/api/gallery-images', { image_url: newImageUrl });
      setGalleryImages(prev => [...prev, created]);
      setNewImageUrl('');
    } catch (error: any) {
      console.error('Error adding image:', error.message);
    }
  };

  const updateImage = async (id: number) => {
    if (!editingImage) return;

    try {
      const updated = await apiPut(`/api/gallery-images/${id}`, { image_url: editingImage.image_url });
      setGalleryImages(prev => prev.map(img => (img.id === id ? updated : img)));
      setEditingImage(null);
    } catch (error: any) {
      console.error('Error updating image:', error.message);
    }
  };

  const deleteImage = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await apiDelete(`/api/gallery-images/${id}`);
      setGalleryImages(prev => prev.filter(img => img.id !== id));
    } catch (error: any) {
      console.error('Error deleting image:', error.message);
    }
  };



  const blockTypes = [
    { value: 'hero', label: 'Hero Section', icon: Image },
    { value: 'text', label: 'Text Block', icon: Type },
    { value: 'image', label: 'Image Block', icon: Image },
    { value: 'cta', label: 'Call to Action', icon: MousePointer },
    { value: 'features', label: 'Features Section', icon: Star },
    { value: 'testimonials', label: 'Testimonials', icon: Star },
    { value: 'gallery', label: 'Image Gallery', icon: Image },
    { value: 'video', label: 'Video Block', icon: Image },
    { value: 'contact', label: 'Contact Form', icon: MousePointer },
    { value: 'newsletter', label: 'Newsletter Signup', icon: MousePointer },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBlock) {
      updateContentBlock(editingBlock.id, formData);
    } else {
      // In a real app, this would create a new content block
      console.log('Creating new content block:', formData);
    }

    resetForm();
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPage) {
      // Update existing page
      console.log('Updating page:', editingPage.id, pageFormData);
    } else {
      // Create new page
      console.log('Creating new page:', pageFormData);
    }

    resetPageForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'text',
      title: '',
      content: '',
      imageUrl: '',
      buttonText: '',
      buttonUrl: '',
    });
    setEditingBlock(null);
    setShowModal(false);
  };

  const resetPageForm = () => {
    setPageFormData({
      name: '',
      slug: '',
      title: '',
      description: '',
    });
    setEditingPage(null);
    setShowPageModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion de Contenu</h1>
        {/* <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPageModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Page</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Content Block</span>
          </button>
        </div> */}
      </div>

      {/* Page Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Page:</label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>
          {currentPage && (
            <div className="flex items-center space-x-4">
              {/* <div className="text-sm text-gray-600">
                <span className="font-medium">URL:</span> /{currentPage.slug}
              </div> */}
              {/* <button
                onClick={() => handleEditPage(currentPage)}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Page</span>
              </button> */}
            </div>
          )}
        </div>
      </div>

      {/* Content Blocks */}
      <div className="space-y-4">
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
  <h2 className="text-xl font-bold mb-4"> Images </h2>

  <div className="flex space-x-2 mb-4">
     <input
    type="file"
    accept="image/*"
    onChange={handleFileChange}
    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
    {editingImage ? (
      <button
        onClick={() => editingImage && updateImage(editingImage.id)}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
      >
        Update
      </button>
    ) : (
      <button
        onClick={addImage}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Ajouter
      </button>
    )}
    {editingImage && (
      <button
        onClick={() => setEditingImage(null)}
        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
      >
        Cancel
      </button>
    )}
  </div>

  <div className="grid grid-cols-3 gap-4">
    {galleryImages.map((img) => (
      <div key={img.id} className="relative">
        <img src={img.image_url} alt={`Gallery ${img.id}`} className="w-full h-32 object-cover rounded" />
        <div className="absolute top-1 right-1 flex space-x-1">
          <button
            onClick={() => setEditingImage(img)}
            className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
          >
            Edit
          </button>
          <button
            onClick={() => deleteImage(img.id)}
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

      </div>

      {/* Add/Edit Content Block Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBlock ? 'Edit Content Block' : 'Add New Content Block'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContentBlock['type'] }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {blockTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {(formData.type === 'hero' || formData.type === 'image') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {(formData.type === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {(formData.type === 'hero' || formData.type === 'cta') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button URL
                    </label>
                    <input
                      type="url"
                      value={formData.buttonUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonUrl: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {(formData.type === 'newsletter' || formData.type === 'contact') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Action URL
                  </label>
                  <input
                    type="url"
                    value={formData.buttonUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, buttonUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-form-handler.com/submit"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  {editingBlock ? 'Update Block' : 'Add Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Page Modal */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              {/* <h2 className="text-2xl font-bold text-gray-900">
                {editingPage ? 'Edit Page' : 'Add New Page'}
              </h2> */}
            </div>

            <form onSubmit={handlePageSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Name
                  </label>
                  <input
                    type="text"
                    value={pageFormData.name}
                    onChange={(e) => setPageFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={pageFormData.slug}
                    onChange={(e) => setPageFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Title
                </label>
                <input
                  type="text"
                  value={pageFormData.title}
                  onChange={(e) => setPageFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={pageFormData.description}
                  onChange={(e) => setPageFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetPageForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  {editingPage ? 'Update Page' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
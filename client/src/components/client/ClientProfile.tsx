import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react';

export const ClientProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    // Récupérer l'utilisateur depuis localStorage
    const clientSession = localStorage.getItem('clientSession');
    if (clientSession) {
      const parsedUser = JSON.parse(clientSession);
      setUser(parsedUser);
      setFormData({
        name: parsedUser.nom + ' ' + parsedUser.prenom,
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        address: parsedUser.adresse || '',
      });
    }
  }, []);

  const handleSave = () => {
    console.log('Enregistrement du profil :', formData);
    setIsEditing(false);
    // Optionnel : mettre à jour localStorage ou appeler l'API
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.nom + ' ' + user.prenom,
        email: user.email || '',
        phone: user.phone || '',
        address: user.adresse || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier le Profil</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.nom} {user.prenom}</h2>
            <p className="text-gray-600 capitalize">{user.role || 'Client'}</p>
            <p className="text-sm text-gray-500">Membre depuis le {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Nom Complet
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{formData.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Adresse Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{formData.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Numéro de Téléphone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez votre numéro de téléphone"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{formData.phone || 'Non renseigné'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Adresse
            </label>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez votre adresse"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 min-h-[84px]">{formData.address || 'Non renseigné'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

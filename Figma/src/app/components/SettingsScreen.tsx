import { ArrowLeft, MapPin, Store, Bell, Heart, User, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const settings = [
  {
    category: 'Préférences d\'optimisation',
    items: [
      { label: 'Nombre max de magasins', value: '2', icon: Store },
      { label: 'Rayon de déplacement', value: '10 km', icon: MapPin },
    ],
  },
  {
    category: 'Épiceries favorites',
    items: [
      { label: 'Maxi', value: '', icon: Heart },
      { label: 'IGA', value: '', icon: Heart },
      { label: 'Super C', value: '', icon: Heart },
    ],
  },
  {
    category: 'Notifications',
    items: [
      { label: 'Nouvelles optimisations', value: 'Activées', icon: Bell },
      { label: 'Activité du groupe', value: 'Activées', icon: Bell },
      { label: 'Récompenses', value: 'Activées', icon: Bell },
    ],
  },
  {
    category: 'Compte',
    items: [
      { label: 'Profil', value: '', icon: User },
      { label: 'Déconnexion', value: '', icon: LogOut },
    ],
  },
];

export function SettingsScreen({ onNavigate, onBack, canGoBack }: SettingsScreenProps) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <motion.button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: 'rgb(229 231 235)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-gray-900">Paramètres</h1>
            <p className="text-gray-500 mt-1">Personnalisez votre expérience</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {settings.map((section, sectionIndex) => (
          <motion.div 
            key={section.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h2 className="text-gray-500 text-sm font-medium mb-3 px-2">
              {section.category}
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    className={`w-full px-4 py-4 flex items-center gap-4 transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    whileHover={{ backgroundColor: 'rgb(249 250 251)', x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div 
                      className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Icon className="w-5 h-5 text-gray-600" />
                    </motion.div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-900">{item.label}</p>
                      {item.value && (
                        <p className="text-gray-500 text-sm mt-1">{item.value}</p>
                      )}
                    </div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </motion.div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Dietary Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-gray-500 text-sm font-medium mb-3 px-2">
            Préférences alimentaires
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-2">
              {['Bio', 'Sans gluten', 'Végétarien', 'Halal', 'Local'].map((tag, index) => (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgb(187 247 208)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {tag}
                </motion.button>
              ))}
              <motion.button 
                className="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-full text-sm"
                whileHover={{ scale: 1.1, borderColor: 'rgb(156 163 175)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.75 }}
              >
                + Ajouter
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div 
          className="text-center py-4 space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-gray-500 text-sm">Version 1.0.0</p>
          <p className="text-gray-400 text-xs">© 2025 GroceryOptimizer</p>
        </motion.div>
      </div>
    </div>
  );
}
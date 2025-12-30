import { ArrowLeft, DollarSign, MapPin, Store, TrendingDown, Navigation, Building2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface OptimizationScreenProps {
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const options = [
  {
    id: 1,
    type: 'cost',
    title: 'Moins cher',
    icon: DollarSign,
    totalPrice: 28.99,
    savings: 5.75,
    stores: [
      { name: 'Maxi', items: 4, price: 18.50 },
      { name: 'Super C', items: 2, price: 10.49 },
    ],
    distance: '8.5 km',
    storeCount: 2,
    recommended: true,
    explanation: 'Économisez 5,75$ en visitant 2 magasins proches de chez vous',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
  },
  {
    id: 2,
    type: 'distance',
    title: 'Moins de distance',
    icon: Navigation,
    totalPrice: 31.24,
    savings: 3.50,
    stores: [
      { name: 'IGA', items: 5, price: 22.75 },
      { name: 'Maxi', items: 1, price: 8.49 },
    ],
    distance: '3.2 km',
    storeCount: 2,
    recommended: false,
    explanation: 'Minimisez vos déplacements avec seulement 3,2 km à parcourir',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
  },
  {
    id: 3,
    type: 'convenience',
    title: 'Moins de magasins',
    icon: Building2,
    totalPrice: 33.49,
    savings: 1.25,
    stores: [
      { name: 'Provigo', items: 6, price: 33.49 },
    ],
    distance: '4.8 km',
    storeCount: 1,
    recommended: false,
    explanation: 'Faites toutes vos courses en un seul arrêt',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-50 to-pink-50',
  },
];

export function OptimizationScreen({ onNavigate, onBack, canGoBack }: OptimizationScreenProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-2">
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
            <h1 className="text-gray-900">Meilleures options</h1>
            <p className="text-gray-500 mt-1">Pour votre panier de 6 produits</p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {options.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`bg-gradient-to-br ${option.bgGradient} rounded-3xl p-5 shadow-lg border-2 ${option.recommended ? 'border-green-400' : 'border-transparent'} cursor-pointer`}
            >
              {option.recommended && (
                <motion.div 
                  className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full mb-4 w-fit"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 15 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Recommandé</span>
                </motion.div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-md`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-gray-900">{option.title}</h2>
                    <p className="text-gray-600 text-sm mt-1">{option.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Price & Savings */}
              <motion.div 
                className="bg-white rounded-2xl p-4 mb-4"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Total</span>
                  <span className="text-gray-900">{option.totalPrice.toFixed(2)} $</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600">Économies</span>
                  <motion.span 
                    className="text-green-600"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ delay: index * 0.15 + 0.5, duration: 0.5 }}
                  >
                    -{option.savings.toFixed(2)} $
                  </motion.span>
                </div>
              </motion.div>

              {/* Store Details */}
              <div className="space-y-2 mb-4">
                {option.stores.map((store, storeIndex) => (
                  <motion.div 
                    key={storeIndex} 
                    className="bg-white bg-opacity-70 rounded-xl p-3 flex items-center justify-between"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 + storeIndex * 0.1 }}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', x: 5 }}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{store.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">{store.items} produits</p>
                      <p className="text-gray-900">{store.price.toFixed(2)} $</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{option.distance}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{option.storeCount} {option.storeCount > 1 ? 'magasins' : 'magasin'}</span>
                </div>
              </div>

              {/* CTA */}
              <motion.button 
                onClick={() => onNavigate('store')}
                className={`w-full bg-gradient-to-r ${option.gradient} text-white py-3 rounded-2xl shadow-lg`}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Choisir cette option
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
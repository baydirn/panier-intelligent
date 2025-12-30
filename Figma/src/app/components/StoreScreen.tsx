import { ArrowLeft, Store, MapPin, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface StoreScreenProps {
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const stores = [
  {
    name: 'Maxi',
    distance: '2.3 km',
    items: [
      { id: 1, name: 'Lait 2%', assignedTo: 'Paul', checked: true },
      { id: 2, name: 'Pain de blé entier', assignedTo: 'Paul', checked: true },
      { id: 3, name: 'Tomates', assignedTo: 'Marie', checked: false },
      { id: 4, name: 'Poulet', assignedTo: 'Marie', checked: false },
    ],
  },
  {
    name: 'Super C',
    distance: '6.2 km',
    items: [
      { id: 5, name: 'Yaourt grec', assignedTo: 'Sophie', checked: false },
      { id: 6, name: 'Bananes', assignedTo: 'Sophie', checked: false },
    ],
  },
];

export function StoreScreen({ onNavigate, onBack, canGoBack }: StoreScreenProps) {
  const totalItems = stores.reduce((sum, store) => sum + store.items.length, 0);
  const checkedItems = stores.reduce(
    (sum, store) => sum + store.items.filter(item => item.checked).length,
    0
  );
  const progress = (checkedItems / totalItems) * 100;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 pt-8 pb-6 text-white">
        <div className="flex items-center gap-4 mb-6">
          <motion.button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1>Mode Magasin</h1>
            <p className="text-white text-opacity-90 mt-1">
              {checkedItems} / {totalItems} produits
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
          <motion.div 
            className="bg-white h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Store Filter */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          <motion.button 
            className="px-4 py-2 bg-blue-500 text-white rounded-full whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Tous les magasins
          </motion.button>
          {stores.map((store, index) => (
            <motion.button 
              key={store.name}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full whitespace-nowrap"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: 'rgb(59 130 246)' }}
              whileTap={{ scale: 0.95 }}
            >
              {store.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Items by Store */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {stores.map((store, storeIndex) => (
          <motion.div 
            key={store.name} 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: storeIndex * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.div 
                className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"
                whileHover={{ rotate: 5, scale: 1.1 }}
              >
                <Store className="w-5 h-5 text-blue-600" />
              </motion.div>
              <div className="flex-1">
                <h2 className="text-gray-900">{store.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 text-sm">{store.distance}</span>
                </div>
              </div>
              <span className="text-gray-500 text-sm">
                {store.items.filter(i => i.checked).length}/{store.items.length}
              </span>
            </div>

            <div className="space-y-2">
              {store.items.map((item, itemIndex) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: storeIndex * 0.1 + itemIndex * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    item.checked 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <motion.button 
                    className="flex-shrink-0"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {item.checked ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </motion.button>
                  <div className="flex-1">
                    <h3 className={`${item.checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {item.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Assigné à {item.assignedTo}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Action */}
      <div className="p-6 bg-white border-t border-gray-200">
        <motion.button 
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl shadow-lg"
          whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Terminer les courses
        </motion.button>
      </div>
    </div>
  );
}
import { Plus, Users, Sparkles, Settings, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

const groceryItems = [
  { id: 1, name: 'Lait 2%', quantity: '2L', price: 5.49, category: 'Produits laitiers' },
  { id: 2, name: 'Pain de blé entier', quantity: '1 unité', price: 3.99, category: 'Boulangerie' },
  { id: 3, name: 'Tomates', quantity: '1kg', price: 4.99, category: 'Fruits & Légumes' },
  { id: 4, name: 'Poulet', quantity: '500g', price: 8.99, category: 'Viandes' },
  { id: 5, name: 'Yaourt grec', quantity: '750g', price: 5.29, category: 'Produits laitiers' },
  { id: 6, name: 'Bananes', quantity: '6 unités', price: 2.99, category: 'Fruits & Légumes' },
];

const members = [
  { name: 'Marie', color: 'bg-blue-500' },
  { name: 'Paul', color: 'bg-green-500' },
  { name: 'Sophie', color: 'bg-purple-500' },
];

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const totalPrice = groceryItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-gray-900">Ma liste d'épicerie</h1>
            <p className="text-gray-500 mt-1">6 produits · {totalPrice.toFixed(2)} $</p>
          </motion.div>
          <div className="flex gap-2">
            <motion.button 
              onClick={() => onNavigate('gamification')}
              className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"
              whileHover={{ scale: 1.1, backgroundColor: 'rgb(252 211 77)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Trophy className="w-5 h-5 text-amber-600" />
            </motion.button>
            <motion.button 
              onClick={() => onNavigate('settings')}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
              whileHover={{ scale: 1.1, backgroundColor: 'rgb(229 231 235)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Shared indicator */}
        <motion.div 
          onClick={() => onNavigate('collaborative')}
          className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer"
          whileHover={{ scale: 1.02, backgroundColor: 'rgb(219 234 254)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900">Liste partagée</span>
          </div>
          <div className="flex -space-x-2">
            {members.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                className={`w-8 h-8 rounded-full ${member.color} border-2 border-white flex items-center justify-center`}
              >
                <span className="text-white">{member.name[0]}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Grocery List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {groceryItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, type: "spring", stiffness: 300, damping: 24 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-gray-900">{item.name}</h3>
                <p className="text-gray-500 mt-1">{item.quantity}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {item.category}
                </span>
              </div>
              <div className="text-right ml-4">
                <p className="text-green-600">{item.price.toFixed(2)} $</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Actions */}
      <motion.div 
        className="p-6 bg-white border-t border-gray-100 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button 
          className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02, backgroundColor: 'rgb(229 231 235)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un produit</span>
        </motion.button>
        <motion.button 
          onClick={() => onNavigate('optimization')}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
          whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          <span>Optimiser mon panier</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
import { ArrowLeft, UserPlus, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface CollaborativeScreenProps {
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const members = [
  { id: 1, name: 'Marie', color: 'bg-blue-500', initials: 'M' },
  { id: 2, name: 'Paul', color: 'bg-green-500', initials: 'P' },
  { id: 3, name: 'Sophie', color: 'bg-purple-500', initials: 'S' },
];

const collaborativeItems = [
  { id: 1, name: 'Lait 2%', addedBy: 'Marie', assignedTo: 'Paul', recurring: true, color: 'blue' },
  { id: 2, name: 'Pain de blé entier', addedBy: 'Paul', assignedTo: 'Paul', recurring: false, color: 'green' },
  { id: 3, name: 'Tomates', addedBy: 'Sophie', assignedTo: 'Marie', recurring: false, color: 'purple' },
  { id: 4, name: 'Poulet', addedBy: 'Marie', assignedTo: null, recurring: false, color: 'blue' },
  { id: 5, name: 'Yaourt grec', addedBy: 'Sophie', assignedTo: 'Sophie', recurring: true, color: 'purple' },
  { id: 6, name: 'Bananes', addedBy: 'Paul', assignedTo: null, recurring: false, color: 'green' },
];

const colorMap: Record<string, string> = {
  blue: 'border-l-blue-500 bg-blue-50',
  green: 'border-l-green-500 bg-green-50',
  purple: 'border-l-purple-500 bg-purple-50',
};

export function CollaborativeScreen({ onNavigate, onBack, canGoBack }: CollaborativeScreenProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
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
            <h1 className="text-gray-900">Liste collaborative</h1>
            <div className="flex items-center gap-2 mt-1">
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              ></motion.div>
              <span className="text-green-600">Synchronisé</span>
            </div>
          </div>
          <motion.button 
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: 'rgb(191 219 254)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <UserPlus className="w-5 h-5 text-blue-600" />
          </motion.button>
        </div>

        {/* Members */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {members.map((member, index) => (
            <motion.div 
              key={member.id} 
              className="flex flex-col items-center gap-2 min-w-fit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              whileHover={{ y: -5 }}
            >
              <div className={`w-12 h-12 rounded-full ${member.color} flex items-center justify-center shadow-md`}>
                <span className="text-white">{member.initials}</span>
              </div>
              <span className="text-gray-700 text-xs">{member.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {collaborativeItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
            whileHover={{ scale: 1.02, x: 5 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${colorMap[item.color]} cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-gray-900">{item.name}</h3>
                  {item.recurring && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                    </motion.div>
                  )}
                </div>
                <p className="text-gray-500 mt-1 text-sm">Ajouté par {item.addedBy}</p>
              </div>
            </div>

            {item.assignedTo ? (
              <motion.div 
                className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-700 text-sm">Assigné à {item.assignedTo}</span>
              </motion.div>
            ) : (
              <motion.button 
                className="w-full bg-gray-100 text-gray-600 rounded-xl px-3 py-2 text-sm"
                whileHover={{ backgroundColor: 'rgb(229 231 235)', scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Assigner à un membre
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Last sync */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Clock className="w-4 h-4" />
          <span>Dernière synchronisation : il y a 2 min</span>
        </div>
      </div>
    </div>
  );
}
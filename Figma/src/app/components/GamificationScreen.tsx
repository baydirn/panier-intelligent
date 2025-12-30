import { ArrowLeft, Trophy, Star, TrendingUp, Award, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface GamificationScreenProps {
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const badges = [
  { id: 1, name: 'Économiste', icon: '💰', unlocked: true, description: 'Économisez 50$' },
  { id: 2, name: 'Collaborateur', icon: '🤝', unlocked: true, description: 'Partagez 5 listes' },
  { id: 3, name: 'Optimiseur', icon: '⚡', unlocked: true, description: 'Optimisez 10 paniers' },
  { id: 4, name: 'Marathonien', icon: '🏃', unlocked: false, description: 'Visitez 20 magasins' },
  { id: 5, name: 'Maître', icon: '👑', unlocked: false, description: 'Économisez 200$' },
  { id: 6, name: 'Expert', icon: '🎯', unlocked: false, description: 'Complétez 50 listes' },
];

const recentActivity = [
  { id: 1, action: 'Liste complétée', points: 50, date: 'Aujourd\'hui' },
  { id: 2, action: 'Panier optimisé', points: 30, date: 'Hier' },
  { id: 3, action: 'Économie de 5,75$', points: 25, date: 'Il y a 2 jours' },
  { id: 4, action: 'Membre invité', points: 20, date: 'Il y a 3 jours' },
];

export function GamificationScreen({ onNavigate, onBack, canGoBack }: GamificationScreenProps) {
  const totalPoints = 1247;
  const nextMilestone = 1500;
  const progress = (totalPoints / nextMilestone) * 100;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-8 pb-6 text-white">
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
            <h1>Vos accomplissements</h1>
            <p className="text-white text-opacity-90 mt-1">Continuez comme ça !</p>
          </div>
        </div>

        {/* Points Card */}
        <motion.div 
          className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Trophy className="w-8 h-8 text-amber-500" />
              </motion.div>
              <div>
                <p className="text-white text-opacity-80 text-sm">Points totaux</p>
                <motion.p 
                  className="text-3xl font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                >
                  {totalPoints}
                </motion.p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-opacity-80 text-sm">Niveau</p>
              <motion.p 
                className="text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
              >
                12
              </motion.p>
            </div>
          </div>

          {/* Progress to next level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white text-opacity-90">
              <span>Prochain niveau</span>
              <span>{nextMilestone - totalPoints} points</span>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="bg-white h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Badges */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-gray-900">Badges débloqués</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: badge.unlocked ? 1.1 : 1, y: badge.unlocked ? -5 : 0 }}
                className={`rounded-2xl p-4 text-center transition-all cursor-pointer ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300'
                    : 'bg-gray-100 opacity-50'
                }`}
              >
                <motion.div 
                  className="text-4xl mb-2"
                  animate={badge.unlocked ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  {badge.icon}
                </motion.div>
                <p className="text-gray-900 text-xs">{badge.name}</p>
                <p className="text-gray-500 text-xs mt-1">{badge.description}</p>
                {badge.unlocked && (
                  <motion.div 
                    className="mt-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                  >
                    <CheckCircle className="w-4 h-4 text-amber-600 mx-auto" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-gray-900">Activité récente</h2>
          </div>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Star className="w-5 h-5 text-green-600" />
                  </motion.div>
                  <div>
                    <p className="text-gray-900">{activity.action}</p>
                    <p className="text-gray-500 text-sm mt-1">{activity.date}</p>
                  </div>
                </div>
                <motion.div 
                  className="text-green-600 font-semibold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 500 }}
                >
                  +{activity.points}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next Reward */}
        <motion.div 
          className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-6 border-2 border-purple-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-gray-900">Prochaine récompense</h3>
              <p className="text-gray-600 text-sm mt-1">253 points restants</p>
            </div>
          </div>
          <p className="text-gray-700">
            Débloquez le badge <span className="font-semibold">"Marathonien" 🏃</span> en visitant 5 magasins de plus !
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            className="bg-green-50 rounded-2xl p-4 border border-green-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <p className="text-green-600 text-sm mb-1">Économies totales</p>
            <p className="text-gray-900 text-2xl font-bold">87,45 $</p>
          </motion.div>
          <motion.div 
            className="bg-blue-50 rounded-2xl p-4 border border-blue-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <p className="text-blue-600 text-sm mb-1">Listes complétées</p>
            <p className="text-gray-900 text-2xl font-bold">23</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}
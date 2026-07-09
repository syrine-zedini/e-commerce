import React from 'react';
import { Gift, Star, TrendingUp, Award, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

export const LoyaltyPoints: React.FC = () => {
  const { user } = useAuth();
  const { loyaltyTransactions } = useData();

  const userTransactions = loyaltyTransactions.filter(t => t.userId === user?.id);
  const totalEarned = userTransactions
    .filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + t.points, 0);
  const totalRedeemed = userTransactions
    .filter(t => t.type === 'redeemed')
    .reduce((sum, t) => sum + t.points, 0);

  const loyaltyTiers = [
    { name: 'Bronze', minPoints: 0, maxPoints: 99, color: 'from-amber-600 to-orange-600', benefits: ['1 point per $1 spent'] },
    { name: 'Silver', minPoints: 100, maxPoints: 499, color: 'from-gray-400 to-gray-600', benefits: ['1.5 points per $1 spent', 'Free shipping'] },
    { name: 'Gold', minPoints: 500, maxPoints: 999, color: 'from-yellow-400 to-yellow-600', benefits: ['2 points per $1 spent', 'Free shipping', 'Early access to sales'] },
    { name: 'Platinum', minPoints: 1000, maxPoints: Infinity, color: 'from-purple-400 to-purple-600', benefits: ['3 points per $1 spent', 'Free shipping', 'Early access to sales', 'Personal shopper'] },
  ];

  const currentPoints = user?.loyaltyPoints || 0;
  const currentTier = loyaltyTiers.find(tier => currentPoints >= tier.minPoints && currentPoints <= tier.maxPoints) || loyaltyTiers[0];
  const nextTier = loyaltyTiers.find(tier => tier.minPoints > currentPoints);
  const pointsToNextTier = nextTier ? nextTier.minPoints - currentPoints : 0;

  const rewardOptions = [
    { points: 100, reward: '$10 Off Next Purchase', description: 'Get $10 off your next order of $50 or more' },
    { points: 250, reward: 'Free Shipping', description: 'Free shipping on your next order' },
    { points: 500, reward: '$50 Off Next Purchase', description: 'Get $50 off your next order of $200 or more' },
    { points: 1000, reward: '$100 Gift Card', description: 'Receive a $100 gift card to use anytime' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Loyalty Points</h1>
        <div className="text-sm text-gray-500">
          Member since {new Date(user?.createdAt || '').toLocaleDateString()}
        </div>
      </div>

      {/* Current Points & Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`w-16 h-16 bg-gradient-to-r ${currentTier.color} rounded-full flex items-center justify-center`}>
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentPoints} Points</h2>
              <p className="text-gray-600">{currentTier.name} Member</p>
            </div>
          </div>

          {nextTier && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress to {nextTier.name}</span>
                <span>{pointsToNextTier} points to go</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${nextTier.color} h-2 rounded-full transition-all duration-300`}
                  style={{
                    width: `${Math.min(100, ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Benefits</h3>
            <ul className="space-y-2">
              {currentTier.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-2 text-gray-700">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Points Summary</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Total Earned</p>
                  <p className="text-sm text-green-700">All time</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-900">{totalEarned}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Gift className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Total Redeemed</p>
                  <p className="text-sm text-blue-700">All time</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-900">{totalRedeemed}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Available Balance</p>
                  <p className="text-sm text-purple-700">Ready to use</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-900">{currentPoints}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Redeem Rewards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rewardOptions.map((option, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Gift className="w-6 h-6 text-purple-600" />
                <span className="text-lg font-bold text-purple-600">{option.points} pts</span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{option.reward}</h3>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>
              
              <button
                disabled={currentPoints < option.points}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                  currentPoints >= option.points
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentPoints >= option.points ? 'Redeem' : 'Not enough points'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Points History</h2>
        
        {userTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'earned' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'earned' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <Gift className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-bold ${
                  transaction.type === 'earned' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Users, ChefHat, Download, Calendar } from 'lucide-react';

export default function ChristmasMenuSelector() {
  const [guests, setGuests] = useState([]);
  const [currentGuest, setCurrentGuest] = useState({
    name: '',
    courses: 2,
    starter: '',
    main: '',
    dessert: '',
    orderDate: ''
  });
  const [viewMode, setViewMode] = useState('form');

  const menuData = {
    starters: [
      { id: 's1', name: 'Creamy garlic mushrooms + sourdough toast', tags: ['v'] },
      { id: 's2', name: 'Lightly spiced parsnip soup + toasted cumin + honey', tags: ['v', 'vgo', 'gfo'] },
      { id: 's3', name: 'Salmon Gravadlax + rye bread + horseradish + mustard cream', tags: ['gfo'] }
    ],
    mains: [
      { id: 'm1', name: 'Angus Sirloin steak + mushrooms + roasted tomato + chips + green peppercorn sauce', tags: ['gfo'] },
      { id: 'm2', name: 'Roasted salmon + crushed new potatoes + asparagus + dill beurre blanc sauce', tags: ['gfo'] },
      { id: 'm3', name: 'Chicken breast + french beans + herby potatoes + tomato + mascarpone sauce', tags: ['gfo'] },
      { id: 'm4', name: 'BBQ rib + wing combo box + coleslaw + corn + seasoned fries', tags: ['gfo'] },
      { id: 'm5', name: 'Wild mushroom + roasted onion vegan puff pastry tart', tags: ['v', 'vgo'] }
    ],
    desserts: [
      { id: 'd1', name: 'Biscoff cheesecake + toffee sauce + vanilla cream', tags: ['v'] },
      { id: 'd2', name: 'Spiced cherry crumble + vanilla pod custard', tags: ['v'] },
      { id: 'd3', name: 'Dark chocolate + caramel tart + berry compote', tags: ['v', 'vgo', 'gf'] },
      { id: 'd4', name: 'British cheese + biscuit selection', tags: ['v'] }
    ]
  };

  useEffect(() => {
    const saved = localStorage.getItem('christmasGuests');
    if (saved) {
      setGuests(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (guests.length > 0) {
      localStorage.setItem('christmasGuests', JSON.stringify(guests));
    }
  }, [guests]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentGuest.name || !currentGuest.main) {
      alert('Please enter your name and select at least a main dish!');
      return;
    }
    if (currentGuest.courses === 3 && (!currentGuest.starter || !currentGuest.dessert)) {
      alert('Please select all 3 courses for the 3-course menu!');
      return;
    }
    if (currentGuest.courses === 2 && !currentGuest.starter && !currentGuest.dessert) {
      alert('Please select a starter or dessert for the 2-course menu!');
      return;
    }
    
    const now = new Date();
    const orderDate = now.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    setGuests([...guests, { ...currentGuest, orderDate }]);
    setCurrentGuest({
      name: '',
      courses: 2,
      starter: '',
      main: '',
      dessert: '',
      orderDate: ''
    });
    alert('Order submitted successfully! 🎄');
  };

  const getItemName = (id, category) => {
    const item = menuData[category].find(i => i.id === id);
    return item ? item.name : '';
  };

  const exportOrders = () => {
    let report = '═══════════════════════════════════════════════════════\n';
    report += '         F&V CHRISTMAS DINNER - FINAL ORDERS\n';
    report += '═══════════════════════════════════════════════════════\n\n';
    report += `Total Guests: ${guests.length}\n`;
    report += `Date: Tuesday 2nd December or Wednesday 3rd December\n\n`;
    
    let total2Course = guests.filter(g => g.courses === 2).length;
    let total3Course = guests.filter(g => g.courses === 3).length;
    let totalCost = (total2Course * 32) + (total3Course * 37);
    
    report += `2-Course Menu (£32): ${total2Course} guests\n`;
    report += `3-Course Menu (£37): ${total3Course} guests\n`;
    report += `TOTAL COST: £${totalCost}\n\n`;
    report += '═══════════════════════════════════════════════════════\n\n';

    guests.forEach((guest, index) => {
      report += `${index + 1}. ${guest.name} (${guest.courses} courses - £${guest.courses === 2 ? '32' : '37'})\n`;
      report += `   Ordered: ${guest.orderDate}\n`;
      if (guest.starter) {
        const starter = menuData.starters.find(s => s.id === guest.starter);
        report += `   Starter: ${starter.name} (${starter.tags.join(', ')})\n`;
      }
      report += `   Main: ${getItemName(guest.main, 'mains')}\n`;
      if (guest.dessert) {
        const dessert = menuData.desserts.find(d => d.id === guest.dessert);
        report += `   Dessert: ${dessert.name} (${dessert.tags.join(', ')})\n`;
      }
      report += '\n';
    });

    report += '═══════════════════════════════════════════════════════\n';
    report += `Generated: ${new Date().toLocaleString('en-GB')}\n`;
    report += '═══════════════════════════════════════════════════════\n';

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Christmas_Dinner_Orders_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const getStats = () => {
    const stats = {
      starters: {},
      mains: {},
      desserts: {}
    };

    menuData.starters.forEach(s => stats.starters[s.id] = 0);
    menuData.mains.forEach(m => stats.mains[m.id] = 0);
    menuData.desserts.forEach(d => stats.desserts[d.id] = 0);

    guests.forEach(guest => {
      if (guest.starter) stats.starters[guest.starter]++;
      if (guest.main) stats.mains[guest.main]++;
      if (guest.dessert) stats.desserts[guest.dessert]++;
    });

    return stats;
  };

  const stats = getStats();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #165B33 0%, #8B0000 25%, #C41E3A 50%, #8B0000 75%, #0F4C23 100%)'
    }}>
      {/* Floating Christmas decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl animate-bounce">🧝‍♂️</div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{animationDelay: '0.5s'}}>🧝‍♀️</div>
        <div className="absolute bottom-20 left-20 text-7xl animate-bounce" style={{animationDelay: '1s'}}>🎅</div>
        <div className="absolute bottom-32 right-32 text-6xl animate-bounce" style={{animationDelay: '1.5s'}}>🤶</div>
        
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-60"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            ❄️
          </div>
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🎄 F&V Christmas Dinner 🎄
          </h1>
          <p className="text-xl text-red-100 drop-shadow">
            Tuesday 2nd December or Wednesday 3rd December
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setViewMode('form')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              viewMode === 'form'
                ? 'bg-white text-red-700 shadow-lg scale-105'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <ChefHat size={20} /> Place Order
          </button>
          <button
            onClick={() => setViewMode('view')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              viewMode === 'view'
                ? 'bg-green-600 text-white shadow-lg scale-105'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <Users size={20} /> View All Orders ({guests.length})
          </button>
        </div>

        {viewMode === 'form' ? (
          <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur rounded-xl shadow-2xl p-8 border-4 border-red-600">
            <h2 className="text-3xl font-bold text-center mb-6 text-red-700">
              🎅 Place Your Order 🎄
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-700">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={currentGuest.name}
                  onChange={(e) => setCurrentGuest({...currentGuest, name: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-lg"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-3 text-gray-700">
                  Choose Your Menu *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentGuest({...currentGuest, courses: 2})}
                    className={`p-4 rounded-lg border-3 font-semibold transition-all ${
                      currentGuest.courses === 2
                        ? 'bg-red-600 text-white border-red-700 scale-105'
                        : 'bg-white border-gray-300 hover:border-red-400'
                    }`}
                  >
                    2 Courses<br/>
                    <span className="text-sm opacity-90">Main + Starter OR Dessert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentGuest({...currentGuest, courses: 3})}
                    className={`p-4 rounded-lg border-3 font-semibold transition-all ${
                      currentGuest.courses === 3
                        ? 'bg-green-600 text-white border-green-700 scale-105'
                        : 'bg-white border-gray-300 hover:border-green-400'
                    }`}
                  >
                    3 Courses<br/>
                    <span className="text-sm opacity-90">Starter + Main + Dessert</span>
                  </button>
                </div>
              </div>

              {(currentGuest.courses === 3 || currentGuest.courses === 2) && (
                <div>
                  <label className="block text-lg font-semibold mb-2 text-gray-700">
                    Starter {currentGuest.courses === 3 ? '*' : '(Optional)'}
                  </label>
                  <select
                    value={currentGuest.starter}
                    onChange={(e) => setCurrentGuest({...currentGuest, starter: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-base"
                    required={currentGuest.courses === 3}
                  >
                    <option value="">-- Select Starter --</option>
                    {menuData.starters.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.tags.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-700">
                  Main Course *
                </label>
                <select
                  value={currentGuest.main}
                  onChange={(e) => setCurrentGuest({...currentGuest, main: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-base"
                  required
                >
                  <option value="">-- Select Main --</option>
                  {menuData.mains.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.tags.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {(currentGuest.courses === 3 || currentGuest.courses === 2) && (
                <div>
                  <label className="block text-lg font-semibold mb-2 text-gray-700">
                    Dessert {currentGuest.courses === 3 ? '*' : '(Optional)'}
                  </label>
                  <select
                    value={currentGuest.dessert}
                    onChange={(e) => setCurrentGuest({...currentGuest, dessert: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-base"
                    required={currentGuest.courses === 3}
                  >
                    <option value="">-- Select Dessert --</option>
                    {menuData.desserts.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.tags.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 text-xl font-bold rounded-lg text-white transition-all shadow-lg hover:scale-105"
                style={{
                  background: 'linear-gradient(90deg, #C41E3A 0%, #0F4C23 50%, #C41E3A 100%)'
                }}
              >
                🎅 Submit Order 🎄
              </button>
            </form>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-6 mb-6 border-4 border-green-600">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-green-700 flex items-center gap-3">
                  🎅 All Orders 🤶
                </h2>
                <button
                  onClick={exportOrders}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Download size={20} /> Export Orders
                </button>
              </div>

              {/* STATISTICS SECTION - NOW AT TOP */}
              <div className="bg-red-50 rounded-lg p-4 mb-6 border-2 border-red-200">
                <h3 className="text-xl font-bold text-red-700 mb-3">📊 Order Statistics</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Starters:</h4>
                    {menuData.starters.map(item => (
                      stats.starters[item.id] > 0 && (
                        <div key={item.id} className="text-sm mb-1">
                          <span className="font-medium">{stats.starters[item.id]}x</span> {item.name.split('+')[0]}
                        </div>
                      )
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Mains:</h4>
                    {menuData.mains.map(item => (
                      stats.mains[item.id] > 0 && (
                        <div key={item.id} className="text-sm mb-1">
                          <span className="font-medium">{stats.mains[item.id]}x</span> {item.name.split('+')[0]}
                        </div>
                      )
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Desserts:</h4>
                    {menuData.desserts.map(item => (
                      stats.desserts[item.id] > 0 && (
                        <div key={item.id} className="text-sm mb-1">
                          <span className="font-medium">{stats.desserts[item.id]}x</span> {item.name.split('+')[0]}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {guests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-xl">No orders yet. Be the first to order! 🎄</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {guests.map((guest, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-green-400 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{guest.name}</h3>
                        <div className="text-right">
                          <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {guest.courses} courses - £{guest.courses === 2 ? '32' : '37'}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 justify-end">
                            <Calendar size={14} />
                            <span>{guest.orderDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {guest.starter && (
                          <p>
                            <span className="font-semibold text-red-600">Starter:</span>{' '}
                            {getItemName(guest.starter, 'starters')}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold text-green-600">Main:</span>{' '}
                          {getItemName(guest.main, 'mains')}
                        </p>
                        {guest.dessert && (
                          <p>
                            <span className="font-semibold text-red-600">Dessert:</span>{' '}
                            {getItemName(guest.dessert, 'desserts')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, ChefHat, Sparkles, Download } from 'lucide-react';

export default function ChristmasMenuSelector() {
  const [guests, setGuests] = useState([]);
  const [currentGuest, setCurrentGuest] = useState({
    name: '',
    courses: 2,
    starter: '',
    main: '',
    dessert: ''
  });
  const [viewMode, setViewMode] = useState('form');
  const [filterDietary, setFilterDietary] = useState('all');

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
    if (currentGuest.courses === 2) {
      if (!currentGuest.starter && !currentGuest.dessert) {
        alert('Please select either a starter OR a dessert for the 2-course menu!');
        return;
      }
      if (currentGuest.starter && currentGuest.dessert) {
        alert('For 2-course menu, please select only ONE: either a starter OR a dessert (not both)!');
        return;
      }
    }

    const newGuest = { ...currentGuest, id: Date.now() };
    setGuests([...guests, newGuest]);
    setCurrentGuest({
      name: '',
      courses: 2,
      starter: '',
      main: '',
      dessert: ''
    });
    setViewMode('summary');
  };

  const exportData = () => {
    // Calculate statistics
    const twoCourseCount = guests.filter(g => g.courses === 2).length;
    const threeCourseCount = guests.filter(g => g.courses === 3).length;
    const twoCourseTotal = twoCourseCount * 32;
    const threeCourseTotal = threeCourseCount * 37;
    
    // Get dish counts
    const starterCounts = getCounts('starters');
    const mainCounts = getCounts('mains');
    const dessertCounts = getCounts('desserts');
    
    // Create comprehensive report
    let report = '═══════════════════════════════════════════════════════\n';
    report += '          F&V CHRISTMAS DINNER - FINAL ORDER          \n';
    report += '═══════════════════════════════════════════════════════\n\n';
    
    report += '📅 EVENT DETAILS:\n';
    report += '   Date Options: Tuesday 2nd December OR Wednesday 3rd December\n';
    report += '   Welcome Drinks: Bubbles or Orange Juice\n\n';
    
    report += '═══════════════════════════════════════════════════════\n';
    report += '📊 ORDER SUMMARY\n';
    report += '═══════════════════════════════════════════════════════\n\n';
    
    report += `Total Guests: ${guests.length}\n`;
    report += `   • 2-Course Menu (£32): ${twoCourseCount} guests = £${twoCourseTotal}\n`;
    report += `   • 3-Course Menu (£37): ${threeCourseCount} guests = £${threeCourseTotal}\n\n`;
    report += `TOTAL COST: £${totalCost}\n\n`;
    
    report += '═══════════════════════════════════════════════════════\n';
    report += '🍽️ DISH QUANTITIES\n';
    report += '═══════════════════════════════════════════════════════\n\n';
    
    report += '--- STARTERS ---\n';
    starterCounts.forEach(item => {
      if (item.count > 0) {
        report += `   ${item.count}× ${item.name}\n`;
      }
    });
    
    report += '\n--- MAIN COURSES ---\n';
    mainCounts.forEach(item => {
      if (item.count > 0) {
        report += `   ${item.count}× ${item.name}\n`;
      }
    });
    
    report += '\n--- DESSERTS ---\n';
    dessertCounts.forEach(item => {
      if (item.count > 0) {
        report += `   ${item.count}× ${item.name}\n`;
      }
    });
    
    report += '\n═══════════════════════════════════════════════════════\n';
    report += '👥 INDIVIDUAL GUEST ORDERS\n';
    report += '═══════════════════════════════════════════════════════\n\n';
    
    guests.forEach((guest, index) => {
      const starter = menuData.starters.find(s => s.id === guest.starter);
      const main = menuData.mains.find(m => m.id === guest.main);
      const dessert = menuData.desserts.find(d => d.id === guest.dessert);
      
      report += `${index + 1}. ${guest.name} (${guest.courses} courses - £${guest.courses === 2 ? 32 : 37})\n`;
      if (guest.starter) report += `   Starter: ${starter?.name}\n`;
      report += `   Main: ${main?.name}\n`;
      if (guest.dessert) report += `   Dessert: ${dessert?.name}\n`;
      report += '\n';
    });
    
    report += '═══════════════════════════════════════════════════════\n';
    report += 'Generated: ' + new Date().toLocaleString('en-GB') + '\n';
    report += '═══════════════════════════════════════════════════════\n';
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FV-Christmas-Dinner-Order-${guests.length}-guests.txt`;
    a.click();
  };

  const getCounts = (courseType) => {
    const items = menuData[courseType];
    return items.map(item => ({
      ...item,
      count: guests.filter(g => g[courseType.slice(0, -1)] === item.id).length
    }));
  };

  const price = currentGuest.courses === 2 ? 32 : 37;
  const totalCost = guests.reduce((sum, g) => sum + (g.courses === 2 ? 32 : 37), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-red-900 to-green-800 p-4 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce">🎅</div>
      <div className="absolute top-20 right-10 text-6xl opacity-20 animate-bounce" style={{animationDelay: '0.5s'}}>🤶</div>
      <div className="absolute bottom-10 left-20 text-6xl opacity-20 animate-bounce" style={{animationDelay: '1s'}}>⛄</div>
      <div className="absolute bottom-20 right-20 text-6xl opacity-20 animate-bounce" style={{animationDelay: '1.5s'}}>🎄</div>
      <div className="absolute top-1/3 left-1/4 text-4xl opacity-10">❄️</div>
      <div className="absolute top-1/2 right-1/4 text-4xl opacity-10">❄️</div>
      <div className="absolute bottom-1/3 left-1/3 text-4xl opacity-10">❄️</div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🎅</span>
            <Sparkles className="text-red-400" size={32} />
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">F&V Christmas Menu</h1>
            <Sparkles className="text-green-400" size={32} />
            <span className="text-4xl">🎅</span>
          </div>
          <p className="text-white text-lg mb-2 drop-shadow">2 Courses £32 | 3 Courses £37 per person</p>
          <p className="text-sm text-green-200 drop-shadow">Suggested dates: Tuesday 2nd Dec / Wednesday 3rd Dec</p>
          <div className="flex items-center justify-center gap-2 mt-4 bg-white/90 backdrop-blur rounded-lg py-3 px-6 inline-flex">
            <Users className="text-blue-600" />
            <span className="text-lg font-semibold">{guests.length} guests registered</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setViewMode('form')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              viewMode === 'form'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChefHat className="inline mr-2" size={20} />
            Place Order
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              viewMode === 'summary'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="inline mr-2" size={20} />
            View All Orders ({guests.length})
          </button>
        </div>

        {/* Form View */}
        {viewMode === 'form' && (
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-8 mb-8 border-4 border-red-600">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-3xl">🎅</span>
              <h2 className="text-2xl font-bold text-gray-800">Select Your Menu</h2>
              <span className="text-3xl">🤶</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={currentGuest.name}
                  onChange={(e) => setCurrentGuest({ ...currentGuest, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Courses *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentGuest({ ...currentGuest, courses: 2 })}
                    className={`flex-1 py-4 rounded-lg font-semibold transition ${
                      currentGuest.courses === 2
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    2 Courses - £32
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentGuest({ ...currentGuest, courses: 3 })}
                    className={`flex-1 py-4 rounded-lg font-semibold transition ${
                      currentGuest.courses === 3
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    3 Courses - £37
                  </button>
                </div>
              </div>

              {/* Starters */}
              <div className={currentGuest.courses === 2 ? 'opacity-75' : ''}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Starter {currentGuest.courses === 2 && '(optional for 2-course)'}
                  {currentGuest.courses === 3 && '*'}
                </label>
                <div className="space-y-2">
                  {menuData.starters.map((starter) => (
                    <label
                      key={starter.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                        currentGuest.starter === starter.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="starter"
                        value={starter.id}
                        checked={currentGuest.starter === starter.id}
                        onChange={(e) => {
                          const newGuest = { ...currentGuest, starter: e.target.value };
                          // For 2-course menu, clear dessert when starter is selected
                          if (currentGuest.courses === 2) {
                            newGuest.dessert = '';
                          }
                          setCurrentGuest(newGuest);
                        }}
                        className="mr-3"
                      />
                      <span className="font-medium">{starter.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {starter.tags.map(tag => `(${tag})`).join(' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mains */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Main Dish *
                </label>
                <div className="space-y-2">
                  {menuData.mains.map((main) => (
                    <label
                      key={main.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                        currentGuest.main === main.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="main"
                        value={main.id}
                        checked={currentGuest.main === main.id}
                        onChange={(e) =>
                          setCurrentGuest({ ...currentGuest, main: e.target.value })
                        }
                        className="mr-3"
                        required
                      />
                      <span className="font-medium">{main.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {main.tags.map(tag => `(${tag})`).join(' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Desserts */}
              <div className={currentGuest.courses === 2 ? 'opacity-75' : ''}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dessert {currentGuest.courses === 2 && '(optional for 2-course)'}
                  {currentGuest.courses === 3 && '*'}
                </label>
                <div className="space-y-2">
                  {menuData.desserts.map((dessert) => (
                    <label
                      key={dessert.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                        currentGuest.dessert === dessert.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dessert"
                        value={dessert.id}
                        checked={currentGuest.dessert === dessert.id}
                        onChange={(e) => {
                          const newGuest = { ...currentGuest, dessert: e.target.value };
                          // For 2-course menu, clear starter when dessert is selected
                          if (currentGuest.courses === 2) {
                            newGuest.starter = '';
                          }
                          setCurrentGuest(newGuest);
                        }}
                        className="mr-3"
                      />
                      <span className="font-medium">{dessert.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {dessert.tags.map(tag => `(${tag})`).join(' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white font-bold rounded-lg hover:from-red-700 hover:via-green-700 hover:to-red-700 transition text-lg shadow-lg"
              >
                🎅 Submit Order (£{price}) 🎄
              </button>
            </form>
          </div>
        )}

        {/* Summary View */}
        {viewMode === 'summary' && (
          <div className="space-y-6">
            {/* Guest List */}
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-8 border-4 border-green-600">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎅</span>
                  <h2 className="text-2xl font-bold text-gray-800">All Orders</h2>
                  <span className="text-3xl">🤶</span>
                </div>
                {guests.length > 0 && (
                  <button
                    onClick={exportData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Download size={20} />
                    Export Orders
                  </button>
                )}
              </div>
              
              {guests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders yet. Be the first to order!</p>
              ) : (
                <div className="space-y-4">
                  {guests.map((guest) => {
                    const starter = menuData.starters.find(s => s.id === guest.starter);
                    const main = menuData.mains.find(m => m.id === guest.main);
                    const dessert = menuData.desserts.find(d => d.id === guest.dessert);
                    
                    return (
                      <div key={guest.id} className="border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-gray-800">{guest.name}</h3>
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                            {guest.courses} courses - £{guest.courses === 2 ? 32 : 37}
                          </span>
                        </div>
                        <div className="space-y-2 text-gray-700">
                          {guest.starter && (
                            <div>
                              <span className="font-semibold text-red-600">Starter:</span> {starter?.name}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-green-600">Main:</span> {main?.name}
                          </div>
                          {guest.dessert && (
                            <div>
                              <span className="font-semibold text-red-600">Dessert:</span> {dessert?.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Statistics */}
            {guests.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Starter Stats */}
                <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-6 border-4 border-red-500">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">⛄</span>
                    <h3 className="text-lg font-bold text-red-600">Starter Counts</h3>
                  </div>
                  {getCounts('starters').map(item => (
                    <div key={item.id} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 truncate">{item.name.split('+')[0]}...</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Stats */}
                <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-6 border-4 border-green-500">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🎄</span>
                    <h3 className="text-lg font-bold text-green-600">Main Dish Counts</h3>
                  </div>
                  {getCounts('mains').map(item => (
                    <div key={item.id} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 truncate">{item.name.split('+')[0]}...</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dessert Stats */}
                <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-6 border-4 border-red-500">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🎁</span>
                    <h3 className="text-lg font-bold text-red-600">Dessert Counts</h3>
                  </div>
                  {getCounts('desserts').map(item => (
                    <div key={item.id} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 truncate">{item.name.split('+')[0]}...</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

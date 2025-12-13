import { useState } from 'react';

interface Item {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'aid' | 'misc' | 'ammo';
  weight: number;
  value: number;
  quantity: number;
}

export function InventoryTab() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const items: Item[] = [
    { id: 1, name: 'LASER RIFLE', type: 'weapon', weight: 5.2, value: 450, quantity: 1 },
    { id: 2, name: 'COMBAT ARMOR', type: 'armor', weight: 15.0, value: 800, quantity: 1 },
    { id: 3, name: 'STIMPAK', type: 'aid', weight: 0.1, value: 50, quantity: 12 },
    { id: 4, name: 'RAD-AWAY', type: 'aid', weight: 0.1, value: 80, quantity: 5 },
    { id: 5, name: 'SCRAP METAL', type: 'misc', weight: 3.0, value: 5, quantity: 8 },
    { id: 6, name: 'FUSION CELL', type: 'ammo', weight: 0.0, value: 2, quantity: 156 },
    { id: 7, name: 'BOBBY PIN', type: 'misc', weight: 0.0, value: 1, quantity: 24 },
  ];

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Item List */}
      <div className="space-y-2">
        <div className="text-lg mb-3 tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
          {'>'} INVENTORY
        </div>
        
        <div className="text-sm mb-4 opacity-70">
          WEIGHT: {totalWeight.toFixed(1)} / 250.0 LBS
        </div>

        <div className="space-y-1">
          {items.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-3 border transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-green-400/30 hover:border-green-400/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.name}</span>
                  </div>
                  {item.quantity > 1 && (
                    <span className="text-xs opacity-70">x{item.quantity}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Details */}
      <div className="border border-green-400/30 p-4">
        {selectedItem ? (
          <div className="space-y-4">
            <div className="text-lg tracking-wider mb-4" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
              {selectedItem.name}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-green-400/20 pb-2">
                <span className="opacity-70">TYPE:</span>
                <span className="uppercase">{selectedItem.type}</span>
              </div>
              
              <div className="flex justify-between border-b border-green-400/20 pb-2">
                <span className="opacity-70">WEIGHT:</span>
                <span>{selectedItem.weight.toFixed(1)} LBS</span>
              </div>
              
              <div className="flex justify-between border-b border-green-400/20 pb-2">
                <span className="opacity-70">VALUE:</span>
                <span>{selectedItem.value} CAPS</span>
              </div>
              
              <div className="flex justify-between border-b border-green-400/20 pb-2">
                <span className="opacity-70">QUANTITY:</span>
                <span>{selectedItem.quantity}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button className="w-full p-2 border border-green-400/50 hover:bg-green-400/10 transition-all">
                USE / EQUIP
              </button>
              <button className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 transition-all">
                DROP
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-50 text-sm">
            SELECT AN ITEM
          </div>
        )}
      </div>
    </div>
  );
}
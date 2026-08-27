const fs = require('fs');

const uiInsert = `
                  {finalPoseImage && (
                    <div className="mt-4 flex flex-col items-center">
                      <span className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Tangkapan Layar Terakhir! 📸</span>
                      <img src={finalPoseImage} alt="Final Pose" className="w-full h-auto object-cover rounded-xl border-4 border-[#d4ff00] shadow-2xl hover:scale-[1.02] transition-transform" />
                    </div>
                  )}
`;

// Endless Runner
let endless = fs.readFileSync('app/endless_runner/page.tsx', 'utf-8');
endless = endless.replace(
  'Penyebab: {gameOverReason || \'Tabrakan\'}</p>\n                    </div>\n                  </div>',
  'Penyebab: {gameOverReason || \'Tabrakan\'}</p>\n                    </div>\n                  </div>' + uiInsert
);
fs.writeFileSync('app/endless_runner/page.tsx', endless);

// Heli Runner
let heli = fs.readFileSync('app/heli_runner/page.tsx', 'utf-8');
heli = heli.replace(
  'Penyebab: {gameOverReason}</p>\n                    </div>\n                  </div>',
  'Penyebab: {gameOverReason}</p>\n                    </div>\n                  </div>' + uiInsert
);
fs.writeFileSync('app/heli_runner/page.tsx', heli);

// Basket Shoot
let basket = fs.readFileSync('app/basket_shoot/page.tsx', 'utf-8');
basket = basket.replace(
  'Waktu telah habis!</p>\n                    </div>\n                  </div>',
  'Waktu telah habis!</p>\n                    </div>\n                  </div>' + uiInsert
);
fs.writeFileSync('app/basket_shoot/page.tsx', basket);

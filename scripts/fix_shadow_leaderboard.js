const fs = require('fs');

const fixPage = (filePath, primaryColorLight) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix Bottom Gradient
  content = content.replace(/className="fixed bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t from-\[#0a0d0c\] via-\[#0a0d0c\] to-transparent z-40 pointer-events-none"/, 
    "className={`fixed bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t ${isLightMode ? 'from-slate-50 via-slate-50' : 'from-[#0a0d0c] via-[#0a0d0c]'} to-transparent z-40 pointer-events-none`}");

  // Fix Leaderboard List (Rank #1 is special colored, others are default)
  // For rank #1 we can keep the current hardcoded orange/blue/green color since they look ok in both modes (maybe slight tweak later if needed)
  
  // Replace the non-first rank background:
  // e.g. 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#f97316] hover:border-[#f97316]'
  content = content.replace(/'bg-\[#1c1e1c\] text-white border-\[#2a2d2a\] shadow-\[0_6px_0_0_#2a2d2a\] hover:shadow-\[0_8px_0_0_#([^\]]+)\] hover:border-\[#([^\]]+)\]'/g, 
    "(isLightMode ? `bg-white text-slate-800 border-slate-200 shadow-sm hover:border-${primaryColorLight}-500 hover:shadow-[0_8px_0_0_#e2e8f0]` : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#$1] hover:border-[#$2]')");

  // Fix avatar background in non-first ranks:
  // ${idx === 0 ? 'bg-black/10' : 'bg-white/5'}
  content = content.replace(/\$\{idx === 0 \? 'bg-black\/10' : 'bg-white\/5'\}/g, 
    "${idx === 0 ? 'bg-black/10' : (isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-white/5')}");

  // Fix date text in non-first ranks:
  // ${idx === 0 ? 'text-black/60' : 'text-[#a0a0a0]'}
  content = content.replace(/\$\{idx === 0 \? 'text-black\/60' : 'text-\[#a0a0a0\]'\}/g, 
    "${idx === 0 ? 'text-black/60' : (isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]')}");

  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + filePath);
};

fixPage('app/endless_runner/page.tsx', 'emerald');
fixPage('app/heli_runner/page.tsx', 'blue');
fixPage('app/basket_shoot/page.tsx', 'orange');


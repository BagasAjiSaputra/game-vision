const fs = require('fs');

const applyLightMode = (filePath, primaryColorLight, shadowColorLight, hoverShadowColorLight) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add Sun/Moon imports if not present
  if (!content.includes('Sun') || !content.includes('Moon')) {
    content = content.replace(/import {([^}]+)} from "lucide-react";/, (match, p1) => {
      return `import {${p1}, Sun, Moon} from "lucide-react";`;
    });
  }

  // Add isLightMode state
  if (!content.includes('isLightMode')) {
    content = content.replace(/(const \[isPlaying, setIsPlaying\] = useState\(false\);)/, `$1\n  const [isLightMode, setIsLightMode] = useState(false);\n\n  useEffect(() => {\n    const saved = localStorage.getItem('isLightMode');\n    if (saved) setIsLightMode(saved === 'true');\n  }, []);\n\n  useEffect(() => {\n    localStorage.setItem('isLightMode', String(isLightMode));\n  }, [isLightMode]);`);
  }

  // Main container
  content = content.replace(/<main className="flex min-h-screen flex-col bg-\[#0a0d0c\] text-white([^"]*)">/, `<main className={\`flex min-h-screen flex-col font-sans transition-colors duration-300 \${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0d0c] text-white'} $1\`}>`);

  // Header Bar (adding Sun/Moon toggle next to mute button)
  const muteBtnRegex = /<button\s+onClick=\{\(\) => setIsMuted\(!isMuted\)\}\s+className="([^"]+)"\s*>\s*\{isMuted \? <VolumeX className="w-6 h-6" \/> : <Volume2 className="w-6 h-6" \/>\}\s*<\/button>/;
  const match = content.match(muteBtnRegex);
  if (match) {
    const oldBtn = match[0];
    const newBtn = `<button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className={\`w-12 h-12 rounded-full flex items-center justify-center transition-colors \${isLightMode ? 'bg-white text-slate-700 shadow-md hover:bg-slate-100 border-transparent' : 'bg-[#1c1e1c] text-[#a0a0a0] hover:text-white border border-white/5'}\`}
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
               </button>
               <button 
                  onClick={() => setIsLightMode(!isLightMode)} 
                  className={\`w-12 h-12 rounded-full flex items-center justify-center transition-colors \${isLightMode ? 'bg-white text-slate-700 shadow-md hover:bg-slate-100 border-transparent' : 'bg-[#1c1e1c] text-[#a0a0a0] hover:text-white border border-white/5'}\`}
                >
                  {isLightMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
               </button>`;
    content = content.replace(oldBtn, newBtn);
  }

  // Top header text
  content = content.replace(/<p className="text-\[#a0a0a0\] text-sm">Selamat datang di,<\/p>/, `<p className={\`text-sm \${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}\`}>Selamat datang di,</p>`);

  // Input Box
  content = content.replace(/className="flex-1 bg-\[#1c1e1c\] border border-white\/5 rounded-full px-8 py-5 text-white font-bold focus:outline-none focus:border-\[([^\]]+)\] transition-colors placeholder:text-\[#555\] text-xl"/, 
    `className={\`flex-1 rounded-full px-8 py-5 font-bold focus:outline-none transition-colors text-xl \${isLightMode ? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-${primaryColorLight}-500 shadow-sm' : 'bg-[#1c1e1c] border border-white/5 text-white placeholder:text-[#555] focus:border-[$1]'}\`}`);

  // Control Cards Backgrounds
  content = content.replace(/className="bg-\[#1c1e1c\] rounded-3xl p-6 border-2 border-\[#2a2d2a\] shadow-\[0_6px_0_0_#2a2d2a\] hover:-translate-y-1 hover:shadow-\[0_8px_0_0_#([^\]]+)\] hover:border-\[#([^\]]+)\] transition-all([^"]*)"/g, 
    `className={\`rounded-3xl p-6 border-2 transition-all hover:-translate-y-1 \${isLightMode ? 'bg-white border-slate-200 shadow-[0_6px_0_0_#e2e8f0] hover:shadow-[0_8px_0_0_${hoverShadowColorLight}] hover:border-${primaryColorLight}-500 text-slate-800' : 'bg-[#1c1e1c] border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#$1] hover:border-[#$2]'}$3\`}`);

  // Subtext in Control Cards
  content = content.replace(/<p className="text-\[#a0a0a0\] text-xl mt-(2|3)">/g, `<p className={\`text-xl mt-$1 \${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}\`}>`);

  // Leaderboard texts
  content = content.replace(/<span className="text-\[#a0a0a0\] hover:text-white cursor-pointer transition-colors font-medium">Lihat Semua<\/span>/, `<span className={\`cursor-pointer transition-colors font-medium \${isLightMode ? 'text-${primaryColorLight}-600 hover:text-${primaryColorLight}-800' : 'text-[#a0a0a0] hover:text-white'}\`}>Lihat Semua</span>`);
  
  // Leaderboard Empty
  content = content.replace(/<div className="bg-\[#1c1e1c\] rounded-3xl p-12 text-center border border-white\/5">/g, `<div className={\`rounded-3xl p-12 text-center border \${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1e1c] border-white/5'}\`}>`);
  content = content.replace(/<p className="text-\[#a0a0a0\] text-lg">Belum ada rekor\.<\/p>/g, `<p className={\`text-lg \${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}\`}>Belum ada rekor.</p>`);

  // Back button
  content = content.replace(/<Link href="\/" className="w-20 h-20 rounded-full bg-\[#1c1e1c\] border border-white\/5 flex items-center justify-center hover:bg-\[#2a2c2a\] transition-colors shrink-0 shadow-2xl text-white">/, 
    `<Link href="/" className={\`w-20 h-20 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-2xl \${isLightMode ? 'bg-white text-slate-700 hover:bg-slate-100 border-transparent' : 'bg-[#1c1e1c] border border-white/5 hover:bg-[#2a2c2a] text-white'}\`}>`);

  // Start Button
  // E.g. bg-[#d4ff00] text-black hover:bg-[#b0d600] border-2 border-[#9bb800] shadow-[0_8px_0_0_#9bb800] hover:shadow-[0_10px_0_0_#9bb800]
  content = content.replace(/'bg-\[#1c1e1c\] text-\[#555\] cursor-not-allowed border-2 border-\[#2a2d2a\] shadow-\[0_6px_0_0_#2a2d2a\]' : '([^']+)'/g,
    `isLightMode ? 'bg-white text-slate-400 cursor-not-allowed border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-[#555] cursor-not-allowed border-2 border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a]'} : (isLightMode ? 'bg-${primaryColorLight}-500 text-white hover:bg-${primaryColorLight}-600 border-2 border-${primaryColorLight}-600 shadow-[0_8px_0_0_${shadowColorLight}] hover:-translate-y-1 hover:shadow-[0_10px_0_0_${shadowColorLight}] active:translate-y-[8px] active:shadow-none' : '$1')`);
    
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
};

applyLightMode('app/endless_runner/page.tsx', 'emerald', '#047857', '#10b981');
applyLightMode('app/heli_runner/page.tsx', 'blue', '#1d4ed8', '#3b82f6');
applyLightMode('app/basket_shoot/page.tsx', 'orange', '#c2410c', '#f97316');


import { useState, useMemo, useEffect, useDeferredValue, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from "papaparse";

export interface PokemonData {
  DexNumber: number;
  Name: string;
  Types: string[];
  Abilities: string[];
  HiddenAbility: string[];
  Generation: string;
  Hp: number;
  Attack: number;
  Defense: number;
  SpecialAttack: number;
  SpecialDefense: number;
  Speed: number;
  TotalStats: number;
  Weight: number;
  Height: number;
  Category: string;
  CatchRate: string;
  LevelingRate: string;
}

const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A77A', Fire: '#EE8130', Water: '#6390F0', Grass: '#7AC74C',
  Electric: '#F7D02C', Ice: '#96D9D6', Fighting: '#C22E28', Poison: '#A33EA1',
  Ground: '#E2BF65', Flying: '#A98FF3', Psychic: '#F95587', Bug: '#A6B91A',
  Rock: '#B6A136', Ghost: '#735797', Dragon: '#6F35FC', Dark: '#705898',
  Steel: '#B7B7CE', Fairy: '#D685AD',
};

const INITIAL_LOAD_COUNT = 30;
const LOAD_MORE_COUNT = 30;

const getImageUrl = (dexNumber: number) => 
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;

const cleanArrayString = (str: any): string[] => {
  if (!str || str === '[]' || str === "['']") return [];
  if (typeof str === 'string') return str.replace(/[\[\]']/g, '').split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

// ==========================================
// MODERN LIST ITEM COMPONENT
// ==========================================
const PokedexListItem = memo(({ pokemon, isSelected, onClick }: { pokemon: PokemonData, isSelected: boolean, onClick: (p: PokemonData) => void }) => (
  <div 
    onClick={() => onClick(pokemon)}
    className={`p-4 border-b border-slate-100 cursor-pointer flex justify-between items-center transition-all ${
      isSelected 
        ? 'bg-red-50/50 border-l-4 border-l-red-500 pl-3' 
        : 'hover:bg-slate-50 border-l-4 border-l-transparent pl-4'
    }`}
  >
    <span className="font-semibold text-slate-700 flex items-center gap-3">
      <span className="text-xs font-bold text-slate-400 w-8">
        #{pokemon.DexNumber.toString().padStart(3, '0')}
      </span>
      {pokemon.Name}
    </span>
    <div className="flex gap-1.5">
      {pokemon.Types.map(t => (
        <span 
          key={t} 
          className="w-2.5 h-2.5 rounded-full shadow-sm" 
          style={{ backgroundColor: TYPE_COLORS[t] || '#ccc' }} 
          title={t} 
        />
      ))}
    </div>
  </div>
), (prev, next) => prev.pokemon.DexNumber === next.pokemon.DexNumber && prev.isSelected === next.isSelected);


export default function ModernPokedex() {
  const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedType, setSelectedType] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonData | null>(null);

  useEffect(() => {
    Papa.parse("/data/Pokemon.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as any[];
        const sanitizedData: PokemonData[] = rawData
          .filter(p => p.Name && p.Type)
          .map(p => ({
            DexNumber: Number(p.DexNumber),
            Name: String(p.Name).trim(),
            Types: cleanArrayString(p.Type),
            Abilities: cleanArrayString(p.Abilities),
            HiddenAbility: cleanArrayString(p.HiddenAbility),
            Generation: String(p.Generation).trim(),
            Hp: Number(p.Hp) || 0,
            Attack: Number(p.Attack) || 0,
            Defense: Number(p.Defense) || 0,
            SpecialAttack: Number(p.SpecialAttack) || 0,
            SpecialDefense: Number(p.SpecialDefense) || 0,
            Speed: Number(p.Speed) || 0,
            TotalStats: Number(p.TotalStats) || 0,
            Weight: Number(p.Weight) || 0,
            Height: Number(p.Height) || 0,
            Category: String(p.Category || '').trim(),
            CatchRate: String(p.CatchRate || '').trim(),
            LevelingRate: String(p.LevelingRate || '').trim(),
          }));
        setPokemonList(sanitizedData);
        // Slight delay for smooth entrance
        setTimeout(() => setIsLoading(false), 800);
      },
    });
  }, []);

  useEffect(() => {
    setVisibleCount(INITIAL_LOAD_COUNT);
  }, [deferredSearchTerm, selectedType]);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    pokemonList.forEach(p => p.Types.forEach(t => types.add(t)));
    return ["All", ...Array.from(types).sort()];
  }, [pokemonList]);

  const filteredPokemon = useMemo(() => {
    return pokemonList.filter((p) => {
      const searchLower = deferredSearchTerm.toLowerCase();
      const matchesSearch = 
        p.Name.toLowerCase().includes(searchLower) || 
        p.DexNumber.toString().includes(searchLower) ||
        p.Category.toLowerCase().includes(searchLower);
      const matchesType = selectedType === "All" || p.Types.includes(selectedType);
      return matchesSearch && matchesType;
    });
  }, [pokemonList, deferredSearchTerm, selectedType]);

  const visiblePokemon = useMemo(() => filteredPokemon.slice(0, visibleCount), [filteredPokemon, visibleCount]);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && visibleCount < filteredPokemon.length) {
      setVisibleCount(prev => prev + LOAD_MORE_COUNT);
    }
  };

  const handleCardClick = useCallback((pokemon: PokemonData) => {
    setSelectedPokemon(prev => prev?.DexNumber === pokemon.DexNumber ? null : pokemon);
  }, []);

  // Shared Pokeball element from the Home design
  const PokeballLogo = ({ size = "large" }: { size?: "small" | "large" }) => (
    <div className={`${size === "large" ? "w-20 h-20" : "w-12 h-12"} mx-auto rounded-full border-[3px] border-slate-900 shadow-lg shadow-red-500/20 relative flex items-center justify-center overflow-hidden`}>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-red-500 to-red-600"></div>
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-50"></div>
      <div className="w-full h-1.5 bg-slate-900 absolute top-1/2 -translate-y-1/2"></div>
      <div className={`${size === "large" ? "w-6 h-6" : "w-4 h-4"} bg-slate-900 rounded-full z-10 flex items-center justify-center`}>
        <div className={`${size === "large" ? "w-2.5 h-2.5" : "w-1.5 h-1.5"} bg-white rounded-full`}></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center relative overflow-hidden font-sans text-slate-900">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMDAwMDAiLz48L3N2Zz4=')]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-red-100/40 to-slate-100/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="relative z-10"
        >
          <PokeballLogo />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-sm font-semibold text-slate-500 tracking-widest uppercase z-10"
        >
          Loading Database...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans text-slate-900 selection:bg-red-500/20 selection:text-red-900 p-4">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMDAwMDAiLz48L3N2Zz4=')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-red-100/40 to-slate-100/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
      
      {/* Main Glass App Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[1000px] h-[85vh] bg-white/80 backdrop-blur-3xl border border-slate-200/80 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] flex flex-col md:flex-row overflow-hidden"
      >
        
        {/* ========================================== */}
        {/* LEFT PANEL: Search & List */}
        {/* ========================================== */}
        <div className="w-full md:w-[380px] flex flex-col border-b md:border-b-0 md:border-r border-slate-200/80 bg-white/50 z-20 shrink-0 h-[40vh] md:h-full">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <PokeballLogo size="small" />
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                PCL <span className="text-red-600 font-bold">Database</span>
              </h2>
            </div>
            
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Search Pokémon..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              <div className="flex items-center gap-2">
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer"
                >
                  {allTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                </select>
                <div className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-400 border border-slate-100">
                  {filteredPokemon.length}
                </div>
              </div>
            </div>
          </div>

          {/* List View */}
          <div 
            className="flex-1 overflow-y-auto custom-scrollbar relative" 
            onScroll={handleScroll}
          >
            {visiblePokemon.map((pokemon) => (
              <PokedexListItem 
                key={`${pokemon.DexNumber}-${pokemon.Name}`} 
                pokemon={pokemon} 
                isSelected={selectedPokemon?.DexNumber === pokemon.DexNumber}
                onClick={handleCardClick} 
              />
            ))}
            {filteredPokemon.length === 0 && (
              <div className="p-8 text-center text-sm font-medium text-slate-400">
                No Pokémon found.
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT PANEL: Details View */}
        {/* ========================================== */}
        <div className="flex-1 bg-slate-50/30 relative flex flex-col h-[60vh] md:h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedPokemon ? (
              <motion.div 
                key={selectedPokemon.DexNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center"
              >
                {/* Visual Header */}
                <div className="relative w-full max-w-sm aspect-square mb-8 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/50 to-slate-100/50 rounded-[3rem] -rotate-3"></div>
                  <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                    src={getImageUrl(selectedPokemon.DexNumber)}
                    alt={selectedPokemon.Name}
                    className="w-4/5 h-4/5 object-contain relative z-10 drop-shadow-2xl"
                  />
                  {/* Floating Type Badges */}
                  <div className="absolute -bottom-4 flex gap-2 z-20">
                    {selectedPokemon.Types.map(t => (
                      <span 
                        key={t} 
                        style={{ backgroundColor: TYPE_COLORS[t] || '#ccc' }}
                        className="px-4 py-1.5 rounded-full text-white text-xs font-bold tracking-wide shadow-md"
                      >
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info Text */}
                <div className="text-center mb-10 w-full max-w-md">
                  <p className="text-sm font-bold text-slate-400 mb-1">
                    #{selectedPokemon.DexNumber.toString().padStart(3, '0')}
                  </p>
                  <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    {selectedPokemon.Name}
                  </h1>
                  <p className="text-slate-500 font-medium">{selectedPokemon.Category}</p>
                </div>

                {/* Measurements Grid */}
                <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 mb-1">HEIGHT</p>
                    <p className="text-lg font-semibold text-slate-700">{selectedPokemon.Height} m</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 mb-1">WEIGHT</p>
                    <p className="text-lg font-semibold text-slate-700">{selectedPokemon.Weight} kg</p>
                  </div>
                </div>

                {/* Base Stats */}
                <div className="w-full max-w-md bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                  <h3 className="text-sm font-bold text-slate-900 mb-5 tracking-wide">BASE STATS</h3>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'HP', val: selectedPokemon.Hp },
                      { label: 'Attack', val: selectedPokemon.Attack },
                      { label: 'Defense', val: selectedPokemon.Defense },
                      { label: 'Sp. Atk', val: selectedPokemon.SpecialAttack },
                      { label: 'Sp. Def', val: selectedPokemon.SpecialDefense },
                      { label: 'Speed', val: selectedPokemon.Speed },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center gap-4">
                        <span className="w-16 text-xs font-bold text-slate-400 uppercase">{stat.label}</span>
                        <span className="w-8 text-sm font-semibold text-slate-700 text-right">{stat.val}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(stat.val / 255) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`h-full rounded-full ${stat.val > 100 ? 'bg-red-500' : stat.val > 60 ? 'bg-slate-800' : 'bg-slate-400'}`}
                          ></motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full h-12 shrink-0"></div> {/* Bottom Padding */}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-slate-400"
              >
                <div className="opacity-20 mb-6 pointer-events-none grayscale">
                  <PokeballLogo />
                </div>
                <p className="text-sm font-semibold">Select a Pokémon to view details.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
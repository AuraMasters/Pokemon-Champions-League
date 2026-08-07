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
  IsLegendary: boolean;
  IsMythical: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  Normal: 'from-gray-400 to-gray-500',
  Fire: 'from-orange-400 to-red-500',
  Water: 'from-blue-400 to-blue-600',
  Grass: 'from-green-400 to-green-600',
  Electric: 'from-yellow-400 to-yellow-600',
  Ice: 'from-cyan-300 to-cyan-500',
  Fighting: 'from-red-600 to-red-800',
  Poison: 'from-purple-400 to-purple-600',
  Ground: 'from-amber-600 to-amber-800',
  Flying: 'from-indigo-300 to-indigo-500',
  Psychic: 'from-pink-400 to-pink-600',
  Bug: 'from-lime-500 to-lime-700',
  Rock: 'from-stone-500 to-stone-700',
  Ghost: 'from-violet-600 to-violet-900',
  Dragon: 'from-indigo-600 to-indigo-900',
  Dark: 'from-slate-700 to-slate-900',
  Steel: 'from-slate-400 to-slate-600',
  Fairy: 'from-pink-300 to-pink-500',
};

const INITIAL_LOAD_COUNT = 15;
const LOAD_MORE_COUNT = 15;

const getImageUrl = (dexNumber: number) => 
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`;

const cleanArrayString = (str: any): string[] => {
  if (!str || str === '[]' || str === "['']") return [];
  if (typeof str === 'string') return str.replace(/[\[\]']/g, '').split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

// ==========================================
// 1. PREMIUM MEMOIZED CARD WITH VIEWPORT ANIMATIONS
// ==========================================
const PokemonCard = memo(({ pokemon, onClick }: { pokemon: PokemonData, onClick: (p: PokemonData) => void }) => {
  const primaryType = pokemon.Types[0] || 'Normal';
  const bgGradient = TYPE_COLORS[primaryType] || TYPE_COLORS.Normal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      // Triggers animation when card enters the screen
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      whileHover={{ 
        y: -8, 
        scale: 1.02, 
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.97 }} // Tactile click feedback
      onClick={() => onClick(pokemon)}
      className={`relative rounded-3xl p-6 cursor-pointer overflow-hidden shadow-lg bg-gradient-to-br ${bgGradient} border border-white/10`}
    >
      <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none transition-transform duration-500 group-hover:scale-150"></div>
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="max-w-[70%]">
          <h3 className="text-2xl font-black text-white capitalize drop-shadow-md truncate pb-1">
            {pokemon.Name}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {pokemon.Types.map((t) => (
              <span key={t} className="px-3 py-1 bg-white/25 backdrop-blur-md rounded-full text-[10px] uppercase tracking-wider font-bold text-white shadow-sm border border-white/20">
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="text-white/70 font-black text-xl drop-shadow-sm tabular-nums">
          #{pokemon.DexNumber.toString().padStart(3, '0')}
        </span>
      </div>

      <div className="relative h-32 w-full flex justify-end items-end z-10">
        <motion.img 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
          src={getImageUrl(pokemon.DexNumber)} 
          alt={pokemon.Name}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'; (e.target as HTMLImageElement).className = 'h-20 w-20 object-contain opacity-50 absolute bottom-0 right-0'; }}
          className="h-40 w-40 object-contain drop-shadow-2xl absolute -bottom-4 -right-4"
        />
      </div>
    </motion.div>
  );
}, (prev, next) => prev.pokemon.Name === next.pokemon.Name);

export default function Pokedex() {
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
            IsLegendary: Boolean(p.IsLegendary),
            IsMythical: Boolean(p.IsMythical),
          }));
        setPokemonList(sanitizedData);
        setIsLoading(false);
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
  const hasMore = visibleCount < filteredPokemon.length;

  const handleCardClick = useCallback((pokemon: PokemonData) => setSelectedPokemon(pokemon), []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-slate-200 border-t-red-500 rounded-full"
        />
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-sm"
        >
          Booting Rotom Dex...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 selection:bg-red-500/20 pb-32">
      <div className="max-w-7xl mx-auto mb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-2">
              National <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Pokédex</span>
            </h1>
            <p className="text-slate-500 font-medium">Database loaded: {pokemonList.length} species.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search name, ID, or species..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none w-full sm:w-80 transition-all font-medium placeholder:text-slate-400"
            />
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-red-500/20 outline-none w-full sm:w-48 cursor-pointer font-medium appearance-none"
            >
              {allTypes.map(type => (
                <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {visiblePokemon.map((pokemon) => (
          <PokemonCard key={`${pokemon.DexNumber}-${pokemon.Name}`} pokemon={pokemon} onClick={handleCardClick} />
        ))}
      </div>

      {filteredPokemon.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-7xl mx-auto text-center py-20"
        >
          <div className="text-6xl mb-4 grayscale opacity-50">🔍</div>
          <h3 className="text-2xl font-bold text-slate-800">No Pokémon found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your filters or search term.</p>
        </motion.div>
      )}

      {hasMore && (
        <div className="max-w-7xl mx-auto mt-16 flex justify-center">
          <motion.button
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
            whileTap={{ y: 0, scale: 0.95 }}
            onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
            className="group relative px-10 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-red-500 hover:text-red-500 transition-colors duration-300 shadow-sm flex items-center gap-3"
          >
            <span>Load More Pokémon</span>
            <span className="text-sm bg-slate-100 text-slate-500 px-2 py-1 rounded-md group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
              {filteredPokemon.length - visibleCount} left
            </span>
          </motion.button>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. CHOREOGRAPHED MODAL ANIMATIONS */}
      {/* ========================================== */}
      <AnimatePresence>
        {selectedPokemon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedPokemon(null)}
              className="absolute inset-0 bg-slate-900/60 cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className={`p-8 bg-gradient-to-br ${TYPE_COLORS[selectedPokemon.Types[0]] || TYPE_COLORS.Normal} relative shrink-0 border-b border-white/10`}>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedPokemon(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full text-white flex items-center justify-center transition-colors z-20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </motion.button>
                
                <div className="flex justify-between items-center relative z-10">
                  <div className="text-white z-20">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-sm font-bold opacity-90 uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full border border-white/10">
                        #{selectedPokemon.DexNumber.toString().padStart(3, '0')} • {selectedPokemon.Category}
                      </span>
                    </motion.div>
                    <motion.h2 
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                      className="text-5xl font-black capitalize drop-shadow-lg tracking-tight"
                    >
                      {selectedPokemon.Name}
                    </motion.h2>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                      className="flex gap-2 mt-4"
                    >
                      {selectedPokemon.Types.map((t) => (
                        <span key={t} className="px-5 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-sm font-bold uppercase tracking-wider shadow-sm border border-white/10">
                          {t}
                        </span>
                      ))}
                    </motion.div>
                  </div>
                  
                  {/* Continuous floating animation for modal image */}
                  <motion.img 
                    initial={{ opacity: 0, x: 100, scale: 0.5 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      y: [0, -10, 0] // Floating effect
                    }}
                    transition={{
                      opacity: { duration: 0.4 },
                      x: { type: "spring", stiffness: 200, damping: 20 },
                      scale: { type: "spring", stiffness: 200, damping: 20 },
                      y: { repeat: Infinity, duration: 4, ease: "easeInOut" } // Infinite float
                    }}
                    src={getImageUrl(selectedPokemon.DexNumber)} 
                    alt={selectedPokemon.Name}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'; }}
                    className="w-48 h-48 object-contain drop-shadow-2xl translate-y-12 z-10"
                  />
                </div>
              </div>

              <div className="p-8 pt-16 bg-white overflow-y-auto">
                <div className="grid grid-cols-2 gap-8 mb-10 border-b border-slate-100 pb-10">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Abilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPokemon.Abilities.map(a => (
                        <span key={a} className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-sm">{a}</span>
                      ))}
                    </div>
                    {selectedPokemon.HiddenAbility.length > 0 && (
                      <div className="mt-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Hidden Ability</span>
                        <span className="font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg text-sm inline-block">
                          {selectedPokemon.HiddenAbility.join(', ')}
                        </span>
                      </div>
                    )}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Height</h4>
                      <p className="font-black text-slate-800 text-lg">{selectedPokemon.Height} <span className="text-sm font-semibold text-slate-500">m</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</h4>
                      <p className="font-black text-slate-800 text-lg">{selectedPokemon.Weight} <span className="text-sm font-semibold text-slate-500">kg</span></p>
                    </div>
                  </motion.div>
                </div>

                <div>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="flex justify-between items-end mb-6"
                  >
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Stats</h4>
                    <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">Total: {selectedPokemon.TotalStats}</span>
                  </motion.div>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'HP', value: selectedPokemon.Hp, color: 'bg-green-500' },
                      { label: 'Attack', value: selectedPokemon.Attack, color: 'bg-red-500' },
                      { label: 'Defense', value: selectedPokemon.Defense, color: 'bg-orange-500' },
                      { label: 'Sp. Atk', value: selectedPokemon.SpecialAttack, color: 'bg-blue-500' },
                      { label: 'Sp. Def', value: selectedPokemon.SpecialDefense, color: 'bg-indigo-500' },
                      { label: 'Speed', value: selectedPokemon.Speed, color: 'bg-pink-500' },
                    ].map((stat, index) => (
                      <div key={stat.label} className="flex items-center text-sm">
                        <span className="w-20 font-bold text-slate-400 uppercase tracking-wider text-[11px]">{stat.label}</span>
                        <span className="w-12 font-black text-slate-800 text-right mr-4 tabular-nums">{stat.value}</span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          {/* Sequentially staggered stat bars using index */}
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((stat.value / 255) * 100, 100)}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 + (index * 0.1) }}
                            className={`h-full rounded-full ${stat.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
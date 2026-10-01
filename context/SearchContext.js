'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { TOOLS } from '../config/registry';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    return TOOLS.filter(tool => {
      const matchName = tool.name.toLowerCase().includes(q);
      const matchDesc = tool.desc.toLowerCase().includes(q);
      const matchCat = tool.category.toLowerCase().includes(q);
      const matchKeywords = (tool.keywords || []).some(k => k.toLowerCase().includes(q));
      const matchTags = (tool.tags || []).some(t => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchCat || matchKeywords || matchTags;
    }).slice(0, 10);
  }, [searchQuery]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearchOpen,
        setIsSearchOpen,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within a SearchProvider');
  return context;
};

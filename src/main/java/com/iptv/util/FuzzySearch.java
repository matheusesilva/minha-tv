package com.iptv.util;

import org.apache.commons.text.similarity.FuzzyScore;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class FuzzySearch {
    
    private final FuzzyScore fuzzyScore;


    public static String normalize(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("[^\\p{ASCII}]", "").toLowerCase().trim();
    }
    
    public FuzzySearch() {
        this.fuzzyScore = new FuzzyScore(Locale.forLanguageTag("pt-BR"));
    }
    
    public <T> List<SearchResult<T>> fuzzySearch(List<T> items, 
                                               String searchTerm, 
                                               int limit, 
                                               int threshold,
                                               StringExtractor<T> extractor) {
        List<SearchResult<T>> results = new ArrayList<>();
        String normalizedTerm = normalize(searchTerm);
        
        for (T item : items) {
            String textToSearch = extractor.extract(item);
            String normalizedText = normalize(textToSearch);
            
            int score = fuzzyScore.fuzzyScore(normalizedText, normalizedTerm);
            
            if (score > threshold) {
                results.add(new SearchResult<>(item, score));
            }
        }
        
        // Sort by score descending
        results.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));
        
        // Apply limit
        return results.stream().limit(limit).toList();
    }
    
    public static class SearchResult<T> {
        private final T item;
        private final int score;
        
        public SearchResult(T item, int score) {
            this.item = item;
            this.score = score;
        }
        
        public T getItem() { return item; }
        public int getScore() { return score; }
    }
    
    @FunctionalInterface
    public interface StringExtractor<T> {
        String extract(T item);
    }
}
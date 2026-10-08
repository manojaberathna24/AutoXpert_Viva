import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import os

# Download VADER lexicon if not present
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon')

# Initialize VADER
sid = SentimentIntensityAnalyzer()

# Custom Singlish/Sinhala Sentiment Lexicon
# Scores range from -4.0 (most negative) to +4.0 (most positive)
singlish_updates = {
    # Negative Words
    'awl': -2.0, 'awul': -2.0, 'tikkwth': -2.0, 'kisima': -2.0, 
    'chater': -3.0, 'cha': -2.5, 'chaa': -2.5, 'wardi': -2.0, 'waradi': -2.0, 
    'narakai': -2.5, 'naraka': -2.0, 'epaa': -2.0, 'epa': -2.0, 'mello': -2.0, 
    'melo': -2.0, 'jarawa': -3.0, 'dissapointed': -2.5, 'pachayak': -3.0, 
    'boruwak': -2.5, 'pacha': -2.5, 'kammali': -2.0, 'kammaliy': -2.0, 
    'wadakma': -2.5, 'aparade': -2.5, 'gahuwa': -2.0, 'kaduwa': -2.0, 
    'kethai': -2.0, 'ketha': -2.0, 'guu': -3.0, 'gu': -3.0, 'wadaa': -2.0,
    'sakkili': -3.0, 'kari': -3.0, 'moda': -2.0, 'modaya': -2.0, 'katu': -2.0,
    
    # Positive Words
    'supiri': 3.0, 'supiriy': 3.0, 'elakiri': 3.0, 'maru': 2.5, 'niyamai': 2.5, 
    'patta': 3.0, 'hodai': 2.5, 'hodaii': 2.5, 'hoda': 2.0, 'ela': 2.0, 
    'elama': 2.5, 'adinawa': 2.0, 'gammac': 2.5, 'gammak': 2.5, 'super': 2.5, 
    'best': 3.0, 'wow': 2.5, 'woow': 2.5, 'maxxa': 3.0, 'gindara': 3.0, 
    'fatta': 3.0, 'sira': 2.5, 'siraawatama': 2.5, 'niyameta': 2.5, 
    'watina': 2.0, 'watinawa': 2.0, 'lesatama': 2.5, 'lassanai': 2.0, 
    'lassana': 2.0, 'jayawewa': 2.5, 'jaya': 2.0, 'good': 2.0, 'great': 2.5, 
    'excellent': 3.0, 'perfect': 3.0, 'amuthuma': 2.0, 'pissu': 2.0, 
    'kora': 2.5, 'ammata': 2.0
}

sid.lexicon.update(singlish_updates)

def get_sentiment(text):
    """
    Analyzes the text using VADER with custom Singlish support.
    Returns: 'positive' or 'negative' based on compound score.
    """
    if not text:
        return 'positive' # Default

    text_lower = text.lower().strip()

    # Hybrid Approach: Explicit phrase checks for multi-word Singlish idioms VADER might miss
    
    # 1. Check for Positive idioms first (e.g. "awlak ne" should override the negative word "awlak")
    positive_phrases = [
        "awlak ne", "awlak na", "awlak naha", "kisi awlak na", "kisi awlak ne", 
        "gindara", "ela ela", "hoda madi na", "epa wela na", "kammali na"
    ]
    for phrase in positive_phrases:
        if phrase in text_lower:
            print(f"DEBUG: Found positive phrase '{phrase}' in '{text}'")
            return 'positive'

    # 2. Check for Negative idioms (e.g. "hoda madi", "hoda na")
    negative_phrases = [
        "hoda madi", "hoda na", "hoda naha", "hoda ne", 
        "hari na", "hari naha", "hari ne",
        "wedak ne", "wadak ne", "wedak na", "wadak na", "weda na", 
        "not good", "tikkwth", "set ne", "set na", 
        "epa wela", "mala karumayak", "kammali"
    ]
    for phrase in negative_phrases:
        if phrase in text_lower:
             print(f"DEBUG: Found negative phrase '{phrase}' in '{text}'")
             return 'negative'
        
    scores = sid.polarity_scores(text)
    compound = scores['compound']
    
    print(f"DEBUG: VADER Scores for '{text}': {scores}")
    
    if compound < 0:
        return 'negative'
    else:
        return 'positive'
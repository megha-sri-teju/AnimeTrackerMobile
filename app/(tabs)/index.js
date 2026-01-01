import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { db, auth } from '../../firebase'; // CORRECT PATH: up two levels from app/(tabs)/
import { collection, doc, setDoc } from 'firebase/firestore';

// API endpoint for top anime and search
const TOP_ANIME_URL = 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=20';
const SEARCH_ANIME_URL = (query) => `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`;

export default function HomeScreen() {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Function to fetch data based on search query or default list
  const fetchData = useCallback(async (query = '') => {
    setLoading(true);
    const url = query ? SEARCH_ANIME_URL(query) : TOP_ANIME_URL;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setAnimeList(data.data || []);
    } catch (e) {
      console.error('Failed to fetch anime:', e);
      Alert.alert('Error', 'Failed to fetch anime list.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to handle search debouncing
  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        fetchData(searchQuery);
        setIsSearching(false);
      }, 500); // Wait 500ms after user stops typing
      return () => clearTimeout(timer);
    } else if (searchQuery.length === 0 && !loading) {
      // If search is cleared, load top anime
      fetchData();
    }
  }, [searchQuery, fetchData]);

  // Function to add anime to the user's Firestore list
  const handleAddToList = async (item) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add anime.');
      return;
    }

    try {
      const animeData = {
        mal_id: item.mal_id,
        title: item.title,
        imageUrl: item.images.jpg.image_url,
        score: item.score || 'N/A',
        status: 'Watching', // Default status
      };

      // Firestore path: users/{userId}/animeList/{animeId}
      const docRef = doc(db, `users/${user.uid}/animeList`, item.mal_id.toString());
      await setDoc(docRef, animeData);

      Alert.alert('Success', `${item.title} added to your list!`);
    } catch (error) {
      console.error('Error adding anime to list: ', error);
      Alert.alert('Error', 'Failed to add anime to list.');
    }
  };

  const renderAnimeItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleAddToList(item)}>
      <Image
        source={{ uri: item.images.jpg.image_url }}
        style={styles.itemImage}
      />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemScore}>
          Score: {item.score ? item.score : 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search for Anime..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {(loading || isSearching) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e028b1" />
          <Text style={styles.loadingText}>
            {isSearching ? 'Searching...' : 'Loading Top Anime...'}
          </Text>
        </View>
      ) : (animeList.length === 0 && searchQuery !== '') ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={animeList}
          renderItem={renderAnimeItem}
          keyExtractor={(item) => item.mal_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingTop: 0,
  },
  itemContainer: {
    width: itemWidth,
    backgroundColor: '#181818',
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  itemImage: {
    width: '100%',
    height: itemWidth * 1.5,
    resizeMode: 'cover',
  },
  itemTextContainer: {
    padding: 10,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    minHeight: 34,
  },
  itemScore: {
    color: '#e028b1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
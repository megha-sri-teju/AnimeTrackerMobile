import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  // RE-IMPORT UPDATE FUNCTIONALITY:
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';

export default function MyListScreen() {
  const [myAnimeList, setMyAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Effect to get the current user ID (Unchanged)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setMyAnimeList([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to listen for database changes (Unchanged)
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const collectionPath = `users/${userId}/animeList`;
    const q = query(collection(db, collectionPath));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const list = [];
        querySnapshot.forEach((document) => {
          list.push({ id: document.id, ...document.data() });
        });
        setMyAnimeList(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching anime list: ', err);
        Alert.alert('Error', 'Failed to load your list.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // --- NEW/RE-ADDED: Handle Status Update ---
  const handleUpdateStatus = async (docId, currentStatus) => {
    const user = auth.currentUser;
    if (!user) return;

    // Toggle the status: Watching <-> Completed
    const newStatus = currentStatus === 'Watching' ? 'Completed' : 'Watching';

    try {
      const docRef = doc(db, `users/${user.uid}/animeList`, docId);
      
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Optimistic/Local State Update (onSnapshot will handle the true update)
      setMyAnimeList((currentList) =>
        currentList.map((item) =>
          item.id === docId ? { ...item, status: newStatus } : item
        )
      );

      // Alert.alert('Success', `Status updated to: ${newStatus}`); // Removed for smoother UX
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  // Handle Delete (Remove from List) - Unchanged
  const handleDelete = async (animeId, title) => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Confirm Remove',
      `Are you sure you want to remove ${title} from your list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, `users/${user.uid}/animeList`, animeId);
              await deleteDoc(docRef);
              Alert.alert('Success', `${title} removed.`);
            } catch (e) {
              console.error('Error deleting document: ', e);
              Alert.alert('Error', 'Failed to remove anime.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  // --- UPDATED: Render Item - Includes Status Button ---
  const renderAnimeItem = ({ item }) => {
    const currentStatus = item.status || 'Watching';
    const nextStatus = currentStatus === 'Watching' ? 'Completed' : 'Watching';
    const statusButtonText = `Mark as ${nextStatus}`;
    // Yellow/Orange for Watching, Green for Completed
    const statusColor = currentStatus === 'Completed' ? '#4CAF50' : '#FFC107'; 

    return (
      <View style={styles.itemWrapper}>
        <TouchableOpacity style={styles.itemContainer} activeOpacity={0.8}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.itemImage}
          />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {/* Display the status */}
            <Text style={[styles.itemScore, { color: statusColor }]}>
              Status: {currentStatus}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* NEW/RE-ADDED: Status Update Button */}
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: statusColor }]}
          onPress={() => handleUpdateStatus(item.id, currentStatus)}
        >
          <Text style={styles.statusButtonText}>{statusButtonText}</Text>
        </TouchableOpacity>

        {/* Delete/Remove Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.title)}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Final Return (Unchanged)
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#e028b1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {myAnimeList.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Your list is empty.</Text>
          <Text style={styles.emptySubText}>
            Go to the Home screen to add anime!
          </Text>
        </View>
      ) : (
        <FlatList
          data={myAnimeList}
          renderItem={renderAnimeItem}
          keyExtractor={(item) => item.id.toString()}
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
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  itemWrapper: {
    width: itemWidth,
    margin: 5,
  },
  itemContainer: {
    backgroundColor: '#181818',
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
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  // --- NEW/RE-ADDED: Status Button Styles ---
  statusButton: {
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#121212', 
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Delete Button Styles (Kept)
  deleteButton: {
    backgroundColor: '#ff4d4d', 
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
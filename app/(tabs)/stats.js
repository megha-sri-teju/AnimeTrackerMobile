import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';

export default function StatsScreen() {
  // NEW: State to hold categorized counts
  const [counts, setCounts] = useState({
    watching: 0,
    completed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  // Effect to get the current user ID (Unchanged)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setCounts({ watching: 0, completed: 0, total: 0 });
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to listen for database changes (Updated Logic)
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
        let watchingCount = 0;
        let completedCount = 0;
        const totalCount = querySnapshot.size;

        // Iterate and count based on the 'status' field
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status || 'Watching'; // Default to Watching
          
          if (status === 'Watching') {
            watchingCount += 1;
          } else if (status === 'Completed') {
            completedCount += 1;
          }
          // Ignore other potential statuses for now
        });

        // Update the state with the new counts
        setCounts({
          watching: watchingCount,
          completed: completedCount,
          total: totalCount,
        });
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching stats: ', err);
        Alert.alert('Error', 'Failed to load stats.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Handle Sign Out (Unchanged)
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (err) {
      console.error('Error signing out: ', err);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  // Render Content (Updated to show all stats)
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#e028b1" />;
    }

    return (
      <View style={styles.statsContainer}>
        {/* Total Anime Stat */}
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{counts.total}</Text>
          <Text style={styles.statLabel}>Total Saved</Text>
        </View>
        
        {/* Watching Stat */}
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FFC107' }]}>{counts.watching}</Text>
          <Text style={styles.statLabel}>Watching</Text>
        </View>

        {/* Completed Stat */}
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{counts.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Stats</Text>
      {renderContent()}

      {/* SIGN OUT BUTTON */}
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  // Container for multiple stat boxes
  statsContainer: {
    width: '100%',
    gap: 15,
  },
  statBox: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#222',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e028b1',
  },
  statLabel: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  signOutButton: {
    marginTop: 'auto',
    marginBottom: 40,
    backgroundColor: '#ff4d4d',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
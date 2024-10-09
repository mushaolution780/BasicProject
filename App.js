import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const App = () => {
  const [user, setUser] = useState(null); // Holds authenticated user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [task, setTask] = useState('');
  const [todos, setTodos] = useState([]); // Holds the list of tasks
  
  // Monitor Auth State Changes
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(setUser);
    return subscriber; // unsubscribe on unmount
  }, []);

  // Fetch todos after user logs in
  useEffect(() => {
    if (user) {
      const unsubscribe = firestore()
        .collection('todos')
        .where('userId', '==', user.uid) // Fetch todos for this user only
        .onSnapshot((querySnapshot) => {
          const newTodos = [];
          querySnapshot.forEach((documentSnapshot) => {
            newTodos.push({
              ...documentSnapshot.data(),
              id: documentSnapshot.id,
            });
          });
          setTodos(newTodos);
        });

      return () => unsubscribe();
    }
  }, [user]);

  const handleSignup = async () => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleAddTask = async () => {
    if (task.length > 0 && user) {
      try {
        await firestore().collection('todos').add({
          task,
          userId: user.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        setTask(''); // Reset input after adding task
      } catch (error) {
        console.error(error.message);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await firestore().collection('todos').doc(taskId).delete();
    } catch (error) {
      console.error(error.message);
    }
  };

  if (!user) {
    return (
      <View style={{ padding: 20 }}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={{ marginBottom: 10, padding: 10, borderWidth: 1, borderRadius: 5 }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: 10, padding: 10, borderWidth: 1, borderRadius: 5 }}
        />
        <Button title="Sign Up" onPress={handleSignup} />
        <Button title="Log In" onPress={handleLogin} />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Add Task"
        value={task}
        onChangeText={setTask}
        style={{ marginBottom: 10, padding: 10, borderWidth: 1, borderRadius: 5 }}
      />
      <Button title="Add Task" onPress={handleAddTask} />

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
            <Text>{item.task}</Text>
            <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
              <Text style={{ color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default App;

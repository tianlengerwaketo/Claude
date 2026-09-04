import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Chat: { token: string; name: string; emoji: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'Gente cerca',
            headerRight: () => (
              <Pressable onPress={() => navigation.navigate('Profile')} hitSlop={12}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#2563eb' }}>Perfil</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Tu perfil' }} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={({ route }) => ({ title: `${route.params.emoji} ${route.params.name}` })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

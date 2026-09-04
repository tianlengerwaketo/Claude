import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

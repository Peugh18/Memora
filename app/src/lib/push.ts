import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { api } from './api';

/**
 * Pide permiso y le manda al servidor el token para los avisos de tomas omitidas.
 * Expo Go (Android) ya no trae el módulo de push: ahí no se carga y la app sigue normal. Funciona en la APK.
 */
export async function registrarPush() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Avisos', importance: Notifications.AndroidImportance.MAX });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api('/yo', { method: 'PATCH', body: { expo_push_token: data } });
}

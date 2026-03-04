import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import service from './trackPlayerService';
import App from './App';

registerRootComponent(App);
TrackPlayer.registerPlaybackService(() => service);
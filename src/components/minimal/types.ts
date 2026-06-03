/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Peer {
  id: string;
  name: string;
  avatarSeed: string; // seed for elegant abstract graphics
  isCameraOn: boolean;
  isMicOn: boolean; // strictly false in library
  statusText: string;
  focusMinutesToday: number;
}

export interface CuratedRoom {
  id: string;
  name: string;
  subtitle: string;
  occupantsCount: number;
  maxOccupants: number;
  peers: Peer[];
  soundType: 'silence' | 'drone' | 'rain' | 'waves';
}

export interface JoinRequest {
  id: string;
  peerName: string;
  roomName: string;
  timeString: string;
}

export type FocusTheme = 'dark-void' | 'light-canvas';

export interface DailyFocus {
  day: string; // Mon, Tue...
  hours: number;
  intensity: number; // 0 to 10
}

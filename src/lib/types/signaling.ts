import { PeerDeviceType } from './network';

export type SignalingMessageType = 
  | 'PEER_DISCOVER' 
  | 'PEER_LEAVE'
  | 'OFFER' 
  | 'ANSWER' 
  | 'ICE_CANDIDATE';

export interface BaseSignalingMessage {
  roomId: string;
  type: SignalingMessageType;
  senderId: string;
  targetId?: string; // If undefined, it's a broadcast
}

export interface PeerDiscoverMessage extends BaseSignalingMessage {
  type: 'PEER_DISCOVER';
  name: string;
  deviceType: PeerDeviceType;
}

export interface PeerLeaveMessage extends BaseSignalingMessage {
  type: 'PEER_LEAVE';
}

export interface OfferMessage extends BaseSignalingMessage {
  type: 'OFFER';
  targetId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface AnswerMessage extends BaseSignalingMessage {
  type: 'ANSWER';
  targetId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidateMessage extends BaseSignalingMessage {
  type: 'ICE_CANDIDATE';
  targetId: string;
  candidate: RTCIceCandidateInit;
}

export type SignalingMessage = 
  | PeerDiscoverMessage 
  | PeerLeaveMessage
  | OfferMessage 
  | AnswerMessage 
  | IceCandidateMessage;
